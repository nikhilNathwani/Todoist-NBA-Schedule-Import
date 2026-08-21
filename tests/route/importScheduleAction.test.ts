import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Ported from the old tests/integration/routes/importScheduleRoute.test.js
// (Express Route via Supertest) onto app/configure-import/actions.ts's
// Server Action, called directly as a plain async function -- no
// Supertest/HTTP layer needed, per the migration task's testing guidance.
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

vi.mock("@/lib/cookieSession", () => ({
	getAccessToken: getAccessTokenMock,
}));

vi.mock("@/lib/parseSchedule", () => ({
	getTeamData: getTeamDataMock,
}));

vi.mock("@/lib/todoist", () => ({
	initializeTodoistAPI: initializeTodoistAPIMock,
	createDestination: createDestinationMock,
	importSchedule: importScheduleMock,
	addYearlyReminder: addYearlyReminderMock,
	createDeepLink: createDeepLinkMock,
	userReachedProjectLimit: userReachedProjectLimitMock,
}));

import { importScheduleAction } from "@/app/configure-import/actions";

describe("importScheduleAction (Server Action)", () => {
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

	it("imports schedule and returns a deep link", async () => {
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

		const result = await importScheduleAction("BOS", "newProject");

		expect(result).toEqual({ success: true, deepLink: "todoist://project/p1" });
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

	it("returns a failure result when access token retrieval fails", async () => {
		getAccessTokenMock.mockRejectedValue(new Error("missing token"));

		const result = await importScheduleAction("BOS", "inbox");

		expect(result.success).toBe(false);
		expect(!result.success && result.message).toContain("missing token");
	});

	it("returns a failure result when the free-tier project limit is reached", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		initializeTodoistAPIMock.mockReturnValue({});
		userReachedProjectLimitMock.mockResolvedValue(true);

		const result = await importScheduleAction("BOS", "newProject");

		expect(result.success).toBe(false);
		expect(!result.success && result.message).toContain("project limit");
		expect(getTeamDataMock).not.toHaveBeenCalled();
	});

	it("returns a failure result when the project-limit check itself fails", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		initializeTodoistAPIMock.mockReturnValue({});
		userReachedProjectLimitMock.mockRejectedValue(new Error("api down"));

		const result = await importScheduleAction("BOS", "newProject");

		expect(result.success).toBe(false);
		expect(!result.success && result.message).toContain(
			"Failed to validate permissions",
		);
	});

	it("returns a failure result when the import flow fails", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		initializeTodoistAPIMock.mockReturnValue({});
		userReachedProjectLimitMock.mockResolvedValue(false);
		getTeamDataMock.mockRejectedValue(new Error("bad team"));

		const result = await importScheduleAction("BOS", "newProject");

		expect(result.success).toBe(false);
		expect(!result.success && result.message).toContain(
			"Error importing games: bad team",
		);
	});

	describe("classified Todoist error results", () => {
		it("surfaces a rate-limited createDestination failure with error details", async () => {
			getAccessTokenMock.mockResolvedValue("token");
			initializeTodoistAPIMock.mockReturnValue({});
			userReachedProjectLimitMock.mockResolvedValue(false);
			getTeamDataMock.mockResolvedValue({
				name: "Boston Celtics",
				color: "red",
				schedule: [],
			});
			createDestinationMock.mockRejectedValue(
				Object.assign(
					new Error(
						"Todoist is rate-limiting requests right now. Please wait about 12s and try again.",
					),
					{
						todoistErrorType: "RATE_LIMITED",
						retryable: true,
						retryAfterSeconds: 12,
					},
				),
			);

			const result = await importScheduleAction("BOS", "inbox");

			expect(result).toMatchObject({
				success: false,
				errorType: "RATE_LIMITED",
				retryable: true,
				retryAfterSeconds: 12,
			});
		});

		it("surfaces an expired-auth failure from the project-limit check", async () => {
			getAccessTokenMock.mockResolvedValue("token");
			initializeTodoistAPIMock.mockReturnValue({});
			userReachedProjectLimitMock.mockRejectedValue(
				Object.assign(
					new Error(
						"Your Todoist session has expired or was revoked. Please log in again.",
					),
					{ todoistErrorType: "AUTH_EXPIRED", retryable: false },
				),
			);

			const result = await importScheduleAction("BOS", "newProject");

			expect(!result.success && result.errorType).toBe("AUTH_EXPIRED");
		});
	});

	describe("error-demo gating (ENABLE_ERROR_DEMO)", () => {
		const originalEnv = process.env.ENABLE_ERROR_DEMO;

		afterEach(() => {
			process.env.ENABLE_ERROR_DEMO = originalEnv;
		});

		it("does not forward mockError when demo mode is disabled", async () => {
			delete process.env.ENABLE_ERROR_DEMO;
			getAccessTokenMock.mockResolvedValue("token");
			initializeTodoistAPIMock.mockReturnValue({});
			userReachedProjectLimitMock.mockResolvedValue(false);

			await importScheduleAction("BOS", "newProject", "500");

			expect(userReachedProjectLimitMock).toHaveBeenCalledWith(
				"token",
				undefined,
			);
		});

		it("forwards mockError when demo mode is enabled", async () => {
			process.env.ENABLE_ERROR_DEMO = "true";
			getAccessTokenMock.mockResolvedValue("token");
			initializeTodoistAPIMock.mockReturnValue({});
			userReachedProjectLimitMock.mockResolvedValue(false);

			await importScheduleAction("BOS", "newProject", "500");

			expect(userReachedProjectLimitMock).toHaveBeenCalledWith(
				"token",
				"500",
			);
		});
	});
});
