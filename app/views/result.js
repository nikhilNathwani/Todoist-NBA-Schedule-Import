import { makeHead, makeFooter, makeLogoBanner } from "./shared/components.js";
import { escapeHTML } from "./shared/escapeHTML.js";

// The page an import ends on, success or failure. POST /setup saves the
// outcome in the session and redirects here (see routes/setup.js).
// result: { ok: true, deepLink } or { ok: false, message }
// teamID: the team that was imported, for the header logo (may be undefined)
function makeResultPageHTML(result, teamID) {
	const status = result.ok
		? {
				pageTitle: "Import complete",
				icon: '<i class="fa-solid fa-check" aria-hidden="true"></i>',
				title: "Import complete!",
				subtitle: "Schedule added to Todoist",
				nextSteps: makeSuccessNextSteps(result.deepLink),
			}
		: {
				pageTitle: "Import failed",
				icon: '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>',
				title: "An error occurred",
				subtitle: result.message,
				nextSteps: makeErrorNextSteps(result.message),
			};

	return `
	<!DOCTYPE html>
	<html lang="en">
		${makeHead(`NBA Schedule Import — ${status.pageTitle}`)}
		<body>
			<main>
				<div class="app-frame">
					<div class="app-header">
						${makeLogoBanner(true, { teamID, arrowIcon: status.icon })}
						<div class="app-status fade-in">
							<h1>${escapeHTML(status.title)}</h1>
							<h3>${escapeHTML(status.subtitle)}</h3>
						</div>
					</div>
					<div class="app-content">
						${status.nextSteps}
					</div>
				</div>
			</main>
			${makeFooter()}
		</body>
	</html>
	`;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       NEXT STEPS                          //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

function makeSuccessNextSteps(deepLink) {
	const contactLink = `mailto:nnathwani36@gmail.com?subject=${encodeURIComponent(
		"Regarding NBA Todoist Import",
	)}`;
	return `
		<ul>
			<li>
				<a class="project project-game" href="${escapeHTML(deepLink)}" target="_blank">
					<i class="fa-solid fa-up-right-from-square"></i> Open Todoist
				</a> to view schedule
			</li>
			<li>
				<a class="project project-game" href="/setup">
					<i class="fa-solid fa-arrow-left"></i> Import another
				</a> schedule
			</li>
			<li>
				<a class="project project-game" href="${escapeHTML(contactLink)}" target="_blank">
					<i class="fa-regular fa-envelope"></i> Contact me
				</a>
			</li>
		</ul>`;
}

function makeErrorNextSteps(errorMessage) {
	const errorReportLink = `mailto:nnathwani36@gmail.com?subject=${encodeURIComponent(
		"Issue with NBA Todoist Import",
	)}&body=${encodeURIComponent(
		"I encountered the following error when trying to import an NBA schedule into Todoist:\n\n" +
			errorMessage,
	)}`;
	return `
		<ul>
			<li>
				<a class="project project-game" href="${escapeHTML(errorReportLink)}" target="_blank">
					<i class="fa-regular fa-envelope"></i> Send error report
				</a>
			</li>
			<li>
				<a class="project project-game" href="/setup">
					<i class="fa-solid fa-arrow-left"></i> Try again
				</a>
			</li>
		</ul>`;
}

export { makeResultPageHTML };
