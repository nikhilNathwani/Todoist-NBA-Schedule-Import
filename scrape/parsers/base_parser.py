from abc import ABC, abstractmethod
from typing import List
from game import Game

class BaseParser(ABC):
    """Base class that defines the interface any schedule parser must implement."""
    
    @abstractmethod
    def getTeamScheduleLinks(self) -> List[str]:
        """
        Returns list of URLs to each team's schedule page.
        
        Returns:
            List[str]: List of URLs to team schedule pages
        """
        pass
    
    @abstractmethod
    def getTeamID(self, url: str) -> str:
        """
        Extract team ID from a team's schedule URL.
        
        Args:
            url (str): URL to team's schedule page
            
        Returns:
            str: Team's canonical ID (e.g., 'BOS', 'LAL')
        """
        pass
        
    @abstractmethod
    def scrapeGames(self, url: str) -> List[Game]:
        """
        Scrapes all games from a team's schedule page.
        
        Args:
            url (str): URL to team's schedule page
            
        Returns:
            List[Game]: List of Game objects representing the team's schedule
        """
        pass