import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
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

import loginRoute from "../../../app/routes/auth/login.js";
import callbackRoute from "../../../app/routes/auth/callback.js";

describe("auth routes", () => {
	beforeEach(() => {
		saveAccessTokenMock.mockReset();
		retrieveAccessTokenMock.mockReset();
	});

	function createApp() {
		const app = express();
		app.use("/api/auth", loginRoute);
		app.use("/api/auth", callbackRoute);
		return app;
	}

	it("redirects /login to Todoist OAuth URL", async () => {
		const response = await request(createApp()).get("/api/auth/login");

		expect(response.status).toBe(302);
		expect(response.headers.location).toContain(
			"https://todoist.com/oauth/authorize",
		);
		expect(response.headers.location).toContain("client_id=test-client-id");
		expect(response.headers.location).toContain("state=test-state-secret");
	});

	it("rejects callback when state does not match", async () => {
		const response = await request(createApp()).get(
			"/api/auth/callback?code=abc&state=wrong-state",
		);

		expect(response.status).toBe(403);
		expect(response.text).toContain("State mismatch");
		expect(retrieveAccessTokenMock).not.toHaveBeenCalled();
	});

	it("stores token and redirects on successful callback", async () => {
		retrieveAccessTokenMock.mockResolvedValue("token-123");
		saveAccessTokenMock.mockResolvedValue(undefined);

		const response = await request(createApp()).get(
			"/api/auth/callback?code=abc&state=test-state-secret",
		);

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/configure-import");
		expect(retrieveAccessTokenMock).toHaveBeenCalledWith("abc");
		expect(saveAccessTokenMock).toHaveBeenCalled();
	});

	it("returns 500 on generic OAuth exchange error", async () => {
		retrieveAccessTokenMock.mockRejectedValue(new Error("boom"));

		const response = await request(createApp()).get(
			"/api/auth/callback?code=abc&state=test-state-secret",
		);

		expect(response.status).toBe(500);
		expect(response.text).toContain(
			"Internal server error during OAuth flow.",
		);
	});
});
