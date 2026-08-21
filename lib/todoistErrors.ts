// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//   TODOIST API ERROR CLASSIFICATION        //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//
// Ported as-is (typed) from app/utils/todoistErrors.js (now removed).
// Behavior is unchanged -- see that file's git history for the original
// commentary this was lifted from. Turns a raw failure from Todoist (via
// @doist/todoist-api-typescript, or the raw OAuth token-exchange fetch in
// retrieveAccessToken) into one consistent shape the rest of the app can
// branch on, instead of every caller re-deciding what a generic caught
// error means.
//
// The status codes handled below are exactly the ones Todoist's own API
// docs document as possible responses (400, 401, 403, 404, 429, 500, 503):
// https://developer.todoist.com/api/v1/#tag/Overview/Errors
// Anything else observed is classified as UNKNOWN rather than guessed at.

export const TODOIST_ERROR_TYPES = Object.freeze({
	BAD_REQUEST: "BAD_REQUEST",
	AUTH_EXPIRED: "AUTH_EXPIRED",
	FORBIDDEN: "FORBIDDEN",
	NOT_FOUND: "NOT_FOUND",
	RATE_LIMITED: "RATE_LIMITED",
	SERVER_ERROR: "SERVER_ERROR",
	SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
	NETWORK_ERROR: "NETWORK_ERROR",
	UNKNOWN: "UNKNOWN",
} as const);

export type TodoistErrorType =
	(typeof TODOIST_ERROR_TYPES)[keyof typeof TODOIST_ERROR_TYPES];

const DEFAULT_RATE_LIMIT_BACKOFF_SECONDS = 30;

// Status codes this module knows how to simulate via createMockTodoistError,
// plus "network" for a connection-level (no HTTP response) failure.
export const MOCKABLE_ERROR_CODES = [
	"400",
	"401",
	"403",
	"404",
	"429",
	"500",
	"503",
	"network",
] as const;
export type MockableErrorCode = (typeof MOCKABLE_ERROR_CODES)[number];

// Shape of a raw error this module knows how to classify: the SDK's
// TodoistRequestError, or a fetch-shaped error with the same fields
// attached manually (see retrieveAccessToken in ./todoist.ts).
export interface RawTodoistError {
	httpStatusCode?: number;
	responseData?: Record<string, unknown>;
	isNetworkError?: boolean;
	message?: string;
}

export interface TodoistErrorClassification {
	type: TodoistErrorType;
	httpStatusCode: number | undefined;
	retryable: boolean;
	retryAfterSeconds: number | undefined;
	userMessage: string;
}

export interface ClassifiedTodoistError extends Error {
	name: "ClassifiedTodoistError";
	context: string;
	todoistErrorType: TodoistErrorType;
	httpStatusCode: number | undefined;
	retryable: boolean;
	retryAfterSeconds: number | undefined;
	responseData: Record<string, unknown> | undefined;
}

export function isClassifiedTodoistError(
	error: unknown,
): error is ClassifiedTodoistError {
	return (
		typeof error === "object" &&
		error !== null &&
		"todoistErrorType" in error
	);
}

// Classifies a raw error thrown by the Todoist SDK (or a fetch call shaped
// the same way: `.httpStatusCode` + optional `.responseData`) into a
// { type, httpStatusCode, retryable, retryAfterSeconds, userMessage } record.
export function classifyTodoistError(
	error: RawTodoistError | null | undefined,
): TodoistErrorClassification {
	// Network-level failure: fetch never got a response at all (DNS failure,
	// connection refused, timeout). The SDK's own fetchWithRetry already
	// retries these 3x internally before giving up, so seeing one here means
	// retrying instantly again is unlikely to help -- worth a short pause.
	if (error?.isNetworkError) {
		return {
			type: TODOIST_ERROR_TYPES.NETWORK_ERROR,
			httpStatusCode: undefined,
			retryable: true,
			retryAfterSeconds: 5,
			userMessage:
				"Couldn't reach Todoist -- check your connection and try again.",
		};
	}

	const httpStatusCode = error?.httpStatusCode;

	switch (httpStatusCode) {
		case 400:
			return {
				type: TODOIST_ERROR_TYPES.BAD_REQUEST,
				httpStatusCode,
				retryable: false,
				retryAfterSeconds: undefined,
				userMessage:
					"Todoist rejected the request as malformed. That's a bug in the app, not something you can fix -- please send an error report.",
			};
		case 401:
			return {
				type: TODOIST_ERROR_TYPES.AUTH_EXPIRED,
				httpStatusCode,
				retryable: false,
				retryAfterSeconds: undefined,
				userMessage:
					"Your Todoist session has expired or was revoked. Please log in again.",
			};
		case 403:
			return {
				type: TODOIST_ERROR_TYPES.FORBIDDEN,
				httpStatusCode,
				retryable: false,
				retryAfterSeconds: undefined,
				userMessage:
					"Todoist denied this action. Please log in again to refresh your permissions.",
			};
		case 404:
			return {
				type: TODOIST_ERROR_TYPES.NOT_FOUND,
				httpStatusCode,
				retryable: false,
				retryAfterSeconds: undefined,
				userMessage:
					"The Todoist project or section for this import couldn't be found -- it may have been deleted or moved. Try importing again to create a fresh one.",
			};
		case 429: {
			const retryAfterSeconds =
				Number(error?.responseData?.retry_after) ||
				DEFAULT_RATE_LIMIT_BACKOFF_SECONDS;
			return {
				type: TODOIST_ERROR_TYPES.RATE_LIMITED,
				httpStatusCode,
				retryable: true,
				retryAfterSeconds,
				userMessage: `Todoist is rate-limiting requests right now. Please wait about ${retryAfterSeconds}s and try again.`,
			};
		}
		case 500:
			return {
				type: TODOIST_ERROR_TYPES.SERVER_ERROR,
				httpStatusCode,
				retryable: true,
				retryAfterSeconds: 10,
				userMessage:
					"Todoist is having a server-side issue right now. Please try again in a moment.",
			};
		case 503:
			return {
				type: TODOIST_ERROR_TYPES.SERVICE_UNAVAILABLE,
				httpStatusCode,
				retryable: true,
				retryAfterSeconds: 30,
				userMessage:
					"Todoist is temporarily unavailable (maintenance or overload). Please try again shortly.",
			};
		default:
			return {
				type: TODOIST_ERROR_TYPES.UNKNOWN,
				httpStatusCode,
				retryable: false,
				retryAfterSeconds: undefined,
				userMessage: error?.message
					? `Unexpected error communicating with Todoist: ${error.message}`
					: "Something unexpected happened talking to Todoist. Please send an error report.",
			};
	}
}

// Wraps a raw caught error into a classified Error: same .message the user
// should see, plus the classification fields attached so callers (route
// handlers, server actions) can branch on `.todoistErrorType` instead of
// parsing text.
export function toClassifiedError(
	rawError: unknown,
	context: string,
): ClassifiedTodoistError {
	const raw = (rawError ?? {}) as RawTodoistError;
	const classification = classifyTodoistError(raw);
	const classifiedError = new Error(classification.userMessage, {
		cause: rawError,
	}) as ClassifiedTodoistError;
	classifiedError.name = "ClassifiedTodoistError";
	classifiedError.context = context;
	classifiedError.todoistErrorType = classification.type;
	classifiedError.httpStatusCode = classification.httpStatusCode;
	classifiedError.retryable = classification.retryable;
	classifiedError.retryAfterSeconds = classification.retryAfterSeconds;
	// Preserved so callers with extra context (e.g. the OAuth callback route,
	// which knows Todoist's specific `bad_authorization_code` /
	// `incorrect_application_credentials` reason strings) can still inspect
	// the raw response body for a more specific message than the generic
	// classification provides.
	classifiedError.responseData = raw?.responseData;
	return classifiedError;
}

// Maps a classified error's type onto the HTTP status *our own* API should
// respond with to the browser. AUTH_EXPIRED/FORBIDDEN become 401 here too --
// from the browser's perspective the remedy is identical either way: log in
// again. RATE_LIMITED passes through as 429 so the client can see it's
// specifically a backoff situation. Everything else Todoist itself is
// responsible for (not-found, outage, unknown) is reported as 502 Bad
// Gateway: our server is fine, the upstream dependency failed.
export function mapTodoistErrorTypeToHttpStatus(
	todoistErrorType: TodoistErrorType,
): number {
	if (
		todoistErrorType === TODOIST_ERROR_TYPES.AUTH_EXPIRED ||
		todoistErrorType === TODOIST_ERROR_TYPES.FORBIDDEN
	) {
		return 401;
	}
	if (todoistErrorType === TODOIST_ERROR_TYPES.RATE_LIMITED) {
		return 429;
	}
	return 502;
}

// Builds a fake error shaped exactly like the real SDK's TodoistRequestError
// (.httpStatusCode, .responseData, .isAuthenticationError()) so it flows
// through classifyTodoistError identically to a real one -- this is what
// lets ?mockTodoistError=<code> exercise the real handling code, not a
// separate copy of it.
export function createMockTodoistError(mockErrorCode: string): RawTodoistError & {
	name: string;
	isAuthenticationError: () => boolean;
} {
	if (mockErrorCode === "network") {
		const error = new Error("Failed to fetch (mocked network error)") as Error &
			RawTodoistError & { name: string; isAuthenticationError: () => boolean };
		error.isNetworkError = true;
		error.name = "Error";
		error.isAuthenticationError = () => false;
		return error;
	}

	const httpStatusCode = Number(mockErrorCode);
	const error = new Error(
		`Mocked Todoist API error (HTTP ${httpStatusCode})`,
	) as Error & RawTodoistError & { name: string; isAuthenticationError: () => boolean };
	error.name = "TodoistRequestError";
	error.httpStatusCode = httpStatusCode;
	error.responseData =
		httpStatusCode === 429
			? { retry_after: 12 }
			: { error: "mocked_error", http_code: httpStatusCode };
	error.isAuthenticationError = () => [401, 403].includes(httpStatusCode);
	return error;
}
