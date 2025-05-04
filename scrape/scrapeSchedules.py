import requests
import json
import os
from datetime import datetime
import pytz
from bs4 import BeautifulSoup

url= "https://www.cbssports.com/nba/teams/"
teamNamesCasual= {"ATL":"hawks","BOS":"celtics","BKN":"nets","CHA":"hornets","CHI":"bulls","CLE":"cavs","DAL":"mavs","DEN":"nuggets","DET":"pistons","GS":"warriors","HOU":"rockets","IND":"pacers","LAC":"clippers","LAL":"lakers","MEM":"grizzlies","MIA":"heat","MIL":"bucks","MIN":"t-wolves","NO":"pelicans","NY":"knicks","OKC":"thunder","ORL":"magic","PHI":"sixers","PHO":"suns","POR":"blazers","SAC":"kings","SA":"spurs","TOR":"raptors","UTA":"jazz","WAS":"wizards"}
teamNames= {"ATL":"Hawks","BOS":"Celtics","BKN":"Nets","CHA":"Hornets","CHI":"Bulls","CLE":"Cavaliers","DAL":"Mavericks","DEN":"Nuggets","DET":"Pistons","GS":"Warriors","HOU":"Rockets","IND":"Pacers","LAC":"Clippers","LAL":"Lakers","MEM":"Grizzlies","MIA":"Heat","MIL":"Bucks","MIN":"Timberwolves","NO":"Pelicans","NY":"Knicks","OKC":"Thunder","ORL":"Magic","PHI":"Sixers","PHO":"Suns","POR":"Blazers","SAC":"Kings","SA":"Spurs","TOR":"Raptors","UTA":"Jazz","WAS":"Wizards"}
teamCities= {"ATL":"Atlanta","BOS":"Boston","BKN":"Brooklyn","CHA":"Charlotte","CHI":"Chicago","CLE":"Cleveland","DAL":"Dallas","DEN":"Denver","DET":"Detroit","GS":"Golden State","HOU":"Houston","IND":"Indiana","LAC":"Los Angeles","LAL":"Los Angeles","MEM":"Memphis","MIA":"Miami","MIL":"Milwaukee","MIN":"Minnesota","NO":"New Orleans","NY":"New York","OKC":"Oklahoma City","ORL":"Orlando","PHI":"Philadelphia","PHO":"Phoenix","POR":"Portland","SAC":"Sacramento","SA":"San Antonio","TOR":"Toronto","UTA":"Utah","WAS":"Washington"}
teamColors = {
    "ATL": "red", "BOS": "green", "BKN": "grey", "CHA": "mint_green", "CHI": "red",
    "CLE": "berry_red", "DAL": "blue", "DEN": "light_blue", "DET": "blue", "GS": "yellow",
    "HOU": "red", "IND": "yellow", "LAC": "red", "LAL": "violet", "MEM": "light_blue",
    "MIA": "berry_red", "MIL": "taupe", "MIN": "lime_green", "NO": "taupe", "NY": "orange",
    "OKC": "blue", "ORL": "blue", "PHI": "red", "PHO": "orange", "POR": "red",
    "SAC": "grape", "SA": "grey", "TOR": "red", "UTA": "grape", "WAS": "red"
}

cityToTeamNamesCasual= {
    "Atlanta": "hawks",
    "Boston": "celtics",
    "Brooklyn": "nets",
    "Charlotte": "hornets",
    "Chicago": "bulls",
    "Cleveland": "cavs",
    "Dallas": "mavs",
    "Denver": "nuggets",
    "Detroit": "pistons",
    "Golden St.": "warriors",
    "Houston": "rockets",
    "Indiana": "pacers",
    "L.A. Clippers": "clippers",
    "L.A. Lakers": "lakers",
    "Memphis": "grizzlies",
    "Miami": "heat",
    "Milwaukee": "bucks",
    "Minnesota": "t-wolves",
    "New Orleans": "pelicans",
    "New York": "knicks",
    "Oklahoma City": "thunder",
    "Orlando": "magic",
    "Philadelphia": "76ers",
    "Phoenix": "suns",
    "Portland": "blazers",
    "Sacramento": "kings",
    "San Antonio": "spurs",
    "Toronto": "raptors",
    "Utah": "jazz",
    "Washington": "wizards"
}

# ~~~~~~~~ PRE-PROCESSING ~~~~~~~~~~~~~~~~

def getScheduleLinks():
    response = requests.get(url)
    soup= BeautifulSoup(response.content, "html.parser")
    rows = soup.findAll('tr', class_='TableBase-bodyTr')

    links= []
    for i,row in enumerate(rows):
        linkCell= row.findAll("a")[-1]
        link= linkCell["href"]
        link= url+link.split("/nba/teams/")[-1]
        print(f"Link {i+1}: {link}")
        links.append(link)

    return links



# ~~~~~~~~ SCRAPE TEAM SCHEDULES ~~~~~~~~~~~~~~~~

def scrapeAllTeamSchedules(links):
    schedules= {}
    for link in links:
        teamID= link.split(url)[-1].split("/")[0]
        schedules[teamID]= {
            "name": teamNames[teamID], 
            "nameCasual": teamNamesCasual[teamID], 
            "city": teamCities[teamID],
            "color": teamColors[teamID], 
            "schedule": scrapeTeamSchedule(link)}
    return schedules

def scrapeTeamSchedule(link):
    games=[]
    response = requests.get(link)
    soup= BeautifulSoup(response.content, "html.parser")
    upcomingGames= soup.findAll(class_ = "TableBaseWrapper")[-1] #first table is completed games, second (last) is upcoming games
    schedule = upcomingGames.find("tbody")
    if not schedule:
        print("No schedule found")
    else:
        rows= schedule.findAll("tr")
        for row in rows:    
           opponent= scrapeOpponent(row)
           isHomeGame= scrapeIsHomeGame(row)
           date= scrapeDate(row)
           time= scrapeTime(row)
           gameTimeUtcIso8601= formatDateTime(date,time)
           games.append({"opponent":opponent, "isHomeGame":isHomeGame, "gameTimeUtcIso8601":gameTimeUtcIso8601})
    return games


# ~~~~~~~~ CREATE JSON FILE ~~~~~~~~~~~~~~~~

def saveSchedulesToJSON(schedules, filename):
    print("\n\n Saving schedules to " + filename)
    with open(filename, 'w') as f:
        print("opened file " + filename)
        json.dump(schedules, f, indent=4)


# ~~~~~~~~ HELPER FUNCTIONS ~~~~~~~~~~~~~~~~

def scrapeOpponent(row):
   opponentElement= row.find(class_ = "TeamName").find("a")
   opponent= opponentElement.text
   #my preferred formatting:
   opponent= cityToTeamNamesCasual[opponent]
   return opponent

def scrapeIsHomeGame(row):
    opponentPrefixSpan= row.find(class_ = "CellLogoNameLockup-opposingPrefix")
    opponentPrefixValue= opponentPrefixSpan.text.strip()
    if opponentPrefixValue == "@":
        return False
    elif opponentPrefixValue == "vs":
        return True
    else:
        return "?"

def scrapeDate(row):
   dateElement= row.find(class_ = "CellGameDate")
   return dateElement.text.strip()

def scrapeTime(row): 
   timeElement= row.find(class_ = "CellGame").find("a")
   return timeElement.text.replace(" ","")

def formatDateTime(date, time):
   # Step 1: Define the original date and time string
   date_str= date + " " + time
   date_format= "%b %d, %Y %I:%M%p" # Format for (e.g.) "October 22, 2024 7:30pm"
   # Step 2: Parse the date and time
   naive_date= datetime.strptime(date_str, date_format)   
   # Step 3: Create an EST timezone (UTC-5 without daylight saving time)
   eastern = pytz.timezone('America/New_York')
   # Step 4: Localize the naive datetime to the Eastern timezone
   localized_date = eastern.localize(naive_date)
   # Step 5: Convert to UTC
   utc_date = localized_date.astimezone(pytz.utc)
   # Step 6: Format in RFC 3339
   rfc3339_format = utc_date.isoformat()
   return rfc3339_format

# ~~~~~~~~ MAIN THREAD ~~~~~~~~~~~~~~~~~~~~~~~~

if __name__ == "__main__":
    links= getScheduleLinks()
    schedules= scrapeAllTeamSchedules(links)
    print(schedules)
    saveSchedulesToJSON(schedules, "data/nba_schedule.json")
