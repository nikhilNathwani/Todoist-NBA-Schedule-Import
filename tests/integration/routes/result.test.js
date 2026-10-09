import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

const { getTeamsMock } = vi.hoisted(() => ({ getTeamsMock: vi.fn() }));

vi.mock("../../../app/utils/parseSchedule.js", () => ({
	getTeams: getTeamsMock,
}));

import resultRouter from "../../../app/routes/result.js";

describe("GET /result", () => {
	beforeEach(() => {
		getTeamsMock.mockReset();
		getTeamsMock.mockResolvedValue({
			BOS: { name: "Celtics", city: "Boston", nameCasual: "celtics" },
		});
	});

	// A plain object stands in for cookie-session, holding what POST /setup
	// would have saved
	function createApp(session) {
		const app = express();
		app.use((req, res, next) => {
			req.session = session;
			next();
		});
		app.use("/result", resultRouter);
		return app;
	}

	it("shows a success with the Open Todoist link and the team's logo", async () => {
		const response = await request(
			createApp({
				importResult: {
					ok: true,
					teamID: "BOS",
					deepLink: "https://app.todoist.com/app/project/p1",
				},
			}),
		).get("/result");

		expect(response.status).toBe(200);
		expect(response.text).toContain("Import complete!");
		expect(response.text).toContain(
			'href="https://app.todoist.com/app/project/p1"',
		);
		expect(response.text).toContain('src="/images/team-logos/BOS.svg"');
	});

	it("shows a failure's message, escaped, with Try again", async () => {
		const response = await request(
			createApp({
				importResult: {
					ok: false,
					teamID: "BOS",
					message: "Todoist said <b>no</b>",
				},
			}),
		).get("/result");

		expect(response.status).toBe(200);
		expect(response.text).toContain("An error occurred");
		expect(response.text).toContain("Todoist said &lt;b&gt;no&lt;/b&gt;");
		expect(response.text).not.toContain("<b>no</b>");
		expect(response.text).toContain('href="/setup"');
	});

	// teamID comes from the submitted form, so it can be anything
	it("falls back to the NBA logo for a team ID that isn't a real team", async () => {
		const response = await request(
			createApp({
				importResult: { ok: false, teamID: "constructor", message: "x" },
			}),
		).get("/result");

		expect(response.text).toContain('src="/images/nba-logo.png"');
		expect(response.text).not.toContain("team-logos/constructor");
	});

	it("redirects to /setup when nothing has been imported yet", async () => {
		const response = await request(createApp({})).get("/result");

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/setup");
	});
});
