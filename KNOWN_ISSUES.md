# Known issues / follow-ups

Findings from a post-migration audit of the `nextjs-migration` branch, deliberately not acted on yet. Not urgent, not blocking the presentation decision -- just tracked here so they don't get lost.

---

## 1. OAuth `state` is a static value, not a per-request nonce

**Where:** `app/api/auth/login/route.ts:6-7`, `app/api/auth/callback/route.ts:6,21`

**What:** `state=${STATE_SECRET}` sends the same fixed environment variable on every login attempt; the callback checks `state !== STATE_SECRET`. Standard OAuth CSRF protection (OWASP, and Todoist's own guidance) calls for a fresh, random, single-use value generated per login attempt -- a static value is really a second permanent secret, not a per-request nonce, and only protects until that one value ever leaks once.

**Pre-existing**, not introduced by the Next.js migration -- carried over unchanged from the original Express app. Worth noting it *has* leaked once already, into an agent smoke-test transcript during this migration (low real-world exposure -- local file only, never committed or published -- but a live illustration of exactly the risk a static value carries).

**Fix, if/when this gets picked up:** generate `crypto.randomUUID()` per login attempt in `/api/auth/login`, store it in a short-lived `httpOnly` cookie before redirecting to Todoist, and have `/api/auth/callback` compare against that cookie's value (then clear it) instead of a fixed env var. Real, scoped work -- touches both auth routes and adds a second cookie -- not a one-liner.

---

## 2. Per-game import failures are swallowed silently

**Where:** `lib/todoist.ts:213-218` (`importGame`), `lib/todoist.ts:290-294` (`addYearlyReminder`)

**What:** Both catch and `console.error` failures without re-throwing. `importSchedule`'s `Promise.all` over `importGame` calls means if 3 of 20 games fail to import, the user still gets a "success" result and a deep link, with no indication some games are missing.

**Pre-existing**, ported logic unchanged from the original. Worth revisiting if "how do you evaluate success/failure" ever comes up for this project specifically -- right now, success is over-reported.

---

## 3. OAuth URL params aren't URL-encoded

**Where:** `app/api/auth/login/route.ts:7`

**What:** `CLIENT_ID`, `STATE_SECRET`, `REDIRECT_URI` are interpolated directly into the authorize URL without `encodeURIComponent`. Low real risk given current values (none contain characters needing escaping today), but not guaranteed-safe practice if any of those values ever changed shape.

**Pre-existing.**

---

## 4. Candidate: `NextStepsList`'s fade-in could drop its `useEffect` entirely

**Where:** `app/configure-import/_components/NextStepsList.tsx`, `public/style.css:405-414`

**What:** The current fade-in relies on `style.css`'s `ul { opacity: 0; transition: opacity 1s ease; } ul.fade-in { opacity: 1; }` -- a **transition**, which only animates on a *state change after the initial paint*, hence the `useEffect(() => requestAnimationFrame(() => setVisible(true)), [])` dance to render once without the class, then add it a frame later.

A CSS **`@keyframes`** animation instead of a transition would play automatically on mount with no JS trigger needed at all -- e.g. `@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }` + `ul { animation: fadeIn 1s ease; }`, always rendered with the animation class from the start. This codebase already uses `@keyframes` elsewhere (`.spinner { animation: spin 2s linear infinite; }`), so it'd be the more consistent choice, not a new pattern.

This would eliminate the `useEffect`, the `visible` state, and the cancel-on-unmount cleanup in `NextStepsList.tsx` -- genuinely simpler, not just "no effect for its own sake." Not applied yet since it touches shared CSS -- flagged as a candidate, not done.

---

## Not an issue, but worth understanding cold if asked

**`LogoBanner`'s Server/Client Component boundary.** It has no `"use client"` directive, but it's imported and rendered directly inside `PickerForm.tsx` (a Client Component). Under the App Router's composition rules, a Server Component only stays server-rendered when passed down *as children* from a Server Component parent -- directly importing and rendering it from inside client code pulls it into the client bundle regardless of its own directive. No actual bug (LogoBanner has no server-only code), just a nuance worth being able to explain.
