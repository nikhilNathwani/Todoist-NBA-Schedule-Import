/**
 * Handles team selection events
 * Responds to user selecting a team from the dropdown
 */

// Note: teamSelect is defined in picker.js
// Note: updateNewProjectSubtitle and enableSubmitButton are defined in picker.js

// Set up event listener for team selection
teamSelect.addEventListener("change", function () {
	const selectedOption = teamSelect.options[teamSelect.selectedIndex];
	const teamID = selectedOption.value;
	const teamName = selectedOption.dataset.teamName;

	handleTeamSelection(teamID, teamName);
});

function handleTeamSelection(teamID, teamName) {
	updateTeamLogo(teamID); // Calls teamLogo.js
	updateNewProjectSubtitle(teamName); // Calls picker.js
	enableSubmitButton(); // Calls picker.js
}
