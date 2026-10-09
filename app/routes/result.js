import express from "express";
import { getImportResult } from "../utils/cookieSession.js";
import { getTeams } from "../utils/parseSchedule.js";
import { makeResultPageHTML } from "../views/result.js";

const router = express.Router();

// Show how the last import went. POST /setup saves the outcome in the
// session (saveImportResult) and redirects here, so refreshing this page
// re-reads the outcome instead of re-running the import.
router.get("/", async (req, res) => {
	const result = getImportResult(req);
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
