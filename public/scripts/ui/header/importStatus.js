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
//       STATUS CONFIGURATION                //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

const STATUS_CONFIG = {
	[importStatus.LOADING]: {
		arrow: '<i class="fa-solid fa-arrow-rotate-right spinner" aria-hidden="true"></i>',
		title: "Importing schedule",
		subtitle: "Please keep this window open",
	},
	[importStatus.SUCCESS]: {
		arrow: '<i class="fa-solid fa-check" aria-hidden="true"></i>',
		title: "Import complete!",
		subtitle: "Schedule added to Todoist",
	},
	[importStatus.ERROR]: {
		arrow: '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>',
		title: "An error occurred",
		subtitle: "",
	},
};

/**
 * Updates all status elements (arrow, title, subtitle)
 * @param {number} status - importStatus enum value
 */
function updateHeaderStatus(status) {
	const config = STATUS_CONFIG[status];

	if (config) {
		document.getElementById("arrow").innerHTML = config.arrow;
		document.querySelector("h1").textContent = config.title;
		document.querySelector("h3").textContent = config.subtitle;
	} else {
		console.warn(
			`Invalid status: ${status}. Expected 0 (LOADING), 1 (SUCCESS), or 2 (ERROR).`
		);
	}
}
