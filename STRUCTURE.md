# Project Structure Guide

## Overview

This project is organized by **route type** (backend) and **function** (frontend) for clarity and ease of navigation.

## Directory Structure

```
app/
├── routes/
│   ├── api/                    # API endpoints (JSON responses)
│   │   ├── getTeams.js         # GET /api/get-teams - Returns list of NBA teams
│   │   └── importSchedule.js   # POST /api/import-schedule - Imports schedule to Todoist
│   ├── pages/                  # Page routes (HTML responses)
│   │   ├── index.js            # GET / - Landing page
│   │   └── picker.js           # GET /configure-import - Team/project selection page
│   └── auth/                   # OAuth authentication routes
│       ├── login.js            # GET /api/auth/login - Redirects to Todoist OAuth
│       └── callback.js         # GET /api/auth/callback - Handles OAuth callback
├── views/                      # HTML generation (server-side rendering)
│   ├── index.js                # Landing page HTML (active season + season over states)
│   ├── picker.js               # Team/project picker page HTML
│   └── shared.js               # Reusable HTML components (head, footer, logo banner)
└── utils/                      # Shared utilities
    ├── parseSchedule.js        # NBA schedule JSON parsing
    ├── cookieSession.js        # Session cookie management
    └── encryption.js           # Access token encryption

public/
└── scripts/                    # Client-side JavaScript
    ├── api/                    # API calls to backend
    │   ├── getTeams.js         # Fetches team names from /api/get-teams
    │   └── importSchedule.js   # Calls /api/import-schedule
    ├── events/                 # Event handlers (user interactions)
    │   ├── selectTeam.js       # Team selection event handler
    │   └── submitForm.js       # Form submission handler
    └── views/                  # View initialization and UI updates
        ├── picker.js           # Initializes picker page (populates team dropdown)
        ├── logoBanner.js       # Logo banner animations
        └── confirmation.js     # Import status screens (loading/success/error)
```

## Architecture Principles

### Separation of Concerns

**Backend:**

-   **Routes** (`routes/`) - Handle HTTP requests, call business logic, delegate to views
-   **Views** (`views/`) - Generate HTML, receive data from routes (no business logic)
-   **Utils** (`utils/`) - Shared utilities and data parsing

**Frontend:**

-   **API** (`scripts/api/`) - Fetch data from backend APIs
-   **Events** (`scripts/events/`) - Handle user interactions
-   **Views** (`scripts/views/`) - Update UI and animations

### Key Design Decisions

1. **Server-side rendering for static HTML, client-side for dynamic data**

    - Backend generates empty dropdown HTML structure
    - Frontend fetches team data from `/api/get-teams` and populates dropdown
    - Single source of truth: all team data flows through one API endpoint
    - Benefit: No duplicate logic, easier to maintain

2. **Business logic stays in routes**

    - Example: `userReachedProjectLimit()` called in route, result passed to view
    - Views are pure presentation functions

3. **Route naming convention**
    - `routes/pages/` = Routes that serve HTML pages (standard Express pattern)
    - `routes/api/` = Routes that serve JSON data
    - NOT `routes/views/` (routes handle requests, views generate HTML)

## Route Organization

### API Routes (`/api/*`)

-   **Purpose**: Endpoints that return JSON data
-   **Location**: `app/routes/api/`
-   **Files**:
    -   `getTeams.js` - Returns team data (id, city, name, nameCasual) for frontend dropdown and UI updates
    -   `importSchedule.js` - Handles schedule import to Todoist

### Page Routes (`/*`)

-   **Purpose**: Routes that render full HTML pages
-   **Location**: `app/routes/pages/`
-   **Pattern**: Fetch data → Pass to view → Send HTML
-   **Files**:
    -   `index.js` - Landing page with login button
    -   `picker.js` - Team/project selection page (calls `userReachedProjectLimit`, passes to view)

### Auth Routes (`/api/auth/*`)

-   **Purpose**: OAuth authentication flow
-   **Location**: `app/routes/auth/`
-   **Files**:
    -   `login.js` - Initiates OAuth with Todoist
    -   `callback.js` - Processes OAuth callback and stores token

## View Layer (`app/views/`)

All server-side HTML generation is centralized here:

-   `index.js` - Landing page (login screen)
-   `picker.js` - Team/project selection form (receives `isInboxDefault` from route, generates static HTML structure)
-   `shared.js` - Shared HTML components (head, footer, logo banner)

**Important**: Views are pure functions - they receive data and return HTML, no API calls or business logic. Dynamic content (like team dropdown options) is populated by frontend scripts.

## Frontend Scripts (`public/scripts/`)

Organized by function:

-   **`api/`** - All backend API calls (keeps fetch logic centralized)
-   **`events/`** - User interaction handlers (respond to user actions)
-   **`views/`** - View initialization and UI updates (populate/update DOM)

### Key Distinction: Views vs Events

-   **`views/`** - Runs on page load, initializes UI (e.g., populate dropdown from API)
-   **`events/`** - Runs on user interaction, responds to events (e.g., team selection)
-   Example: `views/picker.js` populates dropdown, `events/selectTeam.js` handles selection

## Quick Reference

### Backend Routes

| Route                       | File                               | Purpose                       |
| --------------------------- | ---------------------------------- | ----------------------------- |
| `GET /`                     | `app/routes/pages/index.js`        | Landing page                  |
| `GET /configure-import`     | `app/routes/pages/picker.js`       | Team/project selection        |
| `GET /api/auth/login`       | `app/routes/auth/login.js`         | OAuth login                   |
| `GET /api/auth/callback`    | `app/routes/auth/callback.js`      | OAuth callback                |
| `GET /api/get-teams`        | `app/routes/api/getTeams.js`       | Get team names (for frontend) |
| `POST /api/import-schedule` | `app/routes/api/importSchedule.js` | Import schedule               |

### Frontend Scripts

| File                    | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `api/getTeams.js`       | Fetch team data (id, city, name) from backend                 |
| `api/importSchedule.js` | Call import API                                               |
| `views/picker.js`       | Initialize picker page: fetch data and populate team dropdown |
| `events/selectTeam.js`  | Handle team selection event: update logo/subtitle/button      |
| `events/submitForm.js`  | Handle form submission                                        |
| `views/logoBanner.js`   | Logo banner animations (grow, arrow updates)                  |
| `views/confirmation.js` | Status screens (loading/success/error)                        |

## How to Find Things

-   **Adding a new API endpoint?** → Create in `app/routes/api/`
-   **Adding a new page?** → Create route in `app/routes/pages/` and view in `app/views/`
-   **Modifying HTML?** → Look in `app/views/`
-   **Modifying auth flow?** → Look in `app/routes/auth/`
-   **Adding API call from frontend?** → Create in `public/scripts/api/`
-   **Adding event handler?** → Create in `public/scripts/events/`
-   **Modifying UI/animations?** → Look in `public/scripts/views/`

## Common Patterns

### Adding a new page

1. Create route in `app/routes/pages/yourpage.js`
2. Create view in `app/views/yourpage.js`
3. Route fetches data, passes to view, sends HTML
4. Mount route in `app.js`

### Adding frontend functionality

1. API calls → `public/scripts/api/`
2. Event handlers → `public/scripts/events/`
3. UI updates → `public/scripts/views/`
4. Include scripts in view's `<script>` tags

## Benefits of This Structure

1. **Clear separation**: Backend routes vs frontend scripts clearly organized
2. **Easy navigation**: File names match route/function names
3. **Scalability**: Easy to add new routes/scripts in the right place
4. **Maintainability**: Related code is grouped together
5. **Frontend/backend symmetry**: `api/getTeams.js` (frontend) calls `/api/get-teams` (backend)
6. **No business logic in views**: Views are pure presentation functions
