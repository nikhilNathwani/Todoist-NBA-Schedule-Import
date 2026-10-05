/**
 * Picker page view updates
 * Team dropdown, "new project" subtitle, and submit button
 */

export function populateTeamDropdown(teamSelect, teams) {
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

export function updateNewProjectSubtitle(teamName) {
	const newProjectInput = document.querySelector('input[value="newProject"]');
	const newProjectSubtitle = document
		.getElementById("newProject")
		.querySelector("small");

	if (!newProjectInput.disabled && teamName) {
		newProjectSubtitle.textContent = `Import games into a new Todoist project called "${teamName} schedule"`;
	}
}

export function enableSubmitButton() {
	const submitButton = document.getElementById("submitButton");
	submitButton.disabled = false;
}
