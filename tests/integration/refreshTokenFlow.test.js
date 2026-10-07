import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";

// The whole login-to-expiry story through the real app (real routes, real
// cookie-session, real Iron sealing), over plain HTTP like local
// development. Only the network edges are faked: Todoist's token endpoint
// (fetch) and its API (the SDK).
const { TodoistApiMock, getUserMock, getProjectsMock } = vi.hoisted(() => ({
	TodoistApiMock: vi.fn(),
	getUserMock: vi.fn(),
	getProjectsMock: vi.fn(),
}));

vi.mock("@doist/todoist-api-typescript", async (importOriginal) => ({
	...(await importOriginal()),
	TodoistApi: TodoistApiMock,
}));

import app from "../../app.js";

describe("login, then the token expires (refresh-token mode)", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it("logs in with a one-hour token, then sends the user to log in again once Todoist rejects it", async () => {
		// Todoist's token endpoint answers the way refresh-token-mode apps get
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						access_token: "access-abc",
						token_type: "Bearer",
						expires_in: 3600,
						refresh_token: "refresh-xyz",
						scope: "data:read_write",
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				),
			),
		);
		TodoistApiMock.mockImplementation(function TodoistApiCtor() {
			return { getUser: getUserMock, getProjects: getProjectsMock };
		});
		getUserMock.mockResolvedValue({ isPremium: false });
		getProjectsMock.mockResolvedValue([]);

		// A supertest agent keeps cookies between requests, like a browser
		const agent = request.agent(app);

		// 1. Log in over plain HTTP: the session cookie must be set, or the
		//    state can't survive the trip to Todoist and back
		const login = await agent.get("/auth/login");
		const state = new URL(login.headers.location).searchParams.get("state");

		// 2. Todoist redirects back with a code and the same state
		const callback = await agent.get(
			`/auth/callback?code=code-123&state=${state}`,
		);
		expect(callback.status).toBe(302);
		expect(callback.headers.location).toBe("/configure-import");

		// 3. The picker works, calling Todoist with the access token (never the
		//    refresh token, which the app doesn't keep)
		const picker = await agent.get("/configure-import");
		expect(picker.status).toBe(200);
		expect(picker.text).toContain("Select your NBA team");
		expect(TodoistApiMock).toHaveBeenCalledWith("access-abc");

		// 4. An hour later the cookie is still valid but the token isn't:
		//    Todoist answers 401
		getUserMock.mockRejectedValue(
			Object.assign(new Error("Unauthorized"), {
				httpStatusCode: 401,
				responseData: { error_tag: "UNAUTHORIZED", http_code: 401 },
			}),
		);
		const expired = await agent.get("/configure-import");
		expect(expired.status).toBe(401);
		expect(expired.text).toContain("Session expired");
		expect(expired.text).toContain('href="/auth/login"');

		// 5. Following that link starts a fresh login straight away
		const relogin = await agent.get("/auth/login");
		expect(relogin.status).toBe(302);
		expect(relogin.headers.location).toMatch(
			/^https:\/\/todoist\.com\/oauth\/authorize\?/,
		);
	});
});
