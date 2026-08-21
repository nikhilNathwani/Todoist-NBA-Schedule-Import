// cookieSession.ts -- session cookie read/write, ported from
// app/utils/cookieSession.js (now removed) onto next/headers' `cookies()` API.
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// SECURITY-CRITICAL -- read this before touching anything in this file.
// See NEXTJS_MIGRATION_HANDOFF.md ("Cookie-security preservation") for the
// full writeup of what was preserved exactly and what deliberately changed.
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// ORIGINAL (Express) design had two layers:
//   1. `cookie-session` middleware: wrapped the whole session object in a
//      base64 JSON envelope, HMAC-signed with COOKIE_SECRET (integrity only,
//      NOT encryption -- the envelope itself is readable, just tamper-evident).
//   2. Inside that envelope, the access token itself was separately sealed
//      with @hapi/iron using ENCRYPTION_KEY (this IS real encryption + its
//      own built-in HMAC).
//
// NEW (Next.js) design collapses this to one layer: the cookie's value is
// directly the Iron-sealed token (same `encrypt`/`decrypt` from
// ./encryption.ts, same ENCRYPTION_KEY env var, byte-for-byte identical
// sealing behavior). There is no more outer cookie-session envelope, because
// `cookie-session` is an Express-specific package this app no longer uses --
// next/headers' `cookies()` API sets/reads cookies directly, and doesn't
// need (or provide) an app-level "sign this whole envelope" secret the way
// cookie-session did.
//
// This is a deliberate, documented simplification, not an oversight:
// Iron's seal format already includes its own authentication tag, so the
// cookie is just as tamper-evident and just as encrypted as before --
// dropping the outer HMAC layer removes redundant, not load-bearing,
// protection. The practical effect: COOKIE_SECRET is no longer read
// anywhere in this codebase. It's left defined in .env.example /
// tests/setup/env.js for now (harmless if set) rather than ripped out, in
// case Nikhil wants to restore the double-signed envelope for exact parity
// -- flagged explicitly in the handoff doc rather than silently dropped.
//
// Cookie attributes below are preserved EXACTLY from app.js's cookie-session
// config: httpOnly, secure, sameSite: 'lax' (specifically lax, not strict --
// see the comment on SAME_SITE below), and a 1-hour maxAge. The one
// unit-conversion trap called out in the task brief: cookie-session's
// maxAge is in **milliseconds** (60 * 60 * 1000); next/headers' cookies()
// `maxAge` option is in **seconds**. SESSION_MAX_AGE_SECONDS below is
// therefore 3600, not 3600000 -- getting this wrong would silently make
// sessions expire either 1000x too fast or (if seconds were mistaken for ms
// the other direction) live far longer than 1 hour.

import { cookies } from "next/headers";
import { encrypt, decrypt } from "./encryption";

export const SESSION_COOKIE_NAME = "session";

// 1 hour, in SECONDS (next/headers cookies().set() maxAge unit) -- NOT the
// 60 * 60 * 1000 milliseconds the original cookie-session config used.
export const SESSION_MAX_AGE_SECONDS = 60 * 60;

// sameSite: 'lax', specifically NOT 'strict'. Preserved from app.js's
// commented-out history: 'strict' was tried first and broke the session
// cookie being sent back on the redirect Todoist issues back to
// /api/auth/callback (and then on to /configure-import) after OAuth login --
// a real, hard-won debugging finding (13+ commits in the original repo).
// Do not "fix" this to 'strict'.
const SAME_SITE = "lax" as const;

export interface SessionCookieOptions {
	httpOnly: true;
	secure: true;
	sameSite: "lax";
	maxAge: number;
	path: "/";
}

export function sessionCookieOptions(): SessionCookieOptions {
	return {
		httpOnly: true,
		secure: true,
		sameSite: SAME_SITE,
		maxAge: SESSION_MAX_AGE_SECONDS,
		path: "/",
	};
}

// Encrypts accessToken and writes it to the session cookie on the current
// response. Only callable from a Route Handler or Server Action (anywhere
// next/headers' cookies().set() is permitted) -- NOT from a Server Component
// render, which can only read cookies.
export async function saveAccessToken(accessToken: string): Promise<void> {
	const encryptedToken = await encrypt(accessToken);
	const cookieStore = await cookies();
	cookieStore.set(SESSION_COOKIE_NAME, encryptedToken, sessionCookieOptions());
}

// Reads and decrypts the access token from the session cookie.
// Throws if the cookie is absent, or if it's present but fails to decrypt
// (tampered, expired past Iron's own TTL, wrong ENCRYPTION_KEY, etc) --
// callers treat either case as "not authenticated", matching the original
// behavior where a missing/bad session simply threw.
export async function getAccessToken(): Promise<string> {
	const cookieStore = await cookies();
	const encryptedToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
	if (!encryptedToken) {
		throw new Error("Access token is not set in the session.");
	}
	try {
		return await decrypt(encryptedToken);
	} catch {
		throw new Error("Access token in session is invalid or could not be decrypted.");
	}
}
