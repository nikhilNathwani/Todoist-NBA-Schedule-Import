import { isSeasonOver } from "@/lib/parseSchedule";
import LandingPage from "@/components/LandingPage";
import SeasonOverPage from "@/components/SeasonOverPage";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ISR, not pure SSG (see NEXTJS_MIGRATION_HANDOFF.md "Static generation
// strategy for the landing page" for the full writeup).
//
// isSeasonOver() depends on two things: the schedule JSON (changes ~once a
// year, around October) AND today's date compared to the season's final
// game time (changes every day). A plain static export with no revalidation
// would freeze isSeasonOverBool at whatever it was at build time and never
// re-check it -- nothing about the calendar crossing the season-end date
// would trigger a rebuild on its own, so the site could keep showing the
// wrong page (picker after the season's actually over, or season-over after
// a new season's actually started) for however long it goes between
// deploys, potentially months.
//
// `revalidate = 86400` (24h) keeps the real win -- not re-reading/parsing
// the ~12k-line schedule JSON on every single request -- while still
// re-checking the date/schedule boundary daily in the background, which is
// all the granularity this check needs (game-day precision isn't required
// for "is the season over").
export const revalidate = 86400;

export default async function HomePage() {
	const { isSeasonOverBool, seasonEndYear } = await isSeasonOver();

	return isSeasonOverBool ? (
		<SeasonOverPage seasonEndYear={seasonEndYear} />
	) : (
		<LandingPage />
	);
}
