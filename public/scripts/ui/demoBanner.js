/**
 * Error-Handling Demo Banner
 * If the page URL has a demo parameter (?mockTierCheck or
 * ?mockTodoistError), shows a visible banner so it's obvious (to you or an
 * interviewer watching) that a state or failure is being intentionally
 * simulated, not a real bug. Purely cosmetic -- the actual simulation only
 * happens server-side, and only if ENABLE_ERROR_DEMO=true is set (see
 * .env.example); this banner shows regardless, since it's just describing
 * what's in the URL.
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

const DEMO_TIER_LABELS = {
	reached: "the project limit is reached",
	available: "new projects are available",
};

function showDemoBannerIfPresent() {
	const params = new URLSearchParams(window.location.search);
	const tierCheck = params.get("mockTierCheck");
	const importError = params.get("mockTodoistError");

	const notes = [];
	if (tierCheck) {
		notes.push(
			DEMO_TIER_LABELS[tierCheck]
				? `this page acts as if ${DEMO_TIER_LABELS[tierCheck]}`
				: `this page's tier check simulates ${DEMO_ERROR_LABELS[tierCheck] || tierCheck}`,
		);
	}
	if (importError) {
		notes.push(
			`the import will simulate ${DEMO_ERROR_LABELS[importError] || importError}`,
		);
	}
	if (notes.length === 0) return;

	const banner = document.createElement("div");
	banner.className = "demo-banner";
	banner.textContent = `🧪 Demo: ${notes.join("; ")}`;

	// Inserted as the first child of <body>, outside .app-frame, so it
	// doesn't disturb that element's fixed-height grid layout.
	document.body.insertBefore(banner, document.body.firstChild);
}

showDemoBannerIfPresent();
