# Todoist NBA Schedule Saver

OAuth-enabled web app that imports an NBA team's schedule into Todoist as tasks.

## Overview

Todoist NBA Schedule Saver connects to a user's Todoist account, lets them choose an NBA team, and imports upcoming games into either a new project or an Inbox section. It handles OAuth, session security, schedule parsing, Todoist API writes, and season lifecycle behavior.

## Highlights

- Todoist OAuth flow with CSRF protection and encrypted session storage
- Dynamic import destination logic (new project vs Inbox)
- Project-limit-aware UX for Todoist free-tier constraints
- Bulk task creation for team schedule + yearly re-import reminder
- Off-season landing page behavior when no current season should be imported

## Tech Stack

- Node.js + Express (ES modules)
- Todoist REST API via `@doist/todoist-api-typescript`
- `cookie-session` + `@hapi/iron` for token handling
- Vanilla JavaScript frontend
- Python scraper for annual schedule refresh
- Vercel deployment

## Project Structure

```text
app/
    routes/
        auth/                 # OAuth login/callback
        pages/                # Landing and picker pages
        api/                  # Team list + import endpoint
    utils/
        todoist.js            # Todoist API operations
        cookieSession.js      # Encrypted token session helpers
        parseSchedule.js      # Schedule parsing and season-state logic
    views/                  # Server-rendered HTML templates

public/                   # Frontend JS, CSS, images
scrape/                   # Schedule scraping pipeline
data/nba_schedule.json    # Canonical schedule data
```

## Request Flow

1. User visits landing page and starts Todoist OAuth.
2. Callback verifies state, exchanges code for token, and stores encrypted token in session cookie.
3. User selects team and destination.
4. API route reads team schedule from local JSON and creates Todoist tasks.
5. Response returns a deep link to open imported tasks in Todoist.

## Environment Variables

Use `.env.local` (see `.env.example`):

- `CLIENT_ID`
- `CLIENT_SECRET`
- `STATE_SECRET`
- `ENCRYPTION_KEY`
- `COOKIE_SECRET`
- `REDIRECT_URI`

## Getting Started

### 1. Install dependencies

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
npm start      # Start server
npm run dev    # Dev mode with nodemon
```

## Updating NBA Schedule Data

```bash
python3 scrape/main.py
```

For annual workflow and verification details, see `SCRAPE_INSTRUCTIONS.md`.

## Security Notes

- OAuth state is validated in callback flow
- Access tokens are encrypted before session storage
- Cookies are configured for HTTPS production usage

## Why This Project

This project demonstrates practical product engineering: third-party OAuth integration, secure token/session handling, API reliability under external platform constraints, and a complete user-facing workflow from authentication to task creation.
