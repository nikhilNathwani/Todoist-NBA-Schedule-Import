/**
 * Page Transitions & Animation Timing
 * Handles UI transitions and loading duration management
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       PAGE TRANSITIONS                    //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

function transitionToLoading() {
	// Start loading timer
	startLoadingTimer();

	// Update status header
	updateHeaderStatus(importStatus.LOADING);

	// Fade out form
	const form = document.querySelector("form");
	form.classList.add("fade-out");
	form.addEventListener("transitionend", (event) => {
		if (event.propertyName === "opacity") {
			form.remove();
			// Grow logo banner and show loading status
			growLogoBanner();
			const statusContainer = document.querySelector(".app-status");
			statusContainer.classList.add("fade-in");
		}
	});
}

async function transitionToResult(status) {
	// Wait for minimum loading duration
	await waitForLoadingUI();

	// Update status header
	updateHeaderStatus(status);
	// Show footer for success/error states
	document.body.classList.remove("no-footer");
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       LOADING TIMER                       //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

const minDurationLoadingUI = 3000;
let loadingStartTime = null;

function startLoadingTimer() {
	loadingStartTime = Date.now();
}

async function waitForLoadingUI() {
	if (!loadingStartTime) return;

	const elapsed = Date.now() - loadingStartTime;
	const remaining = minDurationLoadingUI - elapsed;

	if (remaining > 0) {
		await new Promise((resolve) => setTimeout(resolve, remaining));
	}
}
