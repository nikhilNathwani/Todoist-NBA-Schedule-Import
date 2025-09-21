# NBA team constants for scraping and schedule processing

teams = {
    "ATL": {"name": "Hawks", "nameCasual": "hawks", "city": "Atlanta", "color": "red"},
    "BOS": {"name": "Celtics", "nameCasual": "celtics", "city": "Boston", "color": "green"},
    "BKN": {"name": "Nets", "nameCasual": "nets", "city": "Brooklyn", "color": "grey"},
    "CHA": {"name": "Hornets", "nameCasual": "hornets", "city": "Charlotte", "color": "mint_green"},
    "CHI": {"name": "Bulls", "nameCasual": "bulls", "city": "Chicago", "color": "red"},
    "CLE": {"name": "Cavaliers", "nameCasual": "cavs", "city": "Cleveland", "color": "berry_red"},
    "DAL": {"name": "Mavericks", "nameCasual": "mavs", "city": "Dallas", "color": "blue"},
    "DEN": {"name": "Nuggets", "nameCasual": "nuggets", "city": "Denver", "color": "light_blue"},
    "DET": {"name": "Pistons", "nameCasual": "pistons", "city": "Detroit", "color": "blue"},
    "GS": {"name": "Warriors", "nameCasual": "warriors", "city": "Golden State", "color": "yellow"},
    "HOU": {"name": "Rockets", "nameCasual": "rockets", "city": "Houston", "color": "red"},
    "IND": {"name": "Pacers", "nameCasual": "pacers", "city": "Indiana", "color": "yellow"},
    "LAC": {"name": "Clippers", "nameCasual": "clippers", "city": "Los Angeles", "color": "red"},
    "LAL": {"name": "Lakers", "nameCasual": "lakers", "city": "Los Angeles", "color": "violet"},
    "MEM": {"name": "Grizzlies", "nameCasual": "grizzlies", "city": "Memphis", "color": "light_blue"},
    "MIA": {"name": "Heat", "nameCasual": "heat", "city": "Miami", "color": "berry_red"},
    "MIL": {"name": "Bucks", "nameCasual": "bucks", "city": "Milwaukee", "color": "taupe"},
    "MIN": {"name": "Timberwolves", "nameCasual": "t-wolves", "city": "Minnesota", "color": "lime_green"},
    "NO": {"name": "Pelicans", "nameCasual": "pelicans", "city": "New Orleans", "color": "taupe"},
    "NY": {"name": "Knicks", "nameCasual": "knicks", "city": "New York", "color": "orange"},
    "OKC": {"name": "Thunder", "nameCasual": "thunder", "city": "Oklahoma City", "color": "blue"},
    "ORL": {"name": "Magic", "nameCasual": "magic", "city": "Orlando", "color": "blue"},
    "PHI": {"name": "Sixers", "nameCasual": "sixers", "city": "Philadelphia", "color": "red"},
    "PHO": {"name": "Suns", "nameCasual": "suns", "city": "Phoenix", "color": "orange"},
    "POR": {"name": "Blazers", "nameCasual": "blazers", "city": "Portland", "color": "red"},
    "SAC": {"name": "Kings", "nameCasual": "kings", "city": "Sacramento", "color": "grape"},
    "SA": {"name": "Spurs", "nameCasual": "spurs", "city": "San Antonio", "color": "grey"},
    "TOR": {"name": "Raptors", "nameCasual": "raptors", "city": "Toronto", "color": "red"},
    "UTA": {"name": "Jazz", "nameCasual": "jazz", "city": "Utah", "color": "grape"},
    "WAS": {"name": "Wizards", "nameCasual": "wizards", "city": "Washington", "color": "red"}
}

cityToTeamNamesCasual = {
    "Atlanta": "hawks",           "Boston": "celtics",         "Brooklyn": "nets",
    "Charlotte": "hornets",       "Chicago": "bulls",          "Cleveland": "cavs",
    "Dallas": "mavs",             "Denver": "nuggets",         "Detroit": "pistons",
    "Golden St.": "warriors",      "Houston": "rockets",        "Indiana": "pacers",
    "L.A. Clippers": "clippers",  "L.A. Lakers": "lakers",     "Memphis": "grizzlies",
    "Miami": "heat",              "Milwaukee": "bucks",        "Minnesota": "t-wolves",
    "New Orleans": "pelicans",    "New York": "knicks",        "Oklahoma City": "thunder",
    "Orlando": "magic",           "Philadelphia": "76ers",      "Phoenix": "suns",
    "Portland": "blazers",        "Sacramento": "kings",        "San Antonio": "spurs",
    "Toronto": "raptors",         "Utah": "jazz",              "Washington": "wizards"
}
