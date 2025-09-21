
from bs4 import BeautifulSoup
import requests
from ..game import Game
from ..constants import teams, cityToTeamNamesCasual
from datetime import datetime
import pytz
from .base_parser import TeamScheduleParser



class CBSScheduleParser(TeamScheduleParser):

######################################################
##  Class Methods                                   ##
######################################################
    url_root = "https://www.cbssports.com/nba/teams/"

    @classmethod
    def getTeamID(cls, link):
        """
        Extract the team ID from a CBS Sports team URL.
        """
        return link.split(cls.url_root)[-1].split("/")[0]

    @classmethod
    def getTeamScheduleLinks(cls):
        response = requests.get(cls.url_root)
        soup = BeautifulSoup(response.content, "html.parser")
        rows = soup.findAll('tr', class_='TableBase-bodyTr')

        links = []
        for i, row in enumerate(rows):
            linkCell = row.findAll("a")[-1]
            link = linkCell["href"]
            link = cls.url_root + link.split("/nba/teams/")[-1]
            print(f"Link {i+1}: {link}")
            links.append(link)
        return links


######################################################
##  Instance Methods                                ##
######################################################
    def setTeamObject(self, teamID):
        teamID = parser_class.getTeamID(link)
        team_info = teams[teamID]
        parser_instance = parser_class()
        schedule = parser_instance.parse_team_schedule(link)
        team_obj = Team(teamID, team_info, schedule)

    def scrapeOpponent(self, row):
        opponentElement = row.find(class_ = "TeamName").find("a")
        opponent = opponentElement.text
        opponent = cityToTeamNamesCasual[opponent]
        return opponent

    def scrapeIsHomeGame(self, row):
        opponentPrefixSpan = row.find(class_ = "CellLogoNameLockup-opposingPrefix")
        opponentPrefixValue = opponentPrefixSpan.text.strip()
        if opponentPrefixValue == "@":
            return False
        elif opponentPrefixValue == "vs":
            return True
        else:
            return "?"

    def scrapeDate(self, row):
        dateElement = row.find(class_ = "CellGameDate")
        return dateElement.text.strip()

    def scrapeTime(self, row):
        timeElement = row.find(class_ = "CellGame").find("a")
        return timeElement.text.replace(" ","")

    def formatDateTime(self, date, time):
        date_str = date + " " + time
        date_format = "%b %d, %Y %I:%M%p"
        naive_date = datetime.strptime(date_str, date_format)
        eastern = pytz.timezone('America/New_York')
        localized_date = eastern.localize(naive_date)
        utc_date = localized_date.astimezone(pytz.utc)
        rfc3339_format = utc_date.isoformat()
        return rfc3339_format

    def parse_team_schedule(self, team_url):
        """
        Fetch and parse the NBA team schedule page at team_url, returning a list of Game objects.
        """
        response = requests.get(team_url)
        soup = BeautifulSoup(response.content, "html.parser")
        games = []
        upcoming_tables = soup.findAll(class_ = "TableBaseWrapper")
        if not upcoming_tables:
            print("No tables found in HTML")
            return games
        upcomingGames = upcoming_tables[-1]
        schedule = upcomingGames.find("tbody")
        if not schedule:
            print("No schedule found")
            return games
        rows = schedule.findAll("tr")
        for row in rows:
            opponent = self.scrapeOpponent(row)
            isHomeGame = self.scrapeIsHomeGame(row)
            date = self.scrapeDate(row)
            time = self.scrapeTime(row)
            gameTimeUtcIso8601 = self.formatDateTime(date, time)
            games.append(Game(opponent, isHomeGame, gameTimeUtcIso8601))
        return games
