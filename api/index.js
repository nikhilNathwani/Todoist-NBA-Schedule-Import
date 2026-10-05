// Vercel deployment entry point -- not application code.
//
// Vercel runs a project's server code as "serverless functions", and it
// finds them by looking for files in a top-level folder that must be named
// api/. This file hands Vercel the whole Express app (app.js) as a single
// function, and vercel.json sends every request (pages included, not just
// /api/... URLs) to it. All routing then happens inside Express, exactly as
// when server.js runs it locally.
//
// Not to be confused with app/routes/api/, which holds this app's own JSON
// endpoints (e.g. POST /api/import-schedule).
import app from "../app.js";
export default app;
