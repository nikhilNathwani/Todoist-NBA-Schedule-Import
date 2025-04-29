const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const schedulePath = path.join(__dirname, "../data/nba_schedule.json");

router.get("/teams", async (req, res) => {
	try {
		const data = await fs.readFile(schedulePath, "utf-8");
		const nbaSchedule = JSON.parse(data);

		// Map the data to the desired structure
		const teamData = {};
		for (const [abbrev, teamInfo] of Object.entries(nbaSchedule)) {
			teamData[abbrev] = teamInfo.name;
		}

		res.json(teamData);
	} catch (err) {
		console.error("Error reading nba_schedule.json for team names:", err);
		res.status(500).json({ error: "Failed to load team data." });
	}
});

router.get("/lastGameTime", async (req, res) => {
	try {
		const data = await fs.readFile(schedulePath, "utf-8");
		const nbaSchedule = JSON.parse(data);

		// Map the data to the desired structure
		var lastGameTime= new Date("2021-04-13T19:30:00+00:00");

		for (const [abbrev, teamInfo] of Object.entries(nbaSchedule)) {
			const numGames= teamInfo["schedule"].length;
			const teamLastGameTimeString= teamInfo["schedule"][numGames-1]["dateTime"];
			const teamLastGameTime= new Date(teamLastGameTimeString);
			if (teamLastGameTime > lastGameTime) {
				lastGameTime= teamLastGameTime;
			}
		}
		console.log(`Last game time: ${lastGameTime}`);
		res.json(lastGameTime);
	} catch (err) {
		console.error("Error reading nba_schedule.json for last game time:", err);
		res.status(500).json({ error: "Failed to get lastGameTime data." });
	}
});

module.exports = router;
