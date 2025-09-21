
class TeamScheduleParser:
    """
    Abstract base class for NBA team schedule parsers.

    Required class variables:
        url (str): The base URL to traverse team schedule pages. Subclasses must override this.

    Required methods (must be implemented by subclasses):
        - getTeamScheduleLinks(cls): Return a list of URLs for each NBA team's schedule page for this site.
        - scrapeOpponent(self, game_data): Extract the opponent from a game entry (HTML element, dict, etc).
        - scrapeIsHomeGame(self, game_data): Determine if the game is a home game from a game entry.
        - scrapeDate(self, game_data): Extract the date from a game entry.
        - scrapeTime(self, game_data): Extract the time from a game entry.
        - formatDateTime(self, date, time): Convert date and time strings to a standard format (e.g., ISO8601).
    """
    url = None  # Subclasses must override with their base URL

    @classmethod
    def getTeamScheduleLinks(cls):
        """
        Return a list of URLs for each NBA team's schedule page for this site.
        Must be implemented by each subclass.
        Raises:
            NotImplementedError: If 'url' is not defined or method is not implemented in subclass.
        """
        if cls.url is None:
            raise NotImplementedError(f"{cls.__name__} must define a class variable 'url' with the base URL for the team schedule.")
        raise NotImplementedError("Subclasses must implement getTeamScheduleLinks().")


    def scrapeOpponent(self, game_data):
        """
        Extract the opponent from a game entry (HTML element, dict, etc).
        Must be implemented by subclass.
        """
        raise NotImplementedError

    def scrapeIsHomeGame(self, game_data):
        """
        Determine if the game is a home game from a game entry.
        Must be implemented by subclass.
        """
        raise NotImplementedError

    def scrapeDate(self, game_data):
        """
        Extract the date from a game entry.
        Must be implemented by subclass.
        """
        raise NotImplementedError

    def scrapeTime(self, game_data):
        """
        Extract the time from a game entry.
        Must be implemented by subclass.
        """
        raise NotImplementedError

    def formatDateTime(self, date, time):
        """
        Convert date and time strings to a standard format (e.g., ISO8601).
        Must be implemented by subclass.
        """
        raise NotImplementedError
