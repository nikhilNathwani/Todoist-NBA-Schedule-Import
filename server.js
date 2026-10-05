// Local development server - NOT used in production
// On Vercel, the platform imports app.js directly and runs the exported app
// (Vercel's built-in Express support, enabled by vercel.json), so this
// file's app.listen() isn't used

// Env vars come from .env.local, loaded by Node itself before this file runs
// (`node --env-file`, see the "dev"/"start" scripts in package.json)
import app from "./app.js";

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
