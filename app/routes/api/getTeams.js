import express from "express";
import { getTeams } from "../../utils/parseSchedule.js";

const router = express.Router();

router.get("/get-teams", async (req, res) => {
	try {
		const teamNames = await getTeams();
		res.json(teamNames);
	} catch (err) {
		console.error("Error retrieving team names:", err);
		res.status(500).json({ error: "Failed to retrieve team names." });
	}
});

export default router;
