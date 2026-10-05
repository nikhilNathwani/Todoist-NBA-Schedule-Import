/**
 * Picker page view initialization
 * Fetches data and populates the team dropdown on page load
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       FORM ELEMENTS                       //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Form elements - shared with event handlers
const form = document.querySelector("form");
const teamSelect = form.elements["team"];
const projectSelect = form.elements["project"];

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       INITIALIZATION                      //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

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
		option.dataset.teamName = team.name; // Store just team name (without city)
		option.textContent = `${team.city} ${team.name}`;
		teamSelect.appendChild(option);
	});
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       PICKER VIEW UPDATES                 //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

function updateNewProjectSubtitle(teamName) {
	const newProjectInput = document.querySelector('input[value="newProject"]');
	const newProjectSubtitle = document
		.getElementById("newProject")
		.querySelector("small");

	if (!newProjectInput.disabled && teamName) {
		newProjectSubtitle.textContent = `Import games into a new Todoist project called "${teamName} schedule"`;
	}
}

function enableSubmitButton() {
	const submitButton = document.getElementById("submitButton");
	submitButton.disabled = false;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       MAIN                                //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Initialize on page load
initializePickerPage();
