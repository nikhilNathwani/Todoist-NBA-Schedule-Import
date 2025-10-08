/* External imports */
require("dotenv").config({ path: ".env.local" });
const express = require("express");
const cookieSession = require("cookie-session");
const path = require("path");
/* Internal imports */
const teamsRoutes = require("./app/routes/teams");
const pagesRoutes = require("./app/routes/pages");
const { router: importGamesRoutes } = require("./app/routes/importGames");
const oauthRoutes = require("./app/routes/oauth");

/* ~~~~~~~~~~~~~~~~~~~~~~~~~ */
/*                           */
/*    App Configurations     */
/*                           */
/* ~~~~~~~~~~~~~~~~~~~~~~~~~ */
const app = express();

// Cookie-session configuration
app.set("trust proxy", 1); // Trust the Vercel proxy
app.use(
	cookieSession({
		name: "session",
		secret: process.env.COOKIE_SECRET,
		maxAge: 24 * 60 * 60 * 1000, // 24 hours
		httpOnly: true, // Prevents client-side JS from accessing the cookie
		secure: true, // Only HTTPS not HTTP
		// sameSite: "Strict", // Mitigates CSRF attacks
		sameSite: "Lax", // Necessary because Strict blocks cookie from getting passed to configure-import as part of the redirect chain from todoist's auth flow
	})
);

// Serve static files from public folder
const staticPathRoot = path.join(__dirname, "public");
app.use(express.static(staticPathRoot));

// Middleware to parse request bodies (for POST requests)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the routes I defined
app.use("/api/auth", oauthRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api", importGamesRoutes);
app.use("/", pagesRoutes);

module.exports = app;
