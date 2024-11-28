const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const schedulePath = path.join(__dirname, "../data/nba_schedule.json");

router.get("/", async (req, res) => {
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
		console.error("Error reading nba_schedule.json:", err);
		res.status(500).json({ error: "Failed to load team data." });
	}
});

module.exports = router;
