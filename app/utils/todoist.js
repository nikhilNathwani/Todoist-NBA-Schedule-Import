import axios from "axios";
import {
	TodoistApi,
	getProjectUrl,
	getSectionUrl,
} from "@doist/todoist-api-typescript";

const projectLimits = {
	FREE: 5,
	PREMIUM: 300,
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       TODOIST OAUTH FUNCTIONS             //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Retrieve access token from Todoist API
async function retrieveAccessToken(code) {
	const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

	try {
		const response = await axios.post(
			"https://todoist.com/oauth/access_token",
			{
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
				code: code,
				redirect_uri: REDIRECT_URI,
			},
		);
		const { access_token } = response.data;
		return access_token;
	} catch (error) {
		console.error(
			"OAuth error:",
			error.response ? error.response.data : error,
		);
		throw error; // Re-throw to let route handler deal with it
	}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       TODOIST CRUD FUNCTIONS              //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Initialize API with the user's token
function initializeTodoistAPI(accessToken) {
	return new TodoistApi(accessToken);
}

// Returns bool. Determines if user has reached project limit
async function userReachedProjectLimit(accessToken) {
	try {
		// Fetch projects via the REST API v2
		const response = await axios.get(
			"https://api.todoist.com/rest/v2/projects",
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			},
		);
		const projects = response.data;

		// Count non-inbox projects
		const projectCount = projects.reduce(
			(count, project) => count + (!project.is_inbox_project ? 1 : 0),
			0,
		);

		// REST API v2 doesn't expose premium status directly, so we infer it:
		// Free users are limited to 5 projects, so if they have more, they must be premium
		const isPremium = projectCount > projectLimits.FREE;

		return isPremium
			? projectCount >= projectLimits.PREMIUM
			: projectCount >= projectLimits.FREE;
	} catch (error) {
		console.error("Error fetching user data:", error);
		throw new Error("Failed to fetch user metadata");
	}
}

async function createDestination(api, destination, name, color) {
	if (destination === "inbox") {
		// Query the Todoist API for the Inbox project ID
		try {
			// Request up to 200 projects to ensure we get the inbox even for power users
			// (Inbox is typically first, but this covers users with 50-200 projects)
			const projects = await api.getProjects({ limit: 200 });

			const inboxProject = projects.find(
				(project) => project.isInboxProject,
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
			console.error("Error in createDestination (inbox):", error);
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
			`Invalid destination type: ${destination}. Expected 'inbox' or 'newProject'.`,
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
		`Importing ${schedule.length} games for ${teamName} into project ID ${destinationIds.projectId}`,
	);
	// Use map to create an array of promises
	const tasks = schedule.map((game, index) =>
		importGame(api, game, teamName, index + 1, destinationIds),
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

async function addYearlyReminder(api, teamName, destinationIds) {
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
		console.error("Error adding yearly reminder to Todoist:", error);
	}
}

export {
	retrieveAccessToken,
	initializeTodoistAPI,
	userReachedProjectLimit,
	createDestination,
	createDeepLink,
	importSchedule,
	addYearlyReminder,
};
