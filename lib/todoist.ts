// todoist.ts -- all Todoist API interaction (OAuth + CRUD).
// Ported (typed) from app/utils/todoist.js (now removed). Logic unchanged.
import {
	TodoistApi,
	getProjectUrl,
	getSectionUrl,
} from "@doist/todoist-api-typescript";
import { toClassifiedError, createMockTodoistError } from "./todoistErrors";
import type { Game } from "./parseSchedule";

const projectLimits = {
	FREE: 5,
	PREMIUM: 300,
};

export interface DestinationIds {
	projectId: string;
	sectionId?: string;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       TODOIST OAUTH FUNCTIONS             //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Retrieve access token from Todoist API
export async function retrieveAccessToken(code: string): Promise<string> {
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
			) as Error & { httpStatusCode: number; responseData: unknown };
			error.httpStatusCode = response.status;
			error.responseData = errorData;
			throw error;
		}
		const { access_token } = (await response.json()) as {
			access_token: string;
		};
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
export function initializeTodoistAPI(accessToken: string): TodoistApi {
	return new TodoistApi(accessToken);
}

// Returns bool. Determines if user has reached project limit.
// mockErrorCode (optional): one of MOCKABLE_ERROR_CODES in todoistErrors.ts.
// When set, simulates that Todoist API failure instead of making a real
// call, so the classification/handling below can be demoed on demand --
// see ?mockTodoistError= on /configure-import.
export async function userReachedProjectLimit(
	accessToken: string,
	mockErrorCode?: string,
): Promise<boolean> {
	try {
		if (mockErrorCode) {
			throw createMockTodoistError(mockErrorCode);
		}

		// Use the TypeScript library to fetch projects (it handles API versioning)
		const api = new TodoistApi(accessToken);
		// getUser().isPremium is the real, directly-exposed plan flag -- fetched
		// in parallel with the project list, not inferred from project count.
		// (An earlier version of this function inferred premium status from
		// projectCount > 5, on the belief the API didn't expose it directly --
		// it does, via the same SDK already in use here. The 5/300 numeric caps
		// themselves still aren't exposed by the API as of this writing, so
		// those stay hardcoded; only which cap applies is now a real API value.)
		const [user, response] = await Promise.all([
			api.getUser(),
			api.getProjects({ limit: 200 }),
		]);

		// Handle both array response and paginated response format
		const projects = Array.isArray(response)
			? response
			: response.results || [];

		// Count non-inbox projects
		const projectCount = projects.reduce(
			(count, project) => count + (!project.inboxProject ? 1 : 0),
			0,
		);

		return user.isPremium
			? projectCount >= projectLimits.PREMIUM
			: projectCount >= projectLimits.FREE;
	} catch (error) {
		throw toClassifiedError(error, "userReachedProjectLimit");
	}
}

// mockErrorCode (optional): see userReachedProjectLimit above -- same
// simulation mechanism, applied at this API call site instead.
export async function createDestination(
	api: TodoistApi,
	destination: "inbox" | "newProject" | string,
	name: string,
	color: string | undefined,
	mockErrorCode?: string,
): Promise<DestinationIds> {
	if (mockErrorCode) {
		throw toClassifiedError(
			createMockTodoistError(mockErrorCode),
			"createDestination",
		);
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
			const inboxProject = projects.find((project) => project.inboxProject);

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

export function createDeepLink(destinationIds: DestinationIds): string {
	if (destinationIds.sectionId) {
		return getSectionUrl(destinationIds.sectionId);
	} else {
		return getProjectUrl(destinationIds.projectId);
	}
}

async function importGame(
	api: TodoistApi,
	game: Game,
	teamName: string,
	taskOrder: number,
	destinationIds: DestinationIds,
): Promise<void> {
	const task = formatTask(game, teamName, taskOrder, destinationIds);
	try {
		await api.addTask(task);
	} catch (error) {
		console.error("Error adding task to Todoist:", error);
	}
}

export async function importSchedule(
	api: TodoistApi,
	schedule: Game[],
	teamName: string,
	destinationIds: DestinationIds,
): Promise<void> {
	console.log(
		`Importing ${schedule.length} games for ${teamName} into project ID ${destinationIds.projectId}`,
	);
	// Use map to create an array of promises
	const tasks = schedule.map((game, index) =>
		importGame(api, game, teamName, index + 1, destinationIds),
	);
	await Promise.all(tasks);
}

function formatTask(
	game: Game,
	teamName: string,
	taskOrder: number,
	destinationIds: DestinationIds,
) {
	const task: {
		content: string;
		dueDatetime: string;
		projectId: string;
		order: number;
		sectionId?: string;
	} = {
		content: `${teamName} ${game.isHomeGame ? "vs" : "at"} ${game.opponent}`,
		dueDatetime: game.gameTimeUtcIso8601,
		projectId: destinationIds.projectId,
		order: taskOrder,
	};
	if (destinationIds.sectionId) {
		task.sectionId = destinationIds.sectionId;
	}
	return task;
}

export async function addYearlyReminder(
	api: TodoistApi,
	teamName: string,
	destinationIds: DestinationIds,
): Promise<void> {
	const siteURL =
		"[NBA -> Todoist Schedule Import](https://nba-todoist-import.vercel.app)";

	const task: {
		content: string;
		description: string;
		projectId: string;
		dueString: string;
		dueLang: string;
		order: number;
		sectionId?: string;
	} = {
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
