/**
 * Imports NBA schedule to Todoist via the backend API
 */

/**
 * @param {string} team - Team ID (e.g., "BOS")
 * @param {string} project - Destination type ("newProject" or "inbox")
 * @returns {Promise<Object>} Response data containing deepLink
 */
async function importSchedule(team, project) {
	// Error-handling demo hook: if the page URL has ?mockTodoistError=<code>,
	// forward it so the backend simulates that Todoist API failure instead
	// of making a real call. Only takes effect if the server has error-demo
	// mode enabled (see .env.example) -- otherwise the backend ignores it.
	const mockError = new URLSearchParams(window.location.search).get(
		"mockTodoistError",
	);

	const response = await fetch("/api/import-schedule", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ team, project, mockError }),
	});

	const data = await response.json();
	if (!response.ok) {
		const error = new Error(data.message || "Failed to import schedule.");
		error.errorType = data.errorType;
		error.retryable = data.retryable;
		error.retryAfterSeconds = data.retryAfterSeconds;
		throw error;
	}
	return data;
}
