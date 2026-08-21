import express from "express";
import { getAccessToken } from "../../utils/cookieSession.js";
import { getTeamData } from "../../utils/parseSchedule.js";
import {
	initializeTodoistAPI,
	createDestination,
	importSchedule,
	addYearlyReminder,
	createDeepLink,
	userReachedProjectLimit,
} from "../../utils/todoist.js";
import { mapTodoistErrorTypeToHttpStatus } from "../../utils/todoistErrors.js";

const router = express.Router();

// Gate: mockError in the request body is only honored when this is
// explicitly enabled (see .env.example) -- disabled by default so it can't
// be triggered on a real deployment unless deliberately turned on for a demo.
const ERROR_DEMO_ENABLED = process.env.ENABLE_ERROR_DEMO === "true";

/**
 * Imports NBA schedule into Todoist
 *
 * Flow:
 * 1. Read user's selected team and destination (project/inbox) from request
 * 2. Initialize Todoist API client with user's auth token
 * 3. Fetch team data (name, color, schedule) from local JSON file
 * 4. Create destination in Todoist:
 *    - If "newProject": create a new project with team name and color
 *    - If "inbox": create a section within user's Inbox project
 * 5. Import all upcoming games as tasks into the destination
 * 6. Add a yearly reminder task to re-import next season
 * 7. Generate a deep link to the destination for the "Open Todoist" button
 */
router.post("/import-schedule", async (req, res) => {
	// Step 1: Extract user selections from request
	const { team: teamID, project: destinationType, mockError } = req.body;
	const mockErrorCode = ERROR_DEMO_ENABLED ? mockError : undefined;

	// Step 2: Initialize Todoist API client
	let todoistApi, accessToken;
	try {
		accessToken = await getAccessToken(req);
		todoistApi = initializeTodoistAPI(accessToken);
	} catch (error) {
		console.error("Failed to initialize Todoist API:", error.message);
		return res.status(401).json({
			success: false,
			message: "Failed to initialize Todoist API: " + error.message,
		});
	}

	// Step 2.5: Validate permissions if user wants to create a new project
	if (destinationType === "newProject") {
		try {
			const reachedLimit = await userReachedProjectLimit(
				accessToken,
				mockErrorCode,
			);
			if (reachedLimit) {
				return res.status(403).json({
					success: false,
					message:
						"Cannot create new project: you've reached your project limit. Please use your Inbox instead.",
				});
			}
		} catch (error) {
			return respondWithClassifiedError(
				res,
				error,
				"Failed to validate permissions",
			);
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
		await importSchedule(
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

		res.status(200).json({ deepLink: todoistDeepLink });
	} catch (error) {
		respondWithClassifiedError(res, error, "Error importing games");
	}
});

export default router;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       ERROR RESPONSE MAPPING              //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Errors thrown by app/utils/todoist.js are classified (see todoistErrors.js)
// and carry `.todoistErrorType`. Anything without that tag is an
// unclassified local error (a real bug, not a Todoist API response) and
// keeps the original generic 500 behavior.
function respondWithClassifiedError(res, error, fallbackPrefix) {
	if (!error.todoistErrorType) {
		console.error(`${fallbackPrefix}:`, error.message);
		return res.status(500).json({
			success: false,
			message: `${fallbackPrefix}: ${error.message}`,
		});
	}

	console.error(`${fallbackPrefix} [${error.todoistErrorType}]:`, error.message);
	return res.status(mapTodoistErrorTypeToHttpStatus(error.todoistErrorType)).json({
		success: false,
		errorType: error.todoistErrorType,
		message: error.message,
		retryable: error.retryable,
		retryAfterSeconds: error.retryAfterSeconds,
	});
}
