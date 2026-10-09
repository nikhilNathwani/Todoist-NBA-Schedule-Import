import { test, expect } from "@playwright/test";
import { loggedInCookies } from "./session.js";

// The setup page through to the result page, in Chrome. Demo parameters
// (see app/routes/setup.js) stand in for Todoist, so nothing here calls it.
// That leaves out a real successful import, which needs Todoist; the
// success page's content is covered by tests/integration/routes/result.test.js.

test.describe("logged in", () => {
	test.beforeEach(async ({ context }) => {
		await context.addCookies(await loggedInCookies());
	});

	test("the project picker shows both plan states", async ({ page }) => {
		await page.goto("/setup?mockTierCheck=reached");
		await expect(page.locator('input[value="newProject"]')).toBeDisabled();
		await expect(page.locator('input[value="inbox"]')).toBeChecked();
		await expect(page.getByText("Project limit reached")).toBeVisible();

		await page.goto("/setup?mockTierCheck=available");
		await expect(page.locator('input[value="newProject"]')).toBeEnabled();
		await expect(page.locator('input[value="newProject"]')).toBeChecked();
	});

	test("choosing a team shows its logo and names the new project", async ({
		page,
	}) => {
		await page.goto("/setup?mockTierCheck=available");
		await page.locator("#team-selector").selectOption("BOS");

		await expect(page.locator("#nbaLogoContainer img")).toHaveAttribute(
			"src",
			/team-logos\/BOS\.svg/,
		);
		await expect(page.locator("#newProject small")).toHaveText(
			'Import games into a new Todoist project called "Celtics schedule"',
		);
	});

	test("submitting without a team is blocked by the browser, which says why", async ({
		page,
	}) => {
		let posts = 0;
		page.on("request", (r) => {
			if (r.method() === "POST") posts++;
		});
		await page.goto("/setup?mockTierCheck=available");

		await page.locator("#submitButton").click();

		await expect(page).toHaveURL(/\/setup/);
		expect(posts).toBe(0);
		const message = await page
			.locator("#team-selector")
			.evaluate((select) => select.validationMessage);
		expect(message).not.toBe("");
	});

	test("an import shows the loading screen, posts once, and ends on /result", async ({
		page,
	}) => {
		// Hold the POST so the page can be looked at while it's in flight
		let posts = 0;
		await page.route("**/setup", async (route) => {
			if (route.request().method() !== "POST") return route.continue();
			posts++;
			await new Promise((resolve) => setTimeout(resolve, 1500));
			await route.continue();
		});

		await page.goto("/setup?mockTierCheck=available&mockTodoistError=429");
		await page.locator("#team-selector").selectOption("BOS");
		await page.locator('input[value="inbox"]').check();

		// Playwright waits out a navigation in progress before touching the
		// page, so the page checks itself: 300ms after the first submit (post
		// in flight, old page still on screen) it notes what's showing, then
		// clicks again like a double-click would. sessionStorage carries the
		// notes across the navigation to /result.
		await page.evaluate(() => {
			const form = document.querySelector("form");
			form.addEventListener(
				"submit",
				() => {
					setTimeout(() => {
						sessionStorage.setItem(
							"duringPost",
							JSON.stringify({
								title: document.querySelector("h1").textContent,
								spinner: document.querySelectorAll("#arrow .spinner").length,
							}),
						);
						document.getElementById("submitButton").click();
					}, 300);
				},
				{ once: true },
			);
		});
		await page.locator("#submitButton").click();

		await page.waitForURL("**/result");
		const duringPost = await page.evaluate(() =>
			JSON.parse(sessionStorage.getItem("duringPost")),
		);
		expect(duringPost).toEqual({ title: "Importing schedule", spinner: 1 });
		// The second click didn't post again
		expect(posts).toBe(1);
		await expect(page.locator("h1")).toHaveText("An error occurred");
		await expect(page.locator("h3")).toContainText("rate-limiting");
		await expect(page.locator("#nbaLogoContainer img")).toHaveAttribute(
			"src",
			/team-logos\/BOS\.svg/,
		);
		await expect(page.getByRole("link", { name: "Try again" })).toBeVisible();

		// Refreshing the result re-reads it; it doesn't re-send the post
		await page.reload();
		await expect(page.locator("h1")).toHaveText("An error occurred");
		expect(posts).toBe(1);

		// Back lands on a fresh form, not a page stuck on the loading screen
		await page.goBack();
		await expect(page).toHaveURL(/\/setup/);
		await expect(page.locator("form")).toBeVisible();
		await expect(page.locator("h1")).toHaveText("");
	});

	test("a failure loading the page shows the error page with its status", async ({
		page,
	}) => {
		const response = await page.goto("/setup?mockTierCheck=503");

		// A Todoist outage is reported as 502 Bad Gateway: the server
		// upstream of this app failed (see todoistErrors.js)
		expect(response.status()).toBe(502);
		await expect(page.locator("h1")).toHaveText(
			"Todoist is temporarily unavailable",
		);
		await expect(page.getByRole("link", { name: "Try again" })).toHaveAttribute(
			"href",
			"/setup",
		);
	});
});

test("a logged-out visitor is sent from /setup to the landing page", async ({
	page,
}) => {
	await page.goto("/setup");
	await expect(page).toHaveURL(/\/$/);
});

test("an unknown path gets the 404 page", async ({ page }) => {
	const response = await page.goto("/no-such-page");

	expect(response.status()).toBe(404);
	await expect(page.locator("h1")).toHaveText("Page not found");
});
