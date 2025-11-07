// Local development server - NOT used in production
// Production uses app.js directly (see vercel.json)
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

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
