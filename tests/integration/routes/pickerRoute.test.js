import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";

const { getAccessTokenMock, userReachedProjectLimitMock } = vi.hoisted(() => ({
	getAccessTokenMock: vi.fn(),
	userReachedProjectLimitMock: vi.fn(),
}));

vi.mock("../../../app/utils/cookieSession.js", () => ({
	getAccessToken: getAccessTokenMock,
}));

vi.mock("../../../app/utils/todoist.js", () => ({
	userReachedProjectLimit: userReachedProjectLimitMock,
}));

import pickerRoute from "../../../app/routes/pages/picker.js";

describe("GET /configure-import", () => {
	beforeEach(() => {
		getAccessTokenMock.mockReset();
		userReachedProjectLimitMock.mockReset();
	});

	function createApp() {
		const app = express();
		app.use(pickerRoute);
		return app;
	}

	it("renders the picker page on success", async () => {
		getAccessTokenMock.mockResolvedValue("token");
		userReachedProjectLimitMock.mockResolvedValue(false);

		const response = await request(createApp()).get("/configure-import");

		expect(response.status).toBe(200);
		expect(response.text).toContain("Select your NBA team");
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
			app.use(freshRoute);

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
			app.use(freshRoute);

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
