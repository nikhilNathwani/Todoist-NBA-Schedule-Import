# Entrypoint for NBA schedule scraping
import json
from parsers.cbs_parser import CBSScheduleParser
from .constants import teams
from .team import Team

def scrapeAllTeamSchedules(parser_class):
    """
    Scrape all team schedules using the provided parser class.
    The parser class must implement getTeamScheduleLinks (class method), getTeamID (class method), and parse_team_schedule (instance method).
    """
    teamSchedules = {}
    links = parser_class.getTeamScheduleLinks()
    for link in links:
        teamID = parser_class.getTeamID(link)
        team_info = teams[teamID]
        parser_instance = parser_class()
        schedule = parser_instance.parse_team_schedule(link)
        team_obj = Team(teamID, team_info, schedule)
        teamSchedules[teamID] = team_obj
    return teamSchedules

def saveSchedulesToJSON(schedules, filename):
    print("\n\n Saving schedules to " + filename)
    with open(filename, 'w') as f:
        print("opened file " + filename)
        # Convert Team objects to dicts for JSON serialization
        json.dump({tid: team.to_dict() for tid, team in schedules.items()}, f, indent=4)

if __name__ == "__main__":
    schedules = scrapeAllTeamSchedules(CBSScheduleParser)
    print(schedules)
    saveSchedulesToJSON(schedules, "data/nba_schedule.json")
