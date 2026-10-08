/**
 * Configure-import page view updates
 * "New project" subtitle and submit button
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//   CONFIGURE-IMPORT VIEW UPDATES           //
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
