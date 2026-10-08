import crypto from "node:crypto";
import express from "express";

const router = express.Router();
// "Client" is OAuth's word for this app, not the user
const { CLIENT_ID, REDIRECT_URI } = process.env;

// Redirect to Todoist for OAuth authorization
router.get("/", (req, res) => {
	// CSRF protection: a fresh random state for every login attempt, saved in
	// this browser's session cookie. /callback only accepts a request that
	// echoes back the same value (see callback.js).
	const state = crypto.randomUUID();
	req.session.oauthState = state;

	// URLSearchParams escapes each value, so characters like & or ? in a
	// value can't break the URL
	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		scope: "data:read_write",
		state,
		redirect_uri: REDIRECT_URI,
	});
	res.redirect(`https://todoist.com/oauth/authorize?${params}`);
});

export default router;
