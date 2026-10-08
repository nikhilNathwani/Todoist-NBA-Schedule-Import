# Testing Guide

This file teaches automated testing in the context of this repository.

## Why automated testing matters

Automated tests are executable checks that verify your app still behaves correctly as code changes.

What they give you:

- Faster feedback than manual clicking
- Confidence during refactors
- Protection against regressions in auth, schedule parsing, and Todoist import behavior
- Better engineering signal for interviews and resume discussions

## Testing stack used in this project

This project uses:

- Vitest: test runner and assertion framework
- Supertest: integration testing for Express routes
- V8 coverage provider: code coverage reports

### Why Vitest instead of Jest here

Jest is still excellent. Vitest is a strong choice for modern ESM projects like this one because:

- Native-feeling ESM support with less config friction
- Very fast startup and test runs
- Jest-like API (`describe`, `it`, `expect`, `beforeEach`, mocks), so interview knowledge transfers directly

If you already know Jest, almost everything here maps 1:1.

## Test types in this project

### 1. Unit tests

Unit tests verify isolated logic with dependencies mocked.

Files:

- `tests/unit/parseSchedule.test.js`
- `tests/unit/cookieSession.test.js`
- `tests/unit/todoist.test.js`
- `tests/unit/todoistErrors.test.js`
- `tests/unit/encryption.test.js`
- `tests/unit/escapeHTML.test.js`

Examples in this repo:

- Date filtering logic (`isLaterThanNow`, `getUpcomingGames`)
- Session token save/load behavior
- Task formatting and destination logic for Todoist
- Plan-based project limits (`getUser().isPremium` picks the 5 or 300 cap)
- Retrying failed game imports (with fake timers, so the 10s wait is instant)
- Classifying Todoist failures by status code
- Real `@hapi/iron` encryption: round trip, tampered or wrong-key values rejected
- HTML escaping, including on the real error and setup pages (these tests fail if escaping is removed)

### 2. Integration tests

Integration tests verify behavior across components (route + middleware + mocked service layer).

Files:

- `tests/integration/app.test.js`
- `tests/integration/routes/setupApiRoute.test.js`
- `tests/integration/routes/authRoutes.test.js`
- `tests/integration/routes/setupPageRoute.test.js`

Examples in this repo:

- API status codes and JSON response shapes
- OAuth state checks, using the real `cookie-session` middleware and a Supertest agent that keeps cookies between requests like a browser
- The setup page: team options rendered in city order, "Create New Project" disabled at the plan limit, logged-out redirect, classified error pages
- The session cookie's flags (`httpOnly`, `secure`, `sameSite=Lax`, 1 hour), checked on the real `app.js`; a forged session cookie leaves the visitor logged out
- OAuth error responses (bad code 400, rate limited 429, outage 502)
- The fully assembled `app.js` boots and returns a 404 for unknown paths (each route test builds its own small app, so only this catches mistakes in how `app.js` wires them together)

## Project test structure

```text
tests/
  setup/
    env.js                      # test environment variables
  unit/
    parseSchedule.test.js
    cookieSession.test.js
    todoist.test.js
    todoistErrors.test.js
    encryption.test.js
    escapeHTML.test.js
  integration/
    app.test.js
    routes/
      setupApiRoute.test.js
      authRoutes.test.js
      setupPageRoute.test.js
```

## How Vitest works

Vitest discovers files matching `tests/**/*.test.js` (configured in `vitest.config.js`).

Core building blocks:

- `describe("group", () => {})`: group related tests
- `it("does x", () => {})`: one behavior expectation
- `expect(actual).matcher(expected)`: assertions
- Hooks like `beforeEach` and `afterEach` for test setup/cleanup

## Mocks

Mocks replace real dependencies with controlled test doubles.

Why they matter:

- Prevent real Todoist API calls in tests
- Let you simulate failures reliably
- Keep tests deterministic and fast

Patterns used:

- `vi.mock("module", factory)` to replace imported modules
- `vi.fn()` to create mock functions
- `mockResolvedValue` / `mockRejectedValue` to control async behavior

## Spies

A spy records how a function was called.

In Vitest, `vi.fn()` mocks are also spies.

Typical assertions:

- `toHaveBeenCalled()`
- `toHaveBeenCalledWith(...)`
- `toHaveBeenCalledTimes(n)`

These prove integration behavior, not just return values.

## beforeEach and afterEach

Use hooks to avoid test cross-contamination.

Examples in this repo:

- Reset mock call history in `beforeEach`
- Restore real timers after fake-timer tests (`vi.useRealTimers()` in a `finally` block)

If you do not reset state, tests can become flaky and misleading.

## `expect()` and common matchers

Common matchers you will use often:

- `toBe(value)`: strict equality
- `toEqual(obj)`: deep equality
- `toContain(text)`
- `toHaveLength(n)`
- `toThrow(error)` / `.rejects.toThrow(error)`
- `expect.objectContaining({ ... })` for partial object checks

Use the strictest matcher that communicates intent clearly.

## Coverage

Coverage answers: "Which lines/branches/functions were executed by tests?"

Run coverage with:

- `npm run test:coverage`

Reports are generated in:

- `coverage/index.html` (human-readable)
- `coverage/lcov.info` (CI tooling)

Important: high coverage is not the goal by itself. Meaningful coverage is the goal.

## How to run tests

Run all tests once:

- `npm test`

Run watch mode (reruns on file changes):

- `npm run test:watch`

Run coverage mode:

- `npm run test:coverage`

Run one specific test file:

- `npx vitest run tests/unit/todoist.test.js`

Run tests matching a name:

- `npx vitest -t "imports schedule and returns deep link"`

## How to interpret test output

For each test file, Vitest shows:

- pass/fail status
- failing test names
- assertion diffs and stack traces

When a test fails:

1. Read the test name first (what behavior broke)
2. Read assertion diff (expected vs received)
3. Read stack trace (where it broke)
4. Reproduce with a single test file for faster debugging

## Debugging failing tests

Practical workflow:

1. Run a single file (`npx vitest run path/to/file.test.js`)
2. Add temporary `console.log` in test and code under test
3. Verify mock setup order (ESM mocking is order-sensitive)
4. Confirm async code is awaited
5. Check if shared state needs reset in `beforeEach`

## CI: why it matters

This repo includes GitHub Actions workflow:

- `.github/workflows/tests.yml`

It runs tests on:

- pushes to `main`
- all pull requests

Why teams do this:

- Enforces quality gates before merge
- Prevents "works on my machine" issues
- Gives contributors immediate feedback

Should tests run before deploy?

- Professional standard: yes, always run tests before deployment.
- For this project: tests should be part of your deployment pipeline gate.

## Professional workflow recommendations

Standard practice on teams:

- CI-required tests on PRs
- Unit + integration tests for business logic and routes
- Coverage tracking trend (not only a hard percentage)

Optional for solo projects (nice to have):

- Pre-push hook to run tests (`npm test`)
- Pre-commit hook for lint/format only (tests can be too slow for every commit)

## Best practices

- Test behavior, not implementation details
- Keep tests small and readable
- Prefer deterministic tests (no real network calls)
- Mock at boundaries (external APIs, not every internal helper)
- Name tests as user/developer-observable behaviors

## Common beginner mistakes

- Writing tests only to increase coverage percent
- Over-mocking everything (tests become fragile)
- Not resetting mocks between tests
- Asserting too little (test passes but proves nothing)
- Ignoring error-path tests
- Writing giant integration tests that are hard to debug

## What this suite intentionally does not test

To avoid brittle or low-value tests, this setup does not heavily test:

- Static HTML template strings line-by-line
- CSS and animation timing implementation details
- Third-party library internals (Todoist SDK internals, `@hapi/iron` internals)

Instead, we test the behavior your code owns.
