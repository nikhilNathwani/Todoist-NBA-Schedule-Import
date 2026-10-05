import { describe, it, expect, afterEach } from "vitest";
import { encrypt, decrypt } from "../../app/utils/encryption.js";

// The real @hapi/iron seal/unseal (not mocked), using ENCRYPTION_KEY from
// tests/setup/env.js. This is the encryption that protects the Todoist
// access token inside the session cookie.
describe("encryption (real @hapi/iron)", () => {
	const originalKey = process.env.ENCRYPTION_KEY;
	afterEach(() => {
		process.env.ENCRYPTION_KEY = originalKey;
	});

	it("round-trips an access token unchanged, and the sealed value doesn't contain it", async () => {
		const token = "a-real-looking-todoist-access-token-abc123";

		const sealed = await encrypt(token);

		expect(sealed).not.toContain(token);
		expect(await decrypt(sealed)).toBe(token);
	});

	it("produces a different sealed value each time (random salt and IV)", async () => {
		const sealedA = await encrypt("same-token");
		const sealedB = await encrypt("same-token");

		expect(sealedA).not.toBe(sealedB);
		expect(await decrypt(sealedA)).toBe("same-token");
		expect(await decrypt(sealedB)).toBe("same-token");
	});

	it("rejects a tampered sealed value instead of returning bad data", async () => {
		const sealed = await encrypt("a-token");
		const tampered = sealed.slice(0, -4) + "abcd";

		await expect(decrypt(tampered)).rejects.toThrow();
	});

	it("can't be unsealed with a different ENCRYPTION_KEY", async () => {
		const sealed = await encrypt("a-token");
		process.env.ENCRYPTION_KEY = "a-different-password-of-at-least-32-chars";

		await expect(decrypt(sealed)).rejects.toThrow();
	});
});
