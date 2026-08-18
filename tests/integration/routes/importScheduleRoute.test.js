import { describe, it, expect, vi, beforeEach } from "vitest";
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

vi.mock("../../../app/utils/cookieSession.js", () => ({
	getAccessToken: getAccessTokenMock,
}));

vi.mock("../../../app/utils/parseSchedule.js", () => ({
	getTeamData: getTeamDataMock,
}));

vi.mock("../../../app/utils/todoist.js", () => ({
	initializeTodoistAPI: initializeTodoistAPIMock,
	createDestination: createDestinationMock,
	importSchedule: importScheduleMock,
	addYearlyReminder: addYearlyReminderMock,
	createDeepLink: createDeepLinkMock,
	userReachedProjectLimit: userReachedProjectLimitMock,
}));

import importScheduleRoute from "../../../app/routes/api/importSchedule.js";

describe("POST /api/import-schedule", () => {
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

	function createApp() {
		const app = express();
		app.use(express.json());
		app.use("/api", importScheduleRoute);
		return app;
	}

	it("imports schedule and returns deep link", async () => {
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

		const response = await request(createApp())
			.post("/api/import-schedule")
			.send({ team: "BOS", project: "newProject" });

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ deepLink: "todoist://project/p1" });
		expect(getTeamDataMock).toHaveBeenCalledWith("BOS");
		expect(createDestinationMock).toHaveBeenCalledWith(
			fakeApi,
			"newProject",
			"Boston Celtics schedule",
			"red",
		);
		expect(importScheduleMock).toHaveBeenCalled();
		expect(addYearlyReminderMock).toHaveBeenCalled();
	});

	it("returns 401 when token retrieval fails", async () => {
		getAccessTokenMock.mockRejectedValue(new Error("missing token"));

		const response = await request(createApp())
			.post("/api/import-schedule")
			.send({ team: "BOS", project: "inbox" });

		expect(response.status).toBe(401);
		expect(response.body.success).toBe(false);
		expect(response.body.message).toContain("missing token");
	});

	it("returns 403 when free-tier project limit reached", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		initializeTodoistAPIMock.mockReturnValue({});
		userReachedProjectLimitMock.mockResolvedValue(true);

		const response = await request(createApp())
			.post("/api/import-schedule")
			.send({ team: "BOS", project: "newProject" });

		expect(response.status).toBe(403);
		expect(response.body.success).toBe(false);
		expect(response.body.message).toContain("project limit");
		expect(getTeamDataMock).not.toHaveBeenCalled();
	});

	it("returns 500 when project limit check fails", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		initializeTodoistAPIMock.mockReturnValue({});
		userReachedProjectLimitMock.mockRejectedValue(new Error("api down"));

		const response = await request(createApp())
			.post("/api/import-schedule")
			.send({ team: "BOS", project: "newProject" });

		expect(response.status).toBe(500);
		expect(response.body.success).toBe(false);
		expect(response.body.message).toContain(
			"Failed to validate permissions",
		);
	});

	it("returns 500 when import flow fails", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		initializeTodoistAPIMock.mockReturnValue({});
		userReachedProjectLimitMock.mockResolvedValue(false);
		getTeamDataMock.mockRejectedValue(new Error("bad team"));

		const response = await request(createApp())
			.post("/api/import-schedule")
			.send({ team: "BOS", project: "newProject" });

		expect(response.status).toBe(500);
		expect(response.body.success).toBe(false);
		expect(response.body.message).toContain(
			"Error importing games: bad team",
		);
	});
});
