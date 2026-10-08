import { describe, it, expect } from "vitest";
import { makeErrorPageHTML } from "../../app/views/errorPage.js";

describe("error page", () => {
	// An expired or revoked token can only be fixed by logging in, so the
	// link should start OAuth itself instead of going back to the landing page
	it.each(["AUTH_EXPIRED", "FORBIDDEN"])(
		"links %s straight to /auth/login",
		(todoistErrorType) => {
			const html = makeErrorPageHTML({ todoistErrorType, message: "x" });
			expect(html).toContain('href="/auth/login"');
			expect(html).toContain("Log in again");
		},
	);

	it("sends retryable failures back to the configure-import page", () => {
		const html = makeErrorPageHTML({ todoistErrorType: "RATE_LIMITED", message: "x" });
		expect(html).toContain('href="/configure-import"');
	});
});
