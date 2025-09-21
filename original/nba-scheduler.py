import requests
from datetime import datetime
import pytz
from config import team, auth_key
from bs4 import BeautifulSoup
from todoist_api_python.api import TodoistAPI

teams = {
    "Atlanta": {"formal": "Hawks", "casual": "hawks", "color": "red"},
    "Boston": {"formal": "Celtics", "casual": "celtics", "color": "green"},
    "Brooklyn": {"formal": "Nets", "casual": "nets", "color": "grey"},
    "Charlotte": {"formal": "Hornets", "casual": "hornets", "color": "mint_green"},
    "Chicago": {"formal": "Bulls", "casual": "bulls", "color": "red"},
    "Cleveland": {"formal": "Cavaliers", "casual": "cavs", "color": "berry_red"},
    "Dallas": {"formal": "Mavericks", "casual": "mavs", "color": "blue"},
    "Denver": {"formal": "Nuggets", "casual": "nuggets", "color": "light_blue"},
    "Detroit": {"formal": "Pistons", "casual": "pistons", "color": "blue"},
    "Golden State": {"formal": "Warriors", "casual": "warriors", "color": "yellow"},
    "Houston": {"formal": "Rockets", "casual": "rockets", "color": "red"},
    "Indiana": {"formal": "Pacers", "casual": "pacers", "color": "yellow"},
    "L.A. Clippers": {"formal": "Clippers", "casual": "clippers", "color": "red"},
    "L.A. Lakers": {"formal": "Lakers", "casual": "lakers", "color": "violet"},
    "Memphis": {"formal": "Grizzlies", "casual": "grizzlies", "color": "light_blue"},
    "Miami": {"formal": "Heat", "casual": "heat", "color": "berry_red"},
    "Milwaukee": {"formal": "Bucks", "casual": "bucks", "color": "taupe"},
    "Minnesota": {"formal": "Timberwolves", "casual": "t-wolves", "color": "lime_green"},
    "New Orleans": {"formal": "Pelicans", "casual": "pelicans", "color": "taupe"},
    "New York": {"formal": "Knicks", "casual": "knicks", "color": "orange"},
    "Oklahoma City": {"formal": "Thunder", "casual": "thunder", "color": "blue"},
    "Orlando": {"formal": "Magic", "casual": "magic", "color": "blue"},
    "Philadelphia": {"formal": "76ers", "casual": "76ers", "color": "red"},
    "Phoenix": {"formal": "Suns", "casual": "suns", "color": "orange"},
    "Portland": {"formal": "Trail Blazers", "casual": "blazers", "color": "red"},
    "Sacramento": {"formal": "Kings", "casual": "kings", "color": "grape"},
    "San Antonio": {"formal": "Spurs", "casual": "spurs", "color": "grey"},
    "Toronto": {"formal": "Raptors", "casual": "raptors", "color": "red"},
    "Utah": {"formal": "Jazz", "casual": "jazz", "color": "grape"},
    "Washington": {"formal": "Wizards", "casual": "wizards", "color": "red"}
}


# To-do:
# -Create project with team name

class Game:
  def __init__(self, opponent, date, time):
    self.opponent = opponent
    self.date = date
    self.time = time


# ~~~~~~~~ SCRAPING THE NBA SCHEDULE SITE ~~~~~~~~
def scrapeGames(url):
    games=[]
    response = requests.get(url)
    soup= BeautifulSoup(response.content, "html.parser")
    schedule = soup.find("tbody")
    if not schedule:
        print("No schedule found")
    else:
        rows= schedule.findAll("tr")
        for row in rows:
           opponent= scrapeOpponent(row)
           date= scrapeDate(row)
           time= scrapeTime(row)
           games.append(Game(opponent, date, time))
        #    print(i+1, opponent, date, time)
    return games

def scrapeOpponent(row):
   opponentElement= row.find(class_ = "TeamName").find("a")
   opponent= opponentElement.text
   #my preferred formatting:
   opponent = teams[opponent]["casual"]
   return opponent

def scrapeDate(row):
   dateElement= row.find(class_ = "CellGameDate")
   return dateElement.text.strip()

def scrapeTime(row): 
   timeElement= row.find(class_ = "CellGame").find("a")
   return timeElement.text.replace(" ","")


# ~~~~~~~~ UPLOADING SCHEDULE TO TODOIST ~~~~~~~~~
api = TodoistAPI(auth_key)

def addTodoistTask(game, projectID):
    taskContent= "Celtics " + game.opponent
    taskDueDatetime= formatDate(game.date, game.time)
    api.add_task(content=taskContent, due_datetime=taskDueDatetime, project_id=projectID)

def uploadScheduleToTodoist(games, projectID):
   for game in games:
      addTodoistTask(game, projectID)

#creates Todoist project and returns project ID
def createTodoistProject(teamCity):
   project = api.add_project(name= teams[teamCity]["formal"] + " new", color= teams[teamCity]["color"])
   return project.id

def formatDate(date, time):
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

   print(rfc3339_format)
   return rfc3339_format

# ~~~~~~~~ MAIN THREAD ~~~~~~~~~~~~~~~~~~~~~~~~~~~
if __name__ ==  "__main__": 
   # Site to scrape NBA schedule from:
   nbaScheduleURL= "https://www.cbssports.com/nba/teams/BOS/boston-celtics/schedule/regular/"
   games= scrapeGames(nbaScheduleURL)

   # Todoist project to add my tasks to:
   todoistProjectId= createTodoistProject(team);  
   uploadScheduleToTodoist(games,todoistProjectId) 