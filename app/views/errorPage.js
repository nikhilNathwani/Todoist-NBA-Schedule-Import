import { makeStatusPageHTML } from "./shared/statusPage.js";

// Renders an error page for failures that happen before the setup page's
// form can even be shown (e.g. the project-limit check right after OAuth
// failing), in the same status-page layout as the import result, so a real
// Todoist outage looks like an intentional part of the app, not a broken
// page.
function makeErrorPageHTML(classifiedError) {
	const title = ERROR_TITLES[classifiedError.todoistErrorType] || "Something went wrong";
	const message =
		classifiedError.message ||
		"An unexpected error occurred talking to Todoist.";
	const action = ACTION_LINKS[classifiedError.todoistErrorType] || DEFAULT_ACTION;
	return renderErrorPage(title, message, action);
}

// Shown for any URL no route matches (see the 404 handler in app.js)
function makeNotFoundPageHTML() {
	return renderErrorPage(
		"Page not found",
		"There's nothing at this address.",
		DEFAULT_ACTION,
	);
}

function renderErrorPage(title, message, action) {
	return makeStatusPageHTML({
		pageTitle: "Error",
		icon: "error",
		title,
		message,
		links: [action],
		// ?mockTierCheck=<code> lands here; the banner says it's simulated
		demoBanner: true,
	});
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

const DEFAULT_ACTION = {
	href: "/",
	label: "Back to start",
	icon: "fa-solid fa-arrow-left",
};
const TRY_AGAIN = {
	href: "/setup",
	label: "Try again",
	icon: "fa-solid fa-arrow-left",
};
const LOG_IN_AGAIN = {
	href: "/auth/login",
	label: "Log in again",
	icon: "fa-solid fa-right-to-bracket",
};
// "Log in again" starts OAuth directly (/auth/login makes a fresh state and
// redirects to Todoist's permission page), rather than detouring through the
// landing page's own "Log in" button.
const ACTION_LINKS = {
	AUTH_EXPIRED: LOG_IN_AGAIN,
	FORBIDDEN: LOG_IN_AGAIN,
	RATE_LIMITED: TRY_AGAIN,
	SERVER_ERROR: TRY_AGAIN,
	SERVICE_UNAVAILABLE: TRY_AGAIN,
	NETWORK_ERROR: TRY_AGAIN,
	NOT_FOUND: TRY_AGAIN,
};

export { makeErrorPageHTML, makeNotFoundPageHTML };
