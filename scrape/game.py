class Game:
    def __init__(self, opponent, isHomeGame, gameTimeUtcIso8601):
        self.opponent = opponent
        self.isHomeGame = isHomeGame
        self.gameTimeUtcIso8601 = gameTimeUtcIso8601

    def to_dict(self):
        return {
            "opponent": self.opponent,
            "isHomeGame": self.isHomeGame,
            "gameTimeUtcIso8601": self.gameTimeUtcIso8601
        }
