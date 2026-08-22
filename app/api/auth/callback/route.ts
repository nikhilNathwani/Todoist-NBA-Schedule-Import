import { NextRequest, NextResponse } from "next/server";
import { saveAccessToken } from "@/lib/cookieSession";
import { retrieveAccessToken } from "@/lib/todoist";
import { isClassifiedTodoistError } from "@/lib/todoistErrors";
import { verifyAndClearOAuthState } from "@/lib/oauthState";

// Ported from app/routes/auth/callback.js (now removed). Handles the OAuth
// callback from Todoist -- logic unchanged except the CSRF state check now
// compares against the per-request nonce from lib/oauthState.ts instead of
// a static secret (see KNOWN_ISSUES.md's former item #1). The
// OAuth-error-reason mapping below is otherwise unchanged.
//
// This is the ONE place `saveAccessToken` (lib/cookieSession.ts) is called
// in the whole app -- see NEXTJS_MIGRATION_HANDOFF.md for the cookie-security
// writeup and the tests proving the cookie this sets has the right
// attributes (tests/route/callback.test.ts).
export async function GET(request: NextRequest) {
	const code = request.nextUrl.searchParams.get("code");
	const state = request.nextUrl.searchParams.get("state");

	// Verify the state parameter against the nonce /api/auth/login stashed
	// in a cookie, to prevent CSRF attacks
	if (!(await verifyAndClearOAuthState(state))) {
		return new NextResponse("State mismatch! Potential CSRF attack.", {
			status: 403,
		});
	}

	try {
		// Retrieve and store encrypted access token in session cookie
		const accessToken = await retrieveAccessToken(code ?? "");
		await saveAccessToken(accessToken);
		// Redirect to the team selection page
		return NextResponse.redirect(new URL("/configure-import", request.url));
	} catch (error) {
		return handleOAuthError(error);
	}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//          HELPER FUNCTIONS                 //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

// Handle OAuth token exchange errors.
//
// Note (carried over from the original file): before that file's
// error-handling pass, this function checked `error.response.data.error` --
// but retrieveAccessToken never threw an error shaped with a `.response`
// property (it used a plain Error from a raw `fetch` call), so the two
// specific-reason branches below were dead code; every OAuth failure fell
// through to the generic 500. Fixed by having retrieveAccessToken
// (lib/todoist.ts) attach `.responseData` (Todoist's parsed OAuth error
// body) to the classified error it throws.
export function handleOAuthError(error: unknown): NextResponse {
	const responseData = isClassifiedTodoistError(error)
		? error.responseData
		: undefined;
	const reason = (responseData as { error?: string } | undefined)?.error;

	if (reason === "bad_authorization_code") {
		return new NextResponse(
			"Bad authorization code. Please try logging in again.",
			{ status: 400 },
		);
	}
	if (reason === "incorrect_application_credentials") {
		return new NextResponse("Incorrect client credentials.", { status: 400 });
	}

	// Fall back to the general classification for anything else Todoist's
	// OAuth endpoint can return (rate limiting, an outage, etc). Only
	// escalate to 502 (upstream failed) when we actually know Todoist
	// returned a status code -- and only then is the error's message safe to
	// show, since it's the classifier's deliberately user-facing text. A
	// bare, unclassified error (no httpStatusCode at all) means something
	// broke on our side; keep that response generic rather than leaking a
	// raw internal error message, and treat it as a 500, not a 502.
	if (!isClassifiedTodoistError(error) || !error.httpStatusCode) {
		return new NextResponse("Internal server error during OAuth flow.", {
			status: 500,
		});
	}
	const status = error.httpStatusCode === 429 ? 429 : 502;
	return new NextResponse(error.message, { status });
}
