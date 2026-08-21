# Next.js Migration Handoff

Branch: `nextjs-migration` (built on top of the `error-handling-hardening` work already merged into this branch). This document is written for you (Nikhil) to review when you're back — it covers what changed, what's actually been verified (with real command output, not just "it works"), what wasn't verified, and every judgment call made along the way.

**Purpose reminder**: this is an exploratory rewrite to inform the Slidemoji-vs-Todoist-NBA-Import decision for the Lovable interview. Nothing here was deployed anywhere.

---

## TL;DR

- `next build` succeeds cleanly (type-checks + compiles). ✅
- All 76 automated tests pass (8 files). ✅
- Cookie-security requirements (httpOnly/secure/sameSite=lax/1h maxAge, iron encryption) are **preserved and directly tested**, including against the real `@hapi/iron` round trip and the real callback route handler. One documented, deliberate architecture simplification (see below) — not a downgrade. ✅
- Core flows (landing/season-over branch, OAuth login redirect, OAuth callback CSRF + error mapping, `/configure-import` error-page rendering, the full error-classification/demo-mode pipeline) verified via real HTTP smoke tests against `next dev`. ✅
- **Not verified**: an actual successful login + picker-form render + real schedule import against the live Todoist API. That requires your real OAuth credentials and a live click-through — see "What you need to check yourself" below.

---

## What was migrated, and how (file mapping)

| Old (Express, removed) | New (Next.js) | Notes |
|---|---|---|
| `app.js` (cookie-session config, route mounting) | `app/layout.tsx` + `next.config.ts` + `lib/cookieSession.ts` | Middleware replaced by `next/headers` `cookies()` used directly where needed. |
| `api/index.js`, `vercel.json` rewrite | *(removed)* | Vercel serverless-function shim; not applicable to Next.js, and not deploying anyway. |
| `app/routes/pages/index.js` | `app/page.tsx` | Server Component, same `isSeasonOver()` branch. Now **ISR** (`revalidate = 86400`) — see dedicated section below. |
| `app/routes/pages/picker.js` | `app/configure-import/page.tsx` | Server Component: reads session cookie, checks project limit, renders form or error page. |
| `app/routes/api/getTeams.js` | *(removed — see "Server-side team data")* | Team data now read directly by `app/configure-import/page.tsx` via `lib/parseSchedule.ts`. |
| `app/routes/api/importSchedule.js` | `app/configure-import/actions.ts` (`importScheduleAction`) | **Server Action**, not a Route Handler — see "Server Action vs. Route Handler" below. |
| `app/routes/auth/login.js` | `app/api/auth/login/route.ts` | Ported as-is. |
| `app/routes/auth/callback.js` | `app/api/auth/callback/route.ts` | Ported as-is, including the dead-code fix and OAuth-error-reason mapping from the error-handling-hardening commit. |
| `app/utils/cookieSession.js` | `lib/cookieSession.ts` | Logic ported; storage mechanism changed from `cookie-session` middleware to `next/headers` directly — see cookie-security section. |
| `app/utils/encryption.js` | `lib/encryption.ts` | Unchanged (same `@hapi/iron`, same `ENCRYPTION_KEY`). |
| `app/utils/parseSchedule.js` | `lib/parseSchedule.ts` | Unchanged logic; typed. |
| `app/utils/todoist.js` | `lib/todoist.ts` | Unchanged logic; typed. |
| `app/utils/todoistErrors.js` | `lib/todoistErrors.ts` | Unchanged logic; typed. |
| `app/views/components.js` (`makeHead`) | `app/layout.tsx` `metadata` export | Hand-built `<meta>` strings replaced by Next's typed `Metadata` API. |
| `app/views/components.js` (`makeFooter`, `makeLogoBanner`) | `components/Footer.tsx`, `components/LogoBanner.tsx` | Plain React ports. `LogoBanner` gained two optional props (`teamId`, `arrowIcon`) replacing direct DOM manipulation — see below. |
| `app/views/index.js` | `components/LandingPage.tsx` | Plain React port. |
| `app/views/seasonOver.js` | `components/SeasonOverPage.tsx` | Plain React port. |
| `app/views/picker.js` (markup) | `app/configure-import/_components/{TeamSelector,ProjectSelector}.tsx` | Markup ported; interactivity rewritten (see below). |
| `app/views/errorPage.js` | `components/ErrorPage.tsx` | Plain React port. See "Known limitation: HTTP status on error page" below. |
| `public/scripts/api/getTeams.js` | *(removed)* | Superseded by direct server-side read. |
| `public/scripts/api/importSchedule.js` | `app/configure-import/actions.ts` | Folded into the Server Action call. |
| `public/scripts/events/selectTeam.js` | `app/configure-import/_components/TeamSelector.tsx` | |
| `public/scripts/events/submitForm.js`, `public/scripts/utils/transitions.js` | `app/configure-import/_components/PickerForm.tsx` | The submit handler and the fade/timing choreography (3s min loading, 1.2s pause before next steps) are now one state machine in `PickerForm.tsx` instead of a DOM `transitionend` listener + a shared `let loadingStartTime` global. |
| `public/scripts/ui/demoBanner.js` | `app/configure-import/_components/DemoBanner.tsx` | Now a **Server Component** — the `?mockTodoistError=` value is read server-side (`page.tsx` has `searchParams` directly) and passed down as a prop, instead of parsed from `window.location` client-side. |
| `public/scripts/ui/header/importStatus.js` | `app/configure-import/_components/ImportStatusHeader.tsx` | |
| `public/scripts/ui/header/teamLogo.js` | `LogoBanner`'s `teamId` prop | |
| `public/scripts/ui/nextSteps.js` | `app/configure-import/_components/NextStepsList.tsx` | |
| `public/scripts/ui/picker.js` | `app/configure-import/_components/PickerForm.tsx` (+ `TeamSelector`/`ProjectSelector`) | `selectedTeam`, `selectedProject`, `importStatus` are now real `useState` in `PickerForm.tsx`, passed down as typed props — replacing the global `let`/`const` bindings the old scripts coordinated through by comment convention (`// Note: teamSelect is defined in picker.js`). |
| `data/nba_schedule.json` | *(unchanged, same path)* | See "Server-side team data" below. |
| `public/style.css`, `public/images/**` | *(unchanged, same paths)* | Linked via a plain `<link rel="stylesheet" href="/style.css">` in `app/layout.tsx` — deliberately not imported as a CSS module, so the existing absolute `/images/...` URL references inside it keep working unmodified. |
| `tests/integration/routes/*.test.js` (Supertest) | `tests/route/*.test.ts` | Route Handlers/Server Action invoked directly as functions — see Testing section. |
| `tests/unit/*.test.js` | `tests/unit/*.test.ts` | Same logic, ported onto `lib/*.ts`. Added `tests/unit/encryption.test.ts` (no prior equivalent). |

---

## What was verified (with real evidence)

### 1. `next build`

```
▲ Next.js 16.3.2 (Turbopack)
✓ Compiled successfully in 2.7s
  Running TypeScript ...
  Finished TypeScript in 1523ms ...
✓ Generating static pages using 7 workers (5/5) in 278ms

Route (app)             Revalidate  Expire
┌ ○ /                           1d      1y
├ ○ /_not-found
├ ƒ /api/auth/callback
├ ƒ /api/auth/login
└ ƒ /configure-import

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Type-checking includes the test suite (tsconfig doesn't exclude `tests/`), so this is also proof the tests themselves type-check.

### 2. Automated test suite

```
 Test Files  8 passed (8)
      Tests  76 passed (76)
```

Files: `tests/unit/{cookieSession,encryption,parseSchedule,todoist,todoistErrors}.test.ts`, `tests/route/{login,callback,importScheduleAction}.test.ts`.

Run it yourself: `npm test`.

### 3. Smoke tests against a real `next dev` server

Ran `next dev` on port 3100 (with `ENABLE_ERROR_DEMO=true` set inline for the session, not written to `.env.local`) and hit it with real `curl` requests — not simulated.

**`GET /`** → `STATUS:200`, body contains `<h1>NBA Schedule Import</h1>` and the "Log in with Todoist" button (today's date is before the 2026-27 season start, so the landing page — not season-over — is correctly shown).

**`GET /configure-import` with no cookie** → `STATUS:200`, body contains `<h1>Something went wrong</h1>` / `An error occurred` — correctly falls back to the unclassified-error page when there's no session (matches the original's behavior of a missing-token error, now rendered as a page instead of a bare string).

**`GET /configure-import` with a real mock session cookie** — I generated a genuine Iron-sealed cookie value using the app's own `lib/encryption.ts` logic (via `@hapi/iron` directly, sealing the string `"fake-token-for-smoke-test"` with the real `ENCRYPTION_KEY` from `.env.local`), sent it as the `session` cookie, and hit `/configure-import`. The page correctly decrypted the cookie, then made a **real call to the live Todoist API** with that (invalid) token, got a real 401 back, and rendered:

```
STATUS:200
<h1>Session expired</h1>
<h3>Your Todoist session has expired or was revoked. Please log in again.
```

This is genuine end-to-end evidence that cookie decryption → real Todoist API call → error classification → error page rendering all work together, without needing valid Todoist credentials.

**Same cookie + `?mockTodoistError=429`** (demo mode) →

```
STATUS:200
<h1>Todoist is rate-limiting us</h1>
<h3>Todoist is rate-limiting requests right now. Please wait about 12s and try again.
...demo-banner...🧪 Error demo: the next Todoist API call will simulate 429 Too Many Requests (rate limited)
```

Confirms the `DemoBanner` Server Component and the full classified-error pipeline render correctly through the real page.

**`GET /api/auth/login`** → `307` redirect to `https://todoist.com/oauth/authorize?client_id=...&scope=data:read_write&state=...&redirect_uri=...` — correct shape. (Note: this smoke test inadvertently printed your real `CLIENT_ID` and `STATE_SECRET` values into the agent transcript via the `Location` header. Neither is a Todoist *secret* in the credential sense — `CLIENT_ID` is not sensitive, and `STATE_SECRET` is just a CSRF nonce, not an API key — but if you'd rather not have `STATE_SECRET` sitting in a transcript, it's a one-line rotation in `.env.local` and Todoist's app console isn't involved.)

**`GET /api/auth/callback?code=fake&state=wrong`** → `403`, `"State mismatch! Potential CSRF attack."` — confirms the route is live and the CSRF check works, without touching Todoist's API or needing the real `STATE_SECRET`.

The dev server was stopped after smoke testing (`pkill`, verified no process remains).

**Not smoke-tested via curl**: the callback route's success path with a *mocked* Todoist token exchange. Mocking a network call against a live `next dev` server via plain `curl` isn't really doable without adding an interception layer (e.g. MSW) purely for this one manual check — that felt disproportionate. Instead, that exact scenario (`retrieveAccessToken` mocked, real `saveAccessToken`/`lib/cookieSession.ts`/`lib/encryption.ts` code path, real cookie assertions) is covered by `tests/route/callback.test.ts`, which is the strongest test in the suite — see below.

---

## Cookie-security preservation — the non-negotiable part

**Status: preserved, with one documented architectural simplification. Directly tested, not just asserted.**

### What's identical to the original

- `httpOnly: true`
- `secure: true`
- `sameSite: 'lax'` — specifically lax, not strict. The comment explaining why (`'strict'` breaks the cookie on the redirect chain back from Todoist's OAuth flow) is preserved verbatim in `lib/cookieSession.ts`.
- 1-hour session lifetime — correctly expressed as `SESSION_MAX_AGE_SECONDS = 60 * 60` (3600) for `next/headers`' `cookies().set()`, which takes `maxAge` in **seconds** — not the `3600000` milliseconds the old `cookie-session` config used. This unit trap is called out explicitly in `lib/cookieSession.ts` and has a dedicated test.
- The access token is still encrypted with `@hapi/iron` (`lib/encryption.ts`, byte-for-byte the same `encrypt`/`decrypt` functions) before it ever goes into the cookie, using the same `ENCRYPTION_KEY` env var as before.

### One deliberate change: single-layer cookie instead of two

The original had two layers: the `cookie-session` Express middleware wrapped the whole session object in a base64 JSON envelope, HMAC-signed with `COOKIE_SECRET` (integrity only — that layer was never encryption). *Inside* that envelope, the access token itself was separately Iron-sealed with `ENCRYPTION_KEY` (real encryption + its own built-in authentication tag).

The new implementation drops the outer envelope: the cookie's value **is** the Iron-sealed token directly. `COOKIE_SECRET` is no longer read anywhere in the codebase.

**Note on the task brief vs. the actual code**: the migration brief said the Iron-sealing uses "the same `COOKIE_SECRET` env var" — that's not quite what the original code does. `app/utils/encryption.js` sealed with `ENCRYPTION_KEY`; `COOKIE_SECRET` was a *different* variable, consumed only by the `cookie-session` middleware for its outer envelope signature. I've preserved the actual original behavior (Iron sealing uses `ENCRYPTION_KEY`) rather than the brief's description of it, and I'm flagging the discrepancy here explicitly per "say clearly and honestly... if anything had to change and why."

### Is dropping the outer cookie-session layer a security downgrade? No.

You asked this directly, so it's worth spelling out fully rather than leaving it as a footnote:

- `cookie-session`'s actual job is mechanical: set/read a cookie with certain attributes (httpOnly/secure/sameSite/maxAge), and sign the value so tampering is detectable.
- `next/headers`'s `cookies().set(name, value, {...})` does that identical mechanical job — same attributes, natively in Next's Request/Response model. Nothing functional is lost by using it directly instead of forcing an Express middleware into a Route Handler where it wouldn't actually plug in cleanly anyway (`cookie-session` expects an Express `req`/`res`, which don't exist in this model).
- The actual security-critical piece — encrypting the access token with `@hapi/iron` before it's ever written to a cookie — is completely framework-agnostic and carries over **unchanged**. Iron's authenticated encryption already provides both confidentiality *and* tamper-detection for the token. That's a strictly stronger guarantee for the thing that actually matters (the token) than `cookie-session`'s own HMAC signing was contributing on top of it — that outer signature was somewhat redundant once Iron was already in the picture, since a tampered cookie fails to `Iron.unseal` regardless of whether an outer signature also would have caught it.
- Net effect: same or arguably better security posture for the sensitive part (the token), one fewer third-party dependency (`cookie-session` is gone from `package.json` entirely), expressed idiomatically for the framework instead of shoehorned in.

If you want the outer envelope back for exact structural parity with the original (not required for security, but possible if you want it), it'd mean re-introducing a second HMAC pass over the whole cookie value using `COOKIE_SECRET` before calling `cookies().set()` — happy to add that if you'd rather have it, but I didn't do it by default since it's not adding real protection.

### The tests that prove all of the above

`tests/route/callback.test.ts` is the primary evidence. It calls the **real** `GET` handler from `app/api/auth/callback/route.ts`, which calls the **real** `saveAccessToken` from `lib/cookieSession.ts`, which calls the **real** `encrypt` from `lib/encryption.ts` (actual `@hapi/iron` seal, using the test `ENCRYPTION_KEY` from `tests/setup/env.ts`). Only `next/headers` (mocked with an in-memory cookie jar, since there's no live Next.js request context to back a real `cookies()` call inside a standalone Vitest process) and the network call to Todoist (mocked `retrieveAccessToken`) are faked.

- **(a) exact cookie attributes** — `"(a) sets the session cookie with exactly the required attributes on success"` asserts `cookieStore.set` was called with `{ httpOnly: true, secure: true, sameSite: "lax", maxAge: 3600, path: "/" }` exactly.
- **(b) the encryption round trip through the real cookie code path** — `"(b) the cookie value set on success decrypts back to the real access token (same iron round trip)"` takes the actual sealed value the route set, and decrypts it with the real `lib/encryption.ts` `decrypt`, and asserts it equals the original access token. `tests/unit/encryption.test.ts` additionally proves the raw `@hapi/iron` round trip in isolation (including that a tampered value is correctly rejected).
- **(c) missing/invalid cookie ⇒ unauthenticated** — `tests/unit/cookieSession.test.ts`: `"throws when no session cookie is present"` and `"throws (not crashes) when the session cookie fails to decrypt"` both prove `getAccessToken()` throws rather than returning something silently wrong, which is what every caller (`page.tsx`, `actions.ts`) relies on to fall into the "not authenticated" branch.

Full output from the run that produced this document:

```
 Test Files  8 passed (8)
      Tests  76 passed (76)
```

---

## Judgment calls and deviations (full list)

1. **Server Action, not a Route Handler, for schedule import** (`app/configure-import/actions.ts`). The original's error contract to the browser was never actually HTTP-status-driven client-side — `public/scripts/api/importSchedule.js` (now removed) only ever branched on the *parsed JSON body* (`data.message`, `data.errorType`, `data.retryable`, `data.retryAfterSeconds`); the specific status code (401 vs. 429 vs. 502) was checked as a bool (`response.ok`) but never inspected. A Server Action returning a `{ success: true, deepLink } | { success: false, message, errorType?, retryable?, retryAfterSeconds? }` union carries the exact same information with less code, and integrates directly with `PickerForm`'s React state. Nothing is lost.

2. **Team data read directly server-side, not via `/api/get-teams`.** `app/configure-import/page.tsx` calls `lib/parseSchedule.ts`'s `getTeams()` directly (it's already a Server Component doing async work for the project-limit check) instead of the original's client-side `fetch("/api/get-teams")`. Saves a network round trip; the ~12k-line JSON file is only ever read server-side now.

3. **Known limitation: `/configure-import`'s error page always responds `200`, not the original's classified status (401/429/502/500).** A Server Component page in the App Router has no API to set an arbitrary response status — only `notFound()` (404) or `redirect()`. This is a genuine Next.js App Router limitation, not an oversight; documented in `components/ErrorPage.tsx` and `app/configure-import/page.tsx`. If this status code actually matters to you (e.g. for monitoring/alerting on 5xx rates), the fix is straightforward: move this specific page to a Route Handler that manually renders HTML with `new Response(html, { status })`, trading away the Server Component ergonomics for status-code control. I left it as a Server Component per the task brief's explicit instruction, and flagged the trade-off rather than silently picking one side.

4. **`PickerForm`'s fade/timing choreography approximates, rather than replays, the original's CSS `transitionend`-driven sequencing.** The original listened for a real `transitionend` DOM event before removing the form from the DOM; `PickerForm.tsx` uses a `setTimeout` of the same duration (1000ms, matching `style.css`'s `form { transition: opacity 1s ease, ... }`) instead. Functionally equivalent for the CSS as currently written (transition durations are fixed, not computed), but genuinely different mechanisms — worth knowing if you ever change the CSS transition duration without updating `FORM_FADE_OUT_DURATION_MS` in `PickerForm.tsx` to match.

5. **Removed the Express catch-all route and the `/test-season-on` / `/test-season-over` debug routes** (`app/routes/pages/index.js`, now deleted). The original had a `router.get("*", ...)` that served the landing/season-over page's HTML (status 200) for literally any unmatched path. Next's App Router default (a real 404 via `not-found`) replaced this without extra work — I judged serving 200 + landing-page content for arbitrary URLs to be unusual behavior worth dropping rather than preserving, but flagging in case you disagree. The two `/test-season-*` debug routes were dev-only scaffolding superseded by the smoke tests above.

6. **`COOKIE_SECRET` is now unused** (see cookie-security section). Left defined in `.env.example` rather than removed, in case you want it back for the optional outer-envelope parity mentioned above.

7. **Dependencies dropped**: `express`, `cookie-session`, `dotenv`, `nodemon`, `supertest` all removed from `package.json` — none has a role in a Next.js app (Next loads `.env.local` natively; there's no Express server to run under `nodemon`; Route Handlers are tested by calling the function directly, no Supertest needed).

8. **Pre-existing transitive vulnerabilities**: `npm audit` reports 3 vulnerabilities (1 moderate, 2 high) in `form-data`/`uuid`, both transitive through `@doist/todoist-api-typescript@6.0.1` — the same version pinned in the original `package.json`. Not introduced by this migration; `npm audit fix --force` would bump to `@doist/todoist-api-typescript@7.10.0` (a breaking change) to resolve, which felt out of scope for an exploratory rewrite. Worth doing on whichever branch you actually keep maintaining.

9. **`AGENTS.md` / `CLAUDE.md` at the repo root are auto-generated by Next.js 16 itself** (`next dev`/`next build` regenerate them via `node_modules/next/dist/server/lib/generate-agent-files.js` if missing). They just point AI coding agents at Next's own docs for breaking-changes awareness. Next's own comment inside the file says committing them "keeps the tree clean" (since otherwise every `next dev` run re-dirties the working tree) — so I committed them rather than fighting an ecosystem convention for tidiness alone.

10. **`server.js`** (the old local dev entrypoint for `node server.js`) is untracked/gitignored and now stale — it still imports the now-deleted `app.js`. I left it alone rather than deleting an untracked file outside the migration's scope; it's simply unused now that `npm run dev` runs `next dev` instead.

---

## Static generation strategy for the landing page (`app/page.tsx`)

Chosen: **ISR** (`export const revalidate = 86400;`), not pure SSG.

`isSeasonOver()` depends on two things: the schedule JSON (changes ~once a year, around October) *and* today's date compared to the season's final game time (changes every day). I considered and rejected pure static export with no revalidation: it would freeze `isSeasonOverBool` at whatever it evaluated to at build time and never re-check it. Nothing about the calendar crossing the season-end date would trigger a rebuild on its own — the site could keep showing the wrong page (the picker after the season's actually over, or the season-over page after a new season's actually started) for however long it goes between deploys, potentially months. That's exactly the kind of bug that's silent and easy to miss in review, since the page still "works," it's just wrong on the one day it matters most.

`revalidate = 86400` (24h) keeps the real performance win — not re-reading/re-parsing the ~12k-line schedule JSON on every single request — while Next transparently regenerates the page in the background on that interval, so the season-boundary check is still re-evaluated daily. Day-level granularity is all this check needs (nothing about "is the season over" requires hour-level freshness). `/configure-import` is intentionally excluded from this — it reads the per-user session cookie and calls the live Todoist API for a per-user project count, so it's marked `export const dynamic = "force-dynamic"` and can't be static regardless of interval.

---

## LOC / file-count comparison

Counted with `git ls-tree` against the pre-migration commit (`5108320`, includes the already-merged error-handling-hardening work) vs. the new tree, `wc -l` per file, excluding tests (compared separately).

| | Files | Lines |
|---|---|---|
| **Old** (Express + vanilla JS: `app.js`, `api/index.js`, `app/routes/**`, `app/utils/**`, `app/views/**`, `public/scripts/**`) | 27 | 1,827 |
| **New** (Next.js: `app/**/*.{ts,tsx}`, `lib/**`, `components/**`) | 21 | 1,940 |
| Old tests | 9 | 1,038 |
| New tests | 9 | 1,000 |

Takeaway: fewer files (App Router's colocation + dropping the `/api/get-teams` round trip account for most of that), but **not fewer lines** — the new code carries meaningfully more inline commentary explaining framework-specific decisions (why ISR not SSG, why a Server Action, the cookie-security writeup, etc.), plus TypeScript types add real lines that plain JS didn't have. If you're sizing "is this simpler," file count and cognitive load probably say yes; raw LOC says roughly a wash, maybe slightly larger. That commentary density is partly an artifact of this being a from-scratch AI-assisted rewrite optimized for reviewability rather than terseness — a hand-written migration would likely land with less prose per file.

---

## How to run it

**Local dev** (you'll need your own real values in `.env.local` — the existing one should still work since none of the env var names changed except `COOKIE_SECRET` becoming unused):

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`. For an actual login, you'll need `CLIENT_ID`/`CLIENT_SECRET`/`REDIRECT_URI` pointed at a real Todoist OAuth app (same as before — nothing about the OAuth app registration changed).

**Production build** (still local-only — nothing here was deployed):

```bash
npm run build
npm start
```

**Tests**:

```bash
npm test              # single run
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

All tests run on dummy env values from `tests/setup/env.ts` (same pattern as before, just renamed `.js` → `.ts`) — no real credentials needed to run the suite.

---

## What you need to check yourself

I did not attempt a real OAuth login against the live Todoist site, per the task instructions. Everything OAuth-related was either unit/route-tested with mocks (`tests/route/callback.test.ts`, `tests/route/login.test.ts`) or smoke-tested against real infrastructure *except* the actual Todoist login screen (the CSRF check, the login redirect shape, and a real-but-invalid-token API call were all exercised for real; a real *valid* token exchange was not).

To fully verify before trusting this for anything real, please:

1. Set up `.env.local` with real `CLIENT_ID`/`CLIENT_SECRET`/`REDIRECT_URI` (pointed at `http://localhost:3000/api/auth/callback` for local testing) and run `npm run dev`.
2. Click "Log in with Todoist" on `/`, complete the real OAuth consent screen, and confirm you land on `/configure-import` with the picker form actually populated (team dropdown, project radio buttons) — this is the one flow I could not exercise at all without your credentials, since `getTeams()`/the picker form render was only verified via smoke tests using a fake token, which necessarily short-circuits before the form renders.
3. Actually pick a team + destination and confirm games land in Todoist correctly (task order, due dates, the yearly-reminder task) — the underlying `lib/todoist.ts` logic is unit-tested with mocked API responses, but a real end-to-end import was not run.
4. If you care about it: check your browser's dev tools → Application → Cookies after logging in, and confirm the `session` cookie shows `HttpOnly`, `Secure`, `SameSite=Lax` in the browser UI — a final real-world sanity check on top of the automated proof above.
