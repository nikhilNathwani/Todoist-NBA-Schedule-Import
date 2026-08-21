import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// SECURITY-CRITICAL TEST FILE.
// This is the primary evidence for requirement (a) from the migration task:
// "the callback route's response sets a cookie with exactly these
// attributes" (httpOnly, secure, sameSite: 'lax', 1-hour maxAge in
// SECONDS). It exercises the REAL callback route handler and the REAL
// lib/cookieSession.ts + lib/encryption.ts (@hapi/iron) code -- the only
// things mocked are `next/headers` (there's no live Next.js request context
// to back cookies() outside the dev/build/start runtime, so the mock
// supplies an in-memory cookie jar instead) and the network call to
// Todoist's OAuth token endpoint (lib/todoist.ts's retrieveAccessToken).
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const { retrieveAccessTokenMock } = vi.hoisted(() => ({
	retrieveAccessTokenMock: vi.fn(),
}));
vi.mock("@/lib/todoist", () => ({
	retrieveAccessToken: retrieveAccessTokenMock,
}));

function createMockCookieStore() {
	const store = new Map<string, string>();
	return {
		get: vi.fn((name: string) => {
			const value = store.get(name);
			return value === undefined ? undefined : { name, value };
		}),
		set: vi.fn((name: string, value: string, _options?: Record<string, unknown>) => {
			store.set(name, value);
		}),
	};
}

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));

import { GET } from "@/app/api/auth/callback/route";
import { decrypt } from "@/lib/encryption";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/cookieSession";

function callbackRequest(query: string) {
	return new NextRequest(
		`http://localhost:3000/api/auth/callback${query}`,
	);
}

describe("GET /api/auth/callback", () => {
	let cookieStore: ReturnType<typeof createMockCookieStore>;

	beforeEach(() => {
		retrieveAccessTokenMock.mockReset();
		cookieStore = createMockCookieStore();
		cookiesMock.mockReset();
		cookiesMock.mockResolvedValue(cookieStore);
	});

	it("rejects when state does not match (CSRF check)", async () => {
		const response = await GET(
			callbackRequest("?code=abc&state=wrong-state"),
		);

		expect(response.status).toBe(403);
		expect(await response.text()).toContain("State mismatch");
		expect(retrieveAccessTokenMock).not.toHaveBeenCalled();
		expect(cookieStore.set).not.toHaveBeenCalled();
	});

	it("(a) sets the session cookie with exactly the required attributes on success", async () => {
		retrieveAccessTokenMock.mockResolvedValue("real-todoist-access-token");

		const response = await GET(
			callbackRequest("?code=abc&state=test-state-secret"),
		);

		expect(response.status).toBe(307); // NextResponse.redirect default
		expect(response.headers.get("location")).toContain("/configure-import");

		expect(cookieStore.set).toHaveBeenCalledTimes(1);
		const [name, value, options] = cookieStore.set.mock.calls[0];
		expect(name).toBe(SESSION_COOKIE_NAME);
		expect(typeof value).toBe("string");
		expect(value).not.toContain("real-todoist-access-token"); // must be sealed, not plaintext
		expect(options).toMatchObject({
			httpOnly: true,
			secure: true,
			sameSite: "lax", // specifically lax, NOT strict -- see lib/cookieSession.ts
			maxAge: SESSION_MAX_AGE_SECONDS, // 3600 seconds (NOT 3600000ms)
			path: "/",
		});
	});

	it("(b) the cookie value set on success decrypts back to the real access token (same iron round trip)", async () => {
		retrieveAccessTokenMock.mockResolvedValue("real-todoist-access-token");

		await GET(callbackRequest("?code=abc&state=test-state-secret"));

		const [, sealedValue] = cookieStore.set.mock.calls[0];
		await expect(decrypt(sealedValue)).resolves.toBe(
			"real-todoist-access-token",
		);
	});

	it("maps bad_authorization_code to a 400", async () => {
		const err = Object.assign(new Error("OAuth failed"), {
			todoistErrorType: "BAD_REQUEST",
			responseData: { error: "bad_authorization_code" },
		});
		retrieveAccessTokenMock.mockRejectedValue(err);

		const response = await GET(
			callbackRequest("?code=abc&state=test-state-secret"),
		);

		expect(response.status).toBe(400);
		expect(await response.text()).toContain("Bad authorization code");
		expect(cookieStore.set).not.toHaveBeenCalled();
	});

	it("maps a rate-limited OAuth failure to 429", async () => {
		const err = Object.assign(new Error("rate limited"), {
			todoistErrorType: "RATE_LIMITED",
			httpStatusCode: 429,
		});
		retrieveAccessTokenMock.mockRejectedValue(err);

		const response = await GET(
			callbackRequest("?code=abc&state=test-state-secret"),
		);

		expect(response.status).toBe(429);
	});

	it("returns 500 (not 502) for an unclassified error with no httpStatusCode", async () => {
		retrieveAccessTokenMock.mockRejectedValue(new Error("boom"));

		const response = await GET(
			callbackRequest("?code=abc&state=test-state-secret"),
		);

		expect(response.status).toBe(500);
		expect(await response.text()).toContain(
			"Internal server error during OAuth flow.",
		);
	});
});
