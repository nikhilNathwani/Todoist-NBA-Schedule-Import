import { makeHead, makeFooter, makeLogoBanner } from "./shared.js";

const PAGE_TITLE = "NBA Schedule Import";

function makeSeasonOverHTML(seasonEndYear) {
	return `
	<!DOCTYPE html>
	<html lang="en">
		${makeHead()}
		<body>
			<main>
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
				</div>
			</main>
			${makeFooter()}
		</body>
	</html>
`;
}

export { makeSeasonOverHTML };
