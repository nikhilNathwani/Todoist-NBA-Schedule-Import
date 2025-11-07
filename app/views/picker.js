import { makeHead, makeFooter, makeLogoBanner } from "./shared.js";

async function makePickerPageHTML(isInboxDefault) {
	const teamPickerHTML = makeTeamPickerHTML();
	const projectPickerHTML = makeProjectPickerHTML(isInboxDefault);

	const form = `
		<form>
			${teamPickerHTML}
			${projectPickerHTML}
			<button id="submitButton" class="button" type="submit" disabled>Import schedule</button>
		</form>
	`;

	return `
	<!DOCTYPE html>
	<html lang="en">
		${makeHead("Select Team and Project Settings")}
		<body>
			<main>
				<div class="app-frame">
					<div class="app-header">
						${makeLogoBanner()}
						<div class="app-status">
							<h1></h1>
							<h3></h3>
						</div>
					</div>
					<div class="app-content">
						${form}
					</div>
				</div>	
			</main>
			${makeFooter()}
	<script src="/scripts/api/getTeams.js"></script>
	<script src="/scripts/api/importSchedule.js"></script>
	<script src="/scripts/views/header/importStatus.js"></script>
	<script src="/scripts/views/header/teamLogo.js"></script>
	<script src="/scripts/views/picker.js"></script>
	<script src="/scripts/views/confirmation.js"></script>
	<script src="/scripts/events/selectTeam.js"></script>
	<script src="/scripts/events/submitForm.js"></script>
		</body>			
	</html>
	`;
}

function makeTeamPickerHTML() {
	return `
		<fieldset id="teamPicker">
			<legend>
				1. Select your NBA team
			</legend>
			<select id="team-selector" name="team" aria-label="NBA Team">
				<option value="" disabled selected>Choose a team</option>
				<!-- Options populated by frontend scripts/events/selectTeam.js -->
			</select>
		</fieldset>`;
}

function makeProjectPickerHTML(isInboxDefault) {
	const intro = `
		<fieldset id="projectPicker">
			<legend>
				2. Select Todoist project
			</legend>`;
	const outro = `</fieldset>`;

	const newProjectOption = `
		<label id="newProject" class="radio-button ${isInboxDefault ? "disabled" : ""}">
			<input type="radio" name="project" value="newProject" ${
				isInboxDefault ? "disabled" : "checked"
			}>
			<span>
				<strong>Create New Project</strong><br>
				<small aria-live="polite">${
					isInboxDefault
						? "Project limit reached. Can't create more Todoist projects."
						: "Import games into a new Todoist project"
				}</small>
			</span>
		</label>`;

	const inboxOption = `
		<label id="inbox" class="radio-button">
			<input type="radio" name="project" value="inbox" ${
				isInboxDefault ? "checked" : ""
			}>
			<span>
				<strong>Inbox</strong><br>
				<small>Import games into your Todoist "Inbox"</small>
			</span>
		</label>`;

	return intro + newProjectOption + inboxOption + outro;
}

export { makePickerPageHTML };
