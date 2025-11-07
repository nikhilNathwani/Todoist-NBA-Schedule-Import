import express from "express";
import { getAccessToken } from "../../utils/cookieSession.js";
import { userReachedProjectLimit } from "../api/importSchedule.js";
import { makePickerPageHTML } from "../../views/picker.js";

const router = express.Router();

// Serve the team/project picker page
router.get("/configure-import", async (req, res) => {
	try {
		const accessToken = getAccessToken(req);
		const isInboxDefault = await userReachedProjectLimit(accessToken);
		const html = await makePickerPageHTML(isInboxDefault);
		res.send(html);
	} catch (error) {
		console.error("Error rendering picker page:", error);
		res.status(500).send("An error occurred");
	}
});

export default router;
