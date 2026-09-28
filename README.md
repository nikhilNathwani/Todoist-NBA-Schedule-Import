# Todoist NBA Schedule Import

OAuth-enabled web app that imports an NBA team's schedule into Todoist as tasks.

## Overview

Todoist NBA Schedule Import connects to a user's Todoist account, lets them choose an NBA team, and imports upcoming games into either a new project or an Inbox section. It handles OAuth, session security, schedule parsing, Todoist API writes, and season lifecycle behavior.

## Highlights

- Todoist OAuth flow with CSRF protection and encrypted session storage
- Dynamic import destination logic (new project vs Inbox)
- Project-limit-aware UX for Todoist free-tier constraints
- Bulk task creation for team schedule + yearly re-import reminder
- Off-season landing page behavior when no current season should be imported

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Todoist REST API via `@doist/todoist-api-typescript`
- `@hapi/iron` for the encrypted session cookie
- Vitest for unit and route tests
- Python scraper for annual schedule refresh
- Vercel deployment

## Project Structure

```text
app/
    page.tsx                  # Landing page (or season-over page off-season)
    layout.tsx
    api/auth/login/           # Starts Todoist OAuth (sets CSRF state cookie)
    api/auth/callback/        # Verifies state, exchanges code, stores encrypted token
    configure-import/
        page.tsx              # Team + destination picker
        actions.ts            # Server Action that creates the Todoist tasks
        _components/          # PickerForm, TeamSelector, ProjectSelector, ...
components/                   # Landing, season-over, error page, header/footer
lib/
    todoist.ts                # Todoist API operations
    todoistErrors.ts          # Classifies Todoist API failures for the UI
    cookieSession.ts          # Encrypted token session helpers (iron)
    oauthState.ts             # OAuth CSRF state nonce
    encryption.ts
    parseSchedule.ts          # Schedule parsing and season-state logic
tests/                        # Vitest: unit/ and route/
public/                       # Team logos and static images
scrape/                       # Python schedule scraping pipeline
data/nba_schedule.json        # Canonical schedule data
```

## Request Flow

1. User visits landing page and starts Todoist OAuth.
2. Callback verifies state, exchanges code for token, and stores encrypted token in session cookie.
3. User selects team and destination.
4. A Server Action (`app/configure-import/actions.ts`) reads the team schedule from local JSON and creates Todoist tasks.
5. The action returns a deep link to open imported tasks in Todoist.

## Environment Variables

Use `.env.local` (see `.env.example`):

- `CLIENT_ID`
- `CLIENT_SECRET`
- `ENCRYPTION_KEY`
- `REDIRECT_URI`
- `ENABLE_ERROR_DEMO` (optional; `"true"` simulates Todoist API failures for demos)

## Getting Started

### 1. Install dependencies

Requires Node 24 (pinned in `.nvmrc`; fnm switches to it automatically).

```bash
npm install
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
npm run dev            # Dev server with hot reload
npm run build          # Production build
npm start              # Serve the production build
npm test               # Run the Vitest suite once
npm run test:coverage  # With coverage (what CI runs)
```

## Updating NBA Schedule Data

```bash
scrape/.venv/bin/python scrape/main.py
```

(See `scrape/README.md` to create the venv with uv first.)

For annual workflow and verification details, see `SCRAPE_INSTRUCTIONS.md`.

## Security Notes

- OAuth state is validated in callback flow
- Access tokens are encrypted before session storage
- Cookies are configured for HTTPS production usage

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
