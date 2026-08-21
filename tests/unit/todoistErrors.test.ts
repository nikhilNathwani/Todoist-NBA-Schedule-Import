import { describe, it, expect } from "vitest";
import {
	TODOIST_ERROR_TYPES,
	MOCKABLE_ERROR_CODES,
	classifyTodoistError,
	toClassifiedError,
	mapTodoistErrorTypeToHttpStatus,
	createMockTodoistError,
} from "@/lib/todoistErrors";

describe("classifyTodoistError", () => {
	it.each([
		[400, TODOIST_ERROR_TYPES.BAD_REQUEST, false],
		[401, TODOIST_ERROR_TYPES.AUTH_EXPIRED, false],
		[403, TODOIST_ERROR_TYPES.FORBIDDEN, false],
		[404, TODOIST_ERROR_TYPES.NOT_FOUND, false],
		[429, TODOIST_ERROR_TYPES.RATE_LIMITED, true],
		[500, TODOIST_ERROR_TYPES.SERVER_ERROR, true],
		[503, TODOIST_ERROR_TYPES.SERVICE_UNAVAILABLE, true],
	])(
		"classifies HTTP %i as %s (retryable: %s)",
		(httpStatusCode, expectedType, expectedRetryable) => {
			const result = classifyTodoistError({ httpStatusCode });
			expect(result.type).toBe(expectedType);
			expect(result.retryable).toBe(expectedRetryable);
			expect(result.httpStatusCode).toBe(httpStatusCode);
			expect(result.userMessage).toBeTruthy();
		},
	);

	it("classifies a network-level failure (no response at all)", () => {
		const result = classifyTodoistError({ isNetworkError: true });
		expect(result.type).toBe(TODOIST_ERROR_TYPES.NETWORK_ERROR);
		expect(result.httpStatusCode).toBeUndefined();
		expect(result.retryable).toBe(true);
	});

	it("classifies an unrecognized status code as UNKNOWN", () => {
		const result = classifyTodoistError({ httpStatusCode: 418 });
		expect(result.type).toBe(TODOIST_ERROR_TYPES.UNKNOWN);
		expect(result.retryable).toBe(false);
	});

	it("classifies a plain error with no status code as UNKNOWN, preserving its message", () => {
		const result = classifyTodoistError(new Error("Inbox project not found"));
		expect(result.type).toBe(TODOIST_ERROR_TYPES.UNKNOWN);
		expect(result.userMessage).toContain("Inbox project not found");
	});

	it("uses responseData.retry_after for 429 when Todoist provides one", () => {
		const result = classifyTodoistError({
			httpStatusCode: 429,
			responseData: { retry_after: 7 },
		});
		expect(result.retryAfterSeconds).toBe(7);
		expect(result.userMessage).toContain("7s");
	});

	it("falls back to a default backoff for 429 when no retry_after is present", () => {
		// Documents a real SDK limitation: @doist/todoist-api-typescript's
		// TodoistRequestError doesn't forward response headers, so a real
		// `Retry-After` header is never visible here even though Todoist sends
		// one -- only a `retry_after` field in the parsed JSON body would be.
		const result = classifyTodoistError({ httpStatusCode: 429 });
		expect(result.retryAfterSeconds).toBeGreaterThan(0);
	});
});

describe("toClassifiedError", () => {
	it("wraps a raw error with classification fields and preserves the cause", () => {
		const raw = { httpStatusCode: 401 };
		const classified = toClassifiedError(raw, "someContext");

		expect(classified).toBeInstanceOf(Error);
		expect(classified.todoistErrorType).toBe(TODOIST_ERROR_TYPES.AUTH_EXPIRED);
		expect(classified.httpStatusCode).toBe(401);
		expect(classified.context).toBe("someContext");
		expect(classified.cause).toBe(raw);
	});

	it("carries responseData forward for callers that need the raw reason", () => {
		const raw = { httpStatusCode: 400, responseData: { error: "bad_authorization_code" } };
		const classified = toClassifiedError(raw, "retrieveAccessToken");
		expect(classified.responseData).toEqual({ error: "bad_authorization_code" });
	});
});

describe("mapTodoistErrorTypeToHttpStatus", () => {
	it("maps AUTH_EXPIRED and FORBIDDEN to 401 (same remedy: log in again)", () => {
		expect(mapTodoistErrorTypeToHttpStatus(TODOIST_ERROR_TYPES.AUTH_EXPIRED)).toBe(401);
		expect(mapTodoistErrorTypeToHttpStatus(TODOIST_ERROR_TYPES.FORBIDDEN)).toBe(401);
	});

	it("maps RATE_LIMITED to 429", () => {
		expect(mapTodoistErrorTypeToHttpStatus(TODOIST_ERROR_TYPES.RATE_LIMITED)).toBe(429);
	});

	it.each([
		TODOIST_ERROR_TYPES.NOT_FOUND,
		TODOIST_ERROR_TYPES.SERVER_ERROR,
		TODOIST_ERROR_TYPES.SERVICE_UNAVAILABLE,
		TODOIST_ERROR_TYPES.NETWORK_ERROR,
		TODOIST_ERROR_TYPES.UNKNOWN,
		TODOIST_ERROR_TYPES.BAD_REQUEST,
	])("maps %s to 502 Bad Gateway (upstream failed, our server is fine)", (type) => {
		expect(mapTodoistErrorTypeToHttpStatus(type)).toBe(502);
	});
});

describe("createMockTodoistError", () => {
	it.each(MOCKABLE_ERROR_CODES)(
		"produces an error for code %s that classifyTodoistError handles",
		(code) => {
			const mockError = createMockTodoistError(code);
			const classification = classifyTodoistError(mockError);
			expect(classification.type).not.toBe(TODOIST_ERROR_TYPES.UNKNOWN);
		},
	);

	it("shapes the mock like the real SDK's TodoistRequestError", () => {
		const mockError = createMockTodoistError("401");
		expect(mockError.httpStatusCode).toBe(401);
		expect(mockError.isAuthenticationError()).toBe(true);
		expect(typeof mockError.responseData).toBe("object");
	});

	it("produces a network-shaped error for 'network'", () => {
		const mockError = createMockTodoistError("network");
		expect(mockError.isNetworkError).toBe(true);
		expect(mockError.httpStatusCode).toBeUndefined();
	});
});
