from constants import TEAM_METADATA
from formatDateTime import format_date_time

class Game:
    def __init__(self, opponent_id, isHomeGame, date, time):
        self.opponent_id = opponent_id
        self.isHomeGame = isHomeGame
        self.gameTimeUtcIso8601 = format_date_time(date, time, 'America/New_York')

    def to_dict(self):
        if self.opponent_id not in TEAM_METADATA:
            raise ValueError(f"No team metadata found for opponent_id: {self.opponent_id}")
        return {
            "opponent": TEAM_METADATA[self.opponent_id]["nameCasual"],
            "isHomeGame": self.isHomeGame,
            "gameTimeUtcIso8601": self.gameTimeUtcIso8601
        }

# Test code
if __name__ == "__main__":
    test_cases = [
        ("Knicks", True, "Oct 22, 2025", "7:30pm", 'America/New_York'),
        ("Lakers", False, "Oct 22, 2025", "6:30pm", 'America/Chicago'),
        ("Bulls", True, "Oct 22, 2025", "5:30pm", 'America/Denver'),
        ("Heat", False, "Oct 22, 2025", "4:30pm", 'America/Los_Angeles'),
        ("Raptors", True, "Oct 23, 2025", "12:30am", 'Europe/London'),
        ("Spurs", False, "Oct 23, 2025", "8:30am", 'Asia/Tokyo'),
        ("Magic", True, "bad-date", "bad-time", 'America/New_York'),
        ("Cavs", True, "Oct 22, 2025", "7:30pm", 'Invalid/Timezone'),
    ]
    for opponent, isHome, date, time, tz in test_cases:
        g = Game(opponent, isHome, date, time, tz)
        print(g.to_dict())