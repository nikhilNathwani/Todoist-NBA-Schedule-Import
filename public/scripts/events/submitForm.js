/**
 * Handles form submission for schedule import
 * Triggers loading UI, calls import API, and shows results
 */

// Note: form, teamSelect, projectSelect are defined in picker.js

// Set up event listener for form submission
form.addEventListener("submit", async function (event) {
	event.preventDefault();

	// Show loading state
	showImportStatusUI(importStatus.LOADING);

	try {
		// Call import API
		const data = await importSchedule(
			teamSelect.value,
			projectSelect.value
		);

		// Wait for loading UI minimum duration
		await waitForLoadingUI();

		// Show success state with deep link
		showImportStatusUI(importStatus.SUCCESS);
		showNextStepsList(importStatus.SUCCESS, data.deepLink);
	} catch (error) {
		console.error("Import failed:", error);

		// Wait for loading UI minimum duration
		await waitForLoadingUI();

		// Show error state
		showImportStatusUI(importStatus.ERROR);
		showNextStepsList(importStatus.ERROR, null, error);
	}
});
