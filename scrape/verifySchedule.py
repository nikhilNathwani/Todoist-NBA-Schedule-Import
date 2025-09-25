import json
import os
from datetime import datetime, timezone
from constants import TEAM_IDS

def verify_schedule(json_path: str) -> bool:
    """
    Verifies the NBA schedule JSON file meets all requirements:
    - Has all 30 NBA teams
    - Each team has exactly 80 regular season games
    - All game times are in valid UTC format
    
    Args:
        json_path (str): Path to the NBA schedule JSON file
        
    Returns:
        bool: True if all checks pass, False otherwise
    """
    # Use canonical team IDs from constants.py
    EXPECTED_TEAMS = set(TEAM_IDS)
    
    try:
        with open(json_path, 'r') as f:
            schedule = json.load(f)
            
        # Check 1: All teams present
        actual_teams = set(schedule.keys())
        missing_teams = EXPECTED_TEAMS - actual_teams
        extra_teams = actual_teams - EXPECTED_TEAMS
        
        if missing_teams:
            print(f"❌ Missing teams: {missing_teams}")
            return False
        if extra_teams:
            print(f"❌ Unexpected teams: {extra_teams}")
            return False
        print("✅ All 30 NBA teams present")
            
        # Check 2: 80 games per team
        for team_id, team_data in schedule.items():
            games = team_data['schedule']
            if len(games) != 80:
                print(f"❌ {team_id} has {len(games)} games (expected 80)")
                return False
        print("✅ All teams have exactly 80 games")
            
        # Check 3: Valid UTC timestamps
        for team_id, team_data in schedule.items():
            for game in team_data['schedule']:
                # Check UTC format
                try:
                    datetime.fromisoformat(game['gameTimeUtcIso8601'].replace('Z', '+00:00'))
                except ValueError:
                    print(f"❌ Invalid UTC timestamp in {team_id}'s schedule: {game['gameTimeUtcIso8601']}")
                    return False
                    
        print("✅ All game times are in valid UTC format")
        print("\n✨ All checks passed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error verifying schedule: {str(e)}")
        return False

if __name__ == "__main__":
    # Get path to NBA schedule JSON
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    schedule_path = os.path.join(project_root, "data", "nba_schedule.json")
    
    # Run verification
    verify_schedule(schedule_path)