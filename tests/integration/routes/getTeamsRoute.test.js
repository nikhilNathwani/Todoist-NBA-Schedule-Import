import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

const { getTeamsMock } = vi.hoisted(() => ({
	getTeamsMock: vi.fn(),
}));

vi.mock("../../../app/utils/parseSchedule.js", () => ({
	getTeams: getTeamsMock,
}));

import getTeamsRoute from "../../../app/routes/api/getTeams.js";

describe("GET /api/get-teams", () => {
	beforeEach(() => {
		getTeamsMock.mockReset();
	});

	function createApp() {
		const app = express();
		app.use("/api", getTeamsRoute);
		return app;
	}

	it("returns team payload from parseSchedule", async () => {
		getTeamsMock.mockResolvedValue({
			BOS: {
				name: "Boston Celtics",
				city: "Boston",
				nameCasual: "Celtics",
			},
		});

		const response = await request(createApp()).get("/api/get-teams");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			BOS: {
				name: "Boston Celtics",
				city: "Boston",
				nameCasual: "Celtics",
			},
		});
	});

	it("returns 500 when parseSchedule throws", async () => {
		getTeamsMock.mockRejectedValue(new Error("boom"));

		const response = await request(createApp()).get("/api/get-teams");

		expect(response.status).toBe(500);
		expect(response.body).toEqual({
			error: "Failed to retrieve team names.",
		});
	});
});
