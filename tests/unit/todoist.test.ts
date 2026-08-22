import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TodoistApi } from "@doist/todoist-api-typescript";

// Test doubles below are intentionally minimal duck-typed objects (only the
// methods each test actually calls), not full TodoistApi instances -- the
// `as unknown as TodoistApi` casts tell TypeScript that's deliberate rather
// than a missed field. lib/todoist.ts's real signature takes a `TodoistApi`
// because that's what production code passes in; tests substitute a mock
// shaped like just the slice of it that's used.
function asApi(partial: Record<string, unknown>): TodoistApi {
	return partial as unknown as TodoistApi;
}

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
	GAME_RETRY_BACKOFF_SECONDS,
} from "@/lib/todoist";

describe("todoist utilities", () => {
	beforeEach(() => {
		TodoistApiMock.mockReset();
		getProjectUrlMock.mockClear();
		getSectionUrlMock.mockClear();
	});

	it("detects free-tier project limit", async () => {
		TodoistApiMock.mockImplementation(function TodoistApiCtor() {
			return {
				getUser: vi.fn().mockResolvedValue({ isPremium: false }),
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

	it("uses the real isPremium flag, not an inferred one, to pick the threshold", async () => {
		// A free account that happens to have MORE than 5 projects (e.g. some
		// were created outside this app) must still be evaluated against the
		// free-tier cap, not misclassified as premium just because the count
		// crossed 5 -- this is exactly the bug an earlier version had, where
		// premium status was inferred from projectCount > 5 instead of read
		// from the API. 6 real projects, isPremium: false -> still "reached".
		TodoistApiMock.mockImplementation(function TodoistApiCtor() {
			return {
				getUser: vi.fn().mockResolvedValue({ isPremium: false }),
				getProjects: vi.fn().mockResolvedValue([
					{ id: "a", inboxProject: false },
					{ id: "b", inboxProject: false },
					{ id: "c", inboxProject: false },
					{ id: "d", inboxProject: false },
					{ id: "e", inboxProject: false },
					{ id: "f", inboxProject: false },
				]),
			};
		});

		await expect(userReachedProjectLimit("token")).resolves.toBe(true);
	});

	it("gives a real premium account the 300-project threshold, not the free one", async () => {
		TodoistApiMock.mockImplementation(function TodoistApiCtor() {
			return {
				getUser: vi.fn().mockResolvedValue({ isPremium: true }),
				getProjects: vi.fn().mockResolvedValue([
					{ id: "a", inboxProject: false },
					{ id: "b", inboxProject: false },
					{ id: "c", inboxProject: false },
					{ id: "d", inboxProject: false },
					{ id: "e", inboxProject: false },
					{ id: "f", inboxProject: false },
				]),
			};
		});

		// 6 projects, genuinely premium -- nowhere near the real 300 cap.
		await expect(userReachedProjectLimit("token")).resolves.toBe(false);
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
			return {
				getUser: vi.fn().mockResolvedValue({ isPremium: false }),
				getProjects: vi.fn().mockRejectedValue(rateLimitError),
			};
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
			asApi(api),
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
			asApi(api),
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
			createDestination(asApi({}), "bad", "BOS schedule", "red"),
		).rejects.toThrow("Invalid destination type: bad");
	});

	it("simulates a classified Todoist error via mockErrorCode instead of calling the API", async () => {
		const api = {
			getProjects: vi.fn(),
			addProject: vi.fn(),
			addSection: vi.fn(),
		};

		await expect(
			createDestination(asApi(api), "newProject", "BOS schedule", "red", "429"),
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
			createDestination(asApi(api), "inbox", "BOS schedule", "red"),
		).rejects.toMatchObject({ todoistErrorType: "AUTH_EXPIRED" });
	});

	it("classifies a real SDK failure from createDestination (newProject)", async () => {
		const serverError = Object.assign(new Error("Server error"), {
			httpStatusCode: 500,
		});
		const api = { addProject: vi.fn().mockRejectedValue(serverError) };

		await expect(
			createDestination(asApi(api), "newProject", "BOS schedule", "red"),
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

		await importSchedule(asApi(api), schedule, "BOS", { projectId: "p1" });

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

	it("retries a game that failed on the first pass, and succeeds silently if the retry works", async () => {
		vi.useFakeTimers();
		try {
			let miaCallCount = 0;
			const api = {
				addTask: vi.fn().mockImplementation((task: { content: string }) => {
					if (task.content === "BOS at MIA") {
						miaCallCount++;
						if (miaCallCount === 1) {
							return Promise.reject(
								Object.assign(new Error("Server error"), { httpStatusCode: 503 }),
							);
						}
					}
					return Promise.resolve({});
				}),
			};
			const schedule = [
				{ opponent: "LAL", isHomeGame: true, gameTimeUtcIso8601: "2026-01-01T10:00:00Z" },
				{ opponent: "MIA", isHomeGame: false, gameTimeUtcIso8601: "2026-01-02T10:00:00Z" },
			];

			const promise = importSchedule(asApi(api), schedule, "BOS", { projectId: "p1" });
			const expectation = expect(promise).resolves.toBeUndefined();
			await vi.advanceTimersByTimeAsync(GAME_RETRY_BACKOFF_SECONDS * 1000);
			await expectation;

			// LAL once, MIA twice (failed first pass, succeeded on retry)
			expect(api.addTask).toHaveBeenCalledTimes(3);
			expect(miaCallCount).toBe(2);
		} finally {
			vi.useRealTimers();
		}
	});

	it("reports a specific, named failure (not a false success) if a game still fails after the retry", async () => {
		vi.useFakeTimers();
		try {
			const api = {
				addTask: vi.fn().mockImplementation((task: { content: string }) => {
					if (task.content === "BOS at MIA") {
						return Promise.reject(
							Object.assign(new Error("Server error"), { httpStatusCode: 503 }),
						);
					}
					return Promise.resolve({});
				}),
			};
			const schedule = [
				{ opponent: "LAL", isHomeGame: true, gameTimeUtcIso8601: "2026-01-01T10:00:00Z" },
				{ opponent: "MIA", isHomeGame: false, gameTimeUtcIso8601: "2026-01-02T10:00:00Z" },
			];

			const promise = importSchedule(asApi(api), schedule, "BOS", { projectId: "p1" });
			const expectation = expect(promise).rejects.toMatchObject({
				todoistErrorType: "SERVICE_UNAVAILABLE",
				retryable: true,
				// Names the specific game, states how many succeeded -- not a
				// generic "something went wrong" the user has to hunt around from.
				message: expect.stringContaining("BOS at MIA"),
			});
			await vi.advanceTimersByTimeAsync(GAME_RETRY_BACKOFF_SECONDS * 1000);
			await expectation;

			const finalMessage = await promise.catch((e: Error) => e.message);
			expect(finalMessage).toContain("1 of 2 games");
			expect(finalMessage).toContain("other 1 were imported successfully");

			// LAL once (never failed), MIA twice (failed both the first pass
			// and the retry) -- the successful LAL task is never touched again,
			// confirming there's no rollback of games that already succeeded.
			expect(api.addTask).toHaveBeenCalledTimes(3);
			expect(api.addTask).toHaveBeenCalledWith(
				expect.objectContaining({ content: "BOS vs LAL" }),
			);
		} finally {
			vi.useRealTimers();
		}
	});

	it("adds yearly reminder in section when section exists", async () => {
		const api = { addTask: vi.fn().mockResolvedValue({}) };

		await addYearlyReminder(asApi(api), "BOS", {
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
