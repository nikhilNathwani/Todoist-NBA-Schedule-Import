import { NextResponse } from "next/server";

// Ported from app/routes/auth/login.js (now removed). Redirects to Todoist
// for OAuth authorization -- logic unchanged.
export async function GET() {
	const { CLIENT_ID, REDIRECT_URI, STATE_SECRET } = process.env;
	const authUrl = `https://todoist.com/oauth/authorize?client_id=${CLIENT_ID}&scope=data:read_write&state=${STATE_SECRET}&redirect_uri=${REDIRECT_URI}`;
	return NextResponse.redirect(authUrl);
}
