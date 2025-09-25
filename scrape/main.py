import os
import json
from scrapeSchedules import getTeamScheduleLinks, getTeamID, scrapeGames
from scheduleToJson import save_schedule_to_json

def main():
    schedule_links = getTeamScheduleLinks()
    print(f"Found {len(schedule_links)} team schedule links.")  
   
    # Use absolute path relative to script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    filename = os.path.join(os.path.dirname(script_dir), "data", "nba_schedule.json")
   
    # Start with an empty JSON file
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'w') as f:
        json.dump({}, f, indent=4)
   
    processed_teams = 0
    for url in schedule_links:
        team_id = getTeamID(url)
        print(f"Processing team {team_id} from URL: {url}")
        games = scrapeGames(url)
        save_schedule_to_json(games, filename, team_id)
        processed_teams += 1
        print(f"Updated {team_id}: {len(games)} games")
   
    print(f"{'All' if processed_teams>=30 else 'Only'} {processed_teams} schedules updated.")

if __name__ == "__main__":
    main()
