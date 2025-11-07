/**
 * Team Logo Management
 * Handles the NBA team logo and banner animations in the header
 */

function updateTeamLogo(teamID) {
	const teamLogo = document
		.getElementById("nbaLogoContainer")
		.querySelector("img");
	teamLogo.src = `images/team-logos/${teamID}.svg`;
	teamLogo.alt = `Selected Team (${teamID}) Logo`;
}

function growLogoBanner() {
	const logoBanner = document.querySelector(".logo-banner");
	logoBanner.classList.add("logo-banner-large");
}
