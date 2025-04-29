/* External imports */
const express = require("express");
const cookieSession = require("cookie-session");
const path = require("path");
/* Internal imports */
const parseScheduleRoutes = require("./routes/parseSchedule");
const pagesRoutes = require("./routes/pages");
const { router: importGamesRoutes } = require("./routes/importGames");
const oauthRoutes = require("./routes/oauth");

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
		sameSite: "Strict", // Mitigates CSRF attacks
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
app.use("/api/schedule", parseScheduleRoutes);
app.use("/api", importGamesRoutes);
app.use("/", pagesRoutes);

module.exports = app;
