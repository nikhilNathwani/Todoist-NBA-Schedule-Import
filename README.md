# Todoist NBA Schedule Import

OAuth-enabled web app that imports an NBA team's schedule into Todoist as tasks.

## Overview

Todoist NBA Schedule Import connects to a user's Todoist account, lets them choose an NBA team, and imports upcoming games into either a new project or an Inbox section. It handles OAuth, session security, schedule parsing, Todoist API writes, and season lifecycle behavior.

## Highlights

- Todoist OAuth flow with a per-login CSRF state and encrypted session storage
- Adapts to the user's Todoist plan: reads free vs. premium from the API and disables "Create New Project" once the user hits their plan's project cap (5 free / 300 premium), falling back to an Inbox section
- Time-zone aware: game times are stored as UTC and sent to Todoist as exact moments, so every user sees tip-off in their own local time
- Bulk task creation with one automatic retry for failed games, plus a yearly re-import reminder
- Classified Todoist error handling: real HTTP statuses and specific user-facing messages (rate limited, session expired, outage, ...)
- Off-season landing page when there's no current season to import

## Tech Stack

- Node.js 24 + Express 5
- Todoist REST API via `@doist/todoist-api-typescript`
- `cookie-session` + `@hapi/iron` for token handling
- Vanilla JavaScript frontend (native ES modules, no build step)
- Vitest + Supertest, run in GitHub Actions CI
- Python scraper for annual schedule refresh
- Vercel deployment

## Project Structure

```text
app/
    routes/
        auth/                 # OAuth login/callback
        pages/                # Landing and configure-import pages
        api/                  # The app's JSON endpoint (POST /import-schedule)
    utils/
        todoist.js            # Todoist API operations
        cookieSession.js      # Encrypted token session helpers
        parseSchedule.js      # Schedule parsing and season-state logic
    views/                  # Server-rendered HTML templates

public/                   # Frontend JS (entry: scripts/main.js), CSS, images
tests/                    # Unit + route tests
docs/                     # Architecture, testing, known issues, scrape workflow
scrape/                   # Schedule scraping pipeline
data/nba_schedule.json    # Canonical schedule data
```

## Request Flow

1. User visits landing page and starts Todoist OAuth.
2. Callback verifies state, exchanges code for token, and stores encrypted token in session cookie.
3. Configure-import page checks the user's plan and project count, then the user selects team and destination.
4. API route reads team schedule from local JSON and creates Todoist tasks.
5. Response returns a deep link to open imported tasks in Todoist.

Full walkthrough: [docs/APP_ARCHITECTURE.md](docs/APP_ARCHITECTURE.md).

## Environment Variables

Use `.env.local` (see `.env.example`):

- `CLIENT_ID`
- `CLIENT_SECRET`
- `ENCRYPTION_KEY`
- `COOKIE_SECRET`
- `REDIRECT_URI`
- `ENABLE_ERROR_DEMO` (optional; `true` enables `?mockTodoistError=` demos)

## Getting Started

### 1. Install dependencies

Node 24 (pinned in `.nvmrc`):

```bash
npm ci
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in Todoist OAuth credentials and secrets.

### 3. Run locally

```bash
npm run dev
```

App runs at http://localhost:3000.

## Scripts

```bash
npm run dev            # Local server, restarts on file changes (node --watch)
npm start              # Local server, no restarts
npm test               # Run tests
npm run test:coverage  # Tests + coverage report in coverage/
```

## Updating NBA Schedule Data

```bash
scrape/.venv/bin/python scrape/main.py
```

For annual workflow and verification details, see [docs/SCRAPE_INSTRUCTIONS.md](docs/SCRAPE_INSTRUCTIONS.md).

## Security Notes

- OAuth `state` is random per login, tied to the browser's session, and single-use
- Access tokens are encrypted (`@hapi/iron`) before session storage
- Session cookie is `httpOnly`, `secure`, `sameSite: Lax`, 1-hour lifetime

## Possible Future Improvements

Deliberately not done now, but worth revisiting if the constraints below change:

- **Schedule data / team logos are static (JSON file + SVGs), not a database.**
  This is a deliberate choice, not a placeholder: the schedule is read-only at
  request time, updated once a year via a batch pipeline (never written to
  during a request), and small enough (~400KB) to fit trivially in memory.
  A database would add write-consistency and query machinery this data has
  no use for. Reconsider if the app ever needs runtime writes to this data
  (e.g. live in-season score/date updates, or user-customized schedules).

## Why This Project

This project demonstrates practical product engineering: third-party OAuth integration, secure token/session handling, API reliability under external platform constraints, and a complete user-facing workflow from authentication to task creation.
