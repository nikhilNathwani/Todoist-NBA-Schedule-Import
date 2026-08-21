// parseSchedule.ts -- reads and derives data from data/nba_schedule.json.
// Ported (typed) from app/utils/parseSchedule.js (now removed). Logic is
// unchanged; only the file-path resolution differs (Next.js runs from the
// project root, so we resolve relative to process.cwd() instead of
// __dirname-relative traversal -- both land on the same repo-root
// data/nba_schedule.json).
import { promises as fs } from "fs";
import path from "path";

const schedulePath = path.join(process.cwd(), "data/nba_schedule.json");

export interface Game {
	opponent: string;
	isHomeGame: boolean;
	gameTimeUtcIso8601: string;
}

export interface TeamData {
	name: string;
	nameCasual: string;
	city: string;
	color: string;
	schedule: Game[];
}

export type NbaSchedule = Record<string, TeamData>;

export interface TeamSummary {
	name: string;
	city: string;
	nameCasual: string;
}

// Utility function to read and parse the JSON file
export async function getSchedule(): Promise<NbaSchedule> {
	try {
		const data = await fs.readFile(schedulePath, "utf-8");
		return JSON.parse(data) as NbaSchedule;
	} catch (err) {
		console.error("Error reading nba_schedule.json:", err);
		throw new Error("Failed to read and parse schedule data");
	}
}

export async function getTeams(): Promise<Record<string, TeamSummary>> {
	try {
		const nbaSchedule = await getSchedule();
		const teams: Record<string, TeamSummary> = {};
		for (const [teamId, teamData] of Object.entries(nbaSchedule)) {
			teams[teamId] = {
				name: teamData.name,
				city: teamData.city,
				nameCasual: teamData.nameCasual,
			};
		}
		return teams;
	} catch (err) {
		console.error("Error reading nba_schedule.json for team names:", err);
		throw new Error("Failed to get team names");
	}
}

export async function getFinalGameTime(): Promise<Date> {
	try {
		const nbaSchedule = await getSchedule();

		// Inital finalGameTime set to arbitrary date in the past
		let finalGameTime = new Date("2021-04-13T19:30:00+00:00");

		for (const teamData of Object.values(nbaSchedule)) {
			const numGames = teamData.schedule.length;
			const teamFinalGameTimeString =
				teamData.schedule[numGames - 1].gameTimeUtcIso8601;
			const teamFinalGameTime = new Date(teamFinalGameTimeString);
			if (teamFinalGameTime > finalGameTime) {
				finalGameTime = teamFinalGameTime;
			}
		}
		return finalGameTime;
	} catch (err) {
		console.error(
			"Error reading nba_schedule.json for final game time:",
			err,
		);
		throw new Error("Failed to get finalGameTime data");
	}
}

// returns 1) true/false indicating whether season is over,
//         2) the end-year of the season in question
export async function isSeasonOver(): Promise<{
	isSeasonOverBool: boolean;
	seasonEndYear: number;
}> {
	try {
		const finalGameDateTime = await getFinalGameTime();
		const seasonEndYear = finalGameDateTime.getFullYear();
		const now = new Date();
		return {
			isSeasonOverBool: now > finalGameDateTime,
			seasonEndYear: seasonEndYear,
		};
	} catch (error) {
		console.error("Failed to determine season status:", error);
		return {
			isSeasonOverBool: false,
			seasonEndYear: 0,
		};
	}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       TEAM DATA FUNCTIONS                 //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

export async function getTeamData(
	teamID: string,
	now: Date = new Date(),
): Promise<TeamData> {
	try {
		const data = await getSchedule();
		const teamData = data[teamID];

		if (!teamData) {
			throw new Error(`Schedule not found for team: ${teamID}`);
		}

		// Filter schedule for upcoming games only
		const upcomingGames = getUpcomingGames(teamData.schedule, now);

		// Return teamData with the filtered schedule
		return { ...teamData, schedule: upcomingGames };
	} catch (error) {
		console.error("Error getting team data:", error);
		throw error;
	}
}

export function getUpcomingGames(schedule: Game[], now: Date = new Date()): Game[] {
	const upcomingGames: Game[] = [];
	for (const game of schedule) {
		if (isLaterThanNow(game.gameTimeUtcIso8601, now)) {
			upcomingGames.push(game);
		}
	}
	return upcomingGames;
}

export function isLaterThanNow(dateTime: string, now: Date = new Date()): boolean {
	const gameDateTime = new Date(dateTime);
	return gameDateTime > now;
}
