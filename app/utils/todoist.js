import {
	TodoistApi,
	getProjectUrl,
	getSectionUrl,
} from "@doist/todoist-api-typescript";
import { toClassifiedError, createMockTodoistError } from "./todoistErrors.js";

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
		const response = await fetch("https://todoist.com/oauth/access_token", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
				code: code,
				redirect_uri: REDIRECT_URI,
			}),
		});
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error("OAuth error:", errorData);
			// Shaped to match the SDK's TodoistRequestError (.httpStatusCode +
			// .responseData) so this flows through the same classifier as
			// every other Todoist API failure in this app.
			const error = new Error(
				`OAuth request failed with status ${response.status}`,
			);
			error.httpStatusCode = response.status;
			error.responseData = errorData;
			throw error;
		}
		const { access_token } = await response.json();
		return access_token;
	} catch (error) {
		throw toClassifiedError(error, "retrieveAccessToken");
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

// Returns bool. Determines if user has reached project limit.
// mockErrorCode (optional): one of MOCKABLE_ERROR_CODES in todoistErrors.js.
// When set, simulates that Todoist API failure instead of making a real
// call, so the classification/handling below can be demoed on demand --
// see ?mockTodoistError= on /configure-import.
async function userReachedProjectLimit(accessToken, mockErrorCode) {
	try {
		if (mockErrorCode) {
			throw createMockTodoistError(mockErrorCode);
		}

		// Use the TypeScript library to fetch projects (it handles API versioning)
		const api = new TodoistApi(accessToken);
		const response = await api.getProjects({ limit: 200 });

		// Handle both array response and paginated response format
		const projects = Array.isArray(response)
			? response
			: response.results || [];

		// Count non-inbox projects
		const projectCount = projects.reduce(
			(count, project) => count + (!project.inboxProject ? 1 : 0),
			0,
		);

		// REST API doesn't expose premium status directly, so we infer it:
		// Free users are limited to 5 projects, so if they have more, they must be premium
		const isPremium = projectCount > projectLimits.FREE;

		return isPremium
			? projectCount >= projectLimits.PREMIUM
			: projectCount >= projectLimits.FREE;
	} catch (error) {
		throw toClassifiedError(error, "userReachedProjectLimit");
	}
}

// mockErrorCode (optional): see userReachedProjectLimit above -- same
// simulation mechanism, applied at this API call site instead.
async function createDestination(api, destination, name, color, mockErrorCode) {
	if (mockErrorCode) {
		throw toClassifiedError(createMockTodoistError(mockErrorCode), "createDestination");
	}

	if (destination === "inbox") {
		// Query the Todoist API for the Inbox project ID
		try {
			// Request up to 200 projects to ensure we get the inbox even for power users
			// (Inbox is typically first, but this covers users with 50-200 projects)
			const response = await api.getProjects({ limit: 200 });

			// Handle both array response and paginated response format
			const projects = Array.isArray(response)
				? response
				: response.results || [];

			// Find the inbox project
			const inboxProject = projects.find(
				(project) => project.inboxProject,
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
				// Debug: log first project structure to see property names
				if (projects.length > 0) {
					console.error(
						"First project structure:",
						JSON.stringify(projects[0], null, 2),
					);
				}
				throw new Error("Inbox project not found");
			}
		} catch (error) {
			console.error("Error in createDestination (inbox):", error);
			throw toClassifiedError(error, "createDestination:inbox");
		}
	} else if (destination === "newProject") {
		// Check if a color exists for the given team name
		if (!color) {
			throw new Error(`No color defined for team: ${name}`);
		}

		// Create a new Todoist project
		try {
			const newProjectResponse = await api.addProject({
				name: name,
				color: color,
			});
			return {
				projectId: newProjectResponse.id,
			};
		} catch (error) {
			console.error("Error in createDestination (newProject):", error);
			throw toClassifiedError(error, "createDestination:newProject");
		}
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
