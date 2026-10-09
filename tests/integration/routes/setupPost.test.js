import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";

const {
	getAccessTokenMock,
	getTeamDataMock,
	initializeTodoistAPIMock,
	createDestinationMock,
	importScheduleMock,
	addYearlyReminderMock,
	createDeepLinkMock,
	userReachedProjectLimitMock,
} = vi.hoisted(() => ({
	getAccessTokenMock: vi.fn(),
	getTeamDataMock: vi.fn(),
	initializeTodoistAPIMock: vi.fn(),
	createDestinationMock: vi.fn(),
	importScheduleMock: vi.fn(),
	addYearlyReminderMock: vi.fn(),
	createDeepLinkMock: vi.fn(),
	userReachedProjectLimitMock: vi.fn(),
}));

// Only the token read is faked; the import-result helpers run for real
vi.mock("../../../app/utils/cookieSession.js", async (importOriginal) => ({
	...(await importOriginal()),
	getAccessToken: getAccessTokenMock,
}));

// getTeams is only used by the GET handler; stubbed so the router loads
vi.mock("../../../app/utils/parseSchedule.js", () => ({
	getTeamData: getTeamDataMock,
	getTeams: vi.fn(),
}));

vi.mock("../../../app/utils/todoist.js", () => ({
	initializeTodoistAPI: initializeTodoistAPIMock,
	createDestination: createDestinationMock,
	importSchedule: importScheduleMock,
	addYearlyReminder: addYearlyReminderMock,
	createDeepLink: createDeepLinkMock,
	userReachedProjectLimit: userReachedProjectLimitMock,
}));

import setupRouter from "../../../app/routes/setup.js";

describe("POST /setup", () => {
	beforeEach(() => {
		getAccessTokenMock.mockReset();
		getTeamDataMock.mockReset();
		initializeTodoistAPIMock.mockReset();
		createDestinationMock.mockReset();
		importScheduleMock.mockReset();
		addYearlyReminderMock.mockReset();
		createDeepLinkMock.mockReset();
		userReachedProjectLimitMock.mockReset();
	});

	// The route saves its outcome in req.session; a plain object stands in
	// for cookie-session so each test can read what was saved
	let session;
	function createApp(router = setupRouter) {
		const app = express();
		app.use(express.urlencoded({ extended: true }));
		app.use((req, res, next) => {
			session = req.session = {};
			next();
		});
		app.use("/setup", router);
		return app;
	}

	// Every outcome, success or failure, redirects to the result page
	function expectRedirectToResult(response) {
		expect(response.status).toBe(303);
		expect(response.headers.location).toBe("/result");
	}

	// Sent the way the browser sends the form: URL-encoded, not JSON
	const post = (app, fields) =>
		request(app).post("/setup").type("form").send(fields);

	it("imports the schedule and saves the deep link for the result page", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		userReachedProjectLimitMock.mockResolvedValue(false);
		const fakeApi = { addTask: vi.fn() };
		initializeTodoistAPIMock.mockReturnValue(fakeApi);
		getTeamDataMock.mockResolvedValue({
			name: "Boston Celtics",
			color: "red",
			schedule: [
				{ opponent: "LAL", gameTimeUtcIso8601: "2026-01-01T10:00:00Z" },
			],
		});
		createDestinationMock.mockResolvedValue({ projectId: "p1" });
		importScheduleMock.mockResolvedValue(undefined);
		addYearlyReminderMock.mockResolvedValue(undefined);
		createDeepLinkMock.mockReturnValue("todoist://project/p1");

		const response = await post(createApp(), {
			team: "BOS",
			project: "newProject",
		});

		expectRedirectToResult(response);
		expect(session.importResult).toEqual({
			ok: true,
			teamID: "BOS",
			deepLink: "todoist://project/p1",
		});
		expect(getTeamDataMock).toHaveBeenCalledWith("BOS");
		expect(createDestinationMock).toHaveBeenCalledWith(
			fakeApi,
			"newProject",
			"Boston Celtics schedule",
			"red",
			undefined,
		);
		expect(importScheduleMock).toHaveBeenCalled();
		expect(addYearlyReminderMock).toHaveBeenCalled();
	});

	it("saves 'session expired' (not the internal error) when there's no valid session", async () => {
		getAccessTokenMock.mockRejectedValue(
			new Error("Access token is not set in the session."),
		);

		const response = await post(createApp(), {
			team: "BOS",
			project: "inbox",
		});

		expectRedirectToResult(response);
		expect(session.importResult).toEqual({
			ok: false,
			teamID: "BOS",
			errorType: "AUTH_EXPIRED",
			message: "Your session has expired. Please log in again.",
		});
	});

	it("saves a project-limit failure when the free-tier limit is reached", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		initializeTodoistAPIMock.mockReturnValue({});
		userReachedProjectLimitMock.mockResolvedValue(true);

		const response = await post(createApp(), {
			team: "BOS",
			project: "newProject",
		});

		expectRedirectToResult(response);
		expect(session.importResult.ok).toBe(false);
		expect(session.importResult.message).toContain("project limit");
		expect(getTeamDataMock).not.toHaveBeenCalled();
	});

	it("saves a failure when the project limit check throws", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		initializeTodoistAPIMock.mockReturnValue({});
		userReachedProjectLimitMock.mockRejectedValue(new Error("api down"));

		const response = await post(createApp(), {
			team: "BOS",
			project: "newProject",
		});

		expectRedirectToResult(response);
		expect(session.importResult.ok).toBe(false);
		expect(session.importResult.message).toContain(
			"Failed to validate permissions",
		);
	});

	it("saves a failure when the import flow throws", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		initializeTodoistAPIMock.mockReturnValue({});
		userReachedProjectLimitMock.mockResolvedValue(false);
		getTeamDataMock.mockRejectedValue(new Error("bad team"));

		const response = await post(createApp(), {
			team: "BOS",
			project: "newProject",
		});

		expectRedirectToResult(response);
		expect(session.importResult.ok).toBe(false);
		expect(session.importResult.message).toContain(
			"Error importing games: bad team",
		);
	});

	describe("classified Todoist errors", () => {
		it("saves a rate-limited createDestination failure with its classified message", async () => {
			getAccessTokenMock.mockResolvedValue("token");
			initializeTodoistAPIMock.mockReturnValue({});
			userReachedProjectLimitMock.mockResolvedValue(false);
			getTeamDataMock.mockResolvedValue({
				name: "Boston Celtics",
				color: "red",
				schedule: [],
			});
			createDestinationMock.mockRejectedValue(
				Object.assign(new Error("Todoist is rate-limiting requests right now. Please wait about 12s and try again."), {
					todoistErrorType: "RATE_LIMITED",
					retryable: true,
					retryAfterSeconds: 12,
				}),
			);

			const response = await post(createApp(), {
				team: "BOS",
				project: "inbox",
			});

			expectRedirectToResult(response);
			expect(session.importResult).toEqual({
				ok: false,
				teamID: "BOS",
				errorType: "RATE_LIMITED",
				message:
					"Todoist is rate-limiting requests right now. Please wait about 12s and try again.",
			});
		});

		it("saves an expired-auth failure from the project-limit check", async () => {
			getAccessTokenMock.mockResolvedValue("token");
			initializeTodoistAPIMock.mockReturnValue({});
			userReachedProjectLimitMock.mockRejectedValue(
				Object.assign(new Error("Your Todoist session has expired or was revoked. Please log in again."), {
					todoistErrorType: "AUTH_EXPIRED",
					retryable: false,
				}),
			);

			const response = await post(createApp(), {
				team: "BOS",
				project: "newProject",
			});

			expectRedirectToResult(response);
			expect(session.importResult.errorType).toBe("AUTH_EXPIRED");
		});

		it("saves an outage-shaped failure", async () => {
			getAccessTokenMock.mockResolvedValue("token");
			initializeTodoistAPIMock.mockReturnValue({});
			userReachedProjectLimitMock.mockResolvedValue(false);
			getTeamDataMock.mockResolvedValue({
				name: "Boston Celtics",
				color: "red",
				schedule: [],
			});
			createDestinationMock.mockRejectedValue(
				Object.assign(new Error("Todoist is having a server-side issue right now."), {
					todoistErrorType: "SERVER_ERROR",
					retryable: true,
					retryAfterSeconds: 10,
				}),
			);

			const response = await post(createApp(), {
				team: "BOS",
				project: "inbox",
			});

			expectRedirectToResult(response);
			expect(session.importResult.errorType).toBe("SERVER_ERROR");
		});
	});

	describe("error-demo gating (ENABLE_ERROR_DEMO)", () => {
		const originalEnv = process.env.ENABLE_ERROR_DEMO;

		afterEach(() => {
			process.env.ENABLE_ERROR_DEMO = originalEnv;
		});

		it("does not forward mockError to todoist.js when demo mode is disabled", async () => {
			delete process.env.ENABLE_ERROR_DEMO;
			vi.resetModules();
			const { default: freshRoute } = await import(
				"../../../app/routes/setup.js"
			);
			const app = createApp(freshRoute);

			getAccessTokenMock.mockResolvedValue("token");
			initializeTodoistAPIMock.mockReturnValue({});
			userReachedProjectLimitMock.mockResolvedValue(false);

			await post(app, {
				team: "BOS",
				project: "newProject",
				mockError: "500",
			});

			expect(userReachedProjectLimitMock).toHaveBeenCalledWith(
				"token",
				undefined,
			);
		});

		it("forwards mockError to todoist.js when demo mode is enabled", async () => {
			process.env.ENABLE_ERROR_DEMO = "true";
			vi.resetModules();
			const { default: freshRoute } = await import(
				"../../../app/routes/setup.js"
			);
			const app = createApp(freshRoute);

			getAccessTokenMock.mockResolvedValue("token");
			initializeTodoistAPIMock.mockReturnValue({});
			userReachedProjectLimitMock.mockResolvedValue(false);

			await post(app, {
				team: "BOS",
				project: "newProject",
				mockError: "500",
			});

			expect(userReachedProjectLimitMock).toHaveBeenCalledWith(
				"token",
				"500",
			);
		});
	});
});
