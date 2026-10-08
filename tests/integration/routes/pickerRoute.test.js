import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";

const { getAccessTokenMock, userReachedProjectLimitMock, getTeamsMock } =
	vi.hoisted(() => ({
		getAccessTokenMock: vi.fn(),
		userReachedProjectLimitMock: vi.fn(),
		getTeamsMock: vi.fn(),
	}));

vi.mock("../../../app/utils/cookieSession.js", () => ({
	getAccessToken: getAccessTokenMock,
}));

vi.mock("../../../app/utils/todoist.js", () => ({
	userReachedProjectLimit: userReachedProjectLimitMock,
}));

vi.mock("../../../app/utils/parseSchedule.js", () => ({
	getTeams: getTeamsMock,
}));

import pickerRouter from "../../../app/routes/pages/picker.js";

describe("GET /configure-import", () => {
	beforeEach(() => {
		getAccessTokenMock.mockReset();
		userReachedProjectLimitMock.mockReset();
		getTeamsMock.mockReset();
		getTeamsMock.mockResolvedValue({
			LAL: { name: "Lakers", city: "Los Angeles", nameCasual: "lakers" },
			BOS: { name: "Celtics", city: "Boston", nameCasual: "celtics" },
		});
	});

	function createApp() {
		const app = express();
		app.use("/configure-import", pickerRouter);
		return app;
	}

	it("renders the picker page on success", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		userReachedProjectLimitMock.mockResolvedValue(false);

		const response = await request(createApp()).get("/configure-import");

		expect(response.status).toBe(200);
		expect(response.text).toContain("Select your NBA team");
	});

	it("renders the team options into the page, sorted by city", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		userReachedProjectLimitMock.mockResolvedValue(false);

		const response = await request(createApp()).get("/configure-import");

		const boston = response.text.indexOf(
			'<option value="BOS" data-team-name="Celtics">Boston Celtics</option>',
		);
		const losAngeles = response.text.indexOf(
			'<option value="LAL" data-team-name="Lakers">Los Angeles Lakers</option>',
		);
		expect(boston).toBeGreaterThan(-1);
		expect(losAngeles).toBeGreaterThan(boston);
	});

	it("disables Create New Project when the user is at their plan's limit", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		userReachedProjectLimitMock.mockResolvedValue(true);

		const response = await request(createApp()).get("/configure-import");

		expect(response.text).toContain('value="newProject" disabled');
		expect(response.text).toContain("Project limit reached");
	});

	it("renders a classified error page (not a raw 500) when the limit check fails with a known Todoist error", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		userReachedProjectLimitMock.mockRejectedValue(
			Object.assign(
				new Error(
					"Todoist is temporarily unavailable (maintenance or overload). Please try again shortly.",
				),
				{ todoistErrorType: "SERVICE_UNAVAILABLE", retryable: true },
			),
		);

		const response = await request(createApp()).get("/configure-import");

		expect(response.status).toBe(502);
		expect(response.text).toContain("temporarily unavailable");
	});

	// The cookie can outlive the token inside it: a revoked token, or (in
	// Todoist's refresh-token mode) a one-hour token that expired. Todoist
	// then answers 401, which should read as "log in again", with a link
	// that starts OAuth directly.
	it("shows 'Session expired' with a direct login link when Todoist rejects the token", async () => {
		const { toClassifiedError } = await import(
			"../../../app/utils/todoistErrors.js"
		);
		getAccessTokenMock.mockResolvedValue("expired-token");
		userReachedProjectLimitMock.mockRejectedValue(
			toClassifiedError(
				Object.assign(new Error("Unauthorized"), {
					httpStatusCode: 401,
					responseData: { error_tag: "UNAUTHORIZED", http_code: 401 },
				}),
				"userReachedProjectLimit",
			),
		);

		const response = await request(createApp()).get("/configure-import");

		expect(response.status).toBe(401);
		expect(response.text).toContain("Session expired");
		expect(response.text).toContain('href="/auth/login"');
	});

	it("redirects to the start page when there's no valid session", async () => {
		getAccessTokenMock.mockRejectedValue(
			new Error("Access token is not set in the session."),
		);

		const response = await request(createApp()).get("/configure-import");

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/");
		expect(userReachedProjectLimitMock).not.toHaveBeenCalled();
	});

	it("falls back to a generic 500 for an unclassified error", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		userReachedProjectLimitMock.mockRejectedValue(new Error("boom"));

		const response = await request(createApp()).get("/configure-import");

		expect(response.status).toBe(500);
		expect(response.text).toBe("An error occurred");
	});

	describe("error-demo gating (ENABLE_ERROR_DEMO)", () => {
		const originalEnv = process.env.ENABLE_ERROR_DEMO;

		afterEach(() => {
			process.env.ENABLE_ERROR_DEMO = originalEnv;
		});

		it("ignores ?mockTodoistError when demo mode is disabled", async () => {
			delete process.env.ENABLE_ERROR_DEMO;
			vi.resetModules();
			const { default: freshRoute } = await import(
				"../../../app/routes/pages/picker.js"
			);
			const app = express();
			app.use("/configure-import", freshRoute);

			getAccessTokenMock.mockResolvedValue("token");
			userReachedProjectLimitMock.mockResolvedValue(false);

			await request(app).get("/configure-import?mockTodoistError=500");

			expect(userReachedProjectLimitMock).toHaveBeenCalledWith(
				"token",
				undefined,
			);
		});

		it("forwards ?mockTodoistError when demo mode is enabled", async () => {
			process.env.ENABLE_ERROR_DEMO = "true";
			vi.resetModules();
			const { default: freshRoute } = await import(
				"../../../app/routes/pages/picker.js"
			);
			const app = express();
			app.use("/configure-import", freshRoute);

			getAccessTokenMock.mockResolvedValue("token");
			userReachedProjectLimitMock.mockResolvedValue(false);

			await request(app).get("/configure-import?mockTodoistError=500");

			expect(userReachedProjectLimitMock).toHaveBeenCalledWith(
				"token",
				"500",
			);
		});
	});
});
