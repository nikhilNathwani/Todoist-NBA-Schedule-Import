/**
 * Imports NBA schedule to Todoist via the backend API
 */

/**
 * @param {string} team - Team ID (e.g., "BOS")
 * @param {string} project - Destination type ("newProject" or "inbox")
 * @returns {Promise<Object>} Response data containing deepLink
 */
async function importSchedule(team, project) {
	const response = await fetch("/api/import-schedule", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ team, project }),
	});

	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.message || "Failed to import schedule.");
	}
	return data;
}
