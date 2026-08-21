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
		await saveAccessToken(req, accessToken);
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

// Handle OAuth token exchange errors.
//
// Note: before this file's error-handling pass, this function checked
// `error.response.data.error` -- but retrieveAccessToken never threw an
// error shaped with a `.response` property (it used a plain Error from a
// raw `fetch` call), so the two specific-reason branches below were dead
// code; every OAuth failure fell through to the generic 500. Fixed by
// having retrieveAccessToken (app/utils/todoist.js) attach `.responseData`
// (Todoist's parsed OAuth error body) to the classified error it throws.
const handleOAuthError = (error, res) => {
	const reason = error.responseData?.error;
	if (reason === "bad_authorization_code") {
		return res
			.status(400)
			.send("Bad authorization code. Please try logging in again.");
	}
	if (reason === "incorrect_application_credentials") {
		return res.status(400).send("Incorrect client credentials.");
	}

	// Fall back to the general classification for anything else Todoist's
	// OAuth endpoint can return (rate limiting, an outage, etc). Only
	// escalate to 502 (upstream failed) when we actually know Todoist
	// returned a status code -- and only then is `error.message` safe to
	// show, since it's the classifier's deliberately user-facing text. A
	// bare, unclassified error (no httpStatusCode at all) means something
	// broke on our side; keep that response generic rather than leaking a
	// raw internal error message, and treat it as a 500, not a 502.
	if (!error.httpStatusCode) {
		return res.status(500).send("Internal server error during OAuth flow.");
	}
	const status = error.httpStatusCode === 429 ? 429 : 502;
	return res.status(status).send(error.message);
};
