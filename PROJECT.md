# QA Release HUB — Project Documentation

> Desktop hub for managing QA deployments.
> PDF report generation, deployment schedules, terminal regression testing, terminal update monitoring, LLM-based test case generation, diagnostic and backend integration tools.
> Stack: Electron + React + TypeScript + Tailwind CSS + Vite

---

## Table of Contents

1. [Project Goal](#project-goal)
2. [Architecture](#architecture)
3. [Folder Structure](#folder-structure)
4. [Technology Stack](#technology-stack)
5. [UI Design Decision](#ui-design-decision)
6. [Conventions](#conventions)
7. [Versioning](#versioning)
8. [Development Setup](#development-setup)
9. [Functional Scope — Modules](#functional-scope--modules)
10. [Input Data Format — Parsers](#input-data-format--parsers)
11. [PDF Report Structure](#pdf-report-structure)
12. [Data Persistence](#data-persistence)
13. [Error Handling Strategy](#error-handling-strategy)
14. [Testing Strategy](#testing-strategy)
15. [IPC Channels Contract](#ipc-channels-contract)
16. [TODO / Roadmap](#todo--roadmap)
17. [Companion App: Terminal Hardware Toolkit](#companion-app-terminal-hardware-toolkit)
18. [Changelog](#changelog)
19. [Architectural Decision Records (ADR)](#architectural-decision-records-adr)
20. [Acceptance Criteria per Version](#acceptance-criteria-per-version)

---

## Project Goal

A desktop application replacing manual tools used during deployments:
- Manually filling in test reports in Excel
- Notepad notes per fix/mod to be tested
- Manually creating schedules in Teams/Loop
- Manually checking update statuses on terminals via a web panel
- Manually crafting test cases from fix/mod descriptions
- Switching between scattered diagnostic utilities (log parsers, parameter parsers, QR generators, SQL clients)
- Manually managing backend lookups (card history, partner data) through external web panels

**Target user:** Software Tester (QA)
**PDF report recipient:** Senior manager (review only)
**Schedule recipient:** Developers + Testers on the deployment call
**Test case generator (Tab 6):** Used by the tester themselves to accelerate fix/mod analysis with LLM assistance

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          ELECTRON (main)                              │
│  - Application window (no system frame — custom titlebar)             │
│  - IPC handlers:                                                      │
│    * PDF export, file save, JSON store                                │
│    * Terminal API calls (auth + updates)                              │
│    * LLM API calls (Tab 6 — AIO TC-GEN)                              │
│    * MSSQL queries (Tab 10)                                           │
│    * Generic backend API bridge (Tabs 11–12)                         │
│  - electron-builder → .exe                                            │
├──────────────────────────────────────────────────────────────────────┤
│                       REACT + VITE (renderer)                         │
│  Category A — Release Management   │ Tab 1: Report Generator         │
│                                    │ Tab 2: Deployment Schedule      │
│  ──────────────────────────────────┼─────────────────────────────────│
│  Category B — Terminal Testing     │ Tab 3a: Android Terminal Reg.   │
│                                    │ Tab 3b: Embedded Terminal Reg.  │
│                                    │ Tab 4: Update Monitor           │
│  ──────────────────────────────────┼─────────────────────────────────│
│  Category C — TC Generator         │ Tab 6: AIO TC-GEN (LLM)         │
│  ──────────────────────────────────┼─────────────────────────────────│
│  Category D — Diagnostic Tools     │ Tab 7: System Log Parser        │
│                                    │ Tab 8: Parameter Parser         │
│                                    │ Tab 9: QRCode Generator         │
│                                    │ Tab 10: SQL Query               │
│  ──────────────────────────────────┼─────────────────────────────────│
│  Category E — Backend Integrations │ Tab 11: Card Management         │
│                                    │ Tab 12: Partner Management      │
│  ──────────────────────────────────┴─────────────────────────────────│
│  System area (gear icon in TitleBar): Settings / Presets / History    │
└──────────────────────────────────────────────────────────────────────┘
```

Hardware-level integrations (Printer, Cashier, Flasher, Card Reader) are **out of scope for this app** — they are intentionally extracted to a separate companion app `Terminal Hardware Toolkit` (see ADR-015). This separation keeps QA Release HUB free of native USB / serial / driver dependencies.

---

## Folder Structure

```
QAReleaseHUB/
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   └── ipc/
│   │       ├── pdf.handler.ts
│   │       ├── store.handler.ts
│   │       ├── terminalMonitor.handler.ts
│   │       ├── llm.handler.ts                # Tab 6
│   │       ├── sql.handler.ts                # Tab 10
│   │       ├── backendBridge.handler.ts      # Tabs 11–12 (generic)
│   │       └── jsonStore.ts
│   ├── preload/
│   │   └── index.ts
│   └── renderer/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.html
│       ├── components/
│       │   ├── ui/                           # Button, Input, DatePicker, Checkbox, Textarea, etc.
│       │   ├── layout/                       # TitleBar (with gear menu), TabBar, PageWrapper
│       │   ├── report/                       # Tab 1
│       │   ├── schedule/                     # Tab 2
│       │   ├── regression/
│       │   │   ├── android/                  # Tab 3a
│       │   │   └── embedded/                 # Tab 3b
│       │   ├── terminalMonitor/              # Tab 4
│       │   ├── tcGen/                        # Tab 6
│       │   ├── diagnostic/
│       │   │   ├── logParser/                # Tab 7
│       │   │   ├── parameterParser/          # Tab 8
│       │   │   ├── qrCodeGenerator/          # Tab 9
│       │   │   └── sqlQuery/                 # Tab 10
│       │   ├── integrations/
│       │   │   ├── cardManagement/           # Tab 11
│       │   │   └── partnerManagement/        # Tab 12
│       │   └── settings/                     # gear menu — presets, history, app config
│       ├── data/
│       │   ├── regression-terminal-android.json
│       │   └── regression-terminal-embedded.json
│       ├── modules/
│       │   ├── parser/
│       │   │   ├── scopeParser.ts
│       │   │   └── scheduleParser.ts
│       │   └── pdfGenerator/
│       │       ├── reportTemplate.ts
│       │       └── pdfGenerator.ts
│       ├── store/
│       │   ├── reportStore.ts
│       │   ├── scheduleStore.ts
│       │   ├── regressionStore.ts            # holds both Android + Embedded sessions
│       │   ├── terminalMonitorStore.ts
│       │   ├── tcGenStore.ts
│       │   ├── secureCredentialStore.ts      # RAM-only credentials (ADR-017)
│       │   └── settingsStore.ts
│       ├── types/
│       │   ├── report.types.ts
│       │   ├── schedule.types.ts
│       │   ├── regression.types.ts
│       │   ├── terminalMonitor.types.ts
│       │   ├── tcGen.types.ts
│       │   └── integrations.types.ts
│       ├── constants/
│       │   └── index.ts                      # all app-wide constants (UPPER_SNAKE_CASE)
│       └── styles/
│           └── globals.css
├── electron.vite.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── CHANGELOG.md
├── CLAUDE.md
├── README.md
└── PROJECT.md
```

---

## Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Desktop shell | Electron v29 | Cross-platform, rich API, IPC |
| Bundler | Vite + electron-vite | Fast HMR, easy Electron configuration |
| UI Framework | React 18 + TypeScript | Ecosystem, type safety |
| Styling | Tailwind CSS v3 | Fast development, utility-first |
| State management | Zustand | Lightweight, simple, no boilerplate |
| Rich text editor | TipTap | Inline image paste from clipboard, extensible |
| PDF generation | pdfmake | Pure JS, tables + base64 images, no Chromium |
| Excel generation | openpyxl (Python IPC) | Full formatting control, emoji, hyperlinks |
| HTTP (main process) | Node.js fetch / axios | Terminal API + LLM calls via IPC, no CORS |
| LLM API | Claude / OpenAI HTTP API | Tab 6 — TC generation from fix/mod descriptions |
| MSSQL driver | `mssql` (tedious) via IPC | Tab 10 — SQL query module |
| Persistence | JSON (electron userData) | Simple scale, no need for SQLite |
| Unit tests | Vitest | Vite-compatible, fast |
| Linting | ESLint + Prettier | Code consistency |
| Packaging | electron-builder | Windows .exe installer |

---

## UI Design Decision

### ADR-012: Slate Pro dark layout

After evaluating four dark-mode layout concepts (Obsidian Dark, Slate Pro, Zinc Minimal, Glass Dark), **Slate Pro** was selected.

Key parameters: background `#0f172a`, cards `#1e293b`, accent `#06b6d4` (cyan), left sidebar navigation.

Reason: sidebar scales better than top tabs as the app grows — and with 11 functional tabs after the v0.4 → v0.14 roadmap, top tabs would not fit. Navy base provides strong contrast for status badges without glass/blur complexity.

Trade-off: slightly more complex initial layout — acceptable given long-term ergonomic benefit.

---

## Conventions

- **TypeScript:** zero `any`, always proper type or `unknown`
- **Constants:** no hardcoded values in components — all in `src/renderer/constants/index.ts`
- **Component size:** max 200 lines per React component — split if exceeded
- **Tests:** every logical module (parser, generator, helper) ships with a `.test.ts` file
- **No code comments** explaining what code does — code is self-documenting through naming. Comments only for non-obvious reasoning (e.g. ADR references, edge case explanations).
- **Lint + type-check** must pass at the end of every session
- **Privacy / public-repo safety:**
  - No real company data in code or tests
  - Tickets in examples: `PROJ-1234`, `PROJ-5678`
  - URLs in examples: `https://api.example.com`
  - Person names in examples: `Developer A`, `Tester A`
  - Terminal names in examples and UI: `Android Terminal` / `Embedded Terminal` (no real vendor names)
  - Internal API names: never used — always generic descriptions
  - Component names in tests: `ComponentA`, `ComponentB`
  - Generic API field values: `deviceId: 12345`, `login: "qa-user"`

---

## Versioning

Semantic Versioning (`MAJOR.MINOR.PATCH`):
- **MAJOR** — breaking changes
- **MINOR** — completed roadmap milestone (v0.1, v0.2, ... v1.0)
- **PATCH** — bug fixes, small additions within a minor version

Every minor milestone:
1. `npm version minor` (bumps `package.json` and creates git tag)
2. Update `CHANGELOG.md`
3. Update `PROJECT.md` roadmap section

---

## Development Setup

```bash
npm install
npm run dev               # Electron app with HMR
npm run dev:browser       # Renderer-only preview in browser (faster UI iteration)
npm run lint
npm run type-check
npm run test
npm run build             # Production bundle
npm run dist              # .exe installer via electron-builder
```

---

## Functional Scope — Modules

### Category A — Release Management

#### TAB 1: Report Generator (v0.1 – v0.3, DONE ✅)

**Metadata form (MetaForm):**
- Deployment number: fixed prefix `R_01.00.` + input `XX` + fixed suffix `.00`
- Date from / Date to: DatePicker (popup calendar adjacent to field)
- Environment: TEST / STAGE checkboxes (both can be checked)
- Tester: dropdown with presets from `config.json` + ability to add new
- Vendor: text input — when filled, ticket cells in ChangesTable render as hyperlinks `${vendor}${ticket}`

**Scope parser** (`scopeParser.ts`):
- Input: Markdown (`* Component vX.Y.Z` → `   * TYPE - Description [PROJ-XXXX](url) Status`)
- Component header detection: **lookahead** — a line is a component header iff the next non-empty line matches `CHANGE_START_RE` (`/^\s*(?:\*\s*)?(MOD|FIX)\s*-/`). Version optional — headers without a version produce `version: ""`.
- Tickets: markdown `[PROJ-XXXX](url)`, bracketed `[PROJ-XXXX]`, and bare `PROJ-XXXX` (in that priority order)
- Statuses: `Done` | `In Review` | `Waiting for test` | `In Progress` | `Documentation`
- Suffix `(z iteracji R_...)` and `(from iteration R_...)` → ignored
- Version `v.2.6.1` → normalized to `v2.6.1`
- No ticket → empty string (not an error)

**Table 1 — Components and Changes:**
`No` | `Component` | `Version` | `Type` | `Change description` | `Ticket` | `Status`

All cells inline-editable. Ticket cell renders as `<a href>` link when vendor is set, plain editable input otherwise.

**Table 2 — Test Cases:**
`No` | `Component` | `Version` | `Type` | `Change description` | `Ticket` | `Current result` | `Result`
- Columns `No`→`Ticket`: 1:1 with Table 1 (read-only mirror)
- `Result`: always "POSITIVE", locked
- `Current result`: TipTap editor — text + inline images (Ctrl+V from clipboard, drag&drop, file picker)

> **Note:** Tab 1 does NOT include a test checklist. The checklist feature originally proposed for Tab 1 was removed on 2026-05-07 as it duplicated Tab 3 (Terminal Regression). Tab 3 is now the canonical place for checklist-style testing.

**PDF output** (pdfmake):
- Header: deployment number, period, tester, environment, generation date
- Section 1: components table with status
- Section 2: test cases table with images
- Section 3: fixed summary and recommendation (editable in settings)
- Footer: `QA Release HUB | Deployment R_xx | Page X/Y`

**Auto-save:** every 30s → `userData/drafts/current.json`, load dialog on app start

---

#### TAB 2: Deployment Schedule (v0.8) — EPHEMERAL

> Demoted from v0.4 — partially complete (parser + ScheduleBuilder structure done in v0.4.0 session A), remaining work (Loop output + clipboard + clear) deferred behind higher-priority modules.

**Schedule parser** (`scheduleParser.ts`) — two formats:

*Type A (Roman numerals):*
```
I. Component (X min)
  0. Step
  1. Step
```
Detection: first non-empty line matches `/^[IVX]+\./`

*Type B (people as headers):*
```
Developer A
1. Component (X min) - note
```
Detection: anything other than Type A

**Output (Loop Markdown)** — format for pasting into Microsoft Teams/Loop:
```
**R_01.00.46.00 — schedule**

**Developer A**
1. Component (X min)
   - [ ] DEV – START
   - [ ] DEV – END
   - [ ] TEST – START
   - [ ] TEST – END
```
- Developer per component: `DEV – START`, `DEV – END`
- Tester per component: `TEST – START`, `TEST – END`
- Dynamically add testers (button "+")
- "Copy to clipboard" button + toast

---

### Category B — Terminal Testing

#### TAB 3a: Android Terminal Regression (v0.5) — EPHEMERAL

**Data:** JSON in repository (`src/renderer/data/regression-terminal-android.json`).

**Session view:**
- Input: app version
- Toggle: STAGE / TEST
- Accordion of categories → subcategories → test cases
- Per TC: PASS ✓ / FAIL ✗ / SKIP ⊘ + Defect field (`PROJ-####`)
- Notes from JSON as read-only tooltip
- SKIP → row grayed out
- Progress bar + filters (All / FAIL only / Not executed)

**Excel output** (openpyxl via Python IPC):
- Header: `[APPLICATION][TERMINAL][VERSION][ENVIRONMENT]`
- Columns: `Test description` | `Result` (👍/👎/⮾) | `Defect` + hyperlink | `Notes`
- SKIP rows: gray background
- Categories/subcategories as section headers (bold, highlighted background)

---

#### TAB 3b: Embedded Terminal Regression (v0.6) — EPHEMERAL

Identical structure to Tab 3a but with `regression-terminal-embedded.json` as the data source. Different TC set (embedded-specific scenarios).

**Why split into 3a / 3b (ADR-014):** the Android and Embedded terminal test suites are functionally disjoint — different hardware, different OS, different feature coverage. Sharing a toggle inside one tab was confusing and made it impossible to view both progress states simultaneously.

---

#### TAB 4: Terminal Update Monitor (v0.7) — EPHEMERAL

##### Goal
Real-time view of update package processing status on terminals. The tester enters a terminal TID and sees whether a given app version has been downloaded — enabling the decision whether a given test case can already be verified.

##### Endpoint
`GET /api/v1/devices/{deviceId}/allupdates`

Parameters: `deviceId` (path, required), `dateFrom`, `dateTo`, `limit` (def. 20), `offset` (def. 0), `sort` (def. `updatedatetime`)

##### Architecture
- API calls: **IPC → main process → Node.js fetch** (never directly from renderer — ADR-010)
- Bearer token: **Zustand RAM only** — never on disk, never in `config.json` (ADR-009)
- Base URL + login: stored in `config.json`
- Password: **never** stored — required on every app start
- Token storage delegated to `secureCredentialStore` (ADR-017)

##### Response structure
```typescript
type UpdateStatus =
  | 'added'       // queued — nothing yet
  | 'generating'  // package being generated
  | 'ready'       // package ready on server
  | 'downloading' // terminal downloading
  | 'downloaded'; // terminal downloaded — ready to test ✓

interface UpdateStatusEntry {
  status: UpdateStatus;
  date: string; // ISO datetime
}

interface UpdateFile {
  fileId: number;
  fileParameterName: string;
  version: string;
  nativeVersion: string;
  addDateTime: string;
  modDateTime: string;
  size: number;
  status: { status: string; date: string };
  description?: string;
}

interface DeviceUpdate {
  updateId: number;
  addDateTime: string;
  priority: string;
  status: UpdateStatusEntry[]; // sorted descending — status[0] = current (ADR-011)
  updateType: string[];
  files: UpdateFile[];
}

interface DeviceUpdatesResponse {
  updates: DeviceUpdate[];
  offset: number;
  limit: number;
  total: number;
}
```

##### Status colors in UI
| Status | Tailwind | Meaning |
|---|---|---|
| `downloaded` | `bg-green-100 text-green-800` | ✅ Ready to test |
| `downloading` | `bg-blue-100 text-blue-800` | ⏳ Download in progress |
| `ready` | `bg-yellow-100 text-yellow-800` | 🕐 Waiting for terminal |
| `generating` | `bg-orange-100 text-orange-800` | ⚙️ Generating |
| `added` | `bg-gray-100 text-gray-600` | 📋 Queued |

##### Extracting app version from file
App version = `nativeVersion` from the file where `fileParameterName.startsWith('BSC.')`.
Explicit logic in a helper, no magic string.

##### Tab 4 components
- `MonitorAuth` — login, token state indicator (collapsible panel)
- `MonitorQuery` — TID form + filters + auto-refresh toggle
- `MonitorSummary` — bar: TID, total, timestamp, per-status counters
- `MonitorTable` — table with status badges + accordion (timeline + files)
- `MonitorHistory` — last 10 session queries, click = repopulate form

---

### Category C — TC Generator

#### TAB 6: AIO TC-GEN (v0.4) — LLM-BASED TEST CASE GENERATOR

##### Goal
Accept fix/mod descriptions (typically pasted from Jira tickets, release notes, or developer write-ups) and generate structured test cases using an LLM. Output suitable for direct use in Tab 3 regression or Tab 1 test cases.

##### Architecture
- LLM call: **IPC → main process → Node.js fetch → Anthropic/OpenAI API**
- API key: stored encrypted in `config.json` OR prompted on first use (decision deferred to v0.4 implementation session — ADR placeholder)
- Streaming response: streamed token-by-token back to renderer via IPC events for live preview
- Provider abstraction: pluggable provider interface (`ClaudeProvider`, `OpenAIProvider`) — single store, single UI

##### Inputs
- Fix/mod description (textarea)
- Optional context: component name, version, environment, prior similar TCs
- Mode toggle: "single TC" / "TC suite" / "regression checklist items"

##### Outputs
- Structured TC list with: title, preconditions, steps, expected result, priority
- Editable inline before export
- Export targets: Markdown, Tab 1 (TestCasesTable), Tab 3 JSON snippet

##### Open architectural questions (to resolve before v0.4 implementation)
- Which LLM provider as default? Claude (Anthropic) given alignment with project
- Where to store API key? Encrypted in `config.json` vs. RAM-only vs. OS keychain
- Prompt template versioning?
- Cost guardrails (max tokens per call, monthly budget alarm)?

---

### Category D — Diagnostic Tools

#### TAB 7: System Log Parser (v0.9) — LOCAL

Parses log files generated by terminals. Filter, search, interpret diagnostic data. Supports troubleshooting and test analysis. Pure local — no API, no auth. Implementation details TBD.

#### TAB 8: Parameter Parser (v0.9) — LOCAL

Parses and interprets terminal configuration parameters (text format). Reads and validates parameter values. Supports diagnostics and tests. Pure local — no API, no auth. Implementation details TBD.

#### TAB 9: QRCode Generator (v0.10) — API-BACKED ⚠️

> **Pre-implementation warning:** logic to be ported from existing standalone app (reverse engineering session required before coding).

Generates QR codes used in system processes (registration / visit initiation). API-backed — calls an external service that produces QR payloads. Generic credential handling via `secureCredentialStore`.

#### TAB 10: SQL Query (v0.12) — API-BACKED

Executes queries against MSSQL backend databases. Supports diagnostics, verification, test data lookup. Connection string + credentials managed via `secureCredentialStore`. Read-only safety guardrail by default — write queries require explicit confirmation. Implementation details TBD.

---

### Category E — Backend Integrations

#### TAB 11: Card Management (v0.13) — API-BACKED ⚠️

> **Pre-implementation warning:** logic to be ported from existing standalone app (reverse engineering session required before coding).

Generic skeleton for managing card-related data through pluggable backend (REST API, database, or both). Initial scope: viewing card event history and status changes for diagnostics. Future scope: card configuration operations. Credentials via `secureCredentialStore`.

#### TAB 12: Partner Management (v0.14) — API-BACKED ⚠️

> **Pre-implementation warning:** logic to be ported from existing standalone app (reverse engineering session required before coding).

Generic skeleton for managing partner data (card metadata, object configuration, partner-level settings). Pluggable backend. Used in administrative and operational flows. Credentials via `secureCredentialStore`.

---

### System Area (gear icon in TitleBar)

Replaces the former "Tab 5: Settings" — settings are not a daily workflow tab (ADR-016). Behind the gear menu in TitleBar:

- **Presets:** tester names, default save path, vendor URL prefix, summary text
- **History:** generated PDF report metadata (`userData/history/index.json`)
- **App config:** theme (future), language (future), LLM provider + API key (Tab 6), saved terminal monitor connections, saved SQL connections
- **About:** version, links

---

## Input Data Format — Parsers

### Parser 1: Deployment scope (scopeParser)

**Input:**
```markdown
* Component vX.Y.Z (optional suffix)
   * TYPE - Description [PROJ-XXXX](https://...) Status
   * TYPE - Description [PROJ-XXXX] Status
   * TYPE - Description PROJ-XXXX Status
```

**Rules:**
1. Component headers detected by **lookahead** — a line is a header iff the next non-empty line matches `/^\s*(?:\*\s*)?(MOD|FIX)\s*-/`
2. Version optional — normalized `v.X.Y.Z` → `vX.Y.Z`
3. Tickets — priority order: markdown link → bracketed → bare uppercase prefix
4. Statuses: `Done` | `In Review` | `Waiting for test` | `In Progress` | `Documentation`
5. Iteration suffixes (`z iteracji ...`, `from iteration ...`) → ignored
6. Non-MOD/FIX lines → silently skipped
7. Orphan MOD/FIX (no component context above) → `unparsedLines[]` (warning surfaced in UI)

### Parser 2: Deployment schedule (scheduleParser)

Already documented above under Tab 2. Auto-detection rule from ADR-006.

---

## PDF Report Structure

### Header (page 1)
```
DEPLOYMENT REPORT
R_01.00.46.00
Period: 2026-05-04 — 2026-05-06
Tester: Tester A
Environment: TEST, STAGE
Generated: 2026-05-06 14:32
```

### Section 1 — Components and Changes
Table mirroring ChangesTable.

### Section 2 — Test Cases
Table mirroring TestCasesTable with rich-text current results (TipTap → pdfmake conversion via `tiptapToText`).

### Section 3 — Summary
```
Summary:        All tests completed with positive results.
                No critical issues detected.
Recommendation: Deployment to production environment can be recommended.
```
Both texts editable in settings (gear menu).

### Footer (every page)
```
QA Release HUB  |  Deployment R_01.00.46.00  |  Page X / Y
```

---

## Data Persistence

```
userData/
├── config.json
│   - testers[]
│   - defaultSavePath
│   - vendorUrlPrefix
│   - summary { podsumowanie, rekomendacja }
│   - terminalMonitor { baseUrl, login }
│   - llm { provider, apiKey_encrypted? }   # Tab 6 — design pending
│   - sqlConnections[]                       # Tab 10
│   - integrations { card: {...}, partner: {...} }  # Tabs 11–12
│   ⚠️ Passwords / Bearer tokens NEVER stored here
├── drafts/
│   └── current.json     # Tab 1 auto-save every 30s
└── history/
    └── index.json       # generated PDF report metadata
```

**Per-tab persistence rules:**
- **Tab 1:** persisted (drafts + final history)
- **Tab 2:** ephemeral — Zustand only
- **Tab 3a / 3b:** ephemeral — Zustand only, confirmation dialog on leave with unfinished session
- **Tab 4:** ephemeral — Bearer token RAM only, results not persisted, history of 10 last queries in-session only
- **Tab 6:** generated TCs ephemeral until explicitly saved/exported; API key handling per design decision (TBD)
- **Tab 7 / 8:** ephemeral
- **Tab 9 / 10 / 11 / 12:** ephemeral session state; connection profiles (URLs, logins) in `config.json`, credentials always RAM via `secureCredentialStore`

---

## Error Handling Strategy

All IPC handlers return `IpcResult<T>` (ADR-013) — never throw raw errors across the IPC boundary.

```typescript
type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; errorCode: IpcErrorCode; errorMessage: string };

type IpcErrorCode =
  | 'AUTH_EXPIRED'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'NETWORK_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'FILE_WRITE_ERROR'
  | 'LLM_ERROR'
  | 'SQL_ERROR'
  | 'UNKNOWN';
```

---

## Testing Strategy

- Unit tests (Vitest) for every parser, generator, and pure helper
- Snapshot tests for PDF document definitions (pdfmake docDef)
- Integration tests for IPC handlers (mock fetch, mock fs)
- Manual E2E flows documented in `CLAUDE.md` session log

---

## IPC Channels Contract

| Channel | Direction | Payload | Returns |
|---|---|---|---|
| `store:get` | renderer → main | `{ key }` | `IpcResult<T>` |
| `store:set` | renderer → main | `{ key, value }` | `IpcResult<void>` |
| `pdf:generate` | renderer → main | `{ docDef, defaultName }` | `IpcResult<{ savedPath }>` |
| `terminal:login` | renderer → main | `{ baseUrl, login, password }` | `IpcResult<{ token }>` (token stays in main? — design ref ADR-009) |
| `terminal:fetchUpdates` | renderer → main | `{ deviceId, filters }` | `IpcResult<DeviceUpdatesResponse>` |
| `llm:generate` | renderer → main | `{ provider, prompt, options }` | `IpcResult<{ stream }>` (streaming events follow) |
| `sql:query` | renderer → main | `{ connectionId, query }` | `IpcResult<{ rows, columns }>` |
| `backend:call` | renderer → main | `{ integrationId, method, path, body }` | `IpcResult<unknown>` |

Renderer pattern: `window.electronAPI.<domain>.<method>()` only — no raw `ipcRenderer.invoke` from components.

---

## TODO / Roadmap

| Version | Scope | Category | Status |
|---|---|---|---|
| v0.1.0 | Foundation, layout, TabBar, MetaForm, DatePicker, UI components | A | **DONE ✅** |
| v0.2.0 | scopeParser + tests, ScopeInput, ChangesTable, TestCasesTable | A | **DONE ✅** |
| v0.3.0 | TipTap rich text, PDF report pipeline, auto-save | A | **DONE ✅** |
| v0.3.1 | Vendor field required, PDF Section 2 plain-text fix | A | **DONE ✅** |
| v0.3.2 | Draft restore dialog, inline base64 images in PDF Section 2 cells | A | **DONE ✅** |
| v0.3.3 | PDF Section 2 refactor — per-component blocks, inline images, TOC + footer back-link | A | **DONE ✅** |
| v0.3.4 | TipTap toolbar (H1/H2/lists/quote/code), auto-save persists `testResults`, low-resolution image warning, [0.3.2] backfill | A | **DONE ✅** |
| v0.4.0 | **Tab 6 — AIO TC-GEN (LLM-based)** | C | TODO |
| v0.5.0 | Tab 3a — Android Terminal Regression | B | TODO |
| v0.6.0 | Tab 3b — Embedded Terminal Regression | B | TODO |
| v0.7.0 | Tab 4 — Terminal Update Monitor | B | TODO |
| v0.8.0 | Tab 2 — Deployment Schedule (finish Loop output + clipboard) | A | PARTIAL (parser + builder done in v0.4 session A) |
| v0.9.0 | Diagnostic Pack: Tab 7 (Log Parser) + Tab 8 (Parameter Parser) | D | TODO |
| v0.10.0 | Tab 9 — QRCode Generator ⚠️ reverse-eng. brief required | D | TODO |
| v0.11.0 | Settings / Presets / History polish (gear menu) | sys | TODO |
| v0.12.0 | Tab 10 — SQL Query | D | TODO |
| v0.13.0 | Tab 11 — Card Management ⚠️ reverse-eng. brief required | E | TODO |
| v0.14.0 | Tab 12 — Partner Management ⚠️ reverse-eng. brief required | E | TODO |
| v1.0.0 | Hardening, packaging, .exe installer, full E2E pass | — | TODO |

### Pre-implementation warnings ⚠️

The following modules require a dedicated reverse-engineering / planning session **before** coding starts. Existing standalone-app logic must be reviewed first:

- **Tab 9 — QRCode Generator** (v0.10)
- **Tab 11 — Card Management** (v0.13)
- **Tab 12 — Partner Management** (v0.14)

For each, the briefing session must produce:
1. List of files / code to port
2. API contract (request, response, auth flow)
3. Credential storage decision (almost certainly `secureCredentialStore`)
4. Dependencies that need adding
5. Risk register (breaking changes, missing parts, overkill check)

---

## Companion App: Terminal Hardware Toolkit

**Separate application** — out of scope for QA Release HUB (ADR-015).

Same stack (Electron + React + TypeScript), separate repository. Houses:

- **Printer App** — printing process integration
- **Cashier App** — cashier / sales process integration
- **Terminal Flasher** — terminal service / configuration / installation operations
- **Card Reader** — magnetic / chip card reader integration with binary data manipulation

**Reason for separation:** these modules require native dependencies (USB, serial, vendor drivers) that would contaminate QA Release HUB's dependency tree. They also have a different cycle of use (ad-hoc, often hardware-specific failures) and a different audience.

Cross-app coordination (if ever needed): local IPC bridge or deep links — not a shared process.

---

## Changelog

> See `CHANGELOG.md` for the full history. Headlines only here.

- **v0.3.4** (2026-05-14) — TODOs cleanup: TipTap toolbar (H1/H2/lists/quote/code), auto-save persists `testResults`, low-resolution image warning, [0.3.2] backfill
- **v0.3.3** (2026-05-14) — PDF Section 2 refactor: per-component blocks with inline images, TOC + footer back-link
- **v0.3.2** (2026-05-10) — Draft restore dialog on app start, base64 images inline in PDF Section 2 cells
- **v0.3.1** (2026-05-10) — Vendor required guard, PDF Section 2 plain-text revert
- **v0.3.0** (2026-05-08) — TipTap + PDF generation pipeline + auto-save
- **v0.2.0** (2026-05-07) — scopeParser, ChangesTable, TestCasesTable, vendor field
- **v0.1.0** (2026-05-07) — Foundation: Electron + React + Tailwind + Zustand scaffold

---

## Architectural Decision Records (ADR)

### ADR-001: pdfmake instead of Puppeteer
Does not require Chromium, native tables + base64 images.
Trade-off: less flexible layout — acceptable for a tabular report.
**Implementation note (v0.3.0):** pdfmake runs in the renderer (Chromium environment) — font bundling in the main process proved unnecessarily complex. Renderer calls `createPdf(docDef).getBase64()`, sends base64 to main, main handles `dialog.showSaveDialog` + `fs.writeFile`. Version: pdfmake v0.3.x (Promise-based API, `addVirtualFileSystem` for fonts).

### ADR-002: JSON instead of SQLite
Scale does not justify SQLite. Simpler debugging, zero native dependencies.

### ADR-003: TipTap for rich text
Inline image paste from clipboard, extensible, React-friendly.
Trade-off: custom TipTap JSON → pdfmake content converter required.

### ADR-004: electron-vite as bundler
Ready-made main+renderer config, HMR, TypeScript out of the box.

### ADR-005: Ephemeral schedule
Tab 2 without persistence — one-time per release, history not needed.

### ADR-006: Auto-detect schedule format (Type A / Type B)
Developers send different formats. Rule: first non-empty line matches `/^[IVX]+\./` → Type A, otherwise Type B.

### ADR-007: Regression data as JSON in repository (not loaded from Excel)
Test cases stored as versioned JSON files in the repo, not loaded from Excel at startup.
Reason: version control for TCs, easy diff when adding new cases, no dependency on external files.
Trade-off: updating TCs requires editing JSON and committing — acceptable, as it should be versioned anyway.

### ADR-008: Excel output via Python/openpyxl via IPC
Generating xlsx for regression via a Python script called from Electron main process via IPC.
Reason: pdfmake does not support xlsx; openpyxl gives full control over formatting, emoji, hyperlinks, background colors.
Trade-off: requires Python on user's machine or bundling — to be resolved during .exe packaging.

### ADR-009: Terminal API Bearer token exclusively in RAM
Bearer token obtained by logging in to the terminal API stored only in Zustand store (RAM).
Never written to `config.json`, `userData`, or any file on disk.
Reason: security — token expires and should not be persisted locally.
Trade-off: requires re-login on every application start — acceptable.
**Generalized in ADR-017** to apply to all API-backed modules (Tabs 4, 9, 10, 11, 12).

### ADR-010: Terminal API calls via IPC main process (not renderer fetch)
All HTTP requests to the terminal API made in Electron main process via Node.js fetch.
Renderer communicates with main via IPC (`ipcRenderer.invoke`), never directly with the API.
Reason: no CORS issues, token not visible in renderer DevTools.
Trade-off: additional IPC layer — acceptable, consistent with rest of architecture.
**Generalized:** the same rule applies to LLM API calls (Tab 6), SQL queries (Tab 10), and generic backend integrations (Tabs 11–12) — never call external services from renderer.

### ADR-011: Current package status = status[0] (first array element)
API returns `status[]` array sorted descending by date — first element is the current package state.
This rule is explicit in code as a named constant/comment, not a magic index.

### ADR-012: Slate Pro dark layout as UI design
After evaluating four dark-mode layout concepts, Slate Pro was selected.
Background `#0f172a`, cards `#1e293b`, accent `#06b6d4` (cyan), left sidebar navigation.
Reason: sidebar scales better than top tabs as the app grows; navy base provides strong contrast for status badges.

### ADR-013: IpcResult<T> as universal IPC error contract
All IPC handlers return `IpcResult<T>` — never throw raw errors across the IPC boundary.
Error codes are typed (`IpcErrorCode`) so renderer can handle specific cases (e.g. `AUTH_EXPIRED` → show login prompt).
Reason: consistent error handling across all modules, typed error codes prevent string-matching hacks in UI.
Trade-off: slightly more boilerplate in handlers — acceptable, eliminates entire class of unhandled error bugs.

### ADR-014: Split Tab 3 into 3a (Android Terminal) and 3b (Embedded Terminal)
Android and Embedded regression suites are functionally disjoint — different hardware, different OS, different test coverage. Original plan of a single tab with a vendor toggle made it impossible to view both progress states at once and inflated single-tab complexity.
Reason: independent navigation, independent session state, independent JSON data files, clearer mental model.
Trade-off: two tabs in the sidebar instead of one — acceptable given sidebar nav scales well (ADR-012).

### ADR-015: Hardware modules extracted to separate companion app
Printer, Cashier, Flasher, and Card Reader modules live in a separate Electron app `Terminal Hardware Toolkit`.
Reason: hardware modules require native dependencies (USB/serial/vendor drivers) that would contaminate QA Release HUB's dependency tree and risk breaking core release-management flows on every native rebuild. Different usage cadence (ad-hoc per-device vs. daily release work). Different audience.
Trade-off: cross-app coordination, if needed, requires a local IPC bridge or deep links — acceptable, far cheaper than the alternative.

### ADR-016: Settings as gear menu in TitleBar, not a dedicated tab
Settings / presets / history are not a daily workflow — they belong behind an icon, not on the sidebar.
Reason: frees a sidebar slot, keeps focus on functional tabs, follows standard desktop UX (gear icon in title bar).
Trade-off: slightly less discoverable for new users — acceptable, mitigated by a clear icon and tooltip.

### ADR-017: Generic secureCredentialStore for all API-backed modules
A reusable Zustand store / pattern (`secureCredentialStore`) holds all sensitive credentials (Bearer tokens, API keys for backend integrations, MSSQL passwords, LLM API keys when set per-session).
- Credentials live in RAM only — never written to disk.
- Connection profiles (base URL, login, connection string without password) live in `config.json`.
- Per-module slots: `terminalMonitor`, `qrCodeApi`, `sqlConnections[]`, `cardApi`, `partnerApi`, `llmApi` (only if RAM mode chosen).
Reason: generalizes ADR-009 across the project, prevents the temptation to persist tokens per module, single audit surface for security review.
Trade-off: every API-backed module requires re-entry of secrets per session — acceptable, matches the project's security posture.

### ADR-018: PDF Section 2 — per-component blocks instead of test cases table
Replaced the 8-column "Test cases" table with a per-component block layout. Each MOD/FIX
renders as a standalone unit starting on its own page (pageBreak: 'before'), with full-width
inline images.
Reason: image readability — screenshots inside narrow table cells (~120pt) were unreadable
at default zoom. Block layout uses full A4-landscape width (782pt) so a typical 800x600
screenshot is readable without zoom.
Trade-off: more pages per report, but linear navigation via TOC table at the top of Section 2.

### ADR-019: TOC anchor on Section 2 title; pageReference cells without linkToDestination
TOC table is hyperlinked to per-component blocks via `linkToDestination` on Nr/Component/
Version/Result cells; the Page column uses `pageReference` (auto-resolved page number)
WITHOUT `linkToDestination` to avoid pdfmake conflict with its built-in auto-link.
Anchor for the "Back to TOC" footer link lives on the Section 2 title (substantial text
node) — pdfmake registers anchors most reliably on text nodes; table-wrapper IDs and
tiny invisible markers get lost during layout decomposition.
Trade-off: footer back-link visibility computed by simple page-range (currentPage > 1 &&
currentPage < pageCount) instead of dynamic section tracking, which pdfmake's
pageBreakBefore callback handles inconsistently for non-table nodes.

---

## Acceptance Criteria per Version

### v0.1.0 — DONE ✅
- [x] `npm run dev` → Electron window opens
- [x] Sidebar: 5 tabs, switching works
- [x] MetaForm: all fields visible and editable
- [x] DatePicker: popup opens/closes without crash, date saves to field
- [x] `npm run lint` + `npm run type-check` → zero errors
- [x] GitHub: repo, min. 5 conventional commits, README.md

### v0.2.0 — DONE ✅
- [x] MetaForm: TEST/STAGE checkboxes displayed inline right of "Environment" label
- [x] Pasting scope → correct table after Parse
- [x] Parser: markdown link, plain ticket, bare ticket, no ticket, "(from iteration)" / "(z iteracji)" suffix, `v.X.Y`
- [x] `npm run test` → green (30/30)
- [x] TestCasesTable: No→Ticket matches table 1, Result=POSITIVE

### v0.3.0 — DONE ✅
- [x] Text can be typed in "Current result"
- [x] Ctrl+V pastes screenshot inline
- [x] "Generate report PDF" → file on disk
- [x] PDF: header, both tables, summary, footer with page numbers
- [x] Images visible in PDF
- [x] Auto-save: draft saved, dialog on restart

### v0.3.1 — DONE ✅
- [x] Vendor input required before Parse — inline error if empty
- [x] PDF Section 2 reverts to plain text (TipTap rich-text layout issues in pdfmake)

### v0.3.2 — DONE ✅
- [x] Draft restore dialog (`DraftRestoreDialog.tsx`) shown on app start when a meaningful draft exists
- [x] `useDraft` gains `peekDraft` + `clearDraft`; autosave global (not per-tab)
- [x] PDF Section 2 "Current result" cells render TipTap content as `{ stack: [...] }` with inline base64 images

### v0.3.3 — DONE ✅
- [x] PDF Section 2 redesigned as per-component blocks (each MOD/FIX starts on a new page, full-width images)
- [x] Section 2 TOC table on page 1 with internal hyperlinks (Nr / Component / Version / Result / Page)
- [x] "Back to TOC" footer link on middle pages of Section 2
- [x] Full TipTap StarterKit support in PDF: H1–H6, bulletList, orderedList, blockquote, codeBlock, horizontalRule, image; inline marks (bold/italic/strike/underline/code)
- [x] Empty content placeholder "No test content provided"
- [x] `npm run test` → green (137/137)

### v0.3.4 — DONE ✅
- [x] TipTap toolbar: H1, H2, BulletList, OrderedList, Blockquote, CodeBlock buttons with active state
- [x] Editor preview renders the new node types (Tailwind variant classes in `EDITOR_CLASS`)
- [x] Auto-save persists `testResults` (`DraftData.testResults?` field + `setTestResults(record)` bulk-replace action); content restored after reload via Draft detected dialog
- [x] Low-resolution image warning panel after paste/drop/file-pick when both dimensions fall below `IMAGE_MAX_WIDTH_PT * 0.25` AND `IMAGE_MAX_HEIGHT_PT * 0.5`; dismissable; never blocks insertion
- [x] `CHANGELOG.md` `[0.3.2]` entry backfilled
- [x] Quality gates: `type-check` + `lint` + `vitest run` (137/137) all green
- [x] Released as patch: `npm version patch` flow walked through first time; gotchas documented in CLAUDE.md Definition of Done (package.json version sync, lightweight vs annotated tags)

### v0.4.0 — DONE when (Tab 6 — AIO TC-GEN):
- [ ] LLM provider selection (Claude / OpenAI) persisted in `config.json`
- [ ] API key handling decided and implemented (RAM vs. encrypted file — see ADR placeholder)
- [ ] Fix/mod description textarea + optional context fields
- [ ] Mode toggle: single TC / TC suite / regression checklist items
- [ ] Streaming preview of LLM output in renderer
- [ ] Generated TCs editable inline before export
- [ ] Export to Markdown, Tab 1 (TestCasesTable), Tab 3 JSON snippet
- [ ] `npm run lint` + `npm run type-check` + `npm run test` → green
- [ ] Manual flow: paste sample fix description → generated TCs visible → export to Tab 1 works

### v0.5.0 — DONE when (Tab 3a — Android Terminal Regression):
- [ ] Loading `regression-terminal-android.json` populates accordion
- [ ] App version input + STAGE/TEST toggle
- [ ] PASS/FAIL/SKIP buttons + Defect (`PROJ-####`) field per TC
- [ ] Notes tooltip from JSON (read-only)
- [ ] SKIP → row grayed out
- [ ] Progress bar + filters (All / FAIL only / Not executed)
- [ ] "Generate Excel report" → .xlsx via openpyxl IPC
- [ ] Excel: header, categories, emoji results, PROJ-#### hyperlinks, gray background for SKIP
- [ ] Confirmation dialog when leaving unfinished session
- [ ] Reset session button

### v0.6.0 — DONE when (Tab 3b — Embedded Terminal Regression):
- [ ] Same criteria as v0.5.0 but for `regression-terminal-embedded.json`
- [ ] Tabs 3a and 3b can be open and progressed independently

### v0.7.0 — DONE when (Tab 4 — Terminal Update Monitor):
- [ ] "Log in" → Bearer token active, indicator green
- [ ] Enter TID + "Fetch statuses" → update table populated
- [ ] Each row shows current status with correct color badge
- [ ] Expanding row → full status timeline + file list
- [ ] App version correctly extracted from `BSC.*` file
- [ ] Auto-refresh at selected interval works and updates table
- [ ] Last 10 queries visible in history, click populates form
- [ ] Expired token → error message + option to log in again
- [ ] Base URL + login saved in `config.json` after restart
- [ ] Password never appears in any file on disk
- [ ] `secureCredentialStore` integration verified — token only in RAM

### v0.8.0 — DONE when (Tab 2 — Deployment Schedule finish):
- [ ] "Copy to clipboard" → text in Loop format with checkboxes
- [ ] Pasting in Teams/Loop renders checkboxes correctly
- [ ] "Clear" resets Tab 2

### v0.9.0 — DONE when (Diagnostic Pack):
- [ ] Tab 7 — System Log Parser: load file, filter, search, highlight errors
- [ ] Tab 8 — Parameter Parser: load text, parse parameters, validate values
- [ ] Both modules pure-local — no API, no auth
- [ ] Tests for parsers green

### v0.10.0 — DONE when (Tab 9 — QRCode Generator):
- [ ] Pre-implementation brief completed: existing code reviewed, port plan documented
- [ ] API integration via `secureCredentialStore` and IPC bridge
- [ ] Input: visit / registration payload → QR code rendered + downloadable
- [ ] Connection profile saved in `config.json`, password RAM-only

### v0.11.0 — DONE when (Settings polish):
- [ ] Gear icon in TitleBar opens settings modal/panel
- [ ] All current `config.json` fields editable from UI
- [ ] PDF history view with re-open / open folder actions
- [ ] Presets management (testers, vendor URL, summary text)

### v0.12.0 — DONE when (Tab 10 — SQL Query):
- [ ] Multiple MSSQL connection profiles in `config.json` (without passwords)
- [ ] Connect → password prompt → token/connection in RAM
- [ ] Query editor + run button
- [ ] Result table with column types
- [ ] Read-only mode toggle (default ON), explicit confirmation for write queries
- [ ] Export result to CSV

### v0.13.0 — DONE when (Tab 11 — Card Management):
- [ ] Pre-implementation brief completed
- [ ] Pluggable backend (REST / DB) defined and implemented for at least one provider
- [ ] Card event history view
- [ ] Credentials via `secureCredentialStore`

### v0.14.0 — DONE when (Tab 12 — Partner Management):
- [ ] Pre-implementation brief completed
- [ ] Partner data CRUD via pluggable backend
- [ ] Credentials via `secureCredentialStore`

### v1.0.0 — DONE when:
- [ ] All v0.x criteria green
- [ ] `electron-builder` produces signed .exe
- [ ] Full E2E walkthrough passes (Tab 1 → PDF, Tab 3a → Excel, Tab 4 → live fetch, Tab 6 → TC export)
- [ ] README.md updated with screenshots and feature list
- [ ] CHANGELOG.md complete

---

*Last updated: 2026-05-14 (v0.3.4 patch: TipTap toolbar, auto-save testResults, image warning, [0.3.2] backfill)*
*Project: QA Release HUB*
