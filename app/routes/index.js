import express from "express";
import { makeLandingPageHTML } from "../views/index.js";
import { makeSeasonOverHTML } from "../views/seasonOver.js";
import { isSeasonOver } from "../utils/parseSchedule.js";

const router = express.Router();

// Serve the landing page (login page or season over page)
router.get("/", async (req, res) => {
	const { isSeasonOverBool, seasonEndYear } = await isSeasonOver();
	const html = isSeasonOverBool
		? makeSeasonOverHTML(seasonEndYear)
		: makeLandingPageHTML();
	res.send(html);
});

// Debug routes to preview either landing page regardless of today's date.
// Not registered in production (Vercel sets NODE_ENV=production).
if (process.env.NODE_ENV !== "production") {
	// TEST ROUTE: Force season on UI for testing
	router.get("/test-season-on", async (req, res) => {
		console.log("DEBUG - /test-season-on route hit!");
		const html = makeLandingPageHTML();
		res.send(html);
	});

	// TEST ROUTE: Force season over UI for testing
	router.get("/test-season-over", async (req, res) => {
		console.log("DEBUG - /test-season-over route hit!");
		const { seasonEndYear } = await isSeasonOver();
		const html = makeSeasonOverHTML(seasonEndYear);
		res.send(html);
	});
}

export default router;
