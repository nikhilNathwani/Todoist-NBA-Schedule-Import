"use server";

// Server Action replacing app/routes/api/importSchedule.js (now removed).
//
// CHOICE: Server Action vs. Route Handler (see task brief / handoff doc).
// Chosen: Server Action. Reasoning: the original route's error contract to
// the browser was never actually HTTP-status-driven on the client -- the
// original public/scripts/api/importSchedule.js (now removed, replaced by
// this file + PickerForm.tsx) only ever branched on the *parsed JSON body*
// (`data.message`, `data.errorType`, `data.retryable`,
// `data.retryAfterSeconds`); `response.ok` was used only as a bool, the
// specific status code (401 vs 429 vs 502) was never inspected client-side.
// Since nothing is lost by dropping the HTTP-status layer, a Server Action
// returning a plain discriminated-union result object carries the exact
// same information with less code (no hand-rolled fetch, no manual JSON
// parsing, no Route Handler boilerplate) and integrates directly with
// PickerForm's React state.
import { getAccessToken } from "@/lib/cookieSession";
import { getTeamData } from "@/lib/parseSchedule";
import {
	initializeTodoistAPI,
	createDestination,
	importSchedule as importScheduleToTodoist,
	addYearlyReminder,
	createDeepLink,
	userReachedProjectLimit,
} from "@/lib/todoist";
import {
	isClassifiedTodoistError,
	type TodoistErrorType,
} from "@/lib/todoistErrors";

export type ImportScheduleResult =
	| { success: true; deepLink: string }
	| {
			success: false;
			message: string;
			errorType?: TodoistErrorType;
			retryable?: boolean;
			retryAfterSeconds?: number;
	  };

// Gate: mockError is only honored when this is explicitly enabled (see
// .env.example) -- disabled by default so it can't be triggered on a real
// deployment unless deliberately turned on for a demo. Read per-call
// (rather than cached at module load, as the original Express constant
// was) so it always reflects the current process.env -- convenient for
// tests, and process.env reads are cheap.
function errorDemoEnabled(): boolean {
	return process.env.ENABLE_ERROR_DEMO === "true";
}

/**
 * Imports NBA schedule into Todoist.
 *
 * Flow (unchanged from the original route):
 * 1. Read user's selected team and destination (project/inbox) from args
 * 2. Initialize Todoist API client with user's auth token (from session cookie)
 * 3. Fetch team data (name, color, schedule) from local JSON file
 * 4. Create destination in Todoist:
 *    - If "newProject": create a new project with team name and color
 *    - If "inbox": create a section within user's Inbox project
 * 5. Import all upcoming games as tasks into the destination
 * 6. Add a yearly reminder task to re-import next season
 * 7. Generate a deep link to the destination for the "Open Todoist" button
 */
export async function importScheduleAction(
	teamID: string,
	destinationType: "newProject" | "inbox",
	mockError?: string,
): Promise<ImportScheduleResult> {
	const mockErrorCode = errorDemoEnabled() ? mockError : undefined;

	// Step 2: Initialize Todoist API client
	let accessToken: string;
	try {
		accessToken = await getAccessToken();
	} catch (error) {
		console.error(
			"Failed to initialize Todoist API:",
			error instanceof Error ? error.message : error,
		);
		return {
			success: false,
			message:
				"Failed to initialize Todoist API: " +
				(error instanceof Error ? error.message : String(error)),
		};
	}
	const todoistApi = initializeTodoistAPI(accessToken);

	// Step 2.5: Validate permissions if user wants to create a new project
	if (destinationType === "newProject") {
		try {
			const reachedLimit = await userReachedProjectLimit(
				accessToken,
				mockErrorCode,
			);
			if (reachedLimit) {
				return {
					success: false,
					message:
						"Cannot create new project: you've reached your project limit. Please use your Inbox instead.",
				};
			}
		} catch (error) {
			return classifiedResult(error, "Failed to validate permissions");
		}
	}

	try {
		// Step 3: Fetch team data from local JSON
		const {
			name: teamName,
			color: teamColor,
			schedule: upcomingGames,
		} = await getTeamData(teamID);

		// Step 4: Create destination (new project or inbox section)
		const destinationIds = await createDestination(
			todoistApi,
			destinationType,
			`${teamName} schedule`,
			teamColor,
			mockErrorCode,
		);

		// Step 5: Import all games as tasks
		await importScheduleToTodoist(
			todoistApi,
			upcomingGames,
			teamName,
			destinationIds,
		);

		// Step 6: Add yearly reminder to re-import next season
		await addYearlyReminder(todoistApi, teamName, destinationIds);

		// Step 7: Generate deep link for "Open Todoist" button
		const todoistDeepLink = createDeepLink(destinationIds);
		console.log("Link to imported schedule:", todoistDeepLink);

		return { success: true, deepLink: todoistDeepLink };
	} catch (error) {
		return classifiedResult(error, "Error importing games");
	}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       ERROR RESULT MAPPING                //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Errors thrown by lib/todoist.ts are classified (see lib/todoistErrors.ts)
// and carry `.todoistErrorType`. Anything without that tag is an
// unclassified local error (a real bug, not a Todoist API response) and
// keeps the original generic-failure message shape.
function classifiedResult(
	error: unknown,
	fallbackPrefix: string,
): ImportScheduleResult {
	if (!isClassifiedTodoistError(error)) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`${fallbackPrefix}:`, message);
		return { success: false, message: `${fallbackPrefix}: ${message}` };
	}

	console.error(`${fallbackPrefix} [${error.todoistErrorType}]:`, error.message);
	return {
		success: false,
		errorType: error.todoistErrorType,
		message: error.message,
		retryable: error.retryable,
		retryAfterSeconds: error.retryAfterSeconds,
	};
}
