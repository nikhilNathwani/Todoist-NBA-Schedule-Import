import { describe, it, expect, vi, afterEach } from "vitest";
import {
	getFinalGameTime,
	getUpcomingGames,
	isLaterThanNow,
	getTeamData,
} from "@/lib/parseSchedule";

afterEach(() => {
	vi.useRealTimers();
});

describe("parseSchedule utilities", () => {
	it("returns true when a game time is in the future", () => {
		const now = new Date("2026-01-01T10:00:00Z");
		const futureGame = "2026-01-01T12:00:00Z";

		expect(isLaterThanNow(futureGame, now)).toBe(true);
	});

	it("returns false when a game time is in the past", () => {
		const now = new Date("2026-01-01T10:00:00Z");
		const pastGame = "2025-12-31T12:00:00Z";

		expect(isLaterThanNow(pastGame, now)).toBe(false);
	});

	it("filters a schedule to only upcoming games", () => {
		const now = new Date("2026-01-01T10:00:00Z");
		const schedule = [
			{ gameTimeUtcIso8601: "2025-12-31T10:00:00Z", opponent: "LAL", isHomeGame: true },
			{ gameTimeUtcIso8601: "2026-01-01T10:00:00Z", opponent: "BOS", isHomeGame: false },
			{ gameTimeUtcIso8601: "2026-01-02T10:00:00Z", opponent: "MIA", isHomeGame: true },
		];

		const upcoming = getUpcomingGames(schedule, now);

		expect(upcoming).toHaveLength(1);
		expect(upcoming[0].opponent).toBe("MIA");
	});

	it("returns final game time from schedule data", async () => {
		const finalGameTime = await getFinalGameTime();
		expect(finalGameTime).toBeInstanceOf(Date);
		expect(Number.isNaN(finalGameTime.getTime())).toBe(false);
	});

	it("returns team data with only upcoming games", async () => {
		const now = new Date("2024-10-01T00:00:00Z");
		const teamData = await getTeamData("BOS", now);

		expect(teamData).toHaveProperty("name");
		expect(teamData).toHaveProperty("schedule");
		expect(Array.isArray(teamData.schedule)).toBe(true);
		expect(
			teamData.schedule.every(
				(game) => new Date(game.gameTimeUtcIso8601) > now,
			),
		).toBe(true);
	});

	it("throws for an unknown team", async () => {
		await expect(getTeamData("NOT_A_TEAM")).rejects.toThrow(
			"Schedule not found for team: NOT_A_TEAM",
		);
	});
});
