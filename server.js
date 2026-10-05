// Local development server - NOT used in production
// Production (Vercel) serves app.js through api/index.js (see vercel.json)

// Env vars come from .env.local, loaded by Node itself before this file runs
// (`node --env-file`, see the "dev"/"start" scripts in package.json)
import app from "./app.js";

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
