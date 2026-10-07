import { describe, it, expect } from "vitest";
import request from "supertest";

// Loads the real app.js with every route mounted -- the per-route tests
// each build their own mini app, so only this catches problems in how the
// app itself is assembled (e.g. a route path Express refuses at startup).
import app from "../../app.js";

describe("app", () => {
	it("serves the landing page at /", async () => {
		const response = await request(app).get("/");

		expect(response.status).toBe(200);
		expect(response.text).toContain("<!DOCTYPE html>");
	});

	// The session cookie's settings live in app.js, so test them against
	// the real app. On Vercel, requests reach Express through a proxy that
	// marks them HTTPS with X-Forwarded-Proto; without that, a `secure`
	// cookie isn't sent at all.
	it("sets the session cookie httpOnly, secure, sameSite=Lax, for 1 hour", async () => {
		const before = Date.now();
		const response = await request(app)
			.get("/auth/login")
			.set("X-Forwarded-Proto", "https");

		const cookies = response.headers["set-cookie"];
		const session = cookies.find((c) => c.startsWith("session="));
		expect(session).toMatch(/; httponly/i);
		expect(session).toMatch(/; secure/i);
		expect(session).toMatch(/; samesite=lax/i);
		// Signed: a separate signature cookie comes with it
		expect(cookies.some((c) => c.startsWith("session.sig="))).toBe(true);

		const expires = Date.parse(session.match(/expires=([^;]+)/i)[1]);
		const oneHour = 60 * 60 * 1000;
		expect(expires - before).toBeGreaterThan(oneHour - 5000);
		expect(expires - before).toBeLessThan(oneHour + 5000);
	});

	// Local development runs on plain http://localhost. The cookie must still
	// be set there (without Secure), or login can't keep its OAuth state.
	it("still sets the session cookie, without Secure, over plain HTTP", async () => {
		const response = await request(app).get("/auth/login");

		const session = response.headers["set-cookie"]?.find((c) =>
			c.startsWith("session="),
		);
		expect(session).toBeDefined();
		expect(session).not.toMatch(/; secure/i);
	});

	// Two layers would each reject this: cookie-session's signature check, and
	// the Iron seal on the token inside. Either way the visitor is logged out.
	it("treats a forged session cookie as logged out", async () => {
		const forged = Buffer.from(
			JSON.stringify({ accessTokenEncrypted: "made-up" }),
		).toString("base64");

		const response = await request(app)
			.get("/configure-import")
			.set("X-Forwarded-Proto", "https")
			.set("Cookie", `session=${forged}; session.sig=not-a-real-signature`);

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/");
	});

	// Routes deliberately avoid /api/...: on Vercel, that prefix is reserved
	// for files in an api/ folder and never reaches this app
	it("serves login and import at their non-/api paths", async () => {
		const login = await request(app)
			.get("/auth/login")
			.set("X-Forwarded-Proto", "https");
		expect(login.status).toBe(302);
		expect(login.headers.location).toMatch(/^https:\/\/todoist\.com\/oauth\/authorize\?/);

		// No session, so the import route answers "session expired"
		const importResponse = await request(app)
			.post("/import-schedule")
			.send({ team: "BOS", project: "inbox" });
		expect(importResponse.status).toBe(401);
		expect(importResponse.body.errorType).toBe("AUTH_EXPIRED");
	});

	it("responds 404 with a not-found page for unknown paths", async () => {
		const response = await request(app).get("/no-such-page");

		expect(response.status).toBe(404);
		expect(response.text).toContain("Page not found");
	});
});
