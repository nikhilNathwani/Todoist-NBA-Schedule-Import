/* External imports */
import express from "express";
import cookieSession from "cookie-session";
import path from "path";
import { fileURLToPath } from "url";
/* Internal imports */
// Routers: each handles the path it's mounted at in "Mount routes" below
import indexPageRouter from "./app/routes/pages/index.js";
import setupPageRouter from "./app/routes/pages/setup.js";
import loginRouter from "./app/routes/auth/login.js";
import callbackRouter from "./app/routes/auth/callback.js";
import setupApiRouter from "./app/routes/api/setup.js";
// Views
import { makeNotFoundPageHTML } from "./app/views/errorPage.js";

/* ~~~~~~~~~~~~~~~~~~~~~~~~~ */
/*                           */
/*    App Configurations     */
/*                           */
/* ~~~~~~~~~~~~~~~~~~~~~~~~~ */
const app = express();

// Cookie-session configuration
// cookie-session needs a secret to sign the cookie and fails with a vague
// ".keys required" without one; name the missing env var instead
if (!process.env.COOKIE_SECRET) {
	throw new Error("COOKIE_SECRET environment variable is not set");
}
app.set("trust proxy", 1); // Trust the Vercel proxy
app.use(
	cookieSession({
		name: "session",
		secret: process.env.COOKIE_SECRET,
		maxAge: 60 * 60 * 1000, // 1 hour
		httpOnly: true, // Prevents client-side JS from accessing the cookie
		// `secure` is left to cookie-session's default: Secure (HTTPS-only)
		// whenever the request came over HTTPS, which on Vercel is always
		// ("trust proxy" above lets Express see that). Hard-coding
		// `secure: true` made the cookies library silently refuse to set the
		// cookie at all over plain http://localhost, so local login failed
		// with "State mismatch".
		// sameSite: "Strict", // Mitigates CSRF attacks
		sameSite: "Lax", // Necessary because Strict blocks cookie from getting passed to /setup as part of the redirect chain from todoist's auth flow
	}),
);

// Serve static files from public folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticPathRoot = path.join(__dirname, "public");
app.use(express.static(staticPathRoot));

// Middleware to parse request bodies (for POST requests)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes: each router is mounted at the path it serves
app.use("/", indexPageRouter); // GET / (landing page)
// Login (OAuth)
app.use("/auth/login", loginRouter); // GET /auth/login
app.use("/auth/callback", callbackRouter); // GET /auth/callback
// The setup page: GET shows the team and project picker; the page's
// JavaScript POSTs the choice back to the same path, which runs the import
// and answers in JSON
app.use("/setup", setupPageRouter); // GET /setup
app.use("/setup", setupApiRouter); // POST /setup

// Anything no route above matched: a real 404, not the landing page
app.use((req, res) => {
	res.status(404).send(makeNotFoundPageHTML());
});

export default app;
