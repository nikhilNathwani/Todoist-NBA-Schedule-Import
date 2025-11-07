/* External imports */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import express from "express";
import cookieSession from "cookie-session";
import path from "path";
import { fileURLToPath } from "url";
/* Internal imports */
import teamsRoutes from "./app/routes/teams.js";
import pagesRoutes from "./app/routes/pages.js";
import { router as importGamesRoutes } from "./app/routes/importGames.js";
import oauthRoutes from "./app/routes/oauth.js";

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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

export default app;
