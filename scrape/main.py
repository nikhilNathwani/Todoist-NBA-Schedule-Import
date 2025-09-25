import os
from parsers.cbs_parser import CBSParser
from schedulesToJson import save_schedules_to_json

def main():
    parser = CBSParser()
    schedule_links = parser.getTeamScheduleLinks()
    print(f"Found {len(schedule_links)} team schedule links.")  
   
    # Use absolute path relative to script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    scheduleJson_filename = os.path.join(os.path.dirname(script_dir), "data", "nba_schedule.json")
   
    # Collect all team schedules
    team_schedules = {}
    for url in schedule_links:
        team_id = parser.getTeamID(url)
        print(f"Processing team {team_id} from URL: {url}")
        games = parser.scrapeGames(url)
        team_schedules[team_id] = games
        print(f"Scraped {team_id}: {len(games)} games")
    
    # Save all schedules at once
    save_schedules_to_json(team_schedules, scheduleJson_filename)
    processed_teams = len(team_schedules)
    print(f"{'All' if processed_teams>=30 else 'Only'} {processed_teams} schedules saved to file.")

if __name__ == "__main__":
    main()
