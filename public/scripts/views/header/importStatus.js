/**
 * Import Status Management
 * Handles the entire import status flow:
 * - Loading UI timing and state
 * - Status arrow, title, subtitle updates
 * - Coordinating UI transitions during import
 */

const importStatus = {
	LOADING: 0,
	SUCCESS: 1,
	ERROR: 2,
};

const minDurationLoadingUI = 3000;
let showingLoadingUI = true;

async function waitForLoadingUI() {
	while (showingLoadingUI) {
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       IMPORT STATUS UI FLOW               //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

function showImportStatusUI(status) {
	// Update header (arrow, title, subtitle)
	updateHeaderStatus(status);

	if (status == importStatus.LOADING) {
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
				setTimeout(() => {
					showingLoadingUI = false;
				}, minDurationLoadingUI);
			}
		});
	} else {
		// Show footer for success/error states
		document.body.classList.remove("no-footer");
	}
}

/**
 * Updates all status elements (arrow, title, subtitle)
 * @param {number} status - importStatus enum value
 */
function updateHeaderStatus(status) {
	updateStatusArrow(status);
	updateStatusTitle(status);
	updateStatusSubtitle(status);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       STATUS ARROW / SPINNER              //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

function updateStatusArrow(status) {
	const arrow = document.getElementById("arrow");
	arrow.innerHTML = getStatusArrow(status);
}

function getStatusArrow(status) {
	switch (status) {
		case importStatus.LOADING:
			return `<i class="fa-solid fa-arrow-rotate-right spinner" aria-hidden="true"></i>`;
		case importStatus.SUCCESS:
			return `<i class="fa-solid fa-check" aria-hidden="true"></i>`;
		case importStatus.ERROR:
			return `<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>`;
		default:
			return `<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>`;
	}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       STATUS TITLE & SUBTITLE             //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

function updateStatusTitle(status) {
	const statusTitle = document.querySelector("h1");
	statusTitle.textContent = getStatusMessage(status);
}

function updateStatusSubtitle(status) {
	const subtitle = document.querySelector("h3");
	subtitle.textContent = getStatusSubtitle(status);
}

function getStatusMessage(status) {
	switch (status) {
		case importStatus.LOADING:
			return "Importing schedule";
		case importStatus.SUCCESS:
			return "Import complete!";
		case importStatus.ERROR:
			return "An error occurred";
		default:
			return "An error occurred";
	}
}

function getStatusSubtitle(status) {
	switch (status) {
		case importStatus.LOADING:
			return "Please keep this window open";
		case importStatus.SUCCESS:
			return "Schedule added to Todoist";
		case importStatus.ERROR:
			return "";
		default:
			return "Unknown error";
	}
}
