import { NextResponse } from "next/server";
import { createOAuthState } from "@/lib/oauthState";

// Ported from app/routes/auth/login.js (now removed), then hardened: the
// `state` param is now a fresh per-request nonce (lib/oauthState.ts)
// instead of a static secret -- see KNOWN_ISSUES.md's former item #1.
export async function GET() {
	const { CLIENT_ID, REDIRECT_URI } = process.env;
	const state = await createOAuthState();
	const authUrl = `https://todoist.com/oauth/authorize?client_id=${CLIENT_ID}&scope=data:read_write&state=${state}&redirect_uri=${REDIRECT_URI}`;
	return NextResponse.redirect(authUrl);
}
