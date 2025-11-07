import { makeHead, makeFooter, makeLogoBanner } from "./components.js";

function makeLandingPageHTML() {
	return `
	<!DOCTYPE html>
	<html lang="en">
		${makeHead()}
		<body>
			<main>
				<div class="app-frame" id="appFrameLanding">
					<div class="app-header">
						${makeLogoBanner(true)}
						<h1>NBA Schedule Import</h1>
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
				</div>
			</main>
			${makeFooter()}
		</body>
	</html>
`;
}

export { makeLandingPageHTML };
