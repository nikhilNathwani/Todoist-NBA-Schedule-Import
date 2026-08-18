import { describe, it, expect, vi, beforeEach } from "vitest";

const { encryptMock, decryptMock } = vi.hoisted(() => ({
	encryptMock: vi.fn(),
	decryptMock: vi.fn(),
}));

vi.mock("../../app/utils/encryption.js", () => ({
	encrypt: encryptMock,
	decrypt: decryptMock,
}));

import {
	saveAccessToken,
	getAccessToken,
} from "../../app/utils/cookieSession.js";

describe("cookieSession utilities", () => {
	beforeEach(() => {
		encryptMock.mockReset();
		decryptMock.mockReset();
	});

	it("encrypts and stores token in session", async () => {
		encryptMock.mockResolvedValue("sealed-token");
		const req = { session: {} };

		await saveAccessToken(req, "raw-token");

		expect(encryptMock).toHaveBeenCalledWith("raw-token");
		expect(req.session.accessTokenEncrypted).toBe("sealed-token");
	});

	it("decrypts token from session", async () => {
		decryptMock.mockResolvedValue("raw-token");
		const req = { session: { accessTokenEncrypted: "sealed-token" } };

		const token = await getAccessToken(req);

		expect(decryptMock).toHaveBeenCalledWith("sealed-token");
		expect(token).toBe("raw-token");
	});

	it("throws when session token is missing", async () => {
		const req = { session: {} };

		await expect(getAccessToken(req)).rejects.toThrow(
			"Access token is not set in the session.",
		);
		expect(decryptMock).not.toHaveBeenCalled();
	});
});
