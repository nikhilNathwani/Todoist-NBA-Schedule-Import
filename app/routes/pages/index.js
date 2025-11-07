import express from "express";
import { makeLandingPageHTML } from "../../views/index.js";

const router = express.Router();

// Serve the landing page (login page)
router.get("/", async (req, res) => {
	const html = await makeLandingPageHTML();
	res.send(html);
});

// TEST ROUTE: Force season over UI for testing
router.get("/test-season-over", async (req, res) => {
	console.log("DEBUG - /test-season-over route hit!");
	const html = await makeLandingPageHTML(true);
	res.send(html);
});

// Catch-all route: redirect to landing page
router.get("*", async (req, res) => {
	const html = await makeLandingPageHTML();
	res.send(html);
});

export default router;
