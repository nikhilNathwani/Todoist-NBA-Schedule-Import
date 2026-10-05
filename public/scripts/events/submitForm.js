/**
 * Handles form submission for schedule import
 * Triggers loading UI, calls import API, and shows results
 */

// Note: form, teamSelect, projectSelect are defined in picker.js

// Set up event listener for form submission
form.addEventListener("submit", async function (event) {
	event.preventDefault();
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
		showNextStepsList(importStatus.ERROR, null, error);
	}
});
