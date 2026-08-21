// Ported from app/views/components.js's makeLogoBanner() (now removed).
// Two new optional props not in the original (both replace direct DOM
// manipulation with plain React props, now that PickerForm owns this as
// state instead of the vanilla JS globals it used to be spread across):
//   - `teamId` replaces public/scripts/ui/header/teamLogo.js's updateTeamLogo()
//   - `arrowIcon` replaces public/scripts/ui/header/importStatus.js's
//     `document.getElementById("arrow").innerHTML = ...` (the arrow between
//     the two logos turns into a loading spinner / check / warning icon
//     once an import is in progress or has finished)
export default function LogoBanner({
	isLarge = false,
	teamId,
	arrowIcon,
}: {
	isLarge?: boolean;
	teamId?: string;
	arrowIcon?: React.ReactNode;
}) {
	const sizeClass = isLarge ? "logo-banner-large" : "";
	return (
		<div className={`logo-banner ${sizeClass}`}>
			<div className="logo-container" id="nbaLogoContainer">
				{/* eslint-disable-next-line @next/next/no-img-element -- team logo count is small/dynamic-by-selection; next/image adds no real benefit here */}
				<img
					src={teamId ? `/images/team-logos/${teamId}.svg` : "/images/nba-logo.png"}
					alt={teamId ? `Selected Team (${teamId}) Logo` : "NBA Logo"}
				/>
			</div>
			<div id="arrow">
				{arrowIcon ?? <i className="fa-solid fa-arrow-right"></i>}
			</div>
			<div className="logo-container">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src="/images/todoist-color-logo.png" alt="Todoist Brand Logo" />
			</div>
		</div>
	);
}
