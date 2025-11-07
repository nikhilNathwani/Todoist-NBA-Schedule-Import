import express from "express";
import { saveAccessToken } from "../../utils/cookieSession.js";
import { retrieveAccessToken } from "../../utils/todoist.js";

const router = express.Router();
const { STATE_SECRET } = process.env;

// Handle the OAuth callback from Todoist
router.get("/callback", async (req, res) => {
	const { code, state } = req.query;

	// Verify the state parameter to prevent CSRF attacks
	if (state !== STATE_SECRET) {
		return res.status(403).send("State mismatch! Potential CSRF attack.");
	}

	try {
		// Retrieve and store encrypted access token in session cookie
		const accessToken = await retrieveAccessToken(code);
		saveAccessToken(req, accessToken);
		// Redirect to the team selection page
		res.redirect(`/configure-import`);
	} catch (error) {
		handleOAuthError(error, res);
	}
});

export default router;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//          HELPER FUNCTIONS                 //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Handle OAuth token exchange errors
const handleOAuthError = (error, res) => {
	if (error.response) {
		const { error: errorMessage } = error.response.data;
		if (errorMessage === "bad_authorization_code") {
			return res.status(400).send("Bad authorization code.");
		} else if (errorMessage === "incorrect_application_credentials") {
			return res.status(400).send("Incorrect client credentials.");
		}
	}
	return res.status(500).send("Internal server error during OAuth flow.");
};
