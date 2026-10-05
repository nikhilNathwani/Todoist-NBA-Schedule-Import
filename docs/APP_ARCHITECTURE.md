# Application Flow

How the NBA Todoist Schedule Importer works, from landing page to finished import.

## Overview

An Express 5 app. The server renders each page's HTML (template-string functions in `app/views/`), and browser-side JavaScript (`public/scripts/`, loaded as ES modules) handles the picker page's interactivity. The browser talks to the server through one JSON endpoint, `POST /api/import-schedule`. Users log in with Todoist OAuth before importing.

`app.js` builds the app: session middleware, static files, body parsing, then the routers. `server.js` runs it locally; on Vercel, `api/index.js` exports the same app as a serverless function, and `vercel.json` rewrites every path to it. Vercel's zero-config Express detection was tried and rejected: it returns 404 for any `/api/*` path that has no matching file under `api/`, and this app's login and import routes all live under `/api` (see commit `da86219`).

---

## Step-by-Step Flow

### 1. Landing Page

**Route:** `GET /`
**Handler:** `app/routes/pages/index.js`
**Views:** `app/views/index.js`, `app/views/seasonOver.js`

- `isSeasonOver()` (`app/utils/parseSchedule.js`) compares now with the latest game time in `data/nba_schedule.json`. Both are absolute UTC moments, so the answer doesn't depend on the server's time zone.
- Season over: renders the season-over page. Otherwise: renders the landing page with "Log in with Todoist".
- Outside production, `/test-season-on` and `/test-season-over` force either page for previewing.

---

### 2. OAuth Login

**Route:** `GET /api/auth/login`
**Handler:** `app/routes/auth/login.js`

- Generates a fresh random `state` (`crypto.randomUUID()`) and saves it in the session cookie.
- Redirects to `https://todoist.com/oauth/authorize` with `client_id`, `scope=data:read_write`, `state` and `redirect_uri`, built with `URLSearchParams` so each value is URL-encoded.

---

### 3. OAuth Callback

**Route:** `GET /api/auth/callback`
**Handler:** `app/routes/auth/callback.js`

- Todoist redirects back with `code` and `state`.
- **CSRF check:** `state` must equal the one saved in this browser's session. The saved state is deleted first, so each one works once. Mismatch or missing: `403`.
- Exchanges `code` for an access token (`retrieveAccessToken()` in `app/utils/todoist.js`, a `fetch` POST to Todoist's token endpoint).
- Encrypts the token and stores it in the session (`saveAccessToken()` in `app/utils/cookieSession.js`), then redirects to `/configure-import`.
- Todoist OAuth errors map to specific responses: bad code or credentials `400`, rate limited `429`, other Todoist failures `502`, anything unclassified `500`.

---

### 4. Picker Page (server side)

**Route:** `GET /configure-import`
**Handler:** `app/routes/pages/picker.js`
**View:** `app/views/picker.js`

- Reads the token from the session. None, or expired: redirects to `/` to log in.
- In parallel: the tier check below and `getTeams()` (`app/utils/parseSchedule.js`), which reads every team's name and city from the schedule JSON.
- **Account tier check:** `userReachedProjectLimit()` (`app/utils/todoist.js`) calls `getUser()` and `getProjects()` in parallel, counts non-Inbox projects, and compares against the cap for the user's plan: 5 if `user.isPremium` is false, 300 if true. The API exposes the plan but not the caps, so the caps are constants.
- Renders the page with the team `<option>`s already in the dropdown, sorted by city. If the user is at their limit, "Create New Project" is disabled and "Inbox" is pre-selected.
- If the Todoist call fails, renders an error page with the classified HTTP status (401/403/404/429/500/502/503) and a matching message. See [Error handling](#error-handling).

---

### 5. Picker Page (browser side)

**Entry point:** `public/scripts/main.js` (the page's only `<script type="module">`)

`main.js` imports everything else explicitly; no script relies on globals:

| File | Role |
|---|---|
| `api/importSchedule.js` | `importSchedule()`: `POST /api/import-schedule` |
| `ui/picker.js` | Updates the "new project" subtitle; enables the submit button |
| `ui/header/importStatus.js` | Status enum (LOADING/SUCCESS/ERROR) and header text |
| `ui/header/teamLogo.js` | Shows the selected team's logo |
| `ui/nextSteps.js` | Builds the next-steps list shown after an import |
| `ui/demoBanner.js` | Banner shown when `?mockTodoistError=` is in the URL |
| `utils/transitions.js` | Fade-out/fade-in sequence and 3-second minimum loading time |
| `events/selectTeam.js` | Dropdown `change` listener |
| `events/submitForm.js` | Form `submit` listener |

On load, `main.js` attaches the dropdown and form listeners. The team list is already in the HTML, so there's nothing to fetch.

**Why the team list is rendered on the server:** it's static data the page needs on first load, and the route already runs on the server for the tier check. Rendering it there means one request instead of two, no moment with an empty dropdown, and no separate failure case for "teams didn't load." An earlier version fetched it from a `GET /api/get-teams` endpoint after the page loaded.

Choosing a team shows its logo, names the new project ("Celtics schedule"), and enables "Import schedule".

---

### 6. Submitting the Form

**Script:** `public/scripts/events/submitForm.js`

- Prevents the normal form post. Only the first submit counts, and the button is disabled, so a double-click can't start two imports.
- `transitionToLoading()`: starts the loading timer, sets the header to LOADING, fades the form out and removes it once its `transitionend` fires.
- Calls `importSchedule(team, project)`.

---

### 7. Import Schedule API

**Route:** `POST /api/import-schedule`
**Handler:** `app/routes/api/importSchedule.js`
**Body:** `{ team: "BOS", project: "newProject" | "inbox" }`

1. Read the token from the session (missing: `401`).
2. If `newProject`, re-check the project limit (it may have changed since the page loaded). At the limit: `403`.
3. `getTeamData()` reads the team from the schedule JSON and keeps only games later than now.
4. `createDestination()`: a new project named "<Team> schedule" in the team's color (checked against Todoist's color list), or a new section inside the Inbox.
5. `importSchedule()` adds one task per game, all in parallel. Each task's `dueDatetime` is the game's UTC time. Failed games are retried once, together, after 10 seconds. If any still fail, the request fails with a message naming them; games that did import are kept.
6. `addYearlyReminder()`: a recurring "every October 10th" task to re-import next season.
7. Returns `{ deepLink }` to the new project or section.

---

### 8. Result

**Scripts:** `utils/transitions.js` → `ui/nextSteps.js`

- `transitionToResult()` waits until at least 3 seconds have passed since loading began, updates the header, then pauses 1.2 seconds.
- Success: "Import complete!" and links to open Todoist, import another team, or contact me.
- Error: "An error occurred", the server's message as the subtitle, and a "Send error report" email link that includes the message.
- The list fades in through a CSS `@keyframes` animation that plays as soon as it's added.

---

## Key Technical Details

### Time zones

- The scraper (`scrape/formatDateTime.py`) reads CBS's Eastern-time listings, attaches `America/New_York` with pytz (handling daylight saving), and stores UTC ISO-8601 strings.
- Tasks are created with `dueDatetime` set to that UTC moment, not a "7:30pm" string. Todoist shows each task in the user's own Todoist time zone, so every user sees their local tip-off time from the same data.
- "Upcoming games" and "season over" compare absolute moments, independent of the server's time zone.
- The yearly reminder uses `dueString: "every October 10th"`, which Todoist reads in the user's time zone.

### Account tier

- Free: 5 projects. Premium: 300. The plan comes from `getUser().isPremium`; the caps are constants because the API doesn't expose them.
- Checked when the picker renders (to disable "Create New Project") and again at import time.
- Inbox imports create a section inside the Inbox, which works on any plan.

### Sessions and security

- `cookie-session` stores the session in a cookie signed with `COOKIE_SECRET`: `httpOnly`, `secure`, `sameSite: "Lax"` (`Strict` would drop the cookie on the redirect back from Todoist), 1-hour lifetime.
- Inside it, the access token is sealed with `@hapi/iron` (`app/utils/encryption.js`, key `ENCRYPTION_KEY`): AES-256-CBC encryption plus an HMAC-SHA256 integrity check, so it can't be read or altered.
- The OAuth `state` is random per login, tied to the browser's session, and single-use.

### Error handling

- `app/utils/todoistErrors.js` sorts each Todoist failure by status code into a type: `AUTH_EXPIRED` (401), `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED` (429, with a suggested wait: Todoist's `retry_after` if the response body has one, otherwise 30 seconds), `SERVER_ERROR`, `SERVICE_UNAVAILABLE`, `NETWORK_ERROR`, and so on. Each type carries whether it's worth retrying and a user-facing message.
- Pages respond with the matching HTTP status and an error page; the import API responds with the status plus `{ errorType, message, retryable, retryAfterSeconds }`.
- Demo mode: with `ENABLE_ERROR_DEMO=true`, `?mockTodoistError=<code>` on `/configure-import` simulates that failure instead of calling Todoist.
- Unknown paths get a real `404` page.

### Data

- `data/nba_schedule.json` is generated once a year by `scrape/main.py` (see `SCRAPE_INSTRUCTIONS.md`) and read at request time. It's read-only, so it stays a file, not a database.

---

## File Organization

```text
app.js                     # Builds the Express app (middleware + routers + 404)
server.js                  # Local server (npm run dev / npm start)
api/index.js               # Vercel serverless entry; exports app.js
app/
  routes/
    pages/index.js         # GET /  (+ debug routes outside production)
    pages/picker.js        # GET /configure-import
    api/importSchedule.js  # POST /api/import-schedule
    auth/login.js          # GET /api/auth/login
    auth/callback.js       # GET /api/auth/callback
  utils/
    todoist.js             # Todoist API calls (OAuth token, tier, projects, tasks)
    todoistErrors.js       # Error classification + demo-mode mocks
    parseSchedule.js       # Schedule JSON reads, upcoming games, season over
    cookieSession.js       # Save/read the encrypted token in the session
    encryption.js          # @hapi/iron seal/unseal
  views/                   # HTML template functions (pages, error page, shared head/footer)
public/
  scripts/                 # Browser ES modules (entry: main.js)
  style.css, images/
tests/                     # Vitest: unit/ and integration/ (Supertest)
scrape/                    # Python schedule scraper
data/nba_schedule.json     # Schedule data
```
