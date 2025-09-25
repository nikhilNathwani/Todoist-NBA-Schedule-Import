import os
from parsers.cbs_parser import CBSParser
from schedulesToJson import save_schedules_to_json

"""
Annual Update Instructions:
1. Run this script in July/August when next season's schedule is released
2. The script will update data/nba_schedule.json with the new season's games
3. Run verify_schedule.py to validate the output JSON:
   - Checks for all 30 NBA teams
   - Verifies each team has 80 games
   - Validates game times are proper UTC format
4. (If validation fails) Verify the parser still works with CBS Sports' website structure
   - If the site structure changed, update CBSParser accordingly
   - Or if using a new site, create a new parser subclassing BaseParser
5. Once verification passes, commit and push the updated nba_schedule.json file

Example: 
1. python3 main.py
2. python3 verify_schedule.py
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
    print(f"{'All' if len(team_schedules)>=30 else 'Only'} {len(team_schedules)} schedules saved to file.")

if __name__ == "__main__":
    main()
