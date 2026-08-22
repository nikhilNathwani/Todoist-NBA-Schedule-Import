import { describe, it, expect, vi, beforeEach } from "vitest";

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
		delete: vi.fn((name: string) => {
			store.delete(name);
		}),
	};
}

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));

import { GET } from "@/app/api/auth/login/route";
import { OAUTH_STATE_COOKIE_NAME } from "@/lib/oauthState";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("GET /api/auth/login", () => {
	let cookieStore: ReturnType<typeof createMockCookieStore>;

	beforeEach(() => {
		cookieStore = createMockCookieStore();
		cookiesMock.mockReset();
		cookiesMock.mockResolvedValue(cookieStore);
	});

	it("redirects to Todoist's OAuth authorize URL with our client id and a fresh state nonce", async () => {
		const response = await GET();

		expect(response.status).toBe(307);
		const location = response.headers.get("location")!;
		expect(location).toContain("https://todoist.com/oauth/authorize");
		expect(location).toContain("client_id=test-client-id");
		expect(location).toContain("scope=data:read_write");

		const state = new URL(location).searchParams.get("state");
		expect(state).toMatch(UUID_PATTERN);
	});

	it("stashes the same state value in a short-lived, CSRF-safe cookie", async () => {
		const response = await GET();
		const location = response.headers.get("location")!;
		const state = new URL(location).searchParams.get("state");

		expect(cookieStore.set).toHaveBeenCalledTimes(1);
		const [name, value, options] = cookieStore.set.mock.calls[0];
		expect(name).toBe(OAUTH_STATE_COOKIE_NAME);
		expect(value).toBe(state);
		expect(options).toMatchObject({
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
		});
	});

	it("generates a different nonce on each call (not reused across login attempts)", async () => {
		const first = new URL(
			(await GET()).headers.get("location")!,
		).searchParams.get("state");
		const second = new URL(
			(await GET()).headers.get("location")!,
		).searchParams.get("state");

		expect(first).not.toBe(second);
	});
});
