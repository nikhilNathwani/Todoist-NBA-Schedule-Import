import express from "express";
import { getTeams } from "../utils/parseSchedule.js";
import { makeResultPageHTML } from "../views/result.js";

const router = express.Router();

// Show how the last import went. POST /setup saves the outcome in the
// session and redirects here, so refreshing this page re-reads the outcome
// instead of re-running the import. It stays in the session until the next
// import replaces it.
router.get("/", async (req, res) => {
	const result = req.session.importResult;
	if (!result) {
		// Nothing imported yet in this session
		return res.redirect("/setup");
	}

	// The team ID came from the form, so only use it for the logo if it's a
	// real team
	let teamID;
	try {
		const teams = await getTeams();
		if (Object.hasOwn(teams, result.teamID)) teamID = result.teamID;
	} catch {
		// No team logo then; the page works without it
	}

	res.send(makeResultPageHTML(result, teamID));
});

export default router;
