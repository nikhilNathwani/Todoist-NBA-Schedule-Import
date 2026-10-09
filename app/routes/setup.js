import express from "express";
import { getAccessToken } from "../utils/cookieSession.js";
import { getTeams, getTeamData } from "../utils/parseSchedule.js";
import {
	initializeTodoistAPI,
	createDestination,
	importSchedule,
	addYearlyReminder,
	createDeepLink,
	userReachedProjectLimit,
} from "../utils/todoist.js";
import {
	TODOIST_ERROR_TYPES,
	mapTodoistErrorTypeToHttpStatus,
} from "../utils/todoistErrors.js";
import { makeSetupPageHTML } from "../views/setup.js";
import { makeErrorPageHTML } from "../views/errorPage.js";

// The setup page and its form submission share this path:
// GET shows the team and project picker (HTML), and the page's JavaScript
// POSTs the user's choice back here to run the import (JSON)
const router = express.Router();

// Gate: a mock error code (?mockTodoistError on the page, mockError in the
// POST body) is only honored when this is explicitly enabled (see
// .env.example) -- disabled by default so it can't be triggered on a real
// deployment unless deliberately turned on for a demo.
const ERROR_DEMO_ENABLED = process.env.ENABLE_ERROR_DEMO === "true";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       GET: THE SETUP PAGE                 //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

router.get("/", async (req, res) => {
	const mockErrorCode = ERROR_DEMO_ENABLED
		? req.query.mockTodoistError
		: undefined;

	// No valid session (never logged in, or the 1-hour cookie expired):
	// send them to the start page to log in, rather than an error page
	let accessToken;
	try {
		accessToken = await getAccessToken(req);
	} catch {
		return res.redirect("/");
	}

	try {
		// The tier check (a Todoist API call) and the team list (a local
		// file read) don't depend on each other, so run them in parallel
		const [reachedLimit, teams] = await Promise.all([
			userReachedProjectLimit(accessToken, mockErrorCode),
			getTeams(),
		]);
		const html = await makeSetupPageHTML(!reachedLimit, teams);
		res.send(html);
	} catch (error) {
		console.error("Error rendering setup page:", error);
		if (error.todoistErrorType) {
			const status = mapTodoistErrorTypeToHttpStatus(error.todoistErrorType);
			return res.status(status).send(makeErrorPageHTML(error));
		}
		res.status(500).send("An error occurred");
	}
});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       POST: RUN THE IMPORT                //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

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
router.post("/", async (req, res) => {
	// Step 1: Extract user selections from request
	const { team: teamID, project: destinationType, mockError } = req.body;
	const mockErrorCode = ERROR_DEMO_ENABLED ? mockError : undefined;

	// Step 2: Initialize Todoist API client
	let todoistApi, accessToken;
	try {
		accessToken = await getAccessToken(req);
		todoistApi = initializeTodoistAPI(accessToken);
	} catch (error) {
		// No valid session: usually the 1-hour cookie expired while the
		// setup page sat open. The page's "Try again" link then lands on
		// the login page (see the GET handler above).
		console.error("No valid session for import:", error.message);
		return res.status(401).json({
			success: false,
			errorType: TODOIST_ERROR_TYPES.AUTH_EXPIRED,
			message: "Your session has expired. Please log in again.",
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
