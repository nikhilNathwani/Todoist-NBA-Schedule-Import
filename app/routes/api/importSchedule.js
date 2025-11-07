import express from "express";
import { getAccessToken } from "../../utils/cookieSession.js";
import { getTeamData } from "../../utils/parseSchedule.js";
import {
	initializeTodoistAPI,
	createDestination,
	importSchedule,
	addYearlyReminder,
	createDeepLink,
} from "../../utils/todoist.js";

const router = express.Router();

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
	const { team: teamID, project: destinationType } = req.body;

	// Step 2: Initialize Todoist API client
	let todoistApi;
	try {
		const accessToken = getAccessToken(req);
		todoistApi = initializeTodoistAPI(accessToken);
	} catch (error) {
		console.error("Failed to initialize Todoist API:", error.message);
		return res.status(401).json({
			success: false,
			message: "Failed to initialize Todoist API: " + error.message,
		});
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
			teamColor
		);

		// Step 5: Import all games as tasks
		await importSchedule(
			todoistApi,
			upcomingGames,
			teamName,
			destinationIds
		);

		// Step 6: Add yearly reminder to re-import next season
		await addYearlyReminder(todoistApi, teamName, destinationIds);

		// Step 7: Generate deep link for "Open Todoist" button
		const todoistDeepLink = createDeepLink(destinationIds);
		console.log("Link to imported schedule:", todoistDeepLink);

		res.status(200).json({ deepLink: todoistDeepLink });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: `Error importing games: ${error.message}`,
		});
	}
});

export default router;
