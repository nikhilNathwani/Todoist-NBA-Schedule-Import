const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const router = express.Router();
const {
	getAccessToken,
	printReqSession,
} = require("../utils/cookieSession.js");
const { userReachedProjectLimit } = require("./importGames");
const { makeLandingPageHTML } = require("../utils/renderLandingPage.js");

// Serve the landing page (login page)
router.get("/", async (req, res) => {
	const html = await makeLandingPageHTML();
	res.send(html);
});

// Serve the team selection page
router.get("/configure-import", async (req, res) => {
	try {
		console.log("In /configure-import, req.session is:");
		printReqSession(req);
		// Make team picker HTML
		const teams = await getTeams();
		const teamPickerHTML = makeTeamPickerHTML(teams);

		// Make project picker HTML
		//const isInboxDefault = req.query.isInboxDefault !== "false"; // Get isInboxDefault for project picker (from the URL parameters)
		const accessToken = getAccessToken(req);
		const isInboxDefault = await userReachedProjectLimit(accessToken);
		const projectPickerHTML = makeProjectPickerHTML(isInboxDefault);

		// Construct the complete HTML
		const form = `
			<form>
				${teamPickerHTML}
				${projectPickerHTML}
				<button id="submitButton" class="button" type="submit" disabled>Import schedule</button>
			</form>
		`;
		const html = htmlIntro + form + htmlOutro;
		res.send(html); // Send the dynamically constructed HTML
	} catch (error) {
		console.error("Error reading NBA schedule:", error);
		res.status(500).send("An error occurred");
	}
});

router.get("*", async (req, res) => {
	const html = await makeLandingPageHTML();
	res.send(html);
});

module.exports = router;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//         PICKERS                           //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
async function getTeams() {
	const data = await fs.readFile(
		path.join(__dirname, "../data/nba_schedule.json")
	);
	return JSON.parse(data);
}

function makeTeamPickerHTML(teams) {
	const intro = `
		<fieldset id="teamPicker">
			<legend>
				1. Select your NBA team
			</legend>
			<select id="team-selector" name="team" aria-label="NBA Team">
				<option value="" disabled selected>Choose a team</option> <!-- Ghost text -->`;
	const outro = `
			</select>
		</fieldset>`;

	//teams sorted alphabetically by city
	const teamOptions = Object.entries(teams)
		.sort((a, b) => (a[1].city > b[1].city ? 1 : -1))
		.map(([teamID, team]) => {
			return `<option value="${teamID}">${team.city} ${team.name}</option>`;
		})
		.join("");

	return intro + teamOptions + outro;
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

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//         HTML FRAME                        //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
const logoBanner = `
	<div class="logo-banner">
		<div class="logo-container" id="nbaLogoContainer">	
			<img src="/images/nba-logo.png" 
			alt="NBA Logo" />
		</div>
		<div id="arrow">
			<i class="fa-solid fa-arrow-right"></i>
		</div>
		<div class="logo-container">
			<img
				src="/images/todoist-color-logo.png"
				alt="Todoist Brand Logo"
			/>
		</div>
	</div>
`;

const appHeader = `
	<div class="app-header">
		${logoBanner}
		<div class="app-status">
			<h1></h1>
			<h3></h3>
		</div>
	</div>
`;

const htmlIntro = `
	<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta http-equiv="X-UA-Compatible" content="IE=edge" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>Select Team and Project Settings</title>
			<link rel="stylesheet" href="/style.css" />
			<link
				rel="apple-touch-icon"
				sizes="180x180"
				href="/images/favicon/apple-touch-icon.png"
			/>
			<link
				rel="icon"
				type="image/png"
				sizes="32x32"
				href="/images/favicon/favicon-32x32.png"
			/>
			<link
				rel="icon"
				type="image/png"
				sizes="16x16"
				href="/images/favicon/favicon-16x16.png"
			/>
			<link rel="manifest" href="/images/favicon/site.webmanifest" />
			<script
				src="https://kit.fontawesome.com/caba6ce64c.js"
				crossorigin="anonymous"
			></script>
		</head>
		<body>
			<main>
				<div class="app-frame">
					${appHeader}
					<div class="app-content">
`;

const htmlOutro = `
					</div>
				</div>	
			</main>
			<footer>
				<div>&copy; Nikhil Nathwani</div>
				|
				<a target="_blank" href="https://nikhilnathwani.com"
					>Other Work</a
				>
				|
				<a
					target="_blank"
					href="https://github.com/nikhilNathwani/Todoist-NBA-Schedule-Saver"
					>Github</a
				>
			</footer>
			<script src="/scripts/renderForm.js"></script>
			<script src="/scripts/renderConfirmation.js"></script>
			<script src="/scripts/handleInput.js"></script>
		</body>			
	</html>
`;
