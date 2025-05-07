const { getFinalGameTime } = require("./parseSchedule");

async function makeLandingPageHTML() {
	// var { isSeasonOverBool, seasonEndYear } = {
	// 	isSeasonOverBool: false,
	// 	seasonEndYear: 2025,
	// };
	var { isSeasonOverBool, seasonEndYear } = await isSeasonOver();
	return `
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta http-equiv="X-UA-Compatible" content="IE=edge" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>NBA -> Todoist Schedule Import</title>
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
				<div class="app-frame ${
					isSeasonOverBool ? "season-over" : ""
				}" id="appFrameLanding">
					${makeAppHeaderHTML(isSeasonOverBool, seasonEndYear)}
					${makeAppContentHTML(isSeasonOverBool)}
				</div>
			</main>
			<footer>
				<div>&copy; Nikhil Nathwani</div>
				|
				<a target="_blank" href="https://nikhilnathwani.com">Other Work</a>
				|
				<a
					target="_blank"
					href="https://github.com/nikhilNathwani/Todoist-NBA-Schedule-Saver"
					>Github</a
				>
			</footer>
		</body>
	</html>
`;
}

function makeAppHeaderHTML(isSeasonOver, seasonEndYear) {
	return `
	<div class="app-header">
		<div class="logo-banner logo-banner-large">
			<div class="logo-container" id="nbaLogoContainer">
				<img src="/images/nba-logo.png" alt="NBA Logo" />
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
		<h1>NBA Schedule Import</h1>
		<h3>
		${
			!isSeasonOver
				? "Log in with Todoist to import your favorite NBA team's regular season schedule."
				: `
					<b>Come back in October</b> when the ${seasonEndYear}-${
						(seasonEndYear + 1) % 100
				  } NBA schedule is available.
					<br />
					<br />
					Then import your favorite team's games into Todoist!
					<br />
					<br />
					<a href="https://youtu.be/t3R9q-3n1lE" target="_blank">
						Watch 60s demo
					</a>
				`
		}
		</h3>
	</div>
	`;
}

function makeAppContentHTML(isSeasonOver) {
	return isSeasonOver
		? ""
		: `
		<div class="app-content">
			<div class="button-container">
				<a
					href="/api/auth/login"
					role="button"
					class="button button-primary"
					>Log in with Todoist</a
				>
				<a
					href="https://youtu.be/t3R9q-3n1lE"
					target="_blank"
					role="button"
					class="button button-secondary"
					>Quick demo & FAQ</a
				>
			</div>
		</div>
		`;
}

function isSeasonOverOld() {
	//Hard-coded final game time (UTC) of last game of 2024-25 regular season
	const finalGameDateTime = new Date("2025-04-13T19:30:00+00:00");
	const now = new Date();
	return now > finalGameDateTime;
}

//returns 1) true/false indicating whether season is over,
//        2) the end-year of the season in question
async function isSeasonOver() {
	try {
		const finalGameDateTime = await getFinalGameTime();
		const seasonEndYear = finalGameDateTime.getFullYear();
		const now = new Date();
		return {
			isSeasonOverBool: now > finalGameDateTime,
			seasonEndYear: seasonEndYear,
		};
	} catch (error) {
		console.error("Failed to fetch team data:", error);
		return {
			isSeasonOverBool: false,
			seasonEndYear: 0,
		};
	}
}

module.exports = { makeLandingPageHTML };
