from datetime import datetime
import pytz
from dateutil import parser

class Game:
    def __init__(self, opponent, isHomeGame, date, time, tz_name=None):
        if tz_name is None:
            tz_name = 'America/New_York' # Default timezone if none provided
        self.opponent = opponent
        self.isHomeGame = isHomeGame
        self.gameTimeUtcIso8601 = self.formatDateTime(date, time, tz_name)

    def to_dict(self):
        return {
            "opponent": self.opponent,
            "isHomeGame": self.isHomeGame,
            "gameTimeUtcIso8601": self.gameTimeUtcIso8601
        }

    def formatDateTime(self, date, time, tz_name):
        date_str = date + " " + time
        # Try strict parsing first
        try:
            date_format = "%b %d, %Y %I:%M%p"
            naive_date = datetime.strptime(date_str, date_format)
        except Exception:
            try:
                # Fallback to flexible parsing
                naive_date = parser.parse(date_str)
            except Exception as e:
                print(f"Warning: Could not parse date/time '{date} {time}': {e}")
                return None
        try:
            tz = pytz.timezone(tz_name)
        except Exception as e:
            print(f"Warning: Could not use timezone '{tz_name}': {e}. Defaulting to America/New_York.")
            tz = pytz.timezone('America/New_York')
        localized_date = tz.localize(naive_date)
        utc_date = localized_date.astimezone(pytz.utc)
        return utc_date.isoformat()

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