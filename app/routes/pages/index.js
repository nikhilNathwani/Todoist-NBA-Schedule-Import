import express from "express";
import { makeLandingPageHTML } from "../../views/index.js";
import { makeSeasonOverHTML } from "../../views/seasonOver.js";
import { isSeasonOver } from "../../utils/parseSchedule.js";

const router = express.Router();

// Serve the landing page (login page or season over page)
router.get("/", async (req, res) => {
	const { isSeasonOverBool, seasonEndYear } = await isSeasonOver();
	const html = isSeasonOverBool
		? makeSeasonOverHTML(seasonEndYear)
		: makeLandingPageHTML();
	res.send(html);
});

// TEST ROUTE: Force season over UI for testing
router.get("/test-season-over", async (req, res) => {
	console.log("DEBUG - /test-season-over route hit!");
	const { seasonEndYear } = await isSeasonOver();
	const html = makeSeasonOverHTML(seasonEndYear);
	res.send(html);
});

// Catch-all route: redirect to landing page
router.get("*", async (req, res) => {
	const { isSeasonOverBool, seasonEndYear } = await isSeasonOver();
	const html = isSeasonOverBool
		? makeSeasonOverHTML(seasonEndYear)
		: makeLandingPageHTML();
	res.send(html);
});

export default router;
