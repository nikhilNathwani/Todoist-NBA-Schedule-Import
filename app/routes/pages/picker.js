import express from "express";
import { getAccessToken } from "../../utils/cookieSession.js";
import { userReachedProjectLimit } from "../../utils/todoist.js";
import { getTeams } from "../../utils/parseSchedule.js";
import { makePickerPageHTML } from "../../views/picker.js";
import { makeErrorPageHTML } from "../../views/errorPage.js";
import { mapTodoistErrorTypeToHttpStatus } from "../../utils/todoistErrors.js";

const router = express.Router();

// Gate: ?mockTodoistError is only honored when this is explicitly enabled
// (see .env.example) -- disabled by default so it can't be triggered on a
// real deployment unless deliberately turned on for a demo.
const ERROR_DEMO_ENABLED = process.env.ENABLE_ERROR_DEMO === "true";

// Serve the team/project picker page
router.get("/", async (req, res) => {
	const mockErrorCode = ERROR_DEMO_ENABLED
		? req.query.mockTodoistError
		: undefined;

	// No valid session (never logged in, or the 1-hour cookie expired):
	// send them to the start page to log in, rather than an error page
	let accessToken;
	try {
		accessToken = await getAccessToken(req);
	} catch {
		return res.redirect("/");
	}

	try {
		// The tier check (a Todoist API call) and the team list (a local
		// file read) don't depend on each other, so run them in parallel
		const [reachedLimit, teams] = await Promise.all([
			userReachedProjectLimit(accessToken, mockErrorCode),
			getTeams(),
		]);
		const html = await makePickerPageHTML(!reachedLimit, teams);
		res.send(html);
	} catch (error) {
		console.error("Error rendering picker page:", error);
		if (error.todoistErrorType) {
			const status = mapTodoistErrorTypeToHttpStatus(error.todoistErrorType);
			return res.status(status).send(makeErrorPageHTML(error));
		}
		res.status(500).send("An error occurred");
	}
});

export default router;
