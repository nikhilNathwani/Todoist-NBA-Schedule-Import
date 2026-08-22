# Known issues / follow-ups

Findings from a post-migration audit of the `nextjs-migration` branch (now merged into `main`). Not urgent, not blocking the presentation -- just tracked here so they don't get lost.

---

## Resolved

### ~~1. OAuth `state` is a static value, not a per-request nonce~~ -- fixed

**Was:** `state=${STATE_SECRET}` sent the same fixed environment variable on every login attempt; the callback checked `state !== STATE_SECRET`. A static value is really a second permanent secret, not a per-request nonce, and only protects until that one value ever leaks once.

**Fix (shipped):** `lib/oauthState.ts` now generates a fresh `crypto.randomUUID()` per login attempt in `/api/auth/login`, stores it in a short-lived `httpOnly` cookie, and `/api/auth/callback` compares against that cookie's value (then clears it, single-use) instead of a fixed env var. `STATE_SECRET` is no longer read anywhere in the app -- removed from `.env.example`, `README.md`, and `tests/setup/env.ts`. Covered by `tests/unit/oauthState.test.ts` and the updated `tests/route/login.test.ts` / `tests/route/callback.test.ts`; also live-verified against a real Todoist login locally, including confirming a forged callback (no matching cookie) is still correctly rejected with 403.

### ~~2. Per-game import failures are swallowed silently~~ -- fixed

**Was:** `importGame` caught and `console.error`'d failures without re-throwing; `importSchedule`'s `Promise.all` meant if 3 of 20 games failed, the user still got a "success" result with no indication anything was missing.

**Fix (shipped):** `lib/todoist.ts`'s `importSchedule` now uses `Promise.allSettled`, and retries whatever failed on the first pass once, together, after a single ~10s backoff (not a rollback, and not a per-game sequential retry -- the errors observed in practice were transient 502/503s from bursting ~80 `addTask` calls at once, which a short shared pause reliably clears). If any games are still failing after that retry, `importSchedule` throws a classified error naming exactly which games didn't make it and how many did succeed, which flows through the existing error-page/subtitle mechanism -- not a silent "78 of 80" success, and not a rollback of the games that did succeed (a rollback's own delete calls are exactly as failure-prone as the adds that got us here). Covered by two new tests in `tests/unit/todoist.test.ts`.

`addYearlyReminder`'s own failure handling (a single, lower-stakes task) was deliberately left as-is -- out of scope for this pass.

---

## Open

## 1. OAuth URL params aren't URL-encoded

**Where:** `app/api/auth/login/route.ts`

**What:** `CLIENT_ID` and `REDIRECT_URI` are interpolated directly into the authorize URL without `encodeURIComponent`. Low real risk given current values (neither contains characters needing escaping today), but not guaranteed-safe practice if either value ever changed shape. (The `state` param no longer has this concern -- `crypto.randomUUID()` is always URL-safe by construction.)

**Pre-existing.**

---

## Not an issue, but worth understanding cold if asked

**`LogoBanner`'s Server/Client Component boundary.** It has no `"use client"` directive, but it's imported and rendered directly inside `PickerForm.tsx` (a Client Component). Under the App Router's composition rules, a Server Component only stays server-rendered when passed down *as children* from a Server Component parent -- directly importing and rendering it from inside client code pulls it into the client bundle regardless of its own directive. No actual bug (LogoBanner has no server-only code), just a nuance worth being able to explain.
