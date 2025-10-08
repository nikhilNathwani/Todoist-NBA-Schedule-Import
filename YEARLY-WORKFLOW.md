# Annual NBA Schedule Update

1. Run `python3 scrape/main.py` in July/August when next season's schedule is released
2. The script will:
    - Update `data/nba_schedule.json` with the new season's games
    - Automatically verify:
        - All 30 NBA teams are present
        - Each team has 82 games
        - Game times are in proper UTC format
3. If verification fails:
    - Check if CBS Sports' website structure changed
    - Update CBSParser accordingly or create new parser for a different website altogether
4. Once verification passes, commit and push the updated `nba_schedule.json`
