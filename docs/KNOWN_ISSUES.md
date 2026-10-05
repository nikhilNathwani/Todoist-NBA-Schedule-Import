# Known issues / follow-ups

Findings from audits of this app, kept so they don't get lost. Several were first fixed in the Next.js version (preserved on the `nextjs` branch) and ported back to Express.

---

## Resolved

### 1. OAuth `state` was a fixed secret, not a per-login value

**Was:** `state=${STATE_SECRET}` sent the same environment variable on every login, and the callback compared against it. A fixed value is a second permanent secret, not CSRF protection: once leaked, it works forever.

**Fix:** `/auth/login` generates `crypto.randomUUID()` per attempt and saves it in the session cookie; `/auth/callback` accepts only a matching state, and deletes it first so it works once. `STATE_SECRET` is gone. Tests: `tests/integration/routes/authRoutes.test.js`.

### 2. OAuth URL parameters weren't URL-encoded

**Was:** `CLIENT_ID` and `REDIRECT_URI` were pasted into the authorize URL as-is; a value containing `&`, `?`, `=` or `#` would have broken it.

**Fix:** the URL is built with `URLSearchParams`.

### 3. Failed game imports were swallowed

**Was:** `importGame` caught and logged `addTask` failures, so a partial import (transient 502/503s from sending ~80 calls at once) still showed "Import complete!".

**Fix:** `importSchedule` uses `Promise.allSettled`, retries the failed games once after 10 seconds, and if any still fail, reports which ones. Games that did import are kept, not rolled back.

### 4. Account tier was guessed from the project count

**Was:** `isPremium = projectCount > 5`, so a free account with more than 5 projects was treated as premium and given the 300 cap.

**Fix:** reads `getUser().isPremium`. The 5 / 300 caps stay hardcoded because the API doesn't expose them.

### 5. Double-clicking "Import schedule" started two imports

**Was:** the second import saw the project the first had just created, failed the project-limit check, and its error replaced the real success on screen.

**Fix:** the submit handler runs once and disables the button.

### 6. Logged-out visitors to `/configure-import` got a bare 500

**Fix:** they're redirected to `/` to log in.

### 7. 502 and 504 from Todoist were classified as `UNKNOWN`

**Was:** the classifier only had cases for the status codes Todoist documents (including 500 and 503), so 502 (bad gateway) and 504 (gateway timeout) fell through to `UNKNOWN`: not retryable, with a generic message. 502s were among the errors seen during bulk imports.

**Fix:** both are classified as `SERVICE_UNAVAILABLE` (retryable), like 503.

### 8. An expired session during an import showed an internal message

**Was:** if the 1-hour session expired while the picker page was open, the import showed "Failed to initialize Todoist API: Access token is not set in the session."

**Fix:** the import returns `AUTH_EXPIRED` with "Your session has expired. Please log in again.", and the browser offers a "Log in again" link.

### 9. Page HTML didn't escape inserted data

**Was:** template strings inserted team data and error text as-is. Nothing a visitor types reached the HTML, but error text from Todoist could.

**Fix:** `escapeHTML()` (`app/views/escapeHTML.js`) on every inserted value that doesn't come from the view file itself. The "Open Todoist" link in the browser is set with the `href` property instead of pasted into HTML.

---

## Open

### 1. Yearly reminder failures are only logged

`addYearlyReminder` still catches and logs its own failure. It's a single, low-stakes task, so this was left out of the import-retry fix.
