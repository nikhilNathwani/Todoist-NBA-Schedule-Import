# Application Flow

This document explains how the NBA Todoist Schedule Importer works, from landing page to successful import.

## Overview

The app uses server-side rendering (backend generates HTML) combined with client-side JavaScript for interactivity. OAuth authentication with Todoist is required before importing schedules.

---

## Step-by-Step Flow

### 1. Landing Page

**Route:** `GET /`  
**Handler:** `app/routes/pages/index.js`  
**View:** `app/views/index.js`

-   Backend checks if NBA season is over using `isSeasonOver()` from `app/utils/parseSchedule.js`
-   If season is over: renders season-over page (`app/views/seasonOver.js`)
-   If season is active: renders landing page with "Log in with Todoist" button
-   Page is fully server-rendered HTML

---

### 2. OAuth Login Initiation

**Route:** `GET /auth/login`  
**Handler:** `app/routes/auth/login.js`

-   User clicks "Log in with Todoist" button
-   Backend redirects to Todoist OAuth authorization URL
-   Includes `client_id`, `scope`, `state`, and `redirect_uri` parameters

---

### 3. OAuth Callback

**Route:** `GET /auth/callback`  
**Handler:** `app/routes/auth/callback.js`

-   Todoist redirects back with authorization `code`
-   Backend exchanges code for access token using `retrieveAccessToken()` from `app/utils/todoist.js`
-   Access token is encrypted and saved to session using `saveAccessToken()` from `app/utils/cookieSession.js`
-   Backend checks if user has reached project limit using `userReachedProjectLimit()` from `app/utils/todoist.js`
-   Redirects to `/configure-import` with `isInboxDefault` flag if needed

---

### 4. Picker Page Load

**Route:** `GET /configure-import`  
**Handler:** `app/routes/pages/picker.js`  
**View:** `app/views/picker.js`

-   Backend renders picker page with empty team dropdown and project selection radio buttons
-   If user hit project limit, "Create New Project" option is disabled and "Inbox" is pre-selected
-   Page loads with these frontend scripts (in order):
    1. `public/scripts/api/getTeams.js` - API call function
    2. `public/scripts/api/importSchedule.js` - API call function
    3. `public/scripts/ui/header/importStatus.js` - Status enum and header updates
    4. `public/scripts/ui/header/teamLogo.js` - Team logo display
    5. `public/scripts/ui/picker.js` - Picker page initialization
    6. `public/scripts/utils/transitions.js` - Page transitions and animations
    7. `public/scripts/ui/nextSteps.js` - Next steps list display
    8. `public/scripts/events/selectTeam.js` - Team selection handler
    9. `public/scripts/events/submitForm.js` - Form submission handler

---

### 5. Team Dropdown Population (Frontend)

**Script:** `public/scripts/ui/picker.js` → `initializePickerPage()`  
**API Call:** `public/scripts/api/getTeams.js` → `getTeams()`  
**API Route:** `GET /api/teams`  
**Handler:** `app/routes/api/getTeams.js`

-   On page load, `initializePickerPage()` runs
-   Calls `getTeams()` which fetches team data from backend
-   Backend reads `data/nba_schedule.json` using `getTeams()` from `app/utils/parseSchedule.js`
-   Frontend populates team dropdown with options
-   Submit button remains disabled until team is selected

---

### 6. Team Selection (Frontend)

**Script:** `public/scripts/events/selectTeam.js`

-   User selects a team from dropdown
-   Event handler shows team logo using `showTeamLogo()` from `public/scripts/ui/header/teamLogo.js`
-   Event handler enables submit button using `enableSubmitButton()` from `public/scripts/ui/picker.js`

---

### 7. Form Submission (Frontend)

**Script:** `public/scripts/events/submitForm.js`

-   User clicks "Import schedule" button
-   Form submission prevented (handled via JavaScript)
-   `transitionToLoading()` called from `public/scripts/utils/transitions.js`:
    -   Starts loading timer
    -   Updates header status to LOADING
    -   Fades out form
    -   Removes form from DOM
    -   Shows loading animation
-   `importSchedule()` called from `public/scripts/api/importSchedule.js`

---

### 8. Import Schedule API Call

**API Route:** `POST /api/import-schedule`  
**Handler:** `app/routes/api/importSchedule.js`  
**Body:** `{ team: "BOS", project: "newProject" }` (or `"inbox"`)

Backend performs 7 steps:

1. **Get access token** from session using `getAccessToken()` from `app/utils/cookieSession.js`
2. **Initialize Todoist API** using `initializeTodoistAPI()` from `app/utils/todoist.js`
3. **Get team data** using `getTeamData()` from `app/utils/parseSchedule.js`:
    - Reads `data/nba_schedule.json`
    - Filters to upcoming games only
    - Returns team info and schedule
4. **Create destination** (project or get inbox ID) using `createDestination()` from `app/utils/todoist.js`
5. **Import games** as Todoist tasks using `importSchedule()` from `app/utils/todoist.js`
6. **Add yearly reminder** task using `addYearlyReminder()` from `app/utils/todoist.js`
7. **Create deep link** to project using `createDeepLink()` from `app/utils/todoist.js`

Returns: `{ deepLink: "https://app.todoist.com/app/project/..." }`

---

### 9. Success Result (Frontend)

**Script:** `public/scripts/events/submitForm.js` (continued)

-   Import API call succeeds
-   `transitionToResult(importStatus.SUCCESS)` called from `public/scripts/utils/transitions.js`:
    -   Waits for minimum 3-second loading duration
    -   Updates header status to SUCCESS
    -   Delays 1.2 seconds for smooth UX
-   `showNextStepsList(importStatus.SUCCESS, deepLink)` called from `public/scripts/ui/nextSteps.js`:
    -   Creates `<ul>` element with next steps
    -   Appends to `.app-content`
    -   Calls `fadeInNextSteps()` from `public/scripts/utils/transitions.js` to trigger fade-in animation
-   User sees:
    -   Success header with checkmark
    -   "Import complete!" message
    -   Next steps list with links to:
        -   Open Todoist project
        -   Import another schedule
        -   Contact developer

---

### 10. Error Handling (Frontend)

**Script:** `public/scripts/events/submitForm.js` (error path)

-   If import API call fails:
-   `transitionToResult(importStatus.ERROR)` called
-   `showNextStepsList(importStatus.ERROR, null, error)` called with error message
-   User sees:
    -   Error header with warning icon
    -   "An error occurred" message
    -   Next steps list with link to send error report email

---

## Key Technical Details

### Session Management

-   Access tokens are encrypted using AES-256-CBC (`app/utils/encryption.js`)
-   Encrypted tokens stored in cookie-session (`app/utils/cookieSession.js`)
-   Encryption key from `ENCRYPTION_KEY` environment variable

### Data Flow

-   NBA schedule data stored in `data/nba_schedule.json`
-   Generated by `scrape/main.py` (run manually to update)
-   Backend reads JSON file for all schedule operations

### Animation Timing

-   All transitions managed by `public/scripts/utils/transitions.js`
-   Minimum 3-second loading screen ensures smooth UX
-   Fade-in animations use CSS classes (`fade-in`, `fade-out`)

### Todoist API Operations

-   All Todoist interactions in `app/utils/todoist.js`
-   Uses `@doist/todoist-api-typescript` library
-   Creates projects, tasks, and generates deep links

---

## File Organization

### Backend Routes

-   `app/routes/pages/` - Page rendering routes
-   `app/routes/api/` - API endpoints
-   `app/routes/auth/` - OAuth flow routes

### Backend Views

-   `app/views/` - HTML generation functions
-   `app/views/components.js` - Reusable components (head, footer, logo)

### Backend Utils

-   `app/utils/todoist.js` - Todoist API operations
-   `app/utils/parseSchedule.js` - Schedule data operations
-   `app/utils/cookieSession.js` - Session token management
-   `app/utils/encryption.js` - AES encryption/decryption

### Frontend Scripts

-   `public/scripts/api/` - API call functions
-   `public/scripts/events/` - User interaction handlers
-   `public/scripts/ui/` - UI updates and rendering
-   `public/scripts/utils/` - Transitions and animations
