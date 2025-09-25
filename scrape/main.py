import os
from parsers.cbs_parser import CBSParser
from schedulesToJson import save_schedules_to_json

# Define output json path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NBA_SCHEDULE_JSON_PATH = os.path.join(PROJECT_ROOT, "data", "nba_schedule.json")

def main():
    parser = CBSParser()
    schedule_links = parser.getTeamScheduleLinks()
    print(f"Found {len(schedule_links)} team schedule links.")
   
    # Collect all team schedules
    team_schedules = {}
    for url in schedule_links:
        team_id = parser.getTeamID(url)
        print(f"Processing team {team_id} from URL: {url}")
        games = parser.scrapeGames(url)
        team_schedules[team_id] = games
        print(f"Scraped {team_id}: {len(games)} games")
    
    # Save all schedules at once
    save_schedules_to_json(team_schedules, NBA_SCHEDULE_JSON_PATH)
    print(f"{'All' if len(team_schedules)>=30 else 'Only'} {len(team_schedules)} schedules saved to file.")

if __name__ == "__main__":
    main()
