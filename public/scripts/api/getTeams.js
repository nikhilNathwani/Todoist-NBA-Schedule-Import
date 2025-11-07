/**
 * Fetches the list of NBA teams from the backend API
 * @returns {Promise<Object>} Object mapping team IDs to team data
 */
async function fetchTeamData() {
	try {
		const response = await fetch("/api/get-teams");
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		console.error("Failed to fetch team data:", error);
		return {}; // Fallback to empty object in case of error
	}
}
