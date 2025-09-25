from datetime import datetime
import pytz
from dateutil import parser

def format_date_time(date, time, tz_name=None):
    if tz_name is None:
        tz_name = 'America/New_York' # Default timezone if none provided
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
    test_times = [
        ("Oct 22, 2025", "7:30pm", 'America/New_York'),
        ("Oct 22, 2025", "6:30pm", 'America/Chicago'),
        ("Oct 22, 2025", "5:30pm", 'America/Denver'),
        ("Oct 22, 2025", "4:30pm", 'America/Los_Angeles'),
        ("Oct 23, 2025", "12:30am", 'Europe/London'),
        ("Oct 23, 2025", "8:30am", 'Asia/Tokyo'),
        ("bad-date", "bad-time", 'America/New_York'),
        ("Oct 22, 2025", "7:30pm", 'Invalid/Timezone'),
    ]
    for date, time, tz in test_times:
        result = format_date_time(date, time, tz)
        print(f"Date: {date}, Time: {time}, TZ: {tz} -> {result}")