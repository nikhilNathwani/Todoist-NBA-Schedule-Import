// Local development server - NOT used in production
// Production uses app.js directly (see vercel.json)

// Load env vars first (local-only since .env.local isn't tracked in git)
if (process.env.NODE_ENV !== "production") {
	const dotenv = await import("dotenv");
	dotenv.config({ path: ".env.local" });
}

const appModule = await import("./app.js");
const app = appModule.default;
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
	if (process.env.NODE_ENV === "production") {
		console.log(`Server running on port ${PORT}`);
	} else {
		console.log(`Server running on http://localhost:${PORT}`);
	}
});
