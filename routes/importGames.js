const express = require("express");
const axios = require("axios");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { getAccessToken, printReqSession } = require("../utils/cookieSession");
const { TodoistApi } = require("@doist/todoist-api-typescript");
const projectLimits = {
	FREE: 5,
	PREMIUM: 300,
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//           ROUTES                          //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Process user's team/project selections and import schedule
router.post("/import-games", async (req, res) => {
	// if (req.session.importInProgress) {
	// 	return res.status(429).json({ message: "Import already in progress" }); // Prevent concurrent imports
	// }
	console.log("In /import-games");
	const { team: teamID, project } = req.body;

	let api;
	try {
		api = initializeTodoistAPI(req);
	} catch (error) {
		console.error("Failed to initialize Todoist API:", error.message);
		return res.status(401).json({
			success: false,
			message: "Failed to initialize Todoist API: " + error.message,
		});
	}
	try {
		const {
			name: teamName,
			color: teamColor,
			schedule,
		} = await getTeamData(teamID);
		const projectID = await getProjectID(
			api,
			project,
			`${teamName} schedule`,
			teamColor
		);
		await importSchedule(api, schedule, projectID, teamName);
		await importYearlyReminder(api, projectID, teamName);
		res.status(200).json({ projectID: projectID });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: `Error importing games: ${error.message}`,
		});
	}
});

module.exports = { router, userReachedProjectLimit };

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       TODOIST CRUD FUNCTIONS              //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Initialize API with the user's token
function initializeTodoistAPI(req) {
	// Initialize Todoist API with the access token
	console.log("In /import-games, about to get access token");
	printReqSession(req);
	const accessToken = getAccessToken(req);
	console.log("In /import-games, got accessToken:", accessToken);
	return new TodoistApi(accessToken);
}

//Returns bool. Determines if user has reached project limit
async function userReachedProjectLimit(accessToken) {
	try {
		// Fetch user resources via the Sync API
		const response = await axios.post(
			"https://api.todoist.com/sync/v9/sync",
			{
				sync_token: "*",
				resource_types: ["user", "projects"],
			},
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);
		const { user, projects } = response.data;
		const isPremium = user.is_premium; // Check if the user is premium
		const projectCount = projects.reduce(
			(count, project) => count + (!project.inbox_project ? 1 : 0),
			0
		);
		console.log("PROJECTS:", projects);
		console.log("PROJECT COUNT:", projectCount);

		return isPremium
			? projectCount >= projectLimits.PREMIUM
			: projectCount >= projectLimits.FREE;
	} catch (error) {
		console.error("Error fetching user data:", error);
		throw new Error("Failed to fetch user metadata");
	}
}

async function getProjectID(api, project, name, color) {
	if (project === "inbox") {
		// Query the Todoist API for the Inbox project ID
		const projects = await api.getProjects();
		const inboxProject = projects.find((project) => project.isInboxProject);
		if (inboxProject) {
			return inboxProject.id; // Return the ID of the Inbox project
		} else {
			throw new Error("Inbox project not found");
		}
	} else if (project === "newProject") {
		// Check if a color exists for the given team name
		if (!color) {
			throw new Error(`No color defined for team: ${name}`);
		}

		// Create a new Todoist project
		const newProjectResponse = await api.addProject({
			name: name,
			color: color,
		});
		return newProjectResponse.id; // Return the ID of the newly created project
	} else {
		throw new Error(
			`Invalid project type: ${project}. Expected 'inbox' or 'newProject'.`
		);
	}
}

async function importGame(api, game, projectID, teamName, taskOrder) {
	const task = formatTask(game, projectID, teamName, taskOrder);
	try {
		await api.addTask(task);
	} catch (error) {
		console.error("Error adding task to Todoist:", error);
	}
}

async function importSchedule(api, schedule, projectID, teamName) {
	const tasks = schedule.map(
		(game, index) => importGame(api, game, projectID, teamName, index + 1) // Pass index + 1 because task order is non-zero
	);
	return Promise.all(tasks); // Return the promise, don't await
}

function formatTask(game, projectID, teamName, taskOrder) {
	return {
		content: `${teamName} ${game.isHomeGame ? "vs" : "at"} ${
			game.opponent
		}`,
		dueDatetime: game.gameTimeUtcIso8601,
		projectId: projectID,
		order: taskOrder,
	};
}

async function importYearlyReminder(api, projectID, teamName) {
	const siteURL =
		"[NBA -> Todoist Schedule Import](https://nba-todoist-import.vercel.app)";

	const task = {
		content: `Import ${teamName} regular season schedule`,
		description: siteURL,
		projectId: projectID,
		dueString: "every October 10th",
		dueLang: "en",
		order: 120,
	};
	try {
		await api.addTask(task);
	} catch (error) {
		console.error("Error adding reminder task to Todoist:", error);
	}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       JSON SCHEDULE PARSING               //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
async function getTeamData(team) {
	try {
		const filePath = path.join(__dirname, "../data/nba_schedule.json");
		const data = JSON.parse(await fs.promises.readFile(filePath, "utf8"));

		const teamData = data[team];
		if (!teamData) {
			throw new Error(`Schedule not found for team: ${team}`);
		}

		// Filter schedule for games with dateTime later than now
		const upcomingGames = getUpcomingGames(teamData.schedule);

		// Return teamData with the filtered schedule
		return { ...teamData, schedule: upcomingGames };
	} catch (error) {
		console.error("Error reading or parsing nba_schedule.json:", error);
		throw error; // Re-throw to handle it further up if needed
	}
}

function getUpcomingGames(schedule) {
	const upcomingGames = [];
	for (const game of schedule) {
		if (isLaterThanNow(game.gameTimeUtcIso8601)) {
			upcomingGames.push(game);
		}
	}
	return upcomingGames;
}

function isLaterThanNow(dateTime) {
	const gameDateTime = new Date(dateTime);
	const now = new Date();
	return gameDateTime > now;
}
