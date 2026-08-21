import { makeHead, makeFooter, makeLogoBanner } from "./components.js";

// Renders a styled error page for failures that happen before the picker
// form can even be shown (e.g. the project-limit check right after OAuth
// failing). Mirrors seasonOver.js's structure so a real Todoist outage
// looks like an intentional part of the app, not a broken page.
function makeErrorPageHTML(classifiedError) {
	const title = ERROR_TITLES[classifiedError.todoistErrorType] || "Something went wrong";
	const message =
		classifiedError.message ||
		"An unexpected error occurred talking to Todoist.";
	const action = ACTION_LINKS[classifiedError.todoistErrorType] || DEFAULT_ACTION;

	return `
	<!DOCTYPE html>
	<html lang="en">
		${makeHead("NBA Schedule Import — Error")}
		<body>
			<main>
				<div class="app-frame season-over" id="appFrameLanding">
					<div class="app-header">
						${makeLogoBanner(true)}
						<h1>${title}</h1>
						<h3>
							${message}
							<br />
							<br />
							<a href="${action.href}">${action.label}</a>
						</h3>
					</div>
				</div>
			</main>
			${makeFooter()}
			<script src="/scripts/ui/demoBanner.js"></script>
		</body>
	</html>
`;
}

const ERROR_TITLES = {
	AUTH_EXPIRED: "Session expired",
	FORBIDDEN: "Permission denied",
	NOT_FOUND: "Not found",
	RATE_LIMITED: "Todoist is rate-limiting us",
	SERVER_ERROR: "Todoist is having issues",
	SERVICE_UNAVAILABLE: "Todoist is temporarily unavailable",
	NETWORK_ERROR: "Couldn't reach Todoist",
};

const DEFAULT_ACTION = { href: "/", label: "Back to start" };
const ACTION_LINKS = {
	AUTH_EXPIRED: { href: "/", label: "Log in again" },
	FORBIDDEN: { href: "/", label: "Log in again" },
	RATE_LIMITED: { href: "/configure-import", label: "Try again" },
	SERVER_ERROR: { href: "/configure-import", label: "Try again" },
	SERVICE_UNAVAILABLE: { href: "/configure-import", label: "Try again" },
	NETWORK_ERROR: { href: "/configure-import", label: "Try again" },
	NOT_FOUND: { href: "/configure-import", label: "Try again" },
};

export { makeErrorPageHTML };
