import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";

const { getAccessTokenMock, userReachedProjectLimitMock, getTeamsMock } =
	vi.hoisted(() => ({
		getAccessTokenMock: vi.fn(),
		userReachedProjectLimitMock: vi.fn(),
		getTeamsMock: vi.fn(),
	}));

// Only the token read is faked; the import-result helpers run for real
vi.mock("../../../app/utils/cookieSession.js", async (importOriginal) => ({
	...(await importOriginal()),
	getAccessToken: getAccessTokenMock,
}));

// The router also imports the POST handler's helpers; stub them so the
// module loads (no GET test calls them)
vi.mock("../../../app/utils/todoist.js", () => ({
	userReachedProjectLimit: userReachedProjectLimitMock,
	initializeTodoistAPI: vi.fn(),
	createDestination: vi.fn(),
	importSchedule: vi.fn(),
	addYearlyReminder: vi.fn(),
	createDeepLink: vi.fn(),
}));

vi.mock("../../../app/utils/parseSchedule.js", () => ({
	getTeams: getTeamsMock,
	getTeamData: vi.fn(),
}));

import setupRouter from "../../../app/routes/setup.js";

describe("GET /setup", () => {
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
		app.use("/setup", setupRouter);
		return app;
	}

	it("renders the setup page on success", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		userReachedProjectLimitMock.mockResolvedValue(false);

		const response = await request(createApp()).get("/setup");

		expect(response.status).toBe(200);
		expect(response.text).toContain("Select your NBA team");
		// A plain form post back to this path runs the import
		expect(response.text).toContain('<form method="post" action="/setup">');
	});

	it("renders the team options into the page, sorted by city", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		userReachedProjectLimitMock.mockResolvedValue(false);

		const response = await request(createApp()).get("/setup");

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

		const response = await request(createApp()).get("/setup");

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

		const response = await request(createApp()).get("/setup");

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

		const response = await request(createApp()).get("/setup");

		expect(response.status).toBe(401);
		expect(response.text).toContain("Session expired");
		expect(response.text).toContain('href="/auth/login"');
	});

	it("redirects to the start page when there's no valid session", async () => {
		getAccessTokenMock.mockRejectedValue(
			new Error("Access token is not set in the session."),
		);

		const response = await request(createApp()).get("/setup");

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/");
		expect(userReachedProjectLimitMock).not.toHaveBeenCalled();
	});

	it("falls back to a generic 500 for an unclassified error", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		userReachedProjectLimitMock.mockRejectedValue(new Error("boom"));

		const response = await request(createApp()).get("/setup");

		expect(response.status).toBe(500);
		expect(response.text).toBe("An error occurred");
	});

	describe("error-demo gating (ENABLE_ERROR_DEMO)", () => {
		const originalEnv = process.env.ENABLE_ERROR_DEMO;

		afterEach(() => {
			process.env.ENABLE_ERROR_DEMO = originalEnv;
		});

		// The route reads ENABLE_ERROR_DEMO when it loads, so load a fresh copy
		async function appWithDemo(enabled) {
			if (enabled) process.env.ENABLE_ERROR_DEMO = "true";
			else delete process.env.ENABLE_ERROR_DEMO;
			vi.resetModules();
			const { default: freshRoute } = await import(
				"../../../app/routes/setup.js"
			);
			const app = express();
			app.use("/setup", freshRoute);
			getAccessTokenMock.mockResolvedValue("token");
			userReachedProjectLimitMock.mockResolvedValue(false);
			return app;
		}

		it("ignores the demo parameters when demo mode is disabled", async () => {
			const app = await appWithDemo(false);

			const response = await request(app).get(
				"/setup?mockTierCheck=500&mockTodoistError=500",
			);

			expect(userReachedProjectLimitMock).toHaveBeenCalledWith(
				"token",
				undefined,
			);
			expect(response.text).not.toContain('name="mockError"');
		});

		it("simulates a tier-check failure for ?mockTierCheck=<error code>", async () => {
			const app = await appWithDemo(true);

			await request(app).get("/setup?mockTierCheck=500");

			expect(userReachedProjectLimitMock).toHaveBeenCalledWith(
				"token",
				"500",
			);
		});

		it("shows the at-the-limit picker for ?mockTierCheck=reached, without calling Todoist", async () => {
			const app = await appWithDemo(true);

			const response = await request(app).get("/setup?mockTierCheck=reached");

			expect(userReachedProjectLimitMock).not.toHaveBeenCalled();
			expect(response.text).toContain("Project limit reached");
			expect(response.text).toMatch(/value="newProject"\s+disabled/);
		});

		it("shows the open picker for ?mockTierCheck=available, without calling Todoist", async () => {
			const app = await appWithDemo(true);

			const response = await request(app).get(
				"/setup?mockTierCheck=available",
			);

			expect(userReachedProjectLimitMock).not.toHaveBeenCalled();
			expect(response.text).toMatch(/value="newProject"\s+checked/);
		});

		it("passes ?mockTodoistError to the import through a hidden form field", async () => {
			const app = await appWithDemo(true);

			const response = await request(app).get("/setup?mockTodoistError=429");

			// The page itself does a real tier check and renders the form
			expect(userReachedProjectLimitMock).toHaveBeenCalledWith(
				"token",
				undefined,
			);
			expect(response.text).toContain(
				'<input type="hidden" name="mockError" value="429">',
			);
		});
	});
});
