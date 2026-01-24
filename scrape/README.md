# NBA Schedule Scraper

Python scripts for scraping NBA team schedules from CBS Sports.

## Setup

### First Time Setup

```bash
cd scrape

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Running the Scraper

```bash
# Navigate to scrape folder
cd scrape

# Activate virtual environment
source .venv/bin/activate

# Run the scraper
python3 main.py

# Verify the results
python3 verifySchedule.py

# When done, deactivate venv (optional)
deactivate
```

See [SCRAPE_INSTRUCTIONS.md](../SCRAPE_INSTRUCTIONS.md) for detailed workflow.

## Adding Python Packages

```bash
cd scrape
source .venv/bin/activate
pip install new-package
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Add new-package"
```

## Dependencies

See [requirements.txt](requirements.txt) for full list. Main dependencies:

- `beautifulsoup4` - HTML parsing
- `requests` - HTTP requests
- `python-dateutil` - Date parsing
- `pytz` - Timezone handling

## Output

Updates `../data/nba_schedule.json` with the latest NBA schedules for all 30 teams.
