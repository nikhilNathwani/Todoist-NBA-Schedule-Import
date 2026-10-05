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
 * @param {string} [subtitleOverride] - replaces the default subtitle when
 *   provided (used for the ERROR state to show the classified, user-facing
 *   message from the backend instead of a blank subtitle)
 */
function updateHeaderStatus(status, subtitleOverride) {
	const config = STATUS_CONFIG[status];

	if (config) {
		document.getElementById("arrow").innerHTML = config.arrow;
		document.querySelector("h1").textContent = config.title;
		document.querySelector("h3").textContent =
			subtitleOverride || config.subtitle;
	} else {
		console.warn(
			`Invalid status: ${status}. Expected 0 (LOADING), 1 (SUCCESS), or 2 (ERROR).`
		);
	}
}
