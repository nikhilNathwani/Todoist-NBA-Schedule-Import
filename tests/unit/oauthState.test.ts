import { describe, it, expect, vi, beforeEach } from "vitest";

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
		delete: vi.fn((name: string) => {
			store.delete(name);
		}),
	};
}

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));

import {
	createOAuthState,
	verifyAndClearOAuthState,
	OAUTH_STATE_COOKIE_NAME,
} from "@/lib/oauthState";

describe("oauthState utilities", () => {
	beforeEach(() => {
		cookiesMock.mockReset();
	});

	it("generates a random-looking UUID and stores it in a CSRF-safe cookie", async () => {
		const store = createMockCookieStore();
		cookiesMock.mockResolvedValue(store);

		const state = await createOAuthState();

		expect(state).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
		expect(store.set).toHaveBeenCalledWith(
			OAUTH_STATE_COOKIE_NAME,
			state,
			expect.objectContaining({
				httpOnly: true,
				secure: true,
				sameSite: "lax",
			}),
		);
	});

	it("generates a different value on each call", async () => {
		const store = createMockCookieStore();
		cookiesMock.mockResolvedValue(store);

		const first = await createOAuthState();
		const second = await createOAuthState();

		expect(first).not.toBe(second);
	});

	it("verifies a matching state and clears the cookie", async () => {
		const store = createMockCookieStore({ [OAUTH_STATE_COOKIE_NAME]: "abc-123" });
		cookiesMock.mockResolvedValue(store);

		const valid = await verifyAndClearOAuthState("abc-123");

		expect(valid).toBe(true);
		expect(store.delete).toHaveBeenCalledWith(OAUTH_STATE_COOKIE_NAME);
	});

	it("rejects a mismatched state and still clears the cookie", async () => {
		const store = createMockCookieStore({ [OAUTH_STATE_COOKIE_NAME]: "abc-123" });
		cookiesMock.mockResolvedValue(store);

		const valid = await verifyAndClearOAuthState("something-else");

		expect(valid).toBe(false);
		expect(store.delete).toHaveBeenCalledWith(OAUTH_STATE_COOKIE_NAME);
	});

	it("rejects when no cookie was ever set (e.g. expired, blocked, or a forged callback)", async () => {
		const store = createMockCookieStore();
		cookiesMock.mockResolvedValue(store);

		const valid = await verifyAndClearOAuthState("anything");

		expect(valid).toBe(false);
	});

	it("rejects a null state (missing query param) even if a cookie happens to be set", async () => {
		const store = createMockCookieStore({ [OAUTH_STATE_COOKIE_NAME]: "abc-123" });
		cookiesMock.mockResolvedValue(store);

		const valid = await verifyAndClearOAuthState(null);

		expect(valid).toBe(false);
	});
});
