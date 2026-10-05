import express from "express";

const router = express.Router();
const { CLIENT_ID, REDIRECT_URI, STATE_SECRET } = process.env;

// Redirect to Todoist for OAuth authorization
router.get("/login", (req, res) => {
	const authUrl = `https://todoist.com/oauth/authorize?client_id=${CLIENT_ID}&scope=data:read_write&state=${STATE_SECRET}&redirect_uri=${REDIRECT_URI}`;
	res.redirect(authUrl);
});

export default router;
