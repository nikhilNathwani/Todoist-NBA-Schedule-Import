import LogoBanner from "@/components/LogoBanner";

// Ported from app/views/seasonOver.js's makeSeasonOverHTML() (now removed).
export default function SeasonOverPage({
	seasonEndYear,
}: {
	seasonEndYear: number;
}) {
	return (
		<main>
			<div className="app-frame season-over" id="appFrameLanding">
				<div className="app-header">
					<LogoBanner isLarge />
					<h1>NBA Schedule Import</h1>
					<h3>
						<b>Come back in October</b> when the {seasonEndYear}-
						{(seasonEndYear + 1) % 100} NBA schedule is available.
						<br />
						<br />
						Then import your favorite team&apos;s games into Todoist!
						<br />
						<br />
						<a href="https://youtu.be/t3R9q-3n1lE" target="_blank">
							Watch 60s demo
						</a>
					</h3>
				</div>
			</div>
		</main>
	);
}
