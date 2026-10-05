/**
 * Handles team selection events
 * Responds to user selecting a team from the dropdown
 */

import { updateTeamLogo } from "../ui/header/teamLogo.js";
import { updateNewProjectSubtitle, enableSubmitButton } from "../ui/picker.js";

// Set up event listener for team selection
export function listenForTeamSelection(teamSelect) {
	teamSelect.addEventListener("change", function () {
		const selectedOption = teamSelect.options[teamSelect.selectedIndex];
		const teamID = selectedOption.value;
		const teamName = selectedOption.dataset.teamName;

		handleTeamSelection(teamID, teamName);
	});
}

function handleTeamSelection(teamID, teamName) {
	updateTeamLogo(teamID);
	updateNewProjectSubtitle(teamName);
	enableSubmitButton();
}
