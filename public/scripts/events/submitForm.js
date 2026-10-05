/**
 * Handles form submission for schedule import
 * Triggers loading UI, calls import API, and shows results
 */

import { importSchedule } from "../api/importSchedule.js";
import { importStatus } from "../ui/header/importStatus.js";
import { showNextStepsList } from "../ui/nextSteps.js";
import { transitionToLoading, transitionToResult } from "../utils/transitions.js";

// Set up event listener for form submission
export function listenForFormSubmit(form) {
	const teamSelect = form.elements["team"];
	const projectSelect = form.elements["project"];
	const submitButton = document.getElementById("submitButton");
	let submitted = false;

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		// Only the first submit counts. A double-click would otherwise start
		// two imports; the second sees the project the first just created,
		// fails the project-limit check, and its error replaces the real
		// success on screen.
		if (submitted) return;
		submitted = true;
		submitButton.disabled = true;
		console.log("Form submitted");

		// Show loading state
		transitionToLoading();

		try {
			// Call import API
			const data = await importSchedule(
				teamSelect.value,
				projectSelect.value
			);
			console.log("Import successful, data:", data);

			// Show success state with deep link
			await transitionToResult(importStatus.SUCCESS);
			console.log("About to call showNextStepsList");
			showNextStepsList(importStatus.SUCCESS, data.deepLink);
		} catch (error) {
			console.error("Import failed:", error);

			// Show error state, with the backend's classified message (e.g.
			// "Todoist is rate-limiting requests...") if one was provided
			await transitionToResult(importStatus.ERROR, error.message);
			showNextStepsList(importStatus.ERROR, null, error.message, error.errorType);
		}
	});
}
