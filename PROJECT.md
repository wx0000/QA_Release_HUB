# QA Release HUB — Project Documentation

> Desktop hub for managing QA deployments.
> PDF report generation, test checklists, deployment schedules, terminal update monitoring.
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
13. [TODO / Roadmap](#todo--roadmap)
14. [Changelog](#changelog)
15. [Architectural Decision Records (ADR)](#architectural-decision-records-adr)
16. [Acceptance Criteria per Version](#acceptance-criteria-per-version)

---

## Project Goal

A desktop application replacing manual tools used during deployments:
- Manually filling in test reports in Excel
- Notepad notes per fix/mod to be tested
- Manually creating schedules in Teams/Loop
- Manually checking update statuses on terminals via a web panel

**Target user:** Software Tester (QA)
**PDF report recipient:** Senior manager (review only)
**Schedule recipient:** Developers + Testers on the deployment call

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ELECTRON (main)                               │
│  - Application window (no system frame — custom titlebar)            │
│  - IPC handlers: PDF export, file save, JSON store,                  │
│                  terminal API calls (auth + updates)                 │
│  - electron-builder → .exe                                           │
├─────────────────────────────────────────────────────────────────────┤
│                     REACT + VITE (renderer)                          │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │  Tab 1:  │  Tab 2:  │  Tab 3:  │  Tab 4:  │  Tab 5:  │          │
│  │ Report   │ Deploy.  │Terminal  │  AIO     │ Terminal │          │
│  │Generator │Schedule  │Regression│  TC-GEN  │ Update   │          │
│  │+Checklist│          │          │  (v0.8)  │ Monitor  │          │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘          │
├─────────────────────────────────────────────────────────────────────┤
│                   DATA LAYER (local JSON)                            │
│  userData/config.json     — settings, tester list, API config       │
│  userData/drafts/         — report drafts (auto-save)               │
│  userData/history/        — report history (metadata)               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
QAReleaseHUB/
├── .github/
│   └── workflows/
│       └── ci.yml                          # lint + type-check on push
├── src/
│   ├── main/                               # Electron main process
│   │   ├── index.ts                        # Electron entry point
│   │   ├── ipc/
│   │   │   ├── pdf.handler.ts              # PDF generation
│   │   │   ├── store.handler.ts            # JSON read/write
│   │   │   └── terminalMonitor.handler.ts  # auth + terminal API fetch
│   │   └── store/
│   │       └── jsonStore.ts                # JSON file handling in userData
│   ├── renderer/                           # React app
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx                         # tab routing
│   │   ├── components/
│   │   │   ├── ui/                         # generic components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── DatePicker.tsx
│   │   │   │   ├── Checkbox.tsx
│   │   │   │   └── Textarea.tsx
│   │   │   ├── layout/
│   │   │   │   ├── TitleBar.tsx
│   │   │   │   ├── TabBar.tsx
│   │   │   │   └── PageWrapper.tsx
│   │   │   ├── report/                     # Tab 1
│   │   │   │   ├── MetaForm.tsx
│   │   │   │   ├── ScopeInput.tsx
│   │   │   │   ├── ChangesTable.tsx
│   │   │   │   ├── TestChecklist.tsx
│   │   │   │   ├── TestCasesTable.tsx
│   │   │   │   └── PdfPreview.tsx
│   │   │   ├── schedule/                   # Tab 2
│   │   │   │   ├── ScheduleInput.tsx
│   │   │   │   ├── ScheduleBuilder.tsx
│   │   │   │   └── ScheduleOutput.tsx
│   │   │   ├── regression/                 # Tab 3
│   │   │   │   ├── RegressionSetup.tsx
│   │   │   │   ├── RegressionChecklist.tsx
│   │   │   │   └── RegressionProgress.tsx
│   │   │   └── terminalMonitor/            # Tab 5
│   │   │       ├── MonitorAuth.tsx
│   │   │       ├── MonitorQuery.tsx
│   │   │       ├── MonitorSummary.tsx
│   │   │       ├── MonitorTable.tsx
│   │   │       └── MonitorHistory.tsx
│   │   ├── hooks/
│   │   │   ├── useDraft.ts
│   │   │   ├── useTesters.ts
│   │   │   └── useSchedule.ts
│   │   ├── modules/
│   │   │   ├── parser/
│   │   │   │   ├── scopeParser.ts
│   │   │   │   ├── scopeParser.test.ts
│   │   │   │   ├── scheduleParser.ts
│   │   │   │   └── scheduleParser.test.ts
│   │   │   └── pdfGenerator/
│   │   │       ├── reportTemplate.ts
│   │   │       └── pdfGenerator.ts
│   │   ├── data/                           # JSON test cases (versioned in repo)
│   │   │   ├── regression-terminal-a.json
│   │   │   └── regression-terminal-b.json
│   │   ├── store/
│   │   │   ├── reportStore.ts
│   │   │   ├── scheduleStore.ts
│   │   │   ├── regressionStore.ts
│   │   │   └── terminalMonitorStore.ts
│   │   ├── types/
│   │   │   ├── report.types.ts
│   │   │   ├── schedule.types.ts
│   │   │   ├── regression.types.ts
│   │   │   └── terminalMonitor.types.ts
│   │   └── styles/
│   │       └── globals.css
├── electron.vite.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── CHANGELOG.md
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
| HTTP (main process) | Node.js fetch / axios | Terminal API calls via IPC, no CORS |
| Persistence | JSON (electron userData) | Simple scale, no need for SQLite |
| Unit tests | Vitest | Vite-compatible, fast |
| Linting | ESLint + Prettier | Code consistency |
| Packaging | electron-builder | Windows .exe installer |

---

## UI Design Decision

### ADR-012: Slate Pro dark layout

After evaluating four dark-mode layout concepts (Obsidian Dark, Slate Pro, Zinc Minimal, Glass Dark), **Slate Pro** was selected as the application's visual design.

**Color palette:**
| Token | Value | Usage |
|---|---|---|
| Background primary | `#0f172a` | Main window background |
| Background secondary | `#1e293b` | Cards, sidebar, table rows |
| Background tertiary | `#0a1120` | Sidebar, footer, topbar |
| Accent / interactive | `#06b6d4` | Active states, primary buttons, badges, links |
| Border | `#1e293b` / `#263548` | Dividers, card borders |
| Text primary | `#e2e8f0` | Headings, active labels |
| Text secondary | `#94a3b8` | Body text, field labels |
| Text muted | `#475569` | Placeholders, inactive items |
| Success | `#4ade80` | PASS status, "Done" |
| Warning | `#facc15` | "In Review", auto-refresh indicator |
| Danger | `#f87171` | FAIL status, error states |

**Layout:**
- Left sidebar (200px fixed) with icon + label navigation for all 5 tabs
- Top bar per tab: tab title + deployment number tag + auto-save timestamp
- Content area: metric cards row → section label → data table
- Footer: action buttons (right-aligned), separated by top border
- No system window frame — custom `TitleBar` component with macOS-style traffic lights

**Rationale:** Sidebar navigation scales better than top tabs as the app grows (settings, history in v0.7+). The navy blue base (`#0f172a`) with cyan accent provides strong contrast for status badges (PASS/FAIL/SKIP, update pipeline states) without the visual noise of glass/blur effects.

---

## Conventions

### Commit messages (Conventional Commits)
```
feat(parser): add Type B schedule support
feat(report): implement test checklist
feat(monitor): implement Tab 5 — Terminal Update Monitor
fix(pdf): fix table margins for test cases
fix(schedule): parser failed to detect Roman numeral numbering
fix(monitor): handle expired Bearer token
chore(deps): update pdfmake to v0.2.x
docs(project): update TODO after v0.2.0 session
refactor(store): extract tester logic to useTesters
test(parser): edge case — schedule without Type B substeps
```

### Naming conventions
- React components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Types/interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Tests: `*.test.ts` next to the tested file

### Branching
```
main          — stable releases (tags v0.x.0)
dev           — active development
feature/xxx   — new features
fix/xxx       — bug fixes
```

---

## Versioning

Format: `MAJOR.MINOR.PATCH` (Semantic Versioning)

- `MAJOR` — breaking change in data format
- `MINOR` — new feature / new module
- `PATCH` — bugfix, minor UX improvement

Git tags: `v0.1.0`, `v0.2.0` etc.
Each release → update `CHANGELOG.md` + Git tag + `npm version`.

---

## Development Setup

```bash
npm install          # install dependencies
npm run dev          # dev mode: Electron + React with HMR
npm run type-check   # TypeScript type checking
npm run test         # unit tests (Vitest)
npm run lint         # ESLint
npm run build        # production build
npm run package      # package to .exe
```

**Requirements:** Node.js >= 18.x, npm >= 9.x, Python >= 3.9 (for xlsx generation)
**VS Code extensions:** ESLint, Prettier, Tailwind CSS IntelliSense, TypeScript

---

## Functional Scope — Modules

### TAB 1: Report Generator + Test Checklist

#### 1A. Metadata form (MetaForm)

| Field | Type | Details |
|---|---|---|
| Deployment number | Input | Fixed prefix `R_01.00.` + field `XX` + fixed suffix `.00` |
| Date from | DatePicker | Calendar popup attached to field |
| Date to | DatePicker | Calendar popup attached to field |
| Environment | Checkboxes | TEST and/or STAGE |
| Tester | Dropdown + Input | Presets from config.json + ability to add new |

#### 1B. Scope input (ScopeInput)
- Textarea for scope in Markdown format
- **"Parse scope"** button
- Table preview after parsing
- Alert with list of unparsed lines (yellow)

#### 1C. "Components and changes" table (ChangesTable)
Columns: `No` | `Component` | `Version` | `Type` | `Change description` | `Ticket` | `Status`
- Auto-populated from parser, inline editable
- `MOD`/`FIX` type highlighted with colored badge

#### 1D. Test checklist (TestChecklist) — sub-feature of Tab 1
- Visible section below/beside table 1C
- Per each row from 1C — automatic checklist row:
  - "Checked" checkbox
  - Label: `[TYPE] Component — Description (Ticket)`
  - Text field: "Test note" (what and how to check)
- Progress bar: `Checked X / Y`
- **"Generate checklist PDF"** button — separate document
- Notes available as hint in "Current result" editor

#### 1E. "Test cases" table (TestCasesTable)
Columns: `No` | `Component` | `Version` | `Type` | `Change description` | `Ticket` | `Current result` | `Result`
- No→Ticket: copied 1:1 from 1C
- `Result`: always "POSITIVE", locked
- `Current result`: TipTap rich text editor per row:
  - Text
  - Ctrl+V → inline screenshot from clipboard
  - Drag & drop image
  - "📎 Add image" button → file picker
  - Hint from test note (1D)

#### 1F. PDF generation
- **"Generate report PDF"** button → save dialog → toast + "Open file"
- **"Generate checklist PDF"** button → separate file

#### 1G. Auto-save
- Every 30s → `userData/drafts/current.json`
- On startup: dialog "Draft detected. Load it?"

---

### TAB 2: Deployment Schedule

#### Purpose
Convert a Teams schedule into a Loop-format checklist (Markdown checkboxes) ready to paste during the deployment call. Data is ephemeral — not saved.

#### 2A. Input (ScheduleInput)
- Textarea + **"Parse schedule"** button
- Parser auto-detects Type A or Type B

#### 2B. Editor (ScheduleBuilder)

**Developers:**
- Type B: people extracted automatically by parser
- Type A: no people — user adds manually with "+" button
- Assign components to people (checkbox list)
- Notes per component (pre-filled from parser or entered manually)

**Testers:**
- Dynamic addition: "+" button → name field
- Any number (1–N)
- Assign components to test

#### 2C. Output (ScheduleOutput)

Loop Markdown format:
```
**R_01.00.46.00 — schedule**

**Developer A**
1. Database update (5 min)
   - [ ] DMT – START
   - [ ] DMT – END
   - [ ] TEST – START
   - [ ] TEST – END

**[Tester]**
1. Component A
   - [ ] TEST – START
   - [ ] TEST – END
```

- Developer per component: `DMT – START`, `DMT – END`
- Tester per component: `TEST – START`, `TEST – END`
- **"Copy to clipboard"** button + "Copied!" toast
- **"Clear"** button → reset tab

---

### TAB 3: Terminal Regression (v0.5)

#### Module purpose
Interactive regression checklist for terminal applications during a test session. Replaces manual marking in Excel. At the end of the session generates an `.xlsx` file matching the format of existing checklists.

#### Test case data
Test cases stored as JSON files in the repository (`src/renderer/data/`):
- `regression-terminal-a.json` — test cases for Terminal A
- `regression-terminal-b.json` — test cases for Terminal B

JSON format mirrors Excel structure (categories → subcategories → test cases). Updating TCs = editing JSON + commit. `[MOD/FIX]` sections are omitted from both files.

**JSON structure:**
```typescript
interface RegressionTestCase {
  id: string;              // unique, e.g. "TERMINAL-A-CATEGORY-001"
  description: string;     // test case content
  notes?: string;          // how-to hint (tooltip)
  category: string;        // e.g. "PAYMENTS"
  subcategory: string;     // e.g. "CHIP"
}

interface RegressionData {
  terminal: 'TERMINAL-A' | 'TERMINAL-B';
  categories: {
    name: string;
    subcategories: {
      name: string;
      tests: RegressionTestCase[];
    }[];
  }[];
}
```

#### 3A. Session form
| Field | Type | Details |
|---|---|---|
| Terminal | Toggle | TERMINAL-A / TERMINAL-B |
| App version | Input | e.g. `3.21.0` |
| Environment | Toggle | STAGE / TEST |

#### 3B. Checklist view
- Categories as collapsible/expandable sections (accordion)
- Subcategories as headers inside sections
- Per test case:
  - Test description
  - Buttons: `✓ PASS` | `✗ FAIL` | `⊘ SKIP`
  - `Defect` field: entering `PROJ-####` → saves as text + generates hyperlink in Excel
  - Notes: tooltip/expandable hint (read-only)
- SKIP rows → grayed out
- Progress bar: `X / Y completed | A ✓ | B ✗ | C ⊘`
- View filter: `All` / `FAIL only` / `Not executed`

#### 3C. Excel report generation
- **"Generate Excel report"** button
- `.xlsx` file:
  - Header: `[APP][TERMINAL][VERSION][ENVIRONMENT]`
  - Columns: `Test description` | `Result` | `Defect` | `Notes`
  - Result: 👍 (PASS) / 👎 (FAIL) / ⮾ (SKIP)
  - Defect: `PROJ-####` text + hyperlink to ticket
  - SKIP rows: gray background
  - Categories and subcategories as section headers (bold, highlighted background)
- **"Reset session"** button → clear all statuses

#### Persistence
Ephemeral — session state in Zustand store only. When closing tab with unfinished session: confirmation dialog.

---

### TAB 4: AIO TC-GEN (v0.8+)
Generating test cases from change descriptions (fix/mod) using LLM API (Claude / OpenAI). Details to be defined in a separate session.

---

### TAB 5: Terminal Update Monitor (v0.6)

#### Module purpose
Real-time view of update package processing statuses on terminals, without opening the management system web panel. The tester provides a terminal ID (TID) and immediately sees whether a given application version has already been downloaded and processed — which allows deciding whether a given test case can already be verified.

#### Connection architecture
API calls made via **Electron IPC → main process → Node.js fetch**. Bearer token stored exclusively in RAM (Zustand store), never written to disk. Base URL and login saved in `config.json`, password never.

Endpoint: `GET /api/v1/devices/{deviceId}/allupdates`

Query parameters:
| Parameter | Type | Description |
|---|---|---|
| `deviceId` | integer (path) | Terminal ID — required |
| `dateFrom` | datetime (query) | Filter from date — optional |
| `dateTo` | datetime (query) | Filter to date — optional |
| `limit` | integer (query) | Max results, default 20 |
| `offset` | integer (query) | Pagination, default 0 |
| `sort` | string (query) | Default `updatedatetime` |

#### Update status pipeline
Each package passes through the following statuses (`status[]` array in response, sorted descending — `status[0]` = current):

| Status | Color | Meaning for tester |
|---|---|---|
| `added` | ⚪ gray | Dispatch requested — nothing yet |
| `generating` | 🟠 orange | Package being generated on server |
| `ready` | 🟡 yellow | Package ready — waiting for terminal to download |
| `downloading` | 🔵 blue | Terminal is downloading |
| `downloaded` | 🟢 green | Terminal downloaded — **ready to test** |

#### 5A. Connection configuration (MonitorAuth)
- Collapsible config panel (remembers expanded state)
- Input: API Base URL (saved in `config.json`)
- Input: Login (saved in `config.json`)
- Input: Password (in memory only, never to disk)
- **"Log in"** button → POST to auth endpoint → Bearer token in Zustand
- Status indicator: `● Connected` (green) / `● No token` (gray) / `● Error` (red)

#### 5B. Query form (MonitorQuery)
| Field | Type | Default | Notes |
|---|---|---|---|
| Device ID (TID) | Input number | — | required |
| Date from | DateTimePicker | — | optional |
| Date to | DateTimePicker | — | optional |
| Limit | Input number | `20` | |
| Offset | Input number | `0` | |
| Sort | Input text | `updatedatetime` | |

- **"Fetch statuses"** button
- **"Auto-refresh"** toggle with interval selector: `10s / 30s / 60s`
- When auto-refresh active: countdown to next refresh

#### 5C. Summary bar (MonitorSummary)
Displayed above table after each fetch:
```
Terminal: 12345  |  Results: 10 / 10  |  Last fetch: 10:24:51
Current statuses:  ● downloaded: 2   ● ready: 6   ● generating: 1   ● added: 1
```

#### 5D. Updates table (MonitorTable)
One row = one update package:

| Column | JSON source | Notes |
|---|---|---|
| Update ID | `updateId` | |
| Added | `addDateTime` | formatted date/time |
| Current status | `status[0].status` | colored badge |
| Since | `status[0].date` | time of last status change |
| Package type | `updateType[]` | tags: `app` / `config` / `report` |
| App version | `files[].nativeVersion` where `fileParameterName` starts with `BSC.` | e.g. `3.21.0` |
| Files | `files[].fileParameterName` | list of file names in package |

**Row expansion** (click → accordion):
- Full status timeline with dates (all steps from `status[]`)
- File list with: `fileParameterName`, `nativeVersion`, size (KB/MB), file status

- **"Copy as JSON"** button — copies raw response to clipboard

#### 5E. Session query history (MonitorHistory)
- Ephemeral — Zustand only, no disk save
- Last 10 queries: `TID | timestamp | result count`
- Click on history row → re-populate form (TID + parameters)

---

## Input Data Format — Parsers

### Parser 1: Deployment scope (scopeParser)

**Input:**
```markdown
* Component vX.Y.Z (optional suffix)
   * TYPE - Description [PROJ-XXXX](https://...) Status
   * TYPE - Description [PROJ-XXXX] Status
```

**Rules:**
1. `* Component vX.Y.Z` → new component
   - Regex: `/^\* (.+?) (v\.?[\d.]+)/`
   - Normalization: `v.2.6.1` → `v2.6.1`
   - Suffix `(from iteration R_...)` → ignored
2. `   * TYPE - ...` → change
   - Type: `MOD` or `FIX`
   - Markdown ticket `[PROJ-XXXX](url)` → `PROJ-XXXX`
   - Plain ticket `[PROJ-XXXX]` → `PROJ-XXXX`
   - No ticket → `""`
   - Status (last token): `Done` | `In Review` | `Waiting for test` | `""`

**Output type:**
```typescript
interface ParsedChange {
  nr: number;
  component: string;
  version: string;
  type: 'MOD' | 'FIX';
  changeDescription: string;
  ticket: string;
  status: 'Done' | 'In Review' | 'Waiting for test' | '';
}
```

---

### Parser 2: Schedule (scheduleParser)

**Type A — detailed (Roman numeral numbering):**
```
I. Component (X min)
  0. Step
  1. Step
II. Component (X min)
```
- No people → user assigns in ScheduleBuilder

**Type B — simplified (people as headers):**
```
Developer A
1. Component (X min) - note
2. Component (X min)
```
- People extracted automatically

**Detection:** First non-empty line matches `/^[IVX]+\./` → Type A, otherwise → Type B

**Output types:**
```typescript
interface ScheduleComponent {
  name: string;
  durationMin: number;
  notes: string;
  steps?: string[];       // Type A
  developer?: string;     // Type B
}

interface SchedulePerson {
  name: string;
  role: 'developer' | 'tester';
  components: ScheduleComponent[];
}

interface ParsedSchedule {
  type: 'A' | 'B';
  people: SchedulePerson[];
  components: ScheduleComponent[];
}
```

---

## PDF Report Structure

### Header
```
QA RELEASE HUB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPLOYMENT TEST REPORT

Deployment number:  R_01.00.46.00
Test period:        2026-05-01 — 2026-05-04
Tester:             Tester A
Environment:        TEST ✓   STAGE ✓
Generated:          2026-05-04
```

### Section 1: Components and changes
`No` | `Component` | `Version` | `Type` | `Change description` | `Ticket` | `Status`

### Section 2: Test cases
`No` | `Component` | `Version` | `Type` | `Change description` | `Ticket` | `Current result` | `Result`

"Current result" column: text + inline images (base64).
"Result" column: always "POSITIVE".

### Section 3: Summary and recommendations
```
Summary:        All tests completed with positive results.
                No critical errors detected.
Recommendation: Deployment to production environment can be recommended.
```

### Footer (every page)
```
QA Release HUB  |  Deployment R_01.00.46.00  |  Page X / Y
```

---

### Checklist PDF (separate document)

```
TEST CHECKLIST — R_01.00.46.00
Tester: Tester A  |  Date: 2026-05-04
─────────────────────────────────────────
[ ] MOD | ComponentA v3.3.14 | PROJ-1001
    Note: Check HTTP cache — F12 → Network → response headers.

[ ] FIX | ComponentA v3.3.14 | PROJ-1002
    Note: Deactivate object, move it, search for it.
```

---

## Data Persistence

### `userData/config.json`
```json
{
  "testers": ["Tester A", "Tester B"],
  "defaultSavePath": "C:/Users/user/Documents/Reports",
  "summary": {
    "text": "All tests completed with positive results. No critical errors detected.",
    "recommendation": "Deployment to production environment can be recommended."
  },
  "terminalMonitor": {
    "baseUrl": "https://api.example.com",
    "login": "qa-user"
  }
}
```

> ⚠️ The terminal API password is **never** saved in `config.json` or any file. Stored exclusively in RAM (Zustand) for the duration of the session.

### `userData/drafts/current.json`
Full report form state — serialized every 30s.

### `userData/history/index.json`
```json
[
  {
    "id": "2026-05-04-R_01.00.46.00",
    "deploymentNumber": "R_01.00.46.00",
    "generatedAt": "2026-05-04T14:32:00",
    "tester": "Tester A",
    "path": "C:/Users/.../R_01.00.46.00_report.pdf"
  }
]
```

### Tab 2, Tab 3, Tab 5 — persistence
- **Tab 2** (Schedule): Ephemeral. Zustand only, no disk save.
- **Tab 3** (Regression): Ephemeral. Zustand only, confirmation dialog when leaving unfinished session.
- **Tab 5** (Monitor): Ephemeral. Token and results in Zustand only. Base URL + login saved in `config.json`, password never.

---

## TODO / Roadmap

### v0.1.0 — Foundation & Layout
- [ ] Setup: electron-vite + React + TypeScript + Tailwind + Zustand
- [ ] Folder structure matching documentation
- [ ] GitHub repo: main + dev, .gitignore, README.md
- [ ] CI: .github/workflows/ci.yml (lint + type-check)
- [ ] Custom TitleBar
- [ ] Sidebar navigation: 5 tabs (Tab 2, 3, 4, 5 as placeholders)
- [ ] UI components: Button, Input, Checkbox, Textarea
- [ ] MetaForm — all fields
- [ ] DatePicker — calendar popup

### v0.2.0 — Parser + Tables
- [ ] scopeParser.ts + Vitest tests
- [ ] ScopeInput: textarea + Parse + error alert
- [ ] ChangesTable: auto from parser, inline editable
- [ ] TestChecklist: auto from parser, notes, checkbox, progress bar
- [ ] TestCasesTable: columns No→Ticket, Result=POSITIVE

### v0.3.0 — Rich Text + PDF
- [ ] TipTap in "Current result"
- [ ] Ctrl+V inline screenshot
- [ ] Image drag & drop
- [ ] "Add image" file picker
- [ ] Test note hint
- [ ] pdfGenerator: main report
- [ ] pdfGenerator: test checklist
- [ ] Save dialog + toast + "Open file"
- [ ] Auto-save + load dialog on startup

### v0.4.0 — Schedule (Tab 2)
- [ ] scheduleParser: Type A + Type B + tests
- [ ] ScheduleInput: textarea + Parse
- [ ] ScheduleBuilder: developers + component assignment
- [ ] ScheduleBuilder: dynamic testers ("+" button)
- [ ] ScheduleBuilder: notes per component
- [ ] ScheduleOutput: Loop Markdown format
- [ ] "Copy to clipboard" + toast
- [ ] "Clear" → reset Tab 2

### v0.5.0 — Terminal Regression (Tab 3)
- [ ] JSON structure for Terminal A and Terminal B
- [ ] regression-terminal-a.json — all TCs without MOD/FIX sections
- [ ] regression-terminal-b.json — all TCs without MOD/FIX sections
- [ ] RegressionSetup: terminal toggle, version, environment
- [ ] RegressionChecklist: category/subcategory accordion
- [ ] PASS/FAIL/SKIP buttons per test case
- [ ] Defect field: PROJ-#### input per test case
- [ ] Tooltip/expandable notes (read-only)
- [ ] SKIP rows: grayed out
- [ ] Progress bar + PASS/FAIL/SKIP counters
- [ ] Filter: All / FAIL only / Not executed
- [ ] .xlsx generation (openpyxl via IPC)
- [ ] Excel: header, categories, columns, emoji, hyperlinks, gray SKIP background
- [ ] Confirmation dialog when leaving unfinished session
- [ ] Reset session button

### v0.6.0 — Terminal Update Monitor (Tab 5)
- [ ] terminalMonitor.types.ts — types from API response
- [ ] terminalMonitor.handler.ts — IPC: login (Bearer token) + fetch /allupdates
- [ ] terminalMonitorStore.ts — token (RAM), results, history, auto-refresh state
- [ ] MonitorAuth: login form, token status indicator
- [ ] Save Base URL + login to config.json (no password)
- [ ] MonitorQuery: TID form + date filters + limit/offset/sort
- [ ] MonitorSummary: summary bar with status counters
- [ ] MonitorTable: update table with colored status badges
- [ ] MonitorTable: expandable accordion per row (timeline + files)
- [ ] MonitorTable: extract app version from BSC.* file
- [ ] Auto-refresh: toggle + 10s/30s/60s interval + countdown
- [ ] MonitorHistory: last 10 session queries
- [ ] "Copy as JSON" — raw response to clipboard
- [ ] Error handling: expired token → message + "Log in again" button
- [ ] Error handling: no connection, 404, 401, timeout

### v0.7.0 — Persistence + UX Polish
- [ ] Tester presets: save/edit/delete
- [ ] Report history
- [ ] Settings: save path, summary text editing, monitor API config
- [ ] Form validation before generation

### v0.8.0 — AIO TC-GEN (Tab 4)
- [ ] Details to be defined

### Backlog
- [ ] Dark/light mode toggle
- [ ] PDF preview before saving
- [ ] Checklist export to .txt / .md

---

## Changelog

### [Unreleased] — dev
- Project initialization
- PROJECT.md — full documentation of architecture, parsers, roadmap
- Added Tab 5: Terminal Update Monitor (ADR-009, ADR-010, ADR-011)
- ADR-012: Slate Pro dark layout selected as UI design

---

## Architectural Decision Records (ADR)

### ADR-001: pdfmake instead of Puppeteer
Does not require Chromium, works in Electron main process, native tables + base64 images.
Trade-off: less flexible layout — acceptable for a tabular report.

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
Developers send different formats. Rule: first line matches `/^[IVX]+\./` → Type A, otherwise Type B.

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

### ADR-010: Terminal API calls via IPC main process (not renderer fetch)
All HTTP requests to the terminal API made in Electron main process via Node.js fetch.
Renderer communicates with main via IPC (`ipcRenderer.invoke`), never directly with the API.
Reason: no CORS issues (request originates from Node.js, not browser), token not visible in renderer DevTools.
Trade-off: additional IPC layer — acceptable, consistent with rest of architecture.

### ADR-011: Current package status = status[0] (first array element)
API returns `status[]` array sorted descending by date — first element is the current package state.
This rule is explicit in code as a constant/comment, not a magic index.

### ADR-012: Slate Pro dark layout as UI design
After evaluating four dark-mode layout concepts, Slate Pro was selected.
Key parameters: background `#0f172a`, cards `#1e293b`, accent `#06b6d4` (cyan), left sidebar navigation.
Reason: sidebar scales better than top tabs as the app grows; navy base provides strong contrast for status badges without glass/blur complexity; closest to a professional QA tooling aesthetic.
Trade-off: slightly more complex initial layout implementation vs. top-tab alternatives — acceptable given long-term ergonomic benefit.

---

## Acceptance Criteria per Version

### v0.1.0 — DONE when:
- [ ] `npm run dev` → Electron window opens
- [ ] Sidebar: 5 tabs, switching works
- [ ] MetaForm: all fields visible and editable
- [ ] DatePicker: popup opens/closes without crash, date saves to field
- [ ] `npm run lint` + `npm run type-check` → zero errors
- [ ] GitHub: repo, min. 5 conventional commits, README.md

### v0.2.0 — DONE when:
- [ ] Pasting scope → correct table after Parse
- [ ] Parser: markdown link, plain ticket, no ticket, "(from iteration)" suffix, `v.X.Y`
- [ ] `npm run test` → green
- [ ] Checklist generated from components table
- [ ] Checkbox + progress bar work
- [ ] TestCasesTable: No→Ticket matches table 1, Result=POSITIVE

### v0.3.0 — DONE when:
- [ ] Text can be typed in "Current result"
- [ ] Ctrl+V pastes screenshot inline
- [ ] "Generate report PDF" → file on disk
- [ ] PDF: header, both tables, summary, footer with page numbers
- [ ] Images visible in PDF
- [ ] "Generate checklist PDF" → separate file
- [ ] Auto-save: draft saved, dialog on restart

### v0.4.0 — DONE when:
- [ ] Schedule Type A → correct structure in ScheduleBuilder
- [ ] Schedule Type B → developer names detected automatically
- [ ] Can add 1–3 testers dynamically
- [ ] "Copy to clipboard" → text in Loop format with checkboxes
- [ ] Pasting in Teams/Loop renders checkboxes correctly
- [ ] "Clear" resets Tab 2

### v0.5.0 — DONE when:
- [ ] Terminal A/B toggle loads correct TC set
- [ ] Categories/subcategories display as accordion
- [ ] Clicking PASS/FAIL/SKIP changes status and row color
- [ ] SKIP → row grayed out
- [ ] Defect field: PROJ-#### can be entered
- [ ] Progress bar updates in real time
- [ ] "FAIL only" filter shows only red rows
- [ ] "Generate Excel report" → .xlsx file on disk
- [ ] Excel contains: header, categories as sections, result emoji, PROJ-#### hyperlinks
- [ ] SKIP rows in xlsx have gray background
- [ ] Dialog when leaving unfinished session

### v0.6.0 — DONE when:
- [ ] "Log in" → Bearer token active, indicator green
- [ ] Enter TID + "Fetch statuses" → update table populated
- [ ] Each row shows current status with correct color badge
- [ ] Expanding row → full status timeline + file list
- [ ] App version correctly extracted from `BSC.*` file
- [ ] Auto-refresh at selected interval works and updates table
- [ ] Last 10 queries visible in history, click populates form
- [ ] Expired token → error message + option to log in again
- [ ] Base URL + login saved in config.json after restart
- [ ] Password never appears in any file on disk

---

*Last updated: 2026-05-05*
*Project: QA Release HUB*
