import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import cookieSession from "cookie-session";
import request from "supertest";

const { saveAccessTokenMock, retrieveAccessTokenMock } = vi.hoisted(() => ({
	saveAccessTokenMock: vi.fn(),
	retrieveAccessTokenMock: vi.fn(),
}));

vi.mock("../../../app/utils/cookieSession.js", () => ({
	saveAccessToken: saveAccessTokenMock,
}));

vi.mock("../../../app/utils/todoist.js", () => ({
	retrieveAccessToken: retrieveAccessTokenMock,
}));

import loginRouter from "../../../app/routes/auth/login.js";
import callbackRouter from "../../../app/routes/auth/callback.js";

describe("auth routes", () => {
	beforeEach(() => {
		saveAccessTokenMock.mockReset();
		retrieveAccessTokenMock.mockReset();
	});

	// Real cookie-session middleware (minus `secure`, since supertest talks
	// plain HTTP), so the OAuth state really round-trips through a cookie
	function createApp() {
		const app = express();
		app.use(cookieSession({ name: "session", secret: "test-cookie-secret" }));
		app.use("/auth/login", loginRouter);
		app.use("/auth/callback", callbackRouter);
		return app;
	}

	// A supertest agent keeps cookies between requests, like a browser.
	// Returns the agent (now holding the session cookie) and the state that
	// /login sent to Todoist.
	async function startLogin() {
		const agent = request.agent(createApp());
		const response = await agent.get("/auth/login");
		const state = new URL(response.headers.location).searchParams.get("state");
		return { agent, response, state };
	}

	it("redirects /login to Todoist with URL-encoded params", async () => {
		const { response } = await startLogin();

		expect(response.status).toBe(302);
		const url = new URL(response.headers.location);
		expect(url.origin + url.pathname).toBe("https://todoist.com/oauth/authorize");
		expect(url.searchParams.get("client_id")).toBe("test-client-id");
		expect(url.searchParams.get("scope")).toBe("data:read_write");
		expect(url.searchParams.get("redirect_uri")).toBe(
			"http://localhost:3000/auth/callback",
		);
		// Encoded, not pasted in raw
		expect(response.headers.location).toContain(
			"redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback",
		);
	});

	it("uses a different random state for every login", async () => {
		const first = await startLogin();
		const second = await startLogin();

		expect(first.state).toMatch(/^[0-9a-f-]{36}$/);
		expect(second.state).not.toBe(first.state);
	});

	it("stores token and redirects on successful callback", async () => {
		retrieveAccessTokenMock.mockResolvedValue("token-123");
		saveAccessTokenMock.mockResolvedValue(undefined);
		const { agent, state } = await startLogin();

		const response = await agent.get(`/auth/callback?code=abc&state=${state}`);

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/configure-import");
		expect(retrieveAccessTokenMock).toHaveBeenCalledWith("abc");
		expect(saveAccessTokenMock).toHaveBeenCalled();
	});

	it("rejects callback when state does not match", async () => {
		const { agent } = await startLogin();

		const response = await agent.get("/auth/callback?code=abc&state=wrong-state");

		expect(response.status).toBe(403);
		expect(response.text).toContain("State mismatch");
		expect(retrieveAccessTokenMock).not.toHaveBeenCalled();
	});

	it("rejects callback from a browser that never started a login (forged request)", async () => {
		const { state } = await startLogin();

		// Fresh client with no session cookie, even though the state is real
		const response = await request(createApp()).get(
			`/auth/callback?code=abc&state=${state}`,
		);

		expect(response.status).toBe(403);
		expect(retrieveAccessTokenMock).not.toHaveBeenCalled();
	});

	it("accepts each state only once", async () => {
		retrieveAccessTokenMock.mockResolvedValue("token-123");
		const { agent, state } = await startLogin();

		await agent.get(`/auth/callback?code=abc&state=${state}`);
		const replay = await agent.get(`/auth/callback?code=abc&state=${state}`);

		expect(replay.status).toBe(403);
		expect(retrieveAccessTokenMock).toHaveBeenCalledTimes(1);
	});

	// How a failed code-for-token exchange with Todoist is reported
	it.each([
		[
			"a bad or reused authorization code",
			Object.assign(new Error("OAuth request failed with status 400"), {
				httpStatusCode: 400,
				responseData: { error: "bad_authorization_code" },
			}),
			400,
			"Bad authorization code",
		],
		[
			"wrong client credentials",
			Object.assign(new Error("OAuth request failed with status 400"), {
				httpStatusCode: 400,
				responseData: { error: "incorrect_application_credentials" },
			}),
			400,
			"Incorrect client credentials",
		],
		[
			"Todoist rate-limiting us",
			Object.assign(new Error("Todoist is rate-limiting requests right now."), {
				httpStatusCode: 429,
			}),
			429,
			"rate-limiting",
		],
		[
			"a Todoist outage",
			Object.assign(new Error("Todoist is temporarily unavailable."), {
				httpStatusCode: 503,
			}),
			502,
			"temporarily unavailable",
		],
	])("responds to %s with %i", async (_label, error, status, text) => {
		retrieveAccessTokenMock.mockRejectedValue(error);
		const { agent, state } = await startLogin();

		const response = await agent.get(`/auth/callback?code=abc&state=${state}`);

		expect(response.status).toBe(status);
		expect(response.text).toContain(text);
		expect(saveAccessTokenMock).not.toHaveBeenCalled();
	});

	it("returns 500 on generic OAuth exchange error", async () => {
		retrieveAccessTokenMock.mockRejectedValue(new Error("boom"));
		const { agent, state } = await startLogin();

		const response = await agent.get(`/auth/callback?code=abc&state=${state}`);

		expect(response.status).toBe(500);
		expect(response.text).toContain(
			"Internal server error during OAuth flow.",
		);
	});
});
