import express from "express";
import cookieSession from "cookie-session";
import request from "supertest";
import { E2E_ENV, BASE_URL } from "./testEnv.js";

// encryption.js reads ENCRYPTION_KEY when it runs, so set the server's
// secrets in this process before using it
Object.assign(process.env, E2E_ENV);
const { encrypt } = await import("../../app/utils/encryption.js");

// Session cookies for a logged-in visitor, made by the same libraries the
// app uses (cookie-session signing, Iron sealing) with the server's test
// secrets, so the app accepts them. The token inside is fake: demo mode
// stands in for every Todoist call the tests trigger.
export async function loggedInCookies() {
	const app = express();
	app.use(cookieSession({ name: "session", secret: E2E_ENV.COOKIE_SECRET }));
	app.get("/", async (req, res) => {
		req.session.accessTokenEncrypted = await encrypt("e2e-fake-token");
		res.end();
	});

	const response = await request(app).get("/");
	// "session=...; path=/; ..." -> { name: "session", value: "...", url }
	return response.headers["set-cookie"].map((header) => {
		const pair = header.split(";")[0];
		const equals = pair.indexOf("=");
		return {
			name: pair.slice(0, equals),
			value: pair.slice(equals + 1),
			url: BASE_URL,
		};
	});
}
