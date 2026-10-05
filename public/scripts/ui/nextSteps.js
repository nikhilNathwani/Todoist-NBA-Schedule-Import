/**
 * Next Steps List
 * Displays actionable next steps after import completes (success or error)
 */

import { importStatus } from "./header/importStatus.js";

export function showNextStepsList(status, deepLink, errorMessage) {
	console.log("showNextStepsList called:", {
		status,
		deepLink,
		errorMessage,
	});

	const list = document.createElement("ul");

	if (status === importStatus.SUCCESS) {
		list.innerHTML = getSuccessNextSteps(deepLink);
	} else if (status === importStatus.ERROR) {
		list.innerHTML = getErrorNextSteps(errorMessage);
	}

	const appContent = document.querySelector(".app-content");
	console.log("appContent element:", appContent);
	console.log("list element:", list);
	// Fades in on its own via the CSS animation on `ul` in style.css
	appContent.appendChild(list);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       HTML TEMPLATES                      //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

function getSuccessNextSteps(deepLink) {
	return `
		<li>
			<a class="project project-game" href="${deepLink}" target="_blank">
				<i class="fa-solid fa-up-right-from-square"></i> Open Todoist
			</a> to view schedule
		</li>
		<li>
			<a class="project project-game" href="/configure-import">
				<i class="fa-solid fa-arrow-left"></i> Import another
			</a> schedule
		</li>
		<li>
			<a class="project project-game" href="mailto:nnathwani36@gmail.com?subject=${encodeURIComponent(
				"Regarding NBA Todoist Import",
			)}" target="_blank">
				<i class="fa-regular fa-envelope"></i> Contact me
			</a>
		</li>
	`;
}

function getErrorNextSteps(errorMessage) {
	const errorReportLink = `mailto:nnathwani36@gmail.com?subject=${encodeURIComponent(
		"Issue with NBA Todoist Import",
	)}&body=${encodeURIComponent(
		"I encountered the following error when trying to import an NBA schedule into Todoist:\n\n" +
			errorMessage,
	)}`;

	return `
		<li>
			<a class="project project-game" href="${errorReportLink}" target="_blank">
				<i class="fa-regular fa-envelope"></i> Send error report
			</a>
		</li>
		<li>
			<a class="project project-game" href="/configure-import">
				<i class="fa-solid fa-arrow-left"></i> Try again
			</a>
		</li>
	`;
}
