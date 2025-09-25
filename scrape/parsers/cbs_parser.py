import requests
from bs4 import BeautifulSoup
from typing import List
from game import Game
from .base_parser import BaseParser

class CBSParser(BaseParser):
    """Parser for CBS Sports NBA schedules."""
    
    # CBS Sports to canonical mapping (CBS-specific)
    CBS_ABBREV_TO_CANONICAL = {
        "BOS": "BOS", "BKN": "BKN", "NY": "NYK", "PHI": "PHI", "TOR": "TOR",
        "CHI": "CHI", "CLE": "CLE", "DET": "DET", "IND": "IND", "MIL": "MIL",
        "ATL": "ATL", "CHA": "CHA", "MIA": "MIA", "ORL": "ORL", "WAS": "WAS",
        "DEN": "DEN", "MIN": "MIN", "OKC": "OKC", "POR": "POR", "UTA": "UTA",
        "GS": "GSW", "LAC": "LAC", "LAL": "LAL", "PHO": "PHO", "SAC": "SAC",
        "DAL": "DAL", "HOU": "HOU", "MEM": "MEM", "NO": "NOP", "SA": "SAS"
    }

    CBS_CITY_TO_CANONICAL = {
        "Atlanta": "ATL", "Boston": "BOS", "Brooklyn": "BKN",
        "Charlotte": "CHA", "Chicago": "CHI", "Cleveland": "CLE",
        "Dallas": "DAL", "Denver": "DEN", "Detroit": "DET",
        "Golden St.": "GSW", "Houston": "HOU", "Indiana": "IND",
        "L.A. Clippers": "LAC", "L.A. Lakers": "LAL", "Memphis": "MEM",
        "Miami": "MIA", "Milwaukee": "MIL", "Minnesota": "MIN",
        "New Orleans": "NOP", "New York": "NYK", "Oklahoma City": "OKC",
        "Orlando": "ORL", "Philadelphia": "PHI", "Phoenix": "PHO",
        "Portland": "POR", "Sacramento": "SAC", "San Antonio": "SAS",
        "Toronto": "TOR", "Utah": "UTA", "Washington": "WAS"
    }

    def getTeamScheduleLinks(self) -> List[str]:
        """Get list of all team schedule URLs from CBS Sports."""
        url = "https://www.cbssports.com/nba/teams/"
        response = requests.get(url)
        soup = BeautifulSoup(response.content, "html.parser")
        links = []
        for a in soup.select(".TeamLogoNameLockup-name a"):
            href = a.get("href")
            links.append("https://www.cbssports.com" + href + "schedule/regular/")
        return links

    def getTeamID(self, url: str) -> str:
        """Extract team ID from CBS Sports URL."""
        parts = url.split("/")
        try:
            idx = parts.index("teams")
            cbs_abbr = parts[idx + 1]
            canonical_id = self.CBS_ABBREV_TO_CANONICAL.get(cbs_abbr)
            if not canonical_id:
                raise ValueError(f"No canonical mapping for CBS abbr: {cbs_abbr}")
            return canonical_id
        except (ValueError, IndexError):
            raise ValueError(f"Could not extract team ID from url: {url}")

    def scrapeGames(self, url: str) -> List[Game]:
        """Scrape all games from a team's CBS Sports schedule page."""
        games = []
        response = requests.get(url)
        soup = BeautifulSoup(response.content, "html.parser")
        schedule = soup.find("tbody")
        if not schedule:
            return games
        
        rows = schedule.findAll("tr")
        for row in rows:
            date = self._scrapeDate(row)
            isHomeGame = self._scrapeIsHomeGame(row)
            opponent = self._scrapeOpponent(row)
            time = self._scrapeTime(row)
            games.append(Game(opponent, isHomeGame, date, time))
        return games

    def _scrapeIsHomeGame(self, row) -> bool:
        """Helper method to determine if game is home or away."""
        opponentPrefixSpan = row.find(class_="CellLogoNameLockup-opposingPrefix")
        opponentPrefixValue = opponentPrefixSpan.text.strip()
        if opponentPrefixValue == "@":
            return False
        elif opponentPrefixValue == "vs":
            return True
        else:
            raise ValueError(f"Unexpected opponent prefix: {opponentPrefixValue}")

    def _scrapeDate(self, row) -> str:
        """Helper method to extract game date."""
        dateElement = row.find(class_="CellGameDate")
        return dateElement.text.strip()

    def _scrapeTime(self, row) -> str:
        """Helper method to extract game time."""
        timeElement = row.find(class_="CellGame").find("a")
        return timeElement.text.replace(" ", "")

    def _scrapeOpponent(self, row) -> str:
        """Helper method to extract opponent's canonical team ID."""
        opponentElement = row.find(class_="TeamName").find("a")
        href = opponentElement.get("href", "")
        parts = href.split("/")
        try:
            idx = parts.index("teams")
            cbs_abbr = parts[idx + 1]
            canonical_id = self.CBS_ABBREV_TO_CANONICAL.get(cbs_abbr)
            if not canonical_id:
                raise ValueError(f"No canonical mapping found for CBS abbreviation: {cbs_abbr}")
            return canonical_id
        except (ValueError, IndexError):
            raise ValueError(f"Could not extract canonical team ID from opponent element: {opponentElement}")