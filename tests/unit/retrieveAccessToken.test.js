import { describe, it, expect, vi, afterEach } from "vitest";
import { retrieveAccessToken } from "../../app/utils/todoist.js";

// The token exchange is a raw fetch to Todoist's OAuth endpoint, so stub
// fetch and check both what's sent and what's kept from the answer
function stubTokenResponse(body, status = 200) {
	const fetchMock = vi.fn().mockResolvedValue(
		new Response(JSON.stringify(body), {
			status,
			headers: { "Content-Type": "application/json" },
		}),
	);
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

describe("retrieveAccessToken", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("sends the code with the app's client credentials to Todoist's token endpoint", async () => {
		const fetchMock = stubTokenResponse({
			access_token: "access-abc",
			token_type: "Bearer",
		});

		await retrieveAccessToken("code-123");

		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe("https://todoist.com/oauth/access_token");
		expect(options.method).toBe("POST");
		expect(JSON.parse(options.body)).toEqual({
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
			code: "code-123",
			redirect_uri: process.env.REDIRECT_URI,
		});
	});

	// Apps in Todoist's refresh-token mode get a one-hour access token plus a
	// refresh token. The app keeps only the access token: one short session
	// is all it needs, and a stored refresh token would only add risk.
	it("keeps only the access token from a refresh-token-mode response", async () => {
		stubTokenResponse({
			access_token: "access-abc",
			token_type: "Bearer",
			expires_in: 3600,
			refresh_token: "refresh-xyz",
			scope: "data:read_write",
		});

		const token = await retrieveAccessToken("code-123");

		expect(token).toBe("access-abc");
	});

	it("handles the older response (long-lived token, no refresh token) the same way", async () => {
		stubTokenResponse({ access_token: "access-abc", token_type: "Bearer" });

		await expect(retrieveAccessToken("code-123")).resolves.toBe("access-abc");
	});

	it("rejects a used or expired code with Todoist's reason attached", async () => {
		stubTokenResponse({ error: "bad_authorization_code" }, 400);

		await expect(retrieveAccessToken("stale-code")).rejects.toMatchObject({
			httpStatusCode: 400,
			responseData: { error: "bad_authorization_code" },
		});
	});
});
