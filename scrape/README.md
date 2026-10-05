# NBA Schedule Scraper

Python scripts for scraping NBA team schedules from CBS Sports.

## Setup

### First Time Setup

```bash
cd scrape

# Create the virtual environment with uv (uses the Python version in .python-version)
uv venv --managed-python .venv

# Install dependencies
uv pip install --python .venv/bin/python -r requirements.txt

# Activate virtual environment
source .venv/bin/activate
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

See [docs/SCRAPE_INSTRUCTIONS.md](../docs/SCRAPE_INSTRUCTIONS.md) for detailed workflow.

## Adding Python Packages

```bash
cd scrape
source .venv/bin/activate
uv pip install new-package
uv pip freeze > requirements.txt
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
