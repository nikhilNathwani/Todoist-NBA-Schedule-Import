import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "@/lib/encryption";

// New test file (no equivalent existed pre-migration) -- added specifically
// to prove point (b) of the cookie-security requirement in the migration
// task: "a request carrying that cookie can be decrypted back to the
// correct access token via the same iron-encryption round trip." This is
// the real @hapi/iron seal/unseal, using ENCRYPTION_KEY from
// tests/setup/env.ts -- not mocked.
describe("encryption (real @hapi/iron round trip)", () => {
	it("round-trips a plain access token through encrypt/decrypt unchanged", async () => {
		const original = "a-real-looking-todoist-access-token-abc123";

		const sealed = await encrypt(original);
		expect(sealed).not.toBe(original);
		expect(typeof sealed).toBe("string");

		const unsealed = await decrypt(sealed);
		expect(unsealed).toBe(original);
	});

	it("produces a different sealed value each time (iron includes random IV/salt)", async () => {
		const sealedA = await encrypt("same-token");
		const sealedB = await encrypt("same-token");
		expect(sealedA).not.toBe(sealedB);

		// but both still decrypt back to the original
		expect(await decrypt(sealedA)).toBe("same-token");
		expect(await decrypt(sealedB)).toBe("same-token");
	});

	it("rejects a tampered/garbage sealed value instead of silently returning bad data", async () => {
		const sealed = await encrypt("a-token");
		const tampered = sealed.slice(0, -4) + "abcd";

		await expect(decrypt(tampered)).rejects.toBeTruthy();
	});
});
