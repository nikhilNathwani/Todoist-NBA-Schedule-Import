const submitButton = document.getElementById("submitButton");
const teamLogo = document
	.getElementById("nbaLogoContainer")
	.querySelector("img");

let teamNames = null; // Will be populated dynamically

// Fetch team data from the /api/teams route
fetchTeamData();

async function fetchTeamData() {
	try {
		const response = await fetch("/api/teams");
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		teamNames = await response.json();
	} catch (error) {
		console.error("Failed to fetch team data:", error);
		teamNames = {}; // Fallback to empty object in case of error
	}
}

// // Wait for the DOM to load before fetching the data
// document.addEventListener("DOMContentLoaded", () => {
// 	fetchTeamData();
// });

const newProjectSubtitle = document
	.getElementById("newProject")
	.querySelector("small");

function enableSubmitButton() {
	submitButton.disabled = false;
}

function updateTeamSpecificUI(selectedTeam) {
	updateTeamLogo(selectedTeam);
	updateNewProjectSubtitle(selectedTeam);
}

function updateTeamLogo(selectedTeam) {
	teamLogo.src = `images/team-logos/${selectedTeam}.svg`;
	teamLogo.alt = `Selected Team (${selectedTeam}) Logo`;
}

function updateNewProjectSubtitle(selectedTeam) {
	if (!isInboxDefault()) {
		newProjectSubtitle.textContent = `Import games into a new Todoist project called "${
			!teamNames ? "[team name]" : teamNames[selectedTeam]
		} schedule"`;
	}
}

function isInboxDefault() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get("isInboxDefault") !== "false";
}

function growLogoBanner() {
	const logoBanner = document.querySelector(".logo-banner");
	logoBanner.classList.add("logo-banner-large");
}
