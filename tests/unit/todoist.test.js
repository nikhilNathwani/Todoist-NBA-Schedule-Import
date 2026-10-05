import { describe, it, expect, vi, beforeEach } from "vitest";

const { TodoistApiMock, getProjectUrlMock, getSectionUrlMock } = vi.hoisted(
	() => ({
		TodoistApiMock: vi.fn(),
		getProjectUrlMock: vi.fn((id) => `project:${id}`),
		getSectionUrlMock: vi.fn((id) => `section:${id}`),
	}),
);

vi.mock("@doist/todoist-api-typescript", () => ({
	TodoistApi: TodoistApiMock,
	getProjectUrl: getProjectUrlMock,
	getSectionUrl: getSectionUrlMock,
}));

import {
	createDestination,
	createDeepLink,
	importSchedule,
	addYearlyReminder,
	userReachedProjectLimit,
} from "../../app/utils/todoist.js";

describe("todoist utilities", () => {
	beforeEach(() => {
		TodoistApiMock.mockReset();
		getProjectUrlMock.mockClear();
		getSectionUrlMock.mockClear();
	});

	it("detects free-tier project limit", async () => {
		TodoistApiMock.mockImplementation(function TodoistApiCtor() {
			return {
				getProjects: vi.fn().mockResolvedValue([
					{ id: "inbox", inboxProject: true },
					{ id: "a", inboxProject: false },
					{ id: "b", inboxProject: false },
					{ id: "c", inboxProject: false },
					{ id: "d", inboxProject: false },
					{ id: "e", inboxProject: false },
				]),
			};
		});

		await expect(userReachedProjectLimit("token")).resolves.toBe(true);
	});

	it("simulates a classified Todoist error via mockErrorCode instead of calling the API", async () => {
		const getProjects = vi.fn();
		TodoistApiMock.mockImplementation(function TodoistApiCtor() {
			return { getProjects };
		});

		await expect(
			userReachedProjectLimit("token", "503"),
		).rejects.toMatchObject({
			todoistErrorType: "SERVICE_UNAVAILABLE",
			httpStatusCode: 503,
			retryable: true,
		});
		expect(getProjects).not.toHaveBeenCalled();
	});

	it("classifies a real SDK failure from userReachedProjectLimit", async () => {
		const rateLimitError = Object.assign(new Error("Too Many Requests"), {
			httpStatusCode: 429,
			responseData: { retry_after: 15 },
		});
		TodoistApiMock.mockImplementation(function TodoistApiCtor() {
			return { getProjects: vi.fn().mockRejectedValue(rateLimitError) };
		});

		await expect(
			userReachedProjectLimit("token"),
		).rejects.toMatchObject({
			todoistErrorType: "RATE_LIMITED",
			retryAfterSeconds: 15,
		});
	});

	it("creates inbox section destination", async () => {
		const api = {
			getProjects: vi.fn().mockResolvedValue([
				{ id: "p1", inboxProject: false },
				{ id: "inbox-id", inboxProject: true },
			]),
			addSection: vi.fn().mockResolvedValue({ id: "section-1" }),
		};

		const destination = await createDestination(
			api,
			"inbox",
			"BOS schedule",
			"red",
		);

		expect(api.addSection).toHaveBeenCalledWith({
			name: "BOS schedule",
			projectId: "inbox-id",
		});
		expect(destination).toEqual({
			projectId: "inbox-id",
			sectionId: "section-1",
		});
	});

	it("creates new Todoist project destination", async () => {
		const api = {
			addProject: vi.fn().mockResolvedValue({ id: "project-1" }),
		};

		const destination = await createDestination(
			api,
			"newProject",
			"BOS schedule",
			"red",
		);

		expect(api.addProject).toHaveBeenCalledWith({
			name: "BOS schedule",
			color: "red",
		});
		expect(destination).toEqual({ projectId: "project-1" });
	});

	it("throws for invalid destination", async () => {
		await expect(
			createDestination({}, "bad", "BOS schedule", "red"),
		).rejects.toThrow("Invalid destination type: bad");
	});

	it("simulates a classified Todoist error via mockErrorCode instead of calling the API", async () => {
		const api = {
			getProjects: vi.fn(),
			addProject: vi.fn(),
			addSection: vi.fn(),
		};

		await expect(
			createDestination(api, "newProject", "BOS schedule", "red", "429"),
		).rejects.toMatchObject({
			todoistErrorType: "RATE_LIMITED",
			httpStatusCode: 429,
			retryable: true,
		});
		expect(api.getProjects).not.toHaveBeenCalled();
		expect(api.addProject).not.toHaveBeenCalled();
	});

	it("classifies a real SDK failure from createDestination (inbox)", async () => {
		const authError = Object.assign(new Error("Unauthorized"), {
			httpStatusCode: 401,
		});
		const api = { getProjects: vi.fn().mockRejectedValue(authError) };

		await expect(
			createDestination(api, "inbox", "BOS schedule", "red"),
		).rejects.toMatchObject({ todoistErrorType: "AUTH_EXPIRED" });
	});

	it("classifies a real SDK failure from createDestination (newProject)", async () => {
		const serverError = Object.assign(new Error("Server error"), {
			httpStatusCode: 500,
		});
		const api = { addProject: vi.fn().mockRejectedValue(serverError) };

		await expect(
			createDestination(api, "newProject", "BOS schedule", "red"),
		).rejects.toMatchObject({ todoistErrorType: "SERVER_ERROR", retryable: true });
	});

	it("creates deep link to section when section id exists", () => {
		const deepLink = createDeepLink({ projectId: "p1", sectionId: "s1" });
		expect(deepLink).toBe("section:s1");
		expect(getSectionUrlMock).toHaveBeenCalledWith("s1");
	});

	it("creates deep link to project when only project id exists", () => {
		const deepLink = createDeepLink({ projectId: "p1" });
		expect(deepLink).toBe("project:p1");
		expect(getProjectUrlMock).toHaveBeenCalledWith("p1");
	});

	it("imports all games as Todoist tasks", async () => {
		const api = { addTask: vi.fn().mockResolvedValue({}) };
		const schedule = [
			{
				opponent: "LAL",
				isHomeGame: true,
				gameTimeUtcIso8601: "2026-01-01T10:00:00Z",
			},
			{
				opponent: "MIA",
				isHomeGame: false,
				gameTimeUtcIso8601: "2026-01-02T10:00:00Z",
			},
		];

		await importSchedule(api, schedule, "BOS", { projectId: "p1" });

		expect(api.addTask).toHaveBeenCalledTimes(2);
		expect(api.addTask).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				content: "BOS vs LAL",
				projectId: "p1",
				order: 1,
			}),
		);
		expect(api.addTask).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				content: "BOS at MIA",
				projectId: "p1",
				order: 2,
			}),
		);
	});

	it("adds yearly reminder in section when section exists", async () => {
		const api = { addTask: vi.fn().mockResolvedValue({}) };

		await addYearlyReminder(api, "BOS", {
			projectId: "project-1",
			sectionId: "section-1",
		});

		expect(api.addTask).toHaveBeenCalledWith(
			expect.objectContaining({
				content: "Import BOS regular season schedule",
				projectId: "project-1",
				sectionId: "section-1",
				dueString: "every October 10th",
			}),
		);
	});
});
