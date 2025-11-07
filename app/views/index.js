import { isSeasonOver } from "../utils/parseSchedule.js";
import { makeHead, makeFooter, makeLogoBanner } from "./shared.js";

const PAGE_TITLE = "NBA Schedule Import";

async function makeLandingPageHTML(forceSeasonOver = false) {
	var { isSeasonOverBool, seasonEndYear } = await isSeasonOver();

	// For testing: force season over state
	if (forceSeasonOver) {
		isSeasonOverBool = true;
	}
	return `
	<!DOCTYPE html>
	<html lang="en">
		${makeHead()}
		<body>
			<main>
				${
					isSeasonOverBool
						? makeSeasonOverAppFrame(seasonEndYear)
						: makeActiveSeasonAppFrame()
				}
			</main>
			${makeFooter()}
		</body>
	</html>
`;
}

function makeActiveSeasonAppFrame() {
	return `
		<div class="app-frame" id="appFrameLanding">
			<div class="app-header">
				${makeLogoBanner(true)}
				<h1>${PAGE_TITLE}</h1>
				<h3>
					Log in with Todoist to import your favorite NBA team's regular season schedule.
				</h3>
			</div>
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
		</div>`;
}

function makeSeasonOverAppFrame(seasonEndYear) {
	return `
		<div class="app-frame season-over" id="appFrameLanding">
			<div class="app-header">
				${makeLogoBanner(true)}
				<h1>${PAGE_TITLE}</h1>
				<h3>
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
				</h3>
			</div>
		</div>`;
}

export { makeLandingPageHTML };
