# Copilot Instructions for Todoist NBA Schedule Saver

## Project Overview

-   **Purpose:** Imports NBA team schedules into Todoist as tasks, allowing users to track games in their Todoist projects.
-   **Stack:** Node.js/Express backend, vanilla JS frontend, Python scraping utilities, and static assets for branding.
-   **Key Data Flow:**
    1. NBA schedules are scraped (see `scrape/scrapeSchedules.py`) and saved as `data/nba_schedule.json`.
    2. Express routes (`routes/`) serve the web UI and API endpoints.
    3. Frontend JS (`public/scripts/`) handles user input, UI transitions, and API calls.
    4. Game import logic interacts with the Todoist API (see `routes/importGames.js`).

## Major Components

-   **`scrape/`**: Python scripts for scraping and formatting NBA schedules. Run manually to update data.
-   **`data/nba_schedule.json`**: Canonical source for NBA schedule data, consumed by backend.
-   **`routes/`**: Express route handlers for pages, API endpoints, and OAuth.
-   **`public/scripts/`**: UI logic for form handling, status display, and confirmation flows.
-   **`public/images/team-logos/`**: SVG logos for all NBA teams, referenced by team ID.
-   **`utils/`**: Shared backend utilities (parsing, rendering, session management).

## Developer Workflows

-   **Update NBA Schedules:**
    -   Run `python3 scrape/scrapeSchedules.py` to fetch and save the latest NBA schedules.
    -   Output is written to `data/nba_schedule.json`.
-   **Start Server:**
    -   `node server.js` (or use Vercel for deployment).
-   **Frontend Dev:**
    -   Edit files in `public/scripts/` and `public/style.css` for UI/UX changes.
-   **API/Backend Dev:**
    -   Edit Express routes in `routes/` and utilities in `utils/`.

## Project Conventions & Patterns

-   **Team IDs:** Always use standard NBA abbreviations (e.g., `ATL`, `BOS`).
-   **Schedule Data:** Each team entry in `nba_schedule.json` includes `name`, `nameCasual`, `city`, `color`, and a `schedule` array.
-   **UI Transitions:** Use CSS classes like `.fade-in`, `.fade-out` for smooth UI updates (see `public/style.css`).
-   **Error Handling:** Frontend shows user-friendly error messages and next steps (see `renderConfirmation.js`).
-   **No Frameworks:** Frontend is vanilla JS; avoid React/Vue patterns.

## Integration Points

-   **Todoist API:** All task/project creation is via Todoist API (see `routes/importGames.js`).
-   **NBA Data Source:** Scraping is from CBS Sports NBA teams page.
-   **OAuth:** Handled in `routes/oauth.js`.

## Examples

-   To add a new team, update all relevant dicts in `scrape/scrapeSchedules.py` and ensure a logo SVG exists in `public/images/team-logos/`.
-   To change UI copy, edit the HTML-generating functions in `utils/renderLandingPage.js` or `routes/pages.js`.

---

For questions, see code comments or contact the repo owner. Please update this file if you introduce new conventions or workflows.
