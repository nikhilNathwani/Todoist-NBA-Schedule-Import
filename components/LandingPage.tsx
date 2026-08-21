import LogoBanner from "@/components/LogoBanner";

// Ported from app/views/index.js's makeLandingPageHTML() (now removed).
export default function LandingPage() {
	return (
		<main>
			<div className="app-frame" id="appFrameLanding">
				<div className="app-header">
					<LogoBanner isLarge />
					<h1>NBA Schedule Import</h1>
					<h3>
						Log in with Todoist to import your favorite NBA team&apos;s
						regular season schedule.
					</h3>
				</div>
				<div className="app-content">
					<div className="button-container">
						<a
							href="/api/auth/login"
							role="button"
							className="button button-primary"
						>
							Log in with Todoist
						</a>
						<a
							href="https://youtu.be/t3R9q-3n1lE"
							target="_blank"
							role="button"
							className="button button-secondary"
						>
							Quick demo &amp; FAQ
						</a>
					</div>
				</div>
			</div>
		</main>
	);
}
