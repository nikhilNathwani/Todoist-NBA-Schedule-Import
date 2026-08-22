// oauthState.ts -- OAuth CSRF-protection nonce, generated fresh per login
// attempt and stashed in a short-lived cookie until the callback needs it.
//
// Replaces the previous design (a single fixed STATE_SECRET env var sent as
// `state` on every login, compared literally on callback) with a real
// nonce. The old design proved "this callback came from someone who knows
// STATE_SECRET" -- effectively a second permanent secret, not a per-request
// proof, and only protected until that one value ever leaked once. This
// proves "this callback corresponds to a login this browser initiated a
// moment ago" instead, which is what OAuth's `state` param is for. See
// KNOWN_ISSUES.md's (now-resolved) item #1 for the full writeup.

import { cookies } from "next/headers";

export const OAUTH_STATE_COOKIE_NAME = "oauth_state";

// Short-lived: only needs to survive the redirect out to Todoist's consent
// screen and back, normally seconds. 10 minutes is generous headroom for a
// slow consent screen, not a real session lifetime.
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

// Generates a fresh random value, stores it in a short-lived httpOnly
// cookie, and returns it for the caller (the login route) to embed as the
// `state` query param sent to Todoist.
export async function createOAuthState(): Promise<string> {
	const state = crypto.randomUUID();
	const cookieStore = await cookies();
	cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
		httpOnly: true,
		secure: true,
		sameSite: "lax", // same reasoning as the session cookie -- see lib/cookieSession.ts
		maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
		path: "/",
	});
	return state;
}

// Compares the `state` Todoist sent back on the callback against the value
// stashed in the cookie, then clears the cookie either way -- it's single-
// use, valid for exactly one login attempt. Returns true only if a cookie
// value was actually present and it matches.
export async function verifyAndClearOAuthState(
	receivedState: string | null,
): Promise<boolean> {
	const cookieStore = await cookies();
	const expected = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
	cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
	return Boolean(expected) && receivedState === expected;
}
