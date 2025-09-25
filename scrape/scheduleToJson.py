import json
import os
from constants import TEAM_METADATA

def save_schedule_to_json(games, filename, team_id):
    """Save a team's schedule to a new JSON file.
    
    Args:
        -games: List of Game objects representing a team's schedule
        -filename: Path to the JSON file to create/overwrite
        -team_id: The canonical ID of the team (e.g., 'BOS', 'LAL')
    """
    if team_id not in TEAM_METADATA:
        raise ValueError(f"Team ID {team_id} not found in team metadata")

    # Read existing data (if any)
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = {}
    
    # Update/add this team's data
    data[team_id] = {
        "name": TEAM_METADATA[team_id]["name"],
        "nameCasual": TEAM_METADATA[team_id]["nameCasual"],
        "city": TEAM_METADATA[team_id]["city"],
        "color": TEAM_METADATA[team_id]["color"],
        "schedule": [game.to_dict() for game in games]
    }
    
    # Write back the complete data
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)