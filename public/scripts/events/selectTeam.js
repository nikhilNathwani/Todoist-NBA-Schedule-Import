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

console.log("selectTeam.js loaded", {
	submitButton,
	teamSelect,
	newProjectInput,
	newProjectSubtitle,
});

// Set up event listener for team selection
if (teamSelect) {
	teamSelect.addEventListener("change", function () {
		console.log("change event fired!");
		const selectedOption = teamSelect.options[teamSelect.selectedIndex];
		const teamID = selectedOption.value;
		const teamName = selectedOption.dataset.teamName;

		handleTeamSelection(teamID, teamName);
	});
} else {
	console.error("teamSelect not found!");
}

function handleTeamSelection(teamID, teamName) {
	console.log("handleTeamSelection called", {
		teamID,
		teamName,
		submitButton,
	});
	updateTeamLogo(teamID); // Calls teamLogo.js
	updateNewProjectSubtitle(teamName);
	enableSubmitButton();
}

function updateNewProjectSubtitle(teamName) {
	if (!newProjectInput.disabled && teamName) {
		newProjectSubtitle.textContent = `Import games into a new Todoist project called "${teamName} schedule"`;
	}
}

function enableSubmitButton() {
	console.log("enableSubmitButton called", {
		submitButton,
		disabled: submitButton?.disabled,
	});
	submitButton.disabled = false;
	console.log("after setting disabled = false", {
		disabled: submitButton?.disabled,
	});
}
