# Copilot Instructions for Todoist NBA Schedule Import

## Project Overview

-   **Purpose:** Imports an NBA team's schedule into Todoist as tasks, so users can track games in a Todoist project or Inbox section.
-   **Stack:** Next.js 16 (App Router) + React 19 + TypeScript, deployed on Vercel. Python scraping utilities in `scrape/`. Tests use Vitest.
-   **Key Data Flow:**
    1. NBA schedules are scraped (`scrape/main.py`) and saved as `data/nba_schedule.json`.
    2. `app/api/auth/login` and `app/api/auth/callback` run the Todoist OAuth flow and store the access token in an iron-encrypted cookie (`lib/cookieSession.ts`, CSRF state in `lib/oauthState.ts`).
    3. `app/configure-import/page.tsx` renders the team/destination picker (`app/configure-import/_components/PickerForm.tsx`).
    4. The Server Action in `app/configure-import/actions.ts` creates the Todoist tasks via `lib/todoist.ts`; failures are classified for the UI by `lib/todoistErrors.ts`.

## Major Components

-   **`app/`**: Pages, OAuth route handlers, and the import Server Action.
-   **`components/`**: Landing page, season-over page, error page, header/footer.
-   **`lib/`**: Todoist API calls, error classification, session/encryption helpers, schedule parsing (`parseSchedule.ts` reads `data/nba_schedule.json`).
-   **`scrape/`**: Python scraper for CBS Sports schedules (run once a year).
-   **`data/nba_schedule.json`**: Canonical schedule data, read at request time.
-   **`public/images/team-logos/`**: SVG logos for all NBA teams, referenced by team ID.
-   **`tests/`**: Vitest unit tests (`tests/unit/`) and route/action tests (`tests/route/`).

## Developer Workflows

-   **Node version:** 24, pinned in `.nvmrc`.
-   **Run locally:** `npm run dev` (http://localhost:3000). Copy `.env.example` to `.env.local` first.
-   **Tests:** `npm test` (CI runs `npm run test:coverage` on push/PR).
-   **Update NBA schedules:** `scrape/.venv/bin/python scrape/main.py`, then `scrape/verifySchedule.py`; see `SCRAPE_INSTRUCTIONS.md` and `scrape/README.md` (venv is built with uv).

## Project Conventions & Patterns

-   **Team IDs:** Always use standard NBA abbreviations (e.g., `ATL`, `BOS`).
-   **Schedule Data:** Each team entry in `nba_schedule.json` includes `name`, `nameCasual`, `city`, `color`, and a `schedule` array.
-   **Next.js version:** Next 16 has breaking changes from older versions (e.g. async `cookies()`); check `node_modules/next/dist/docs/` before relying on remembered APIs (see `AGENTS.md`).
-   **Session security:** Keep cookie attributes (httpOnly, secure, `sameSite: "lax"`, 1-hour maxAge) and the OAuth state check intact; they are covered by tests.

## Integration Points

-   **Todoist API:** All task/project creation goes through `lib/todoist.ts`.
-   **NBA Data Source:** CBS Sports team schedule pages (`scrape/parsers/cbs_parser.py`).
-   **OAuth:** `app/api/auth/login/route.ts` and `app/api/auth/callback/route.ts`.

## Examples

-   To add a new team, update the team data in `scrape/constants.py` and ensure a logo SVG exists in `public/images/team-logos/`.
-   To change landing-page copy, edit `components/LandingPage.tsx`.

---

Please update this file if you introduce new conventions or workflows.
