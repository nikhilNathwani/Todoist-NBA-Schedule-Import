// Ported from public/scripts/ui/demoBanner.js (now removed). The original
// read `?mockTodoistError=` client-side via window.location; here the
// value is read server-side (app/configure-import/page.tsx has `searchParams`
// directly) and passed down as a prop, so this can be a plain Server
// Component -- no client JS needed just to render a static banner string.
//
// Purely cosmetic -- the actual simulation only happens server-side, and
// only if ENABLE_ERROR_DEMO=true is set (see .env.example); this banner
// renders regardless, since it's just describing what's in the URL.
const DEMO_ERROR_LABELS: Record<string, string> = {
	"400": "400 Bad Request",
	"401": "401 Unauthorized (expired session)",
	"403": "403 Forbidden",
	"404": "404 Not Found",
	"429": "429 Too Many Requests (rate limited)",
	"500": "500 Internal Server Error",
	"503": "503 Service Unavailable",
	network: "network failure (no response)",
};

export default function DemoBanner({ mockError }: { mockError?: string }) {
	if (!mockError) return null;

	const label = DEMO_ERROR_LABELS[mockError] || mockError;
	return (
		<div className="demo-banner">
			{`🧪 Error demo: the next Todoist API call will simulate ${label}`}
		</div>
	);
}
