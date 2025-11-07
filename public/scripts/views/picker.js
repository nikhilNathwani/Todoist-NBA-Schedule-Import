/**
 * Picker page view initialization
 * Fetches data and populates the team dropdown on page load
 */

const teamSelect = document.querySelector('select[name="team"]');

// Initialize picker page: fetch team data and populate dropdown
async function initializePickerPage() {
	const teamData = await fetchTeamData();
	populateTeamDropdown(teamData);
	// Make teamData globally accessible for other scripts
	window.teamData = teamData;
}

function populateTeamDropdown(teams) {
	// Sort teams alphabetically by city
	const sortedTeams = Object.entries(teams).sort((a, b) =>
		a[1].city > b[1].city ? 1 : -1
	);

	// Create and append option elements
	sortedTeams.forEach(([teamID, team]) => {
		const option = document.createElement("option");
		option.value = teamID;
		option.textContent = `${team.city} ${team.name}`;
		teamSelect.appendChild(option);
	});
}

// Initialize on page load
initializePickerPage();
