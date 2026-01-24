// Local development server - NOT used in production
// Production uses app.js directly (see vercel.json)

// Load env vars first (local-only since .env.local isn't tracked in git)
if (process.env.NODE_ENV !== "production") {
	import("dotenv").then((dotenv) => dotenv.config({ path: ".env.local" }));
}

import app from "./app.js";
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
	if (process.env.NODE_ENV === "production") {
		console.log(`Server running on port ${PORT}`);
	} else {
		console.log(`Server running on http://localhost:${PORT}`);
	}
});
