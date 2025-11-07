/**
 * Handles team selection events
 * Responds to user selecting a team from the dropdown
 * Updates logo, project subtitle, and enables submit button
 */

const submitButton = document.getElementById("submitButton");
const teamSelect = document.querySelector('select[name="team"]');
const newProjectInput = document.querySelector('input[value="newProject"]');
const newProjectSubtitle = document
	.getElementById("newProject")
	.querySelector("small");

// Set up event listener for team selection
teamSelect.addEventListener("change", function () {
	handleTeamSelection(teamSelect.value);
});

function handleTeamSelection(selectedTeam) {
	updateTeamLogo(selectedTeam); // Calls appHeader.js
	updateNewProjectSubtitle(selectedTeam);
	enableSubmitButton();
}

function updateNewProjectSubtitle(selectedTeam) {
	const teamData = getTeamData(); // Get from picker.js
	if (!newProjectInput.disabled && teamData) {
		newProjectSubtitle.textContent = `Import games into a new Todoist project called "${teamData[selectedTeam].nameCasual} schedule"`;
	}
}

function enableSubmitButton() {
	submitButton.disabled = false;
}
