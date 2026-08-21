import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/auth/login/route";

describe("GET /api/auth/login", () => {
	it("redirects to Todoist's OAuth authorize URL with our client id and state", async () => {
		const response = await GET();

		expect(response.status).toBe(307);
		const location = response.headers.get("location");
		expect(location).toContain("https://todoist.com/oauth/authorize");
		expect(location).toContain("client_id=test-client-id");
		expect(location).toContain("state=test-state-secret");
		expect(location).toContain("scope=data:read_write");
	});
});
