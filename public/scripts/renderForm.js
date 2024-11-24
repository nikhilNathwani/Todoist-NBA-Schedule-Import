const submitButton = document.getElementById("submitButton");
const teamLogo = document
	.getElementById("nbaLogoContainer")
	.querySelector("img");
const teamNames = {
	ATL: "Hawks",
	BOS: "Celtics",
	BKN: "Nets",
	CHA: "Hornets",
	CHI: "Bulls",
	CLE: "Cavaliers",
	DAL: "Mavericks",
	DEN: "Nuggets",
	DET: "Pistons",
	GS: "Warriors",
	HOU: "Rockets",
	IND: "Pacers",
	LAC: "Clippers",
	LAL: "Lakers",
	MEM: "Grizzlies",
	MIA: "Heat",
	MIL: "Bucks",
	MIN: "Timberwolves",
	NO: "Pelicans",
	NY: "Knicks",
	OKC: "Thunder",
	ORL: "Magic",
	PHI: "Sixers",
	PHO: "Suns",
	POR: "Trailblazers",
	SAC: "Kings",
	SA: "Spurs",
	TOR: "Raptors",
	UTA: "Jazz",
	WAS: "Wizards",
};
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
		newProjectSubtitle.textContent = `Import games into a new Todoist project called "${teamNames[selectedTeam]} schedule"`;
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
