"use client";

// Ported from public/scripts/ui/picker.js (team dropdown half) +
// public/scripts/events/selectTeam.js (now removed). Team data is passed in
// as a prop -- read server-side by app/configure-import/page.tsx via
// lib/parseSchedule's getTeams() directly, instead of the original's
// client-side fetch("/api/get-teams") round trip (see
// NEXTJS_MIGRATION_HANDOFF.md "Server-side team data" for why).
import type { TeamSummary } from "@/lib/parseSchedule";

export default function TeamSelector({
	teams,
	selectedTeam,
	onSelectTeam,
}: {
	teams: Record<string, TeamSummary>;
	selectedTeam: string;
	onSelectTeam: (teamID: string, teamName: string) => void;
}) {
	// Sort teams alphabetically by city, same as the original populateTeamDropdown()
	const sortedTeams = Object.entries(teams).sort((a, b) =>
		a[1].city > b[1].city ? 1 : -1,
	);

	return (
		<fieldset id="teamPicker">
			<legend>1. Select your NBA team</legend>
			<select
				id="team-selector"
				name="team"
				aria-label="NBA Team"
				value={selectedTeam}
				onChange={(event) => {
					const teamID = event.target.value;
					const teamName = teams[teamID]?.name ?? "";
					onSelectTeam(teamID, teamName);
				}}
			>
				<option value="" disabled>
					Choose a team
				</option>
				{sortedTeams.map(([teamID, team]) => (
					<option key={teamID} value={teamID}>
						{team.city} {team.name}
					</option>
				))}
			</select>
		</fieldset>
	);
}
