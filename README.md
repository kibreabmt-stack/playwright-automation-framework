# Playwright automation framework

TypeScript + Playwright Test with Page Object Model UI tests, REST API tests,
UI/API end-to-end scenarios, and bounded load testing. Includes an isolated local
todo application: no external account, credentials, or public API required.

## Quick start

Install Node.js 22+ and npm, then from the repository root:

```sh
npm ci
npx playwright install --with-deps chromium
cp .env.example .env
npm run typecheck
npm test
npm run report
```

On Windows, copy `.env.example` to `.env` using your shell or editor.
Linux browser dependency installation may require administrator privileges.
The runner starts and stops the local demo automatically at
`http://127.0.0.1:4173`. Keep that port free. To explore the demo manually, use
`npm run demo`, open that URL, and stop the server before running tests.
The demo is loopback-only, stores data in memory, and is **not a production app**.

## Structure

```text
src/
├── pages/             # Accessible-locator page objects
├── tests/
│   ├── ui/            # Browser interactions through page objects
│   ├── api/           # REST lifecycle, negative cases, utility regression tests
│   ├── e2e/           # API setup → UI assertions; UI creation → API assertions
│   └── stress/        # Opt-in bounded health endpoint load
├── utils/             # API client, load runner, structured logger
├── config/            # Validated dev/staging/prod configuration
├── fixtures/          # Test-scoped fixtures, unique data, local demo server
└── reporters/         # Structured JSON console summary reporter
```

## Running tests

| Command | Purpose |
| --- | --- |
| `npm test` | UI Chromium + API + E2E (no stress traffic) |
| `npm run test:ui` | POM browser examples |
| `npm run test:api` | REST examples and utility regression tests |
| `npm run test:e2e` | Combined UI/API scenarios |
| `npm run test:headed` | Functional suites with visible browsers |
| `npm run test:debug` | Functional suites with Playwright Inspector |
| `npm run typecheck` | Strict TypeScript validation, no emitted build |
| `npm run report` | Open the most recent HTML report |
| `npx playwright test --list` | List all projects and tests |

Forward runner arguments after `--`, for example:

```sh
npm run test:api -- --grep "reject"
npm run test:ui -- --workers=1
```

Chromium is configured out of the box. To add Firefox/WebKit, add projects using
Playwright's device profiles in `playwright.config.ts`, install those browsers
with `npx playwright install --with-deps firefox webkit`, and include the new
project names in the desired npm scripts.

## Configuration guide

`src/config/environment.ts` loads `.env` from the working directory.
Shell/CI environment variables take precedence. Commit only `.env.example`,
never real credentials or environment files.

| Variable | Default | Description |
| --- | --- | --- |
| `TEST_ENV` | `dev` | Must be `dev`, `staging`, or `prod` |
| `UI_BASE_URL` | local demo | UI origin; must be supplied with API URL |
| `API_BASE_URL` | local demo | API origin; must be supplied with UI URL |
| `RUN_STRESS` | off | Set exactly `1` to authorize load tests |
| `STRESS_REQUESTS` | `40` | Total requests, integer 1–1000 |
| `STRESS_CONCURRENCY` | `4` | Concurrent requests, integer 1–20 |
| `STRESS_MAX_P95_MS` | `2000` | Passing p95 threshold, integer 1–60000 |

`dev` uses the demo unless both URLs are supplied. `staging` and `prod` require
both URLs, and never start the demo. Default test timeouts are 15 seconds in dev
and 30 seconds in staging/prod. URL protocols must be HTTP(S); credentials in
URLs are rejected. Routes beginning with `/` are resolved at the origin root.

Example (POSIX shell; PowerShell users can set `$env:TEST_ENV = "staging"` etc.):

```sh
TEST_ENV=staging \
UI_BASE_URL=https://ui.staging.example.com \
API_BASE_URL=https://api.staging.example.com \
npm test
```

**Adapt before targeting your own application.** Example URLs do not provide
the todo routes automatically. Replace the page object, API client, fixture data,
and assertions with your app's contract. The included contract is:

- `GET /api/health` → `200 {"status":"ok"}`
- `POST /api/todos` with `{"title":"..."}` → `201 {"id":"...","title":"..."}`
- `GET /api/todos/:id` → `200` with the todo, or `404`
- `DELETE /api/todos/:id` → `204`, or `404` if absent
- UI `/` provides labeled title/ID fields, create/find buttons, and a status region.

Functional examples create and delete data. Only run them against authorized,
dedicated test environments; selecting `prod` is **not** a read-only mode.
For authenticated apps, extend the request/browser fixtures with your app's
authentication flow and inject secrets through CI secret storage.

## Stress/load testing

Stress tests are excluded from `npm test`, skip without explicit consent, and
always skip in `prod`. Only target systems you own or have permission to test:

```sh
RUN_STRESS=1 STRESS_REQUESTS=100 STRESS_CONCURRENCY=5 npm run test:stress
```

The test calls only `GET /api/health`, uses one Playwright worker and no retries,
caps each request at one second, and enforces a 100-second request budget plus
a 120-second test timeout. Invalid/oversized budgets fail before sending traffic.
Results include failure count, elapsed time, requests/second, and nearest-rank
p95 latency as a JSON report attachment. Failed requests count toward p95.
The utility holds at most the configured concurrency in flight. This is a small,
single-process baseline—not a distributed load generator or capacity guarantee.
Avoid running multiple stress runners simultaneously.

## Reporting and debugging

- HTML: `playwright-report/index.html` (`npm run report`).
- JUnit XML: `test-results/junit.xml`.
- Console: readable runner output plus JSON events with status, duration, and retries.
- Failure diagnostics: screenshots, videos, and retained traces in `test-results/`.
  Open a trace with `npx playwright show-trace <path-to-trace.zip>`.

Reports are replaced by subsequent runs. Copy them elsewhere if you need to keep
them. Traces, screenshots, and reports can contain sensitive application data;
restrict access, do not commit them, and avoid logging credentials or payloads.

## CI/CD setup

`.github/workflows/playwright.yml` runs on pull requests, pushes to `main`/`master`,
and manual dispatch. Enable GitHub Actions in the repository settings. It uses
Node 22, `npm ci`, strict type checking, Chromium installation, and the functional
suites against the local demo. No secrets are required. CI uses two workers and
two retries for functional tests; stress tests never run by default.

The `playwright-results` artifact contains HTML/JUnit reports and diagnostics,
including on test failure, with seven-day retention. The workflow token is
read-only and superseded runs are cancelled.

For a deployed test environment, configure both URLs and `TEST_ENV` in the
test step after adapting the examples. Keep credentials in GitHub Actions
secrets. Do not expose deployment secrets to untrusted pull request code.
The workflow tests the framework; add application deployment as a separate,
appropriately authorized pipeline stage if needed.

## Docker

Docker and Docker Compose v2 are required. The Playwright image version in
`Dockerfile` must match the pinned `@playwright/test` package when upgrading.
The container runs as the non-root `pwuser`.

```sh
docker build -t playwright-framework .
docker run --rm --init --ipc=host playwright-framework
docker compose up --build --abort-on-container-exit --exit-code-from tests
```

Compose mounts `playwright-report/` and `test-results/` onto the host. On Linux,
create those folders and grant the image's `pwuser` (UID 1000) write access
before starting Compose; use appropriately scoped permissions, not world-write.
Compose forwards the documented configuration variables; `.env` is not copied
into the image. An external target must be reachable **from the container**:
`localhost` inside a container is not the Docker host. No port publishing is
needed for the internal demo.

To run a specific suite or authorized local demo load test:

```sh
docker compose run --rm tests npm run test:api
RUN_STRESS=1 docker compose run --rm tests npm run test:stress
```

## Contributing guidelines

1. Install using the lockfile (`npm ci`); keep dependency versions and the Docker
   image aligned when upgrading Playwright.
2. Put UI interactions in `src/pages`, reusable behavior in `src/utils`, and tests
   in the matching suite. Prefer role/label locators and web-first assertions;
   do not add arbitrary sleeps to browser tests.
3. Use fixtures from `src/fixtures/test.ts` for API contexts and page objects.
   Generate unique data with `todoTitle()` and immediately register created
   records with `trackTodo(id)` so teardown cleans up even after later failures.
4. Add focused positive and negative regression tests. Keep tests independent,
   parallel-safe, and free of external-service dependencies by default.
5. Run `npm run typecheck`, the affected suite, then `npm test` before submitting
   a pull request. Run authorized stress checks separately when changing load
   utilities. No separate lint/build tool is configured; TypeScript is checked
   without emitting JavaScript and Playwright transpiles tests.
6. Describe behavior changes and verification in the pull request. Never commit
   `.env`, authentication state, report artifacts, or secrets.
