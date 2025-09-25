import os
from parsers.cbs_parser import CBSParser
from schedulesToJson import save_schedules_to_json
from verifySchedule import verify_schedule

"""
Annual Update Instructions:
1. Run this script in July/August when next season's schedule is released
2. The script will:
   a) Update data/nba_schedule.json with the new season's games
   b) Automatically verify:
      - All 30 NBA teams are present
      - Each team has 80 games
      - Game times are in proper UTC format
3. If verification fails:
   - Check if CBS Sports' website structure changed
   - Update CBSParser accordingly or create new parser
4. Once verification passes, commit and push the updated nba_schedule.json

Example: python3 main.py
"""

# Define output json path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NBA_SCHEDULE_JSON_PATH = os.path.join(PROJECT_ROOT, "data", "nba_schedule.json")

def main():
    parser = CBSParser()

    # Get links to all team schedules
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
    
    # Verify the saved schedule
    print("\nVerifying saved schedule...")
    if not verify_schedule(NBA_SCHEDULE_JSON_PATH):
        print("\n❌ Schedule verification failed! Please check the errors above.")
        exit(1) # exit with error code if verification fails
    else:
        print("\n✅ Schedule update and verification complete!")

if __name__ == "__main__":
    main()
