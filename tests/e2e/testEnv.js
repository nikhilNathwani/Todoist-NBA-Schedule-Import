// Environment for the browser tests' own server (see playwright.config.js).
// Test-only secrets: the server never reads .env.local, so a run can't touch
// real credentials, and the tests can make session cookies it accepts.
// Demo mode is on so every Todoist call can be stood in for (see the demo
// parameters in app/routes/setup.js); the fake token is never sent anywhere.
export const PORT = 3100;
export const BASE_URL = `http://localhost:${PORT}`;

export const E2E_ENV = {
	PORT: String(PORT),
	CLIENT_ID: "e2e-client-id",
	CLIENT_SECRET: "e2e-client-secret",
	REDIRECT_URI: `${BASE_URL}/auth/callback`,
	COOKIE_SECRET: "e2e-cookie-secret",
	ENCRYPTION_KEY: "e2e-encryption-key-at-least-32-characters",
	ENABLE_ERROR_DEMO: "true",
};
