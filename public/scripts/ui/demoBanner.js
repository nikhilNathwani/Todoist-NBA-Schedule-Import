/**
 * Error-Handling Demo Banner
 * If the page URL has ?mockTodoistError=<code>, shows a visible banner so
 * it's obvious (to you or an interviewer watching) that a failure is being
 * intentionally simulated, not a real bug. Purely cosmetic -- the actual
 * simulation only happens server-side, and only if ENABLE_ERROR_DEMO=true
 * is set (see .env.example); this banner shows regardless, since it's just
 * describing what's in the URL.
 */

const DEMO_ERROR_LABELS = {
	400: "400 Bad Request",
	401: "401 Unauthorized (expired session)",
	403: "403 Forbidden",
	404: "404 Not Found",
	429: "429 Too Many Requests (rate limited)",
	500: "500 Internal Server Error",
	503: "503 Service Unavailable",
	network: "network failure (no response)",
};

function showDemoBannerIfPresent() {
	const mockError = new URLSearchParams(window.location.search).get(
		"mockTodoistError",
	);
	if (!mockError) return;

	const label = DEMO_ERROR_LABELS[mockError] || mockError;
	const banner = document.createElement("div");
	banner.className = "demo-banner";
	banner.textContent = `🧪 Error demo: the next Todoist API call will simulate ${label}`;

	// Inserted as the first child of <body>, outside .app-frame, so it
	// doesn't disturb that element's fixed-height grid layout.
	document.body.insertBefore(banner, document.body.firstChild);
}

showDemoBannerIfPresent();
