/**
 * Picker page view initialization
 * Fetches data and populates the team dropdown on page load
 */

const teamSelect = document.querySelector('select[name="team"]');
let teamData = null;

// Initialize picker page: fetch team data and populate dropdown
async function initializePickerPage() {
	teamData = await fetchTeamData();
	populateTeamDropdown(teamData);
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
		option.dataset.teamName = `${team.city} ${team.name}`; // Store full name
		option.textContent = `${team.city} ${team.name}`;
		teamSelect.appendChild(option);
	});
}

function getTeamData() {
	return teamData;
}

// Initialize on page load
initializePickerPage();
