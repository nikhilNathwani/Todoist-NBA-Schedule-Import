import { makeHead, makeFooter, makeLogoBanner } from "./shared/components.js";
import { escapeHTML } from "./shared/escapeHTML.js";

async function makeSetupPageHTML(canCreateProjects, teams) {
	const teamPickerHTML = makeTeamPickerHTML(teams);
	const projectPickerHTML = makeProjectPickerHTML(canCreateProjects);

	// A normal form post: POST /setup runs the import, then redirects to
	// /result. events/submitForm.js only shows a loading screen meanwhile.
	const form = `
		<form method="post" action="/setup">
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
	<script type="module" src="/scripts/main.js"></script>
		</body>
	</html>
	`;
}

// teams: { BOS: { name: "Celtics", city: "Boston", ... }, ... } from getTeams()
function makeTeamPickerHTML(teams) {
	// Sorted by city, so "Boston Celtics" sits under B
	const teamOptions = Object.entries(teams)
		.sort(([, a], [, b]) => a.city.localeCompare(b.city))
		.map(
			([teamID, team]) =>
				`<option value="${escapeHTML(teamID)}" data-team-name="${escapeHTML(team.name)}">${escapeHTML(team.city)} ${escapeHTML(team.name)}</option>`,
		)
		.join("\n\t\t\t\t");

	return `
		<fieldset id="teamPicker">
			<legend>
				1. Select your NBA team
			</legend>
			<select id="team-selector" name="team" aria-label="NBA Team">
				<option value="" disabled selected>Choose a team</option>
				${teamOptions}
			</select>
		</fieldset>`;
}

function makeProjectPickerHTML(canCreateProjects) {
	const intro = `
		<fieldset id="projectPicker">
			<legend>
				2. Select Todoist project
			</legend>`;
	const outro = `</fieldset>`;

	const newProjectOption = `
		<label id="newProject" class="radio-button ${canCreateProjects ? "" : "disabled"}">
			<input type="radio" name="project" value="newProject" ${
				canCreateProjects ? "checked" : "disabled"
			}>
			<span>
				<strong>Create New Project</strong><br>
				<small aria-live="polite">${
					canCreateProjects
						? "Import games into a new Todoist project"
						: "Project limit reached. Can't create more Todoist projects."
				}</small>
			</span>
		</label>`;

	const inboxOption = `
		<label id="inbox" class="radio-button">
			<input type="radio" name="project" value="inbox" ${
				canCreateProjects ? "" : "checked"
			}>
			<span>
				<strong>Inbox</strong><br>
				<small>Import games into your Todoist "Inbox"</small>
			</span>
		</label>`;

	return intro + newProjectOption + inboxOption + outro;
}

export { makeSetupPageHTML };
