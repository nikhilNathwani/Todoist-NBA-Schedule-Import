const fs = require("fs").promises;
const path = require("path");

// Path to the NBA schedule JSON file
const schedulePath = path.join(__dirname, "../data/nba_schedule.json");

//returns 1) true/false indicating whether season is over,
//        2) the end-year of the season in question
async function isSeasonOver() {
	try {
		const finalGameDateTime = await getFinalGameTime();
		const seasonEndYear = finalGameDateTime.getFullYear();
		const now = new Date();
		return {
			isSeasonOverBool: now > finalGameDateTime,
			seasonEndYear: seasonEndYear,
		};
	} catch (error) {
		console.error("Failed to fetch team data:", error);
		return {
			isSeasonOverBool: false,
			seasonEndYear: 0,
		};
	}
}

// Utility function to read and parse the JSON file
async function getSchedule() {
	try {
		const data = await fs.readFile(schedulePath, "utf-8");
		return JSON.parse(data); // Parse the JSON and return it
	} catch (err) {
		console.error("Error reading nba_schedule.json:", err);
		throw new Error("Failed to read and parse schedule data");
	}
}

async function getTeams() {
	try {
		const nbaSchedule = await getSchedule();
		const teamNames = {};
		for (const [teamId, teamData] of Object.entries(nbaSchedule)) {
			teamNames[teamId] = teamData.name;
		}
		return teamNames;
	} catch (err) {
		console.error("Error reading nba_schedule.json for team names:", err);
		throw new Error("Failed to get team names");
	}
}

async function getFinalGameTime() {
	try {
		const nbaSchedule = await getSchedule();

		//Inital finalGameTime set to arbitrary date in the past
		var finalGameTime = new Date("2021-04-13T19:30:00+00:00");

		for (const [teamId, teamData] of Object.entries(nbaSchedule)) {
			const numGames = teamData["schedule"].length;
			const teamFinalGameTimeString =
				teamData["schedule"][numGames - 1]["gameTimeUtcIso8601"];
			const teamFinalGameTime = new Date(teamFinalGameTimeString);
			if (teamFinalGameTime > finalGameTime) {
				finalGameTime = teamFinalGameTime;
			}
		}
		// console.log(`Final game time: ${finalGameTime}`);
		return finalGameTime;
	} catch (err) {
		console.error(
			"Error reading nba_schedule.json for final game time:",
			err
		);
		throw new Error("Failed to get finalGameTime data");
	}
}

module.exports = { getTeams, isSeasonOver };
