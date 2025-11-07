/**
 * Import Status Management
 * Handles the import status UI flow:
 * - Status arrow, title, subtitle updates
 * - Coordinating UI transitions during import
 */

const importStatus = {
	LOADING: 0,
	SUCCESS: 1,
	ERROR: 2,
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       IMPORT STATUS UI FLOW               //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

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
