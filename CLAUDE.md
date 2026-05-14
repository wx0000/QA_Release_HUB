# CLAUDE.md — Working Memory & Session Protocol
# QA Release HUB

> Read this file at the start of every session.
> Update "Current Status" and "Session Log" before ending every session.
> Full project spec: PROJECT.md

---

## Quick Orientation

- **App:** Electron desktop app for QA testers — report generation, deployment schedules, regression checklists, terminal update monitoring
- **Stack:** Electron v29 + React 18 + TypeScript + Tailwind CSS v3 + Zustand + pdfmake + electron-vite
- **Target OS:** Windows (.exe via electron-builder)
- **Full spec:** PROJECT.md (parsers, types, PDF structure, persistence, ADRs)

---

## Current Status

- **Version in dev:** v0.4.0 in progress — Tab 6 AIO TC-GEN (LLM-based test case generator, CV killer feature)
- **Status of completed versions:** v0.1, v0.2, v0.3, v0.3.1, v0.3.2, v0.3.3 → DONE · v0.4.0 sesja A (Schedule parser + ScheduleBuilder) → PARTIAL (deferred to v0.8)
- **Next concrete task:** v0.4.0 — Tab 6 AIO TC-GEN. Open architectural questions to resolve at session start:
  1. LLM provider default (Claude vs OpenAI) — likely Claude
  2. API key storage: encrypted in `config.json` vs RAM-only vs OS keychain
  3. Prompt template versioning strategy
  4. Cost guardrails: max tokens per call, monthly budget warning
- **Tabs roadmap:** 11 functional tabs across 5 categories — full breakdown in `PROJECT.md` § Functional Scope. Notable:
  - Tab 3 split into 3a (Android Terminal Regression) and 3b (Embedded Terminal Regression) — ADR-014
  - Tab 6 (AIO TC-GEN) promoted from v0.9 placeholder to v0.4 as CV killer feature
  - Tab 2 (Deployment Schedule) demoted from v0.4 to v0.8 — sesja A done, Loop output / clipboard / clear deferred
  - Settings moved from sidebar tab to gear menu in TitleBar — ADR-016
  - Hardware modules (Printer, Cashier, Flasher, Card Reader) extracted to separate companion app `Terminal Hardware Toolkit` — ADR-015
- **Blockers:** none
- **Surfaced TODOs (post-v0.3.3):**
  1. Auto-save TipTap "current result" content per row in `drafts/current.json` — currently only `rawScope` survives a crash; rich content (text + base64 images) is lost
  2. TipTap toolbar in UI for headings / lists / blockquote / codeBlock — PDF generator already supports these node types, but the editor has no UI controls to enable them
  3. Image resolution validation on TipTap paste — warn user when natural dpi is too low for readable PDF even at viewer zoom (e.g. paste of a downscaled thumbnail)
  4. Missing CHANGELOG entry for `[0.3.2]` — auto-save dialog + images in PDF, present in CLAUDE.md session log but never landed in CHANGELOG
- **Browser preview:** `npm run dev:browser` → `http://localhost:5173` (all UI components work; IPC calls silently no-op)

---

## Session Protocol — Read Before Every Session

### Token optimization rules (no Pro Max plan)

**Load ONLY files needed for the current task:**

| Task type | Load these files |
|-----------|-----------------|
| Parser work | `scopeParser.ts` + `scopeParser.test.ts` + `report.types.ts` |
| UI component | that component file + its types only |
| IPC handler | handler file + related store + types |
| Store work | store file + types |
| Bug fix | only the broken file + direct dependencies |

**Never load without reason:**
- Do NOT load the entire `src/` directory
- Do NOT load `PROJECT.md` in full if you already know the context — reference specific sections with `@PROJECT.md#section`
- Do NOT load all type files — only the types used in the current task
- Do NOT regenerate files that haven't changed

**Session size rule:**
- 1 session = 1 module OR 1 component + its tests OR 1 bug fix
- If a task will produce >150 lines of new code — split into 2 sessions
- If you're unsure whether a task fits — ask before starting

### Stop and ask before bigger tasks

**Definition of "bigger task" — any of these:**
- Creating a new source file (not a test file)
- Changing a TypeScript interface used in more than 2 places
- Adding a new IPC channel
- Refactoring an existing module
- Anything that will take more than 100 lines of code

**Required format before proceeding:**
```
I'm about to: [what]
This will affect: [which files]
Estimated new lines: [~N]
Proceed? (YES/NO)
```

Wait for explicit YES before generating code.

### End of session checklist

Before closing every session, always do these in order:
1. Update **Current Status** section above (version, next task, blockers)
2. Add entry to **Session Log** below
3. Verify `npm run type-check` → 0 errors
4. Verify `npm run lint` → 0 errors
5. Verify `npm run test` → green
6. **Tested manually:** confirm UI works end-to-end (record in Session Log under `Tested manually:`)
7. Provide conventional commit message

---

## Git / Commit Strategy

- Commit after each completed, working step (feature, component, bug fix)
- Never commit broken code — `type-check` + `lint` must pass first
- One commit = one closed change
- Claude Code commits locally — user decides when to push to GitHub

---

## Definition of Done (per task)

A task is complete when ALL of these pass:

- [ ] Code written
- [ ] Zero `any` in TypeScript — every value has a proper type
- [ ] `npm run type-check` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] Test written (required for any business logic — parsers, helpers, transformations)
- [ ] `npm run test` → green
- [ ] CLAUDE.md updated (current status + session log)
- [ ] Tested manually: UI golden path verified, recorded in Session Log
- [ ] Code review: przejrzyj wszystkie zmiany tej sesji pod kątem bezpieczeństwa, jakości i zgodności z konwencjami projektu przed przygotowaniem commit message
- [ ] Conventional commit message prepared

---

## Error Handling Strategy

### IPC handlers (main process) — always return typed result

Every IPC handler returns this shape — no exceptions, no raw throws:

```typescript
type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: IpcErrorCode }

type IpcErrorCode =
  | 'AUTH_EXPIRED'
  | 'AUTH_FAILED'
  | 'NETWORK_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN'
```

### Zustand stores — every async store has these fields

```typescript
isLoading: boolean
error: string | null
// reset error on new request, set on failure
```

### React components — how to surface errors

- Non-blocking errors (copy failed, refresh failed): toast notification
- Blocking errors (auth failed, data load failed): inline error state with retry option
- Per-tab error boundaries: each tab wrapped in `<ErrorBoundary>` — one tab crashing doesn't kill the app

### What NOT to do

- Never throw raw `Error` from IPC to renderer — always wrap in `IpcResult`
- Never use `console.error` as the only error handling
- Never ignore network errors — 401, 404, timeout each handled separately with specific `IpcErrorCode`
- Never show raw error stack traces in UI

### Terminal monitor specific

- `401` → set `AUTH_EXPIRED`, show "Session expired — log in again" with login button
- `404` → show "Terminal ID not found"
- Network timeout → show "Connection failed — check Base URL"
- Expired token must NEVER be logged to disk or console with token value

---

## Testing Strategy

### What we unit test (Vitest)

| Module | Test file | What to cover |
|--------|-----------|---------------|
| `scopeParser.ts` | `scopeParser.test.ts` | markdown ticket, plain ticket, no ticket, version normalization, ignored suffix, MOD/FIX types, all status values |
| `scheduleParser.ts` | `scheduleParser.test.ts` | Type A detection, Type B detection, Roman numeral parsing, person extraction, duration parsing |
| `pdfGenerator helpers` | inline test file | header formatting, date formatting, page footer content |
| `terminalMonitor helpers` | `terminalMonitor.helpers.test.ts` | BSC.* version extraction, status[0] current status rule, size formatting (KB/MB) |

### What we do NOT unit test

- React components (no renderer test setup in this project)
- IPC handlers (require Electron runtime — tested manually)
- PDF/Excel output (tested manually against acceptance criteria)
- Zustand stores (integration-level, not unit)

### Test format — always table-driven for parsers

```typescript
describe('scopeParser', () => {
  const cases = [
    {
      desc: 'markdown link ticket',
      input: '   * MOD - Fix cache [PROJ-1234](https://example.com) Done',
      expected: { typ: 'MOD', ticket: 'PROJ-1234', status: 'Done' }
    },
    {
      desc: 'plain ticket no status',
      input: '   * FIX - Something [PROJ-5678]',
      expected: { typ: 'FIX', ticket: 'PROJ-5678', status: '' }
    },
    {
      desc: 'no ticket',
      input: '   * MOD - Something without ticket Done',
      expected: { ticket: '', status: 'Done' }
    },
  ]

  test.each(cases)('$desc', ({ input, expected }) => {
    const result = parseScope(input)
    expect(result).toMatchObject(expected)
  })
})
```

### Mocking IPC in tests

Parsers and helpers are pure functions — they don't touch IPC.
**Rule:** If a function needs IPC to run, extract its pure logic into a separate helper and test that helper.
Never mock `ipcRenderer` in unit tests — that's a sign the function needs to be split.

---

## Component Structure Standard

Every component follows this order — no exceptions:

```typescript
// 1. External imports (react, libraries)
// 2. Internal imports (components, hooks, stores, types, constants)
// 3. Local types/interfaces (only if not in types/ already)
// 4. Local constants (UPPER_SNAKE_CASE)
// 5. Component function
//    5a. Hook calls (useState, useEffect, useStore — at the top)
//    5b. Derived values (useMemo, computed from state)
//    5c. Event handlers (handle + EventName pattern)
//    5d. Early returns (loading state, error state)
//    5e. Main JSX return
// 6. export default ComponentName
```

**Handler naming:** always `handle` + event noun — `handleSubmit`, `handleParseScope`, `handleStatusChange`, `handleRowExpand`

**Local state vs Zustand:**

| Use local state for | Use Zustand for |
|--------------------|-----------------|
| UI-only (isOpen, hovered, inputValue before submit) | Business data (parsed changes, test results, API responses) |
| Transient form values | Data shared between components |
| Animation state | Data that needs to survive tab switches |

**Max component size: 200 lines.** If you reach 180 lines — extract a subcomponent or hook before continuing.

---

## IPC Channels Contract

Central registry of all IPC channels. Add new channels here when creating new handlers.

| Channel | Direction | Payload type | Response type | Handler file |
|---------|-----------|--------------|---------------|--------------|
| `pdf:generate-report` | renderer→main | `{pdfBase64: string; defaultFilename: string}` | `IpcResult<{path: string\|null}>` | `pdf.handler.ts` |
| `pdf:generate-checklist` | renderer→main | `ChecklistData` | `IpcResult<{path: string}>` | `pdf.handler.ts` |
| `store:get` | renderer→main | `{key: string}` | `IpcResult<unknown>` | `store.handler.ts` |
| `store:set` | renderer→main | `{key: string; data: unknown}` | `IpcResult<void>` | `store.handler.ts` |
| `monitor:login` | renderer→main | `{baseUrl: string; login: string; password: string}` | `IpcResult<{token: string}>` | `terminalMonitor.handler.ts` |
| `monitor:fetch-updates` | renderer→main | `MonitorQueryParams` | `IpcResult<DeviceUpdatesResponse>` | `terminalMonitor.handler.ts` |
| `excel:generate-regression` | renderer→main | `RegressionExportData` | `IpcResult<{path: string}>` | `excel.handler.ts` |

**Channel naming convention:** `domain:action` — lowercase, colon separator, no spaces.

---

## Types & Store Quick Reference

> Avoids opening `report.types.ts` / `reportStore.ts` just to confirm field names.

### `report.types.ts` — key shapes

| Type | Fields |
|------|--------|
| `ReportMeta` | `deploymentSuffix`, `dateFrom`, `dateTo`, `environmentTest`, `environmentStage`, `tester`, `vendor` |
| `ParsedChange` | `nr`, `component`, `version`, `type` (MOD\|FIX), `changeDescription`, `ticket`, `status` |
| `ChecklistItem` | `nr`, `checked`, `note`, `change` (ParsedChange ref) |
| `TestCaseResult` | `nr`, `component`, `version`, `type`, `changeDescription`, `ticket`, `currentResult`, `result` |
| `ReportDraft` | `meta`, `rawScope`, `changes`, `checklist`, `savedAt` |

### `reportStore` — actions

`setMeta(patch)` · `setRawScope(raw)` · `setChanges(changes)` · `updateChange(nr, patch)` · `updateChecklist(nr, patch)` · `setTestResult(nr, content)` · `resetReport()`

> `setChanges` auto-builds `checklist[]` from `changes[]` and resets `testResults`. `updateChange` syncs both arrays. `setTestResult` stores TipTap JSON string keyed by row `nr`.

---

## Naming & Code Conventions (quick ref)

| Thing | Convention | Example |
|-------|-----------|---------|
| React components | PascalCase.tsx | `MonitorTable.tsx` |
| Hooks | useCamelCase.ts | `useDraft.ts` |
| Utilities / helpers | camelCase.ts | `scopeParser.ts` |
| Types / interfaces | PascalCase | `DeviceUpdate`, `IpcResult` |
| Constants | UPPER_SNAKE_CASE | `AUTO_REFRESH_INTERVALS` |
| IPC channels | domain:action | `monitor:login` |
| Event handlers | handle + Noun | `handleParseScope` |
| Test files | alongside source | `scopeParser.test.ts` |

**Hard rules:**
- Zero `any` — use `unknown` and narrow, or define the type
- No hardcoded strings that appear in more than one place — extract to `constants.ts`
- No `// this component does X` comments — names should explain intent
- No component over 200 lines without extracting

---

## Security Rules (non-negotiable)

- Terminal API **password** → RAM only (Zustand), never written anywhere
- Bearer **token** → RAM only (Zustand), never in config.json, never in logs
- All terminal API calls → IPC → main process → Node.js fetch (never renderer fetch)
- Example data in code and tests:
  - Tickets: `PROJ-1234`, `PROJ-5678`
  - URLs: `https://api.example.com`
  - Names: `Developer A`, `Tester A`
  - Device IDs: `12345`, `99999`
  - Components: `ComponentA`, `ComponentB`
- Before any public commit: verify no real company data, real URLs, real names, real ticket prefixes

---

## Known Gotchas & Edge Cases

These took time to figure out — don't re-solve them:

- **Version normalization:** `v.2.6.1` → must become `v2.6.1` (regex: `/v\.(\d)/` → `v$1`)
- **status[0] = current status:** API returns `status[]` sorted descending — first element is current (ADR-011). This is a named constant in code, not a magic index.
- **BSC.* file extraction:** App version = `nativeVersion` from file where `fileParameterName.startsWith('BSC.')` — NOT the first file in array, NOT every file
- **DatePicker positioning:** popup must be attached to the field (relative positioning), not `position: fixed` — fixed breaks inside scrollable containers
- **pdfmake v0.3.x setup:** use `pdfMake.addVirtualFileSystem(vfsFonts)` (not `pdfMake.vfs = ...` from v0.2.x). Fonts load from `pdfmake/build/vfs_fonts` as base64 dict — pass directly, no Buffer conversion needed. API is Promise-based: `.getBase64()`, `.getBuffer()`.
- **PDF generation architecture:** renderer builds pdfmake doc + generates base64 → sends to main via `pdf:generate-report` IPC → main runs `dialog.showSaveDialog` + `fs.writeFile`. Never generate in main (no font bundling there).
- **TipTap images in auto-save:** serialize editor content to base64 before writing to `userData/drafts/current.json` — raw blob URLs don't survive serialization
- **ChangeStatus values (all 5):** `'Done'` | `'In Review'` | `'In Progress'` | `'Waiting for test'` | `'Documentation'` — keep STATUS_TOKENS, STATUS_OPTIONS, and ChangeStatus type in sync
- **Schedule parser Type A detection:** check FIRST non-empty line only against `/^[IVX]+\./` — not all lines
- **Ticket extraction:** strip markdown link syntax — `[PROJ-1234](https://...)` → `PROJ-1234`, NOT the full markdown string
- **Electron userData path:** use `app.getPath('userData')` in main process — never hardcode paths
- **IPC in renderer:** always use `window.electronAPI.<domain>.<method>(payload)` — the typed wrapper exposed via contextBridge. Never import `ipcRenderer` directly in renderer. Never call `window.electron.ipcRenderer.invoke` — that path does not exist in this project.

---

## Session Log

### 2026-05-13/14 — v0.3.3: PDF Section 2 refactor (per-component blocks + inline images)

**Goal:** Replace 8-col "Test cases" table in PDF Section 2 with per-component block layout so screenshots and prose in "Current result" are readable at default zoom (cramped 120pt table cell → full-width 782pt A4-landscape).

**Files added (8 new modules + 7 test files):**
- `src/renderer/modules/pdfGenerator/constants.ts` — all labels, colors, dimensions, anchor IDs (i18n-ready `LABELS.*`)
- `blockBuilder.ts` (+ test) — anchor (id + pageBreak: 'before' on tiny text node) + headerTable (unbreakable, gray bg) + content/placeholder
- `tocBuilder.ts` (+ test) — Section 2 TOC table; per-cell `linkToDestination` on Nr/Component/Version/Result, `pageReference` on Page column (no link — pdfmake conflict)
- `footerBuilder.ts` (+ test) — page-range footer with "Back to TOC" link (simple rule: `currentPage > 1 && currentPage < pageCount`)
- `tiptapToPdfContent.ts` (+ test) — full TipTap StarterKit walker: paragraph, heading (H1–H6), bulletList, orderedList, blockquote, codeBlock, horizontalRule, image + inline marks (bold/italic/strike/underline/code-gray-bg)
- `imageHelper.ts` (+ test) — px→pt + `computeImageSize` discriminated union (natural vs. fit) checking BOTH width and height bounds
- `resolveImageDimensions.ts` (+ test) — pre-resolves image dims (loads each base64 dataUri via `new Image()`, returns `Map<src, ImageSize>`) so builder stays sync

**Files modified:**
- `reportTemplate.ts` — wires new builders, adds PDF metadata (`info` block), `compress: false`, pageBreak on Section 3
- `pdfGenerator.ts` — Roboto-only font registry (Courier doesn't work in Electron VFS — no `.afm` files bundled with `vfs_fonts.js`)
- `PdfPreview.tsx` — `await resolveImageDimensions(testResults)` before sync `buildDocDefinition(data, imageSizes)`
- `scopeParser.test.ts` — +2 defensive tests for multi-MOD/FIX per component (each becomes separate ParsedChange with sequential global `nr`)
- `tsconfig.web.json` — removed deprecated `baseUrl`, made `paths` relative (TS 7.0 deprecation)
- `PROJECT.md` — ADR-018 + ADR-019
- `CHANGELOG.md` — `[0.3.3]` entry

**Architectural decisions:**
- ADR-018 — PDF Section 2 as per-component blocks (replaces 8-col test cases table)
- ADR-019 — TOC anchor on Section 2 title (substantial text node); `pageReference` cells without `linkToDestination` (pdfmake auto-link conflict)

**5 rounds of bugfixes after manual Electron tests:**
1. **Courier font fallback** — `data/Courier.afm not found in virtual file system`. pdfmake's bundled VFS only ships Roboto; standard PDF fonts (Courier/Helvetica/Times) need `.afm` files. Code blocks now use Roboto + gray background only.
2. **`pageReference id not found` crash** — `id` on table-wrapper gets lost during pdfmake layout decomposition; fix: anchor on tiny text node (`text: ' ', fontSize: 1`), table-wrapper has no id, no pageBreak.
3. **Landscape sizing + image overflow** — `TEXT_COLUMN_WIDTH_PT` 470→782 (portrait assumption), `IMAGE_MAX_HEIGHT_PT` 650→480 (image was overflowing onto footer: usable A4 landscape vertical = 505pt, 25pt safety margin). New constant `IMAGE_MAX_WIDTH_PT` for semantic separation from text column.
4. **TOC hyperlinks + footer back-link** — `linkToDestination` removed from `pageReference` cell (pdfmake auto-link conflicts); `pageBreakBefore` callback fires unreliably for non-table nodes → footer scope tracking via closure ABANDONED, replaced with simple page-range rule (Option A: middle pages only).
5. **Unicode glyphs `✓ ↑ —` removed** — Roboto VFS doesn't include them, rendered as "tofu" placeholder. `formatEnvironment` rewritten to comma-joined list (`"TEST, STAGE"` / `"—"` fallback).

**Additional UI fixes during testing:**
- Removed `BLOCK_CURRENT_RESULT_LABEL` ("Current result:") — redundant under block header
- Header layout redesign: MOD/FIX badge moved from top row to bottom row (`[BADGE] : <description>` format), replacing the old `"Change description:"` label
- `"Table of contents"` subheader removed — TOC table sits directly under "2. Test cases" section title
- Section 2 title no longer has `pageBreak: 'before'` — TOC table flows naturally under Section 1 table on page 1
- Empty TipTap content → renders `"No test content provided"` placeholder (italic, gray)
- `hasVisibleContent` walker detects whitespace-only TipTap docs → placeholder triggered

**Checks:**
- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run test` ✅ — **137 tests** (was 30 before this session)

**Tested manually:** Electron app — generated test PDF with multiple components, mixed empty/long content, inline images at various resolutions. Verified: full-width image rendering, TOC click navigation, "Back to TOC" footer link on Section 2 pages, placeholder for empty current result, badge layout (MOD/FIX colored pill in bottom row), comma-separated environment label, no Unicode "tofu" boxes.

**Commits in this session (3):**
- `9380593` — refactor(pdf): redesign Section 2 as per-component blocks with inline images
- `ecf21da` — docs: add ADR-018 and ADR-019 for PDF Section 2 refactor
- `9cc96c5` — chore(tsconfig): remove deprecated baseUrl, use relative paths

**Surfaced TODOs (recorded in Current Status):** TipTap content auto-save, TipTap toolbar UI, image resolution validation on paste, missing `[0.3.2]` CHANGELOG entry.

### 2026-05-13 — Roadmap expansion + git history rewrite (docs + ops)

**Strategic session (Claude.ai):**
- Roadmap expanded from v0.1–v0.8 to v0.1–v1.0 with 11 functional tabs across 5 categories
- Tab 6 (AIO TC-GEN) promoted to v0.4 as CV killer feature
- Tab 3 split into 3a (Android Terminal) and 3b (Embedded Terminal)
- Hardware modules (Printer, Cashier, Flasher, Card Reader) extracted to separate companion app `Terminal Hardware Toolkit`
- Settings demoted from sidebar tab to gear menu in TitleBar
- New ADRs: 014 (Tab 3 split), 015 (Hardware extraction), 016 (gear menu), 017 (secureCredentialStore)
- Generic naming throughout: Android/Embedded Terminal, no internal API names
- PROJECT.md fully rewritten in English to match actual repo state

**Files changed in commit `0aabcfa` (merged to main):**
- `PROJECT.md` — full rewrite (955 lines, +736/-887 vs previous)
- `CHANGELOG.md` — [Unreleased] section added describing strategic decisions
- `.gitignore` — added `*.backup-*` and `NEW/`

**Operational session (git history rewrite):**
- Configured global git: `user.name = wx0000`, `user.email = 37546801+wx0000@users.noreply.github.com`
- Ran `git filter-repo --mailmap` to rewrite all 35 commits + 1 tag (v0.1.0) from `wx0000@wx-2.local` author/committer → GitHub noreply
- Verified: distinct emails after rewrite = 1 (noreply only); commit count preserved (35→35); content identical to pre-rewrite backup (diff -r empty for tracked files)
- Force-pushed: `main` (--force-with-lease), `v0.1.0` tag, `docs/roadmap-expansion-2026-05-12` branch
- Manual verification on GitHub: ✅ avatar attached to all commits, ✅ Contributors page shows 35 commits, ✅ contribution graph (green squares) populated for May 2026

**Checks:**
- `npm run lint` ✅
- `npm run type-check` ✅
- `npx vitest run` ✅ 30/30 (scopeParser 27, scheduleParser 3)

**Decisions / lessons learned:**
- For a portfolio repo at solo-dev scale, history rewrite is worth the destructive ops to get clean author linkage from the start — value compounds with every future commit
- `git filter-repo --mailmap` + `--force-with-lease` push is the safe modern pattern (vs deprecated `filter-branch`)
- Pre-rewrite full local clone backup is non-negotiable insurance

**Next task:**
v0.4.0 — Tab 6 AIO TC-GEN (LLM-based test case generator). Open architectural questions to resolve at session start:
1. LLM provider default (Claude vs OpenAI) — likely Claude
2. API key storage: encrypted in config.json vs RAM-only vs OS keychain
3. Prompt template versioning strategy
4. Cost guardrails: max tokens per call, monthly budget warning

### 2026-05-11 — v0.4.0 sesja A: ScheduleInput + ScheduleBuilder
- **`ScheduleInput.tsx`:** textarea + "Parse schedule" button → `parseSchedule` → `setParsed`; po parsowaniu pokazuje Type + liczbę komponentów + liczbę wykrytych developerów
- **`ScheduleBuilder.tsx`:** `PersonCard` (subcomponent inline) — checkbox lista komponentów z opcjonalnym polem notes; sekcja Developers (Type A: "+" button + usuwanie, Type B: auto z parsera bez usuwania); sekcja Testers (zawsze "+" button + usuwanie); stan w `scheduleStore.people` via `setPeople`
- **`App.tsx`:** `ScheduleBuilder` dodany do `SchedulePage`; import dołączony
- **Checks:** `npm run type-check` ✅ · `npm run lint` ✅ · `npm run test` ✅ (30/30)
- **Tested manually:** `npm run dev:browser` — do weryfikacji przez użytkownika

### 2026-05-11 — Tabs 6–9: placeholder pages in App.tsx + TabBar.tsx
- **`TabBar.tsx`:** `TabId` rozszerzony do `1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9`; dodano ikony `Monitor`, `ShieldCheck`, `CreditCard`, `Smartphone` z lucide-react; 4 nowe wpisy w `TABS` z badge v0.9/v1.0/v1.1/v1.2
- **`App.tsx`:** 4 inline page functions (`VirtualTerminalPage`, `LimitCheckerPage`, `CardReaderPage`, `MobileAppPage`) wzorowane na `AITCGenPage`; zarejestrowane w `TAB_PAGES`; bez nowych plików .tsx
- **Checks:** `npm run type-check` ✅ · `npm run lint` ✅
- **Tested manually:** `npm run dev:browser` — do weryfikacji przez użytkownika

### 2026-05-11 — roadmap: Tabs 6–9 added as placeholders (docs only)
- **`PROJECT.md`:** architecture diagram extended with Tabs 6–9; TAB 6–9 placeholder entries added in Functional Scope (after TAB 5); v0.9.0–v1.2.0 entries added in Roadmap (after v0.8.0); v0.9.0–v1.2.0 Acceptance Criteria stubs added; `*Last updated*` bumped to 2026-05-11
- **`CLAUDE.md`:** Current Status updated — new "Tabs roadmap" line notes 9 tabs total, Tabs 6–9 as doc-only placeholders
- **Checks:** n/a (docs only)
- **Tested manually:** n/a

### 2026-05-10 — v0.3.2: auto-save dialog + images in PDF
- **`DraftRestoreDialog.tsx`** (nowy): modal "Draft detected" z przyciskami Load/Discard; pokazuje sformatowaną datę zapisu; `formatSavedAt` jako helper
- **`useDraft.ts`:** dodano `peekDraft` (zwraca `savedAt | null`, pomija draft bez treści), `clearDraft` (ustawia null na dysku); wszystkie funkcje opakowane w `useCallback`; `useEffect` z dep `[saveDraft]` zamiast `[]`
- **`App.tsx`:** `useDraft` przeniesiony do głównego komponentu `App`; `useEffect` wywołuje `peekDraft` raz po starcie; `DraftRestoreDialog` renderowany jako overlay; autosave działa globalnie (niezależnie od aktywnego taba)
- **`reportTemplate.ts`:** usunięto `tiptapToText`; dodano `TipTapNode` interface, `PdfRun` type, `parseParagraphInlines` (bold/italic/hardBreak), `tiptapToCell` — buduje `{ stack: [...] }` z blokami tekstu i obrazami base64 (width: 120); sekcja 2 używa `tiptapToCell` zamiast `tiptapToText`
- **Checks:** `npm run type-check` ✅ · `npm run lint` ✅ · `npm run test` ✅ (30/30)
- **Tested manually:** `npm run dev:browser` — brak możliwości weryfikacji dialogu (IPC no-op w browser preview); PDF z obrazami wymaga Electron + TipTap content

### 2026-05-10 — retroactive versioning clarification (docs only)
- **`CLAUDE.md`:** all `v0.3.0A` / `v0.3.0B` labels in Session Log replaced with `v0.3.0`; exploratory session entry updated to document v0.3.1 scope; Current Status updated to reflect v0.3.1 shipped
- **`PROJECT.md`:** Versioning section: added one-line PATCH note; Changelog: `v0.3.0A` → `v0.3.0` (2 places), ADR-001 `v0.3.0B` → `v0.3.0`; new `[0.3.1] — 2026-05-10` entry added with full description
- **Checks:** n/a (docs only)
- **Tested manually:** n/a

### 2026-05-10 — v0.3.1 shipped + exploratory / diagnostic session
- Committed and pushed two pre-staged changesets as **v0.3.1**:
  - `fix(pdf)`: reverted `tiptapToContent` → `tiptapToText` in Section 2 (rich-text layout issues in pdfmake)
  - `feat(report)`: vendor field now required before Parse scope — inline error on Vendor input; `vendorWarning` state + `setVendorWarning` action added to `reportStore`; `Input` component gains `required` prop (red asterisk)
- Read `scopeParser.ts` (IGNORED_SUFFIX_RE, component header detection, changeDescription extraction)
- Read `reportTemplate.ts` (Section 1 body builder, tiptapToText, Section 2 Current result cell)
- Added/removed temporary `console.log`s in `PdfPreview.tsx` and `reportTemplate.ts` (net zero change)
- **Checks:** `npm run type-check` ✅ · `npm run lint` ✅
- **Tested manually:** n/a (no new UI flows beyond what was shipped)

### 2026-05-10 — pdfGenerator runtime fix
- **`pdfGenerator.ts`:** fixed "addVirtualFileSystem is not a function" — bundler wraps both dynamic imports in `.default`; added `pdfMakeRaw`/`vfsFontsRaw` intermediates with `.default ?? raw` unwrap before use
- **Checks:** `npm run type-check` ✅ · `npm run lint` ✅
- **Tested manually:** requires Electron app with PDF generation flow

### 2026-05-10 — wire testResults into PDF Section 2 (v0.3.0)
- **`reportTemplate.ts`:** added `tiptapToText` helper (full text extraction from TipTap JSON, no truncation); Section 2 "Current result" cell now uses `tiptapToText(testResults[c.nr] ?? '')` instead of raw JSON
- **`PdfPreview.tsx`:** added `testResults` selector; passed to `buildDocDefinition`
- **`TestCasesTable.tsx`:** fixed pre-existing `no-extra-semi` lint errors (unnecessary `;` before `(` inside `if` blocks)
- **Checks:** `npm run type-check` ✅ · `npm run lint` ✅ · `npm run test` ✅ (30/30)
- **Tested manually:** n/a — requires Electron + TipTap content + PDF generation; golden path verified in prior session

### 2026-05-10 — ticket hyperlinks w TestCasesTable + ChangesTable fallback
- **`TestCasesTable.tsx`:** dodano `vendor = useReportStore(state => state.meta.vendor)`; kolumna Ticket renderuje `<a href>` z `text-accent underline` gdy vendor+ticket, `<span>` gdy puste — identycznie jak ChangesTable
- **`ChangesTable.tsx`:** fallback kolumny Ticket zmieniony z edytowalnego `<input>` na read-only `<span className="font-mono text-xs">{c.ticket || '—'}</span>`
- **Checks:** `npm run type-check` ✅
- **Tested manually:** n/a (wizualna zmiana — weryfikowalna po wpisaniu vendora w MetaForm)

### 2026-05-10 — ticket link font size fix
- **`ChangesTable.tsx`:** ticket hyperlink klasa zmieniona z `text-sm` na `text-xs` (zgodnie ze specem)
- **Tested manually:** n/a (1-linia CSS, wizualnie weryfikowalne w tabeli)

### 2026-05-10 — TipTap modal "Current result" (v0.3.0)
- **`package.json`:** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image` v3.23.1 installed
- **`reportStore.ts`:** added `testResults: Record<number, string>` + `setTestResult(nr, content)`; `setChanges` resets `testResults` on re-parse; `resetReport` clears `testResults`
- **`ResultEditorModal.tsx`** (nowy): TipTap editor z Bold/Italic toolbar, Ctrl+V paste obrazów, file picker (jpg/jpeg/png), drag&drop; obrazy serializowane jako base64 data URI; Escape i klik poza → zamknięcie bez zapisu
- **`TestCasesTable.tsx`:** usunięto lokalny `useState` na currentResults; kolumna "Current result" → klikalny preview (`extractPreview` z TipTap JSON); modal renderowany via React Fragment poza tabelą
- **Checks:** `npm run type-check` ✅ · `npm run test` ✅ (30/30)
- **Tested manually:** `npm run dev:browser` → kliknięcie w "Current result" otwiera modal Slate Pro; Bold/Italic działa; upload obrazu przez picker; Escape zamyka bez zapisu; Save → preview widoczny w komórce ✅

### 2026-05-10 — Vendor field + ticket hyperlinks
- **`report.types.ts`:** `ReportMeta` extended with `vendor: string`
- **`reportStore.ts`:** `DEFAULT_META` updated with `vendor: ''`
- **`MetaForm.tsx`:** new Vendor `Input` field (placeholder "np. firma"), persisted to store via `setMeta`
- **`ChangesTable.tsx`:** added `vendor` selector (`state.meta.vendor`); Ticket cell renders as `<a href>` with `text-accent underline` when both `vendor` and `ticket` non-empty — falls back to editable `<input>` otherwise
- **Checks:** `npm run type-check` ✅ · `npm run test` ✅ (30/30)
- **Tested manually:** `npm run dev:browser` → pole Vendor widoczne w MetaForm, wpisanie vendora → tickety w ChangesTable renderują się jako klikalne linki; brak vendora → zwykły input ✅

### 2026-05-09 — Definition of Done: code review step
- **`CLAUDE.md`:** added `Code review` as mandatory checklist item in Definition of Done — review all session changes for security, quality, and project conventions before preparing commit message
- **Tested manually:** n/a (docs only)

### 2026-05-09 — Zustand selectors + useDraft fix
- **`useDraft.ts`:** useEffect missing `[]` fixed (interval was resetting every render → autosave never fired); `saveDraft` now uses `useReportStore.getState()` instead of stale closure values; setters selected via individual selectors
- **`ChangesTable.tsx`, `ScopeInput.tsx`, `TestCasesTable.tsx`, `PdfPreview.tsx`, `MetaForm.tsx`:** all replaced `useReportStore()` (full-store subscription) with per-field selectors — each component now re-renders only when its own slice of state changes
- **Checks:** `npm run type-check` ✅ · `npm run test` ✅ (30/30)
- **Tested manually:** `npm run dev:browser` → tabela widoczna po parsowaniu, TestCasesTable wypełniona, Generate PDF działa, PDF zapisany na dysk

### 2026-05-09 — PROJECT.md audit + memory protocol
- **PROJECT.md:** v0.1.0 all roadmap items marked `[x]`, heading updated to `✅`; Acceptance Criteria v0.1.0 same treatment
- **PROJECT.md Changelog:** added missing entries — scopeParser hardening (ChangeStatus, bare ticket, Polish suffix) and TabBar `__APP_VERSION__` fix, both from 2026-05-08 session
- **Memory:** added `feedback_bug_diagnosis.md` — when listing bug causes, always pick most likely + provide ready-to-paste Claude Code prompt
- **Memory:** updated `feedback_update_logs.md` — full section-by-section checklist for conscious update protocol; test: "would a new developer have accurate picture from PROJECT.md alone?"
- **Tested manually:** n/a (no UI changes — docs and memory only)

### 2026-05-09 — scopeParser lookahead header detection
- **`scopeParser.ts`:** replaced COMPONENT_RE-based header detection with lookahead — a line is a component header iff the next non-empty line matches `CHANGE_START_RE` (`/^\s*(?:\*\s*)?(MOD|FIX)\s*-/`); COMPONENT_RE retained for optional version extraction
- **No version case:** lines without a version token → `currentComponent = trimmed` (bullet stripped), `currentVersion = ''`
- **`scopeParser.test.ts`:** added `scopeParser — component header without version` describe block — 2 new cases (header+MOD/FIX → recognized with `version=''`; lone header → silently skipped); total 27 scope tests, 30 overall
- **Checks:** `npm run type-check` ✅ · `npm run lint` ✅ · `npm run test` ✅ (30/30)
- **Tested manually:** n/a (parser-only change — no UI affected)
- **Commit:** `feat(parser): detect component headers by lookahead instead of requiring a version`

### 2026-05-08 — TabBar version fix
- **`TabBar.tsx`:** replaced hardcoded `v0.1.0 — Foundation` with `v{__APP_VERSION__}` — both title bar and sidebar now update automatically from `package.json`
- **Checks:** `npm run type-check` ✅
- **Tested manually:** `npm run dev:browser` → sidebar shows `v0.3.0` instead of hardcoded `v0.1.0`

### 2026-05-08 — package.json version bump
- **Root cause:** `package.json` `version` field was `0.1.0` — never bumped despite completing v0.2.0 and v0.3.0 sessions
- **Fix:** bumped to `0.3.0`; `__APP_VERSION__` Vite define now resolves to the correct value
- **Tested manually:** n/a (config change only — verified by TitleBar/TabBar showing `v0.3.0`)
- **Commit:** `chore: bump version to 0.3.0 in package.json`

### 2026-05-08 — TitleBar version automation
- **`electron.vite.config.ts`:** reads `version` from `package.json` via `readFileSync`; injects as `__APP_VERSION__` global via `renderer.define`
- **`electron.d.ts`:** declared `const __APP_VERSION__: string` inside `declare global` (module-file scoping requirement)
- **`TitleBar.tsx`:** replaced hardcoded `"v0.3.0"` with `v{__APP_VERSION__}`
- **Checks:** `npm run type-check` ✅ · `npm run lint` ✅
- **Tested manually:** `npm run dev:browser` → title bar shows `v0.3.0` derived from `package.json`

### 2026-05-08 — scopeParser hardening
- **`ChangeStatus`:** added `'In Progress'` and `'Documentation'` to type + `STATUS_TOKENS` + `ChangesTable` `STATUS_OPTIONS`
- **Bare ticket:** added `TICKET_BARE_RE = /\b([A-Z]+-\d+)\b/` as 3rd fallback after markdown and bracketed forms
- **Polish suffix:** `IGNORED_SUFFIX_RE` now covers `(z iteracji ...)` alongside existing `(from iteration ...)`
- **Line skipping:** non-MOD/FIX lines silently skipped; only MOD/FIX without component context → `unparsedLines`
- **Tests:** full table-driven rewrite — 18 cases across 6 `describe` blocks (tickets, statuses, version, suffix, skipping, multi-component); total 21 tests green
- **Checks:** `npm run type-check` ✅ · `npm run lint` ✅ · `npm run test` ✅ (21/21)
- **Tested manually:** n/a (parser-only — covered by Vitest; UI change limited to Status dropdown options)

### 2026-05-08 — v0.3.0 — pdfGenerator pipeline (COMPLETE)
- **Architecture:** pdfmake runs in renderer (Chromium); renderer generates base64 PDF → main process saves via `dialog.showSaveDialog` + `fs.writeFile`
- **pdfmake v0.3.8 installed** — API changed from v0.2.x: `addVirtualFileSystem(vfsFonts)` for font setup; `.getBase64()` / `.getBuffer()` return Promises
- **`reportTemplate.ts`:** full pdfmake doc definition — header block, Section 1 (7-col changes table), Section 2 (8-col test cases, `testResults` wired for v0.3.0), Section 3 (summary), footer with page numbers
- **`pdfGenerator.ts`:** `createPdfBase64(docDef) → Promise<string>` — thin wrapper around pdfmake
- **`pdf.handler.ts`:** full IPC handler — save dialog, `fs.writeFile`, `IpcResult` typed returns
- **`PdfPreview.tsx`:** "Generate report PDF" button + inline success/error status; graceful no-op in browser preview
- **`report.types.ts`:** added `ReportData { meta, changes, testResults? }`
- **`electron.d.ts` + `preload/index.ts`:** updated `pdf.generateReport` signature to `(pdfBase64, defaultFilename)`
- **App.tsx:** `<PdfPreview />` added to ReportPage
- **Checks:** `npm run type-check` ✅ · `npm run lint` ✅ · `npm run test` ✅ (8/8)
- **Tested manually:** Electron app → parse scope → Generate report PDF → save dialog → PDF on disk with header, tables, footer ✅; `currentResult` cells blank (expected — TipTap pending)
- **Known limitation:** `currentResult` cells in Section 2 are blank until v0.3.0 (TipTap) wires `testResults` into store

### 2026-05-07 — v0.2.0 (COMPLETE)
- **MetaForm:** TEST/STAGE checkboxes now inline to the right of the "Environment" label
- **ScopeInput:** textarea + "Parse scope" button + success count + unparsed-lines warning panel
- **ChangesTable:** fully wired to store — all 6 columns inline-editable (inputs + selects); type column styled as colored badge-select; empty state when no changes parsed
- **TestCasesTable:** No→Ticket columns read from store (read-only mirror of ChangesTable); "Current result" per-row textarea (local state — moves to store in v0.3.0 with TipTap); POSITIVE badge locked; empty state
- **reportStore:** added `updateChange(nr, patch)` — updates both `changes[]` and the matching `checklist[].change` reference
- **App.tsx:** swapped `TestChecklist` → `TestCasesTable`
- **Checks:** `npm run type-check` ✅ · `npm run lint` ✅ · `npm run test` ✅ (8/8)
- **Tested manually:** `npm run dev:browser` → paste scope → Parse → ChangesTable populated, all columns editable, TestCasesTable mirrors data, POSITIVE badge locked ✅
- **Known limitation:** `currentResult` in TestCasesTable is local state — lost on tab switch until TipTap + store wiring in v0.3.0

### 2026-05-07 — v0.2.0 scope correction + conventions
- **Removed `TestChecklist` (1D) from Tab 1** — it duplicates the checklist/regression functionality in Tab 3 (Terminal Regression); it was a spec mistake
- **Removed checklist PDF** from Tab 1 PDF generation (1F) and v0.3.0 roadmap — no checklist to export without 1D
- **MetaForm layout change:** TEST/STAGE checkboxes must be inline to the right of the "Environment" label, not stacked below it
- **IPC channels standardized:** `store:get` / `store:set` (was `store:read` / `store:write`); `window.electronAPI.<domain>.<method>()` is the only renderer IPC pattern (removed stale `window.electron.ipcRenderer.invoke` reference)
- **Session shorthand established:** "update CLAUDE.md" = update Current Status + Session Log (saved to persistent memory)
- Files changed: `CLAUDE.md`, `PROJECT.md`
- **Tested manually:** n/a (spec/convention changes only — no code)

### 2026-05-07 — v0.1.0 Foundation & Layout (COMPLETE)
- **What was done:** Full v0.1.0 scaffold built from scratch — 55 source files generated
- **Files created:**
  - Config: `package.json`, `electron.vite.config.ts`, `tsconfig.json/node/web`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.json`, `.prettierrc`, `.gitignore`
  - Main process: `src/main/index.ts`, IPC handlers (pdf/store/terminalMonitor stubs), `jsonStore.ts`
  - Preload: `src/preload/index.ts` — contextBridge exposing `window.electronAPI`
  - Renderer: `App.tsx`, `main.tsx`, `index.html`, `styles/globals.css`
  - Layout: `TitleBar.tsx`, `TabBar.tsx` (sidebar, 5 tabs), `PageWrapper.tsx`
  - UI primitives: `Button`, `Input`, `Checkbox`, `Textarea`, `DatePicker` (calendar popup, dark theme)
  - MetaForm: all fields — deployment number, date range, TEST/STAGE checkboxes, tester dropdown
  - Zustand stores: `reportStore`, `scheduleStore`, `regressionStore`, `terminalMonitorStore`
  - Types: all 4 type modules + `electron.d.ts`
  - Hooks: `useTesters`, `useDraft`, `useSchedule`
  - Parsers: `scopeParser.ts` + `scheduleParser.ts` with 8 Vitest tests (all green)
  - Data: `regression-terminal-a.json`, `regression-terminal-b.json`
  - Tabs 2–5: placeholder components with version labels
  - CI: `.github/workflows/ci.yml`
  - Browser preview: `vite.browser.config.ts` + `dev:browser` script
- **Checks:** `npm run type-check` ✅ · `npm run lint` ✅ · `npm run test` ✅ (8/8)
- **Tag:** `v0.1.0` on `main`
- **Tested manually:** `npm run dev:browser` → sidebar 5 tabs, MetaForm all fields, DatePicker popup, tab switching works ✅
- **Decisions / gotchas found:**
  - `window.electronAPI` must use `?.` optional chaining in all hooks — crashes browser preview otherwise
  - `@import` in globals.css must precede `@tailwind` directives (PostCSS requirement)
- **Next task:** v0.2.0 — `ScopeInput`, `ChangesTable`, `TestChecklist`, `TestCasesTable`

### 2026-05-07 — Project initialization
- What was done: PROJECT.md finalized (English version), CLAUDE.md created, architecture decisions documented (ADR-001 through ADR-013)
- Files changed: `PROJECT.md`, `CLAUDE.md`
- Decisions: Slate Pro dark layout selected (ADR-012), Error handling strategy formalized (ADR-013)
- Next task: v0.1.0 setup — electron-vite scaffold, folder structure, custom TitleBar, TabBar (sidebar), UI components

---

_Last updated: 2026-05-14_
_Project: QA Release HUB_
