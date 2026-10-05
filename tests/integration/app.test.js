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

	it("responds 404 with a not-found page for unknown paths", async () => {
		const response = await request(app).get("/no-such-page");

		expect(response.status).toBe(404);
		expect(response.text).toContain("Page not found");
	});
});
