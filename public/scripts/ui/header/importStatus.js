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
//       HELPER FUNCTIONS               //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

function updateStatusArrow(status) {
	const arrow = document.getElementById("arrow");

	switch (status) {
		case importStatus.LOADING:
			arrow.innerHTML = `<i class="fa-solid fa-arrow-rotate-right spinner" aria-hidden="true"></i>`;
			break;
		case importStatus.SUCCESS:
			arrow.innerHTML = `<i class="fa-solid fa-check" aria-hidden="true"></i>`;
			break;
		case importStatus.ERROR:
			arrow.innerHTML = `<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>`;
			break;
		default:
			arrow.innerHTML = `<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>`;
	}
}

function updateStatusTitle(status) {
	const statusTitle = document.querySelector("h1");

	switch (status) {
		case importStatus.LOADING:
			statusTitle.textContent = "Importing schedule";
			break;
		case importStatus.SUCCESS:
			statusTitle.textContent = "Import complete!";
			break;
		case importStatus.ERROR:
			statusTitle.textContent = "An error occurred";
			break;
		default:
			statusTitle.textContent = "An error occurred";
	}
}

function updateStatusSubtitle(status) {
	const subtitle = document.querySelector("h3");

	switch (status) {
		case importStatus.LOADING:
			subtitle.textContent = "Please keep this window open";
			break;
		case importStatus.SUCCESS:
			subtitle.textContent = "Schedule added to Todoist";
			break;
		case importStatus.ERROR:
			subtitle.textContent = "";
			break;
		default:
			subtitle.textContent = "Unknown error";
	}
}
