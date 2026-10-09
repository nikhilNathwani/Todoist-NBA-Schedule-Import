import { defineConfig } from "@playwright/test";
import { BASE_URL, E2E_ENV } from "./tests/e2e/testEnv.js";

// Browser tests (npm run test:e2e): the real app in a real browser, for what
// the Vitest suite can't see -- the browser scripts in public/scripts/ and
// how the pages behave across a form post, a redirect, refresh and Back.
export default defineConfig({
	testDir: "tests/e2e",
	// Retry once on CI only, so a one-off timing hiccup doesn't fail the build
	retries: process.env.CI ? 1 : 0,
	use: {
		baseURL: BASE_URL,
		// The installed Google Chrome (GitHub's Ubuntu runners have it too),
		// so there's no separate browser download
		channel: "chrome",
	},
	webServer: {
		command: "node server.js",
		url: BASE_URL,
		env: E2E_ENV,
		// Always its own server: never a dev server running on real secrets
		reuseExistingServer: false,
	},
});
