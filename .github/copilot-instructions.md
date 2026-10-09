# Copilot Instructions for Todoist NBA Schedule Import

## Project Overview

-   **Purpose:** Imports an NBA team's schedule into Todoist as tasks, in a new Todoist project or an Inbox section.
-   **Stack:** Node.js 24 + Express 5, server-rendered HTML, vanilla JavaScript frontend loaded as native ES modules (no build step), deployed on Vercel. Python scraping utilities in `scrape/`. Tests use Vitest + Supertest.
-   **Key Data Flow:**
    1. NBA schedules are scraped (`scrape/main.py`) and saved as `data/nba_schedule.json`.
    2. `app/routes/auth/login.js` and `callback.js` run the Todoist OAuth flow and store the iron-encrypted access token in the `cookie-session` session.
    3. `GET /setup` (`app/routes/setup.js`) renders the team/destination picker, team list included (`app/views/setup.js`); `public/scripts/main.js` adds the interactivity and a loading screen.
    4. The form posts to `POST /setup` (same file), which creates the Todoist tasks via `app/utils/todoist.js` (failures classified by `app/utils/todoistErrors.js`), saves the outcome in the session, and redirects to `GET /result` (`app/routes/result.js`, `app/views/result.js`).

## Major Components

-   **`app.js`**: Builds and exports the Express app (middleware, routers, 404). `server.js` runs it locally; Vercel imports `app.js` directly (`vercel.json` declares `"framework": "express"`, required for that).
-   **No `/api/...` URLs:** Vercel reserves that prefix for an `api/` folder, so routes live at `/auth/...` and `/setup`.
-   **`app/routes/`**: Page and OAuth route handlers, one router per path.
-   **`app/views/`**: Functions that return page HTML, one file per page; `app/views/shared/` holds the pieces they reuse (head/footer, `escapeHTML`).
-   **`app/utils/`**: Todoist API calls, error classification, session/encryption helpers, schedule parsing.
-   **`public/scripts/`**: Browser ES modules. Each file imports what it uses; no shared globals.
-   **`scrape/`**: Python scraper for CBS Sports schedules (run once a year).
-   **`tests/`**: Vitest unit tests (`tests/unit/`) and Supertest route tests (`tests/integration/`).
-   **`docs/`**: Architecture walkthrough, testing guide, known issues, scrape workflow.

## Developer Workflows

-   **Node version:** 24, pinned in `.nvmrc`.
-   **Run locally:** `npm run dev` (http://localhost:3000). Copy `.env.example` to `.env.local` first.
-   **Tests:** `npm test` (CI runs `npm run test:coverage` on push/PR).
-   **Update NBA schedules:** `scrape/.venv/bin/python scrape/main.py`; see `docs/SCRAPE_INSTRUCTIONS.md` and `scrape/README.md` (venv is built with uv).

## Project Conventions & Patterns

-   **Team IDs:** Always use standard NBA abbreviations (e.g., `ATL`, `BOS`).
-   **Schedule Data:** Each team entry in `nba_schedule.json` includes `name`, `nameCasual`, `city`, `color` (a Todoist color key), and a `schedule` array with UTC `gameTimeUtcIso8601` times.
-   **No Frameworks:** Frontend is vanilla JS ES modules; avoid React/Vue patterns.
-   **Session security:** Keep cookie attributes (httpOnly, secure, `sameSite: "Lax"`, 1-hour maxAge) and the per-login OAuth state check intact; they are covered by tests.

## Integration Points

-   **Todoist API:** All task/project creation goes through `app/utils/todoist.js`.
-   **NBA Data Source:** CBS Sports team schedule pages (`scrape/parsers/cbs_parser.py`).
-   **OAuth:** `app/routes/auth/login.js` and `app/routes/auth/callback.js`.

## Examples

-   To add a new team, update the team data in `scrape/constants.py` and ensure a logo SVG exists in `public/images/team-logos/`.
-   To change landing-page copy, edit `app/views/index.js`.

---

Please update this file if you introduce new conventions or workflows.
