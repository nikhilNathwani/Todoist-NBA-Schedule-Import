import os
import json
from typing import Dict, List
from game import Game
from constants import TEAM_METADATA

def save_schedules_to_json(team_schedules: Dict[str, List[Game]], filename: str) -> None:
    """
    Save all team schedules to a JSON file at once.
    
    Args:
        team_schedules (Dict[str, List[Game]]): Dictionary mapping team IDs to their game schedules
        filename (str): Path to the JSON file to save to
    """
    # Ensure directory exists
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    # Convert schedules to JSON-serializable format
    json_schedules = {}
    for team_id, games in team_schedules.items():
        # Add team metadata and schedule
        metadata = TEAM_METADATA[team_id]
        json_schedules[team_id] = {
            "name": metadata["name"],
            "nameCasual": metadata["nameCasual"],
            "city": metadata["city"],
            "color": metadata["color"],
            "schedule": [game.to_dict() for game in games]
        }
    
    # Write to file
    with open(filename, 'w') as f:
        json.dump(json_schedules, f, indent=4)