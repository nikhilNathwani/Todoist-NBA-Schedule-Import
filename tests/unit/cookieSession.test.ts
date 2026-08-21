import { describe, it, expect, vi, beforeEach } from "vitest";

// lib/cookieSession.ts now reads/writes via next/headers' `cookies()`
// instead of an Express `req.session` object, so this mocks next/headers
// with an in-memory cookie jar instead of mocking a plain object like the
// original test did. This also directly exercises (and asserts on) the
// exact cookie attributes lib/cookieSession.ts passes to `.set()` -- see
// tests/route/callback.test.ts for the same assertion made against the real
// callback route (not just this unit).
const { encryptMock, decryptMock } = vi.hoisted(() => ({
	encryptMock: vi.fn(),
	decryptMock: vi.fn(),
}));

vi.mock("@/lib/encryption", () => ({
	encrypt: encryptMock,
	decrypt: decryptMock,
}));

function createMockCookieStore(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial));
	return {
		get: vi.fn((name: string) => {
			const value = store.get(name);
			return value === undefined ? undefined : { name, value };
		}),
		set: vi.fn((name: string, value: string) => {
			store.set(name, value);
		}),
	};
}

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));

import {
	saveAccessToken,
	getAccessToken,
	sessionCookieOptions,
	SESSION_COOKIE_NAME,
	SESSION_MAX_AGE_SECONDS,
} from "@/lib/cookieSession";

describe("cookieSession utilities", () => {
	beforeEach(() => {
		encryptMock.mockReset();
		decryptMock.mockReset();
		cookiesMock.mockReset();
	});

	it("encrypts and stores token in the session cookie with the right attributes", async () => {
		encryptMock.mockResolvedValue("sealed-token");
		const store = createMockCookieStore();
		cookiesMock.mockResolvedValue(store);

		await saveAccessToken("raw-token");

		expect(encryptMock).toHaveBeenCalledWith("raw-token");
		expect(store.set).toHaveBeenCalledWith(
			SESSION_COOKIE_NAME,
			"sealed-token",
			expect.objectContaining({
				httpOnly: true,
				secure: true,
				sameSite: "lax",
				maxAge: SESSION_MAX_AGE_SECONDS,
			}),
		);
	});

	it("uses a 1-hour maxAge expressed in SECONDS, not milliseconds", () => {
		// The literal trap called out in the task brief: cookie-session's
		// maxAge was 60 * 60 * 1000 (ms). next/headers' cookies().set()
		// maxAge is in seconds -- this must be 3600, not 3600000.
		expect(SESSION_MAX_AGE_SECONDS).toBe(3600);
		expect(sessionCookieOptions().maxAge).toBe(3600);
	});

	it("sets sameSite to 'lax', not 'strict'", () => {
		// 'strict' broke the cookie being sent back on the OAuth redirect
		// chain from Todoist -- see lib/cookieSession.ts's header comment.
		expect(sessionCookieOptions().sameSite).toBe("lax");
	});

	it("decrypts token from the session cookie", async () => {
		decryptMock.mockResolvedValue("raw-token");
		const store = createMockCookieStore({
			[SESSION_COOKIE_NAME]: "sealed-token",
		});
		cookiesMock.mockResolvedValue(store);

		const token = await getAccessToken();

		expect(decryptMock).toHaveBeenCalledWith("sealed-token");
		expect(token).toBe("raw-token");
	});

	it("throws when no session cookie is present (treated as unauthenticated)", async () => {
		const store = createMockCookieStore();
		cookiesMock.mockResolvedValue(store);

		await expect(getAccessToken()).rejects.toThrow(
			"Access token is not set in the session.",
		);
		expect(decryptMock).not.toHaveBeenCalled();
	});

	it("throws (not crashes) when the session cookie fails to decrypt -- treated as unauthenticated", async () => {
		decryptMock.mockRejectedValue(new Error("Bad hmac value"));
		const store = createMockCookieStore({
			[SESSION_COOKIE_NAME]: "tampered-or-garbage-value",
		});
		cookiesMock.mockResolvedValue(store);

		await expect(getAccessToken()).rejects.toThrow(
			"Access token in session is invalid or could not be decrypted.",
		);
	});
});
