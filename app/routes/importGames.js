import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getAccessToken } from "../utils/cookieSession.js";
import {
	TodoistApi,
	getProjectUrl,
	getSectionUrl,
} from "@doist/todoist-api-typescript";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectLimits = {
	FREE: 5,
	PREMIUM: 300,
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//           ROUTES                          //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Process user's team/project selections and import schedule into the destination project/inbox
router.post("/import-games", async (req, res) => {
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
		const destinationIds = await getDestinationIds(
			api,
			project,
			`${teamName} schedule`,
			teamColor
		);
		await importSchedule(api, schedule, teamName, destinationIds);
		await importYearlyReminder(api, teamName, destinationIds);
		const deepLink = createDeepLink(destinationIds);
		console.log("Link to imported schedule:", deepLink);
		res.status(200).json({ deepLink });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: `Error importing games: ${error.message}`,
		});
	}
});

export { router, userReachedProjectLimit };

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       TODOIST CRUD FUNCTIONS              //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Initialize API with the user's token
function initializeTodoistAPI(req) {
	// Initialize Todoist API with the access token
	const accessToken = getAccessToken(req);
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

		return isPremium
			? projectCount >= projectLimits.PREMIUM
			: projectCount >= projectLimits.FREE;
	} catch (error) {
		console.error("Error fetching user data:", error);
		throw new Error("Failed to fetch user metadata");
	}
}

async function getDestinationIds(api, destination, name, color) {
	if (destination === "inbox") {
		// Query the Todoist API for the Inbox project ID
		try {
			const projectsResponse = await api.getProjects();
			const projects = projectsResponse.results; // v6+ returns { results, nextCursor }

			const inboxProject = projects.find(
				(project) => project.inboxProject
			);

			if (inboxProject) {
				// Create section within Inbox project
				const newSectionResponse = await api.addSection({
					name: name,
					projectId: inboxProject.id,
				});
				return {
					projectId: inboxProject.id,
					sectionId: newSectionResponse.id,
				};
			} else {
				throw new Error("Inbox project not found");
			}
		} catch (error) {
			console.error("Error in getDestinationIds (inbox):", error);
			throw error;
		}
	} else if (destination === "newProject") {
		// Check if a color exists for the given team name
		if (!color) {
			throw new Error(`No color defined for team: ${name}`);
		}

		// Create a new Todoist project
		const newProjectResponse = await api.addProject({
			name: name,
			color: color,
		});
		return {
			projectId: newProjectResponse.id,
		};
	} else {
		throw new Error(
			`Invalid destination type: ${destination}. Expected 'inbox' or 'newProject'.`
		);
	}
}

function createDeepLink(destinationIds) {
	if (destinationIds.sectionId) {
		return getSectionUrl(destinationIds.sectionId);
	} else {
		return getProjectUrl(destinationIds.projectId);
	}
}

async function importGame(api, game, teamName, taskOrder, destinationIds) {
	const task = formatTask(game, teamName, taskOrder, destinationIds);
	try {
		await api.addTask(task);
	} catch (error) {
		console.error("Error adding task to Todoist:", error);
	}
}

async function importSchedule(api, schedule, teamName, destinationIds) {
	console.log(
		`Importing ${schedule.length} games for ${teamName} into project ID ${destinationIds.projectId}`
	);
	// Use map to create an array of promises
	const tasks = schedule.map((game, index) =>
		importGame(api, game, teamName, index + 1, destinationIds)
	);
	return Promise.all(tasks); // Return the promise, don't await
}

function formatTask(game, teamName, taskOrder, destinationIds) {
	const task = {
		content: `${teamName} ${game.isHomeGame ? "vs" : "at"} ${
			game.opponent
		}`,
		dueDatetime: game.gameTimeUtcIso8601,
		projectId: destinationIds.projectId,
		order: taskOrder,
	};
	if (destinationIds.sectionId) {
		task.sectionId = destinationIds.sectionId;
	}
	return task;
}

async function importYearlyReminder(api, teamName, destinationIds) {
	const siteURL =
		"[NBA -> Todoist Schedule Import](https://nba-todoist-import.vercel.app)";

	const task = {
		content: `Import ${teamName} regular season schedule`,
		description: siteURL,
		projectId: destinationIds.projectId,
		dueString: "every October 10th",
		dueLang: "en",
		order: 120,
	};

	// If importing to Inbox section, add the task to that section
	if (destinationIds.sectionId) {
		task.sectionId = destinationIds.sectionId;
	}

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
		const filePath = path.join(__dirname, "../../data/nba_schedule.json");
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
