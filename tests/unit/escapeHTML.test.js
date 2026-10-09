import { describe, it, expect } from "vitest";
import { escapeHTML } from "../../app/views/shared/escapeHTML.js";
import { makeErrorPageHTML } from "../../app/views/errorPage.js";
import { makeSetupPageHTML } from "../../app/views/setup.js";

describe("escapeHTML", () => {
	it("turns markup characters into text the browser displays, not runs", () => {
		expect(escapeHTML('<script>alert("hi")</script>')).toBe(
			"&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt;",
		);
	});

	it("escapes & first, so existing text isn't double-escaped wrongly", () => {
		expect(escapeHTML("Tom & Jerry's <b>")).toBe(
			"Tom &amp; Jerry&#39;s &lt;b&gt;",
		);
	});

	it("leaves ordinary text alone and accepts non-strings", () => {
		expect(escapeHTML("Boston Celtics")).toBe("Boston Celtics");
		expect(escapeHTML(76)).toBe("76");
	});

	it("is applied to error messages on the error page", () => {
		const html = makeErrorPageHTML({
			todoistErrorType: "UNKNOWN",
			message: "Unexpected error: <img src=x onerror=alert(1)>",
		});

		expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
		expect(html).not.toContain("<img src=x");
	});

	it("is applied to team data in the setup page's team dropdown", async () => {
		const html = await makeSetupPageHTML(true, {
			BOS: { name: 'Celtics"><script>x()</script>', city: "Boston" },
		});

		expect(html).toContain("&lt;script&gt;x()&lt;/script&gt;");
		expect(html).not.toContain("<script>x()");
	});
});
