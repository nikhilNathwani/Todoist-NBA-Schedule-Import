import LogoBanner from "@/components/LogoBanner";
import type { TodoistErrorType } from "@/lib/todoistErrors";

// Ported from app/views/errorPage.js's makeErrorPageHTML() (now removed).
// Renders a styled error page for failures that happen before the picker
// form can even be shown (e.g. the project-limit check right after OAuth
// failing). Mirrors SeasonOverPage's structure so a real Todoist outage
// looks like an intentional part of the app, not a broken page.
//
// NOTE (see NEXTJS_MIGRATION_HANDOFF.md): the original Express route set a
// specific HTTP status code here (401/429/502) via
// mapTodoistErrorTypeToHttpStatus. app/configure-import/page.tsx is a
// Server Component; the App Router gives Server Component pages no way to
// set an arbitrary response status (only notFound() for 404 or redirect())
// aside from a Route Handler. This page therefore renders the same content
// and copy as before but the HTTP response status is Next's default 200,
// not the classified status. Flagged as a known, documented limitation
// rather than worked around by swapping this page for a Route Handler.
export default function ErrorPage({
	todoistErrorType,
	message,
}: {
	todoistErrorType?: TodoistErrorType;
	message: string;
}) {
	const title =
		(todoistErrorType && ERROR_TITLES[todoistErrorType]) ||
		"Something went wrong";
	const action =
		(todoistErrorType && ACTION_LINKS[todoistErrorType]) || DEFAULT_ACTION;

	return (
		<main>
			<div className="app-frame season-over" id="appFrameLanding">
				<div className="app-header">
					<LogoBanner isLarge />
					<h1>{title}</h1>
					<h3>
						{message}
						<br />
						<br />
						<a href={action.href}>{action.label}</a>
					</h3>
				</div>
			</div>
		</main>
	);
}

const ERROR_TITLES: Partial<Record<TodoistErrorType, string>> = {
	AUTH_EXPIRED: "Session expired",
	FORBIDDEN: "Permission denied",
	NOT_FOUND: "Not found",
	RATE_LIMITED: "Todoist is rate-limiting us",
	SERVER_ERROR: "Todoist is having issues",
	SERVICE_UNAVAILABLE: "Todoist is temporarily unavailable",
	NETWORK_ERROR: "Couldn't reach Todoist",
};

const DEFAULT_ACTION = { href: "/", label: "Back to start" };
const ACTION_LINKS: Partial<Record<TodoistErrorType, { href: string; label: string }>> = {
	AUTH_EXPIRED: { href: "/", label: "Log in again" },
	FORBIDDEN: { href: "/", label: "Log in again" },
	RATE_LIMITED: { href: "/configure-import", label: "Try again" },
	SERVER_ERROR: { href: "/configure-import", label: "Try again" },
	SERVICE_UNAVAILABLE: { href: "/configure-import", label: "Try again" },
	NETWORK_ERROR: { href: "/configure-import", label: "Try again" },
	NOT_FOUND: { href: "/configure-import", label: "Try again" },
};
