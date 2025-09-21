class Team:
    def __init__(self, teamID, info, schedule):
        self.teamID = teamID
        self.name = info["name"]
        self.nameCasual = info["nameCasual"]
        self.city = info["city"]
        self.color = info["color"]
        self.schedule = schedule  # list of Game objects

    def to_dict(self):
        return {
            "name": self.name,
            "nameCasual": self.nameCasual,
            "city": self.city,
            "color": self.color,
            "schedule": [g.to_dict() for g in self.schedule]
        }
