/**
 * Picker page view updates
 * Team dropdown, "new project" subtitle, and submit button
 */

export function populateTeamDropdown(teamSelect, teams) {
	// fetchTeamData returns {} if /api/get-teams failed. Say so in the
	// dropdown instead of leaving it silently empty (the submit button stays
	// disabled, since no team can be picked).
	if (Object.keys(teams).length === 0) {
		teamSelect.options[0].textContent =
			"Couldn't load teams. Please refresh the page.";
		return;
	}

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
