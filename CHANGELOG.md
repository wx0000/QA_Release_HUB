# Changelog

All notable changes to QA Release HUB follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased] — 2026-05-12 — Roadmap expansion (strategic / docs only)

### Strategic decisions
- **Roadmap expanded** from v0.1 – v0.8 to v0.1 – v1.0 with 11 functional tabs across 5 categories (Release Management, Terminal Testing, TC Generator, Diagnostic Tools, Backend Integrations).
- **Tab 6 — AIO TC-GEN promoted to v0.4** as the project's CV-killer feature (LLM-based test case generator). Previously slotted at v0.8+ as "details TBD".
- **Tab 3 split into Tab 3a (Android Terminal Regression) and Tab 3b (Embedded Terminal Regression).** Original single-tab toggle approach abandoned — two suites are functionally disjoint.
- **Hardware modules extracted to a separate companion app** `Terminal Hardware Toolkit`: Printer App, Cashier App, Terminal Flasher, Card Reader. They will NOT live in QA Release HUB. Reason: native dependencies (USB/serial/vendor drivers), different usage cadence, cleaner CV story.
- **Tab 5 (Settings) demoted from sidebar tab to gear menu in TitleBar.** Settings are not a daily workflow — they belong behind an icon.
- **6 new tabs added to the roadmap:**
  - Tab 7 — System Log Parser (v0.9, local)
  - Tab 8 — Parameter Parser (v0.9, local)
  - Tab 9 — QRCode Generator (v0.10, API-backed, ⚠️ reverse-eng. required)
  - Tab 10 — SQL Query (v0.12, MSSQL)
  - Tab 11 — Card Management (v0.13, ⚠️ reverse-eng. required)
  - Tab 12 — Partner Management (v0.14, ⚠️ reverse-eng. required)
- **Tab 2 (Deployment Schedule) demoted from v0.4 to v0.8** — parser + ScheduleBuilder already built in v0.4.0 session A, remaining Loop output / clipboard / clear deferred behind higher-priority modules.

### New ADRs
- **ADR-014** — Split Tab 3 into 3a (Android Terminal) and 3b (Embedded Terminal): two disjoint suites, independent state, independent JSON data.
- **ADR-015** — Hardware modules extracted to separate companion app `Terminal Hardware Toolkit`: native dependency isolation, different usage cadence, cleaner portfolio story.
- **ADR-016** — Settings as gear icon in TitleBar, not a dedicated tab: frees sidebar slot, follows standard desktop UX.
- **ADR-017** — Generic `secureCredentialStore` for all API-backed modules: generalizes ADR-009 across Tabs 4, 9, 10, 11, 12 (and Tab 6 if RAM-only API key mode is chosen). Bearer tokens, API keys, and DB passwords always RAM-only; connection profiles (URLs, logins) in `config.json`.

### Renaming / generic naming pass
- **TERMINAL-A / TERMINAL-B** in roadmap and data file naming → **Android Terminal / Embedded Terminal**.
- Removed internal company-specific API names from documentation. Tabs 11 and 12 described in functional terms only.
- Tab numbering remapped: Tab 4 is now **Terminal Update Monitor** (was Tab 5); Tab 5 slot freed (settings → gear menu); Tab 6 is **AIO TC-GEN** (was Tab 4).

### Documentation
- **`PROJECT.md` fully rewritten** to reflect the new roadmap, ADRs, folder structure, and conventions. English throughout (some sections previously in Polish merged in).
- **`CHANGELOG.md`** — this entry.

### Files changed
- `PROJECT.md` (full rewrite — strategic + structural updates)
- `CHANGELOG.md` (this entry)

### Manual test
- n/a — documentation-only change. No code, no behavior change. Existing v0.1–v0.3.1 features unaffected.

### Commit message
```
docs(project): expand roadmap, split regression tab, extract hardware to separate app

- Add 6 new tabs (Tabs 7–12) across Diagnostic Tools and Backend Integrations
- Promote AIO TC-GEN to v0.4 as CV killer feature (was v0.8+ TBD)
- Split Tab 3 into 3a (Android Terminal) and 3b (Embedded Terminal)
- Demote Tab 2 (Schedule) to v0.8 — finish remaining Loop output later
- Move Settings from sidebar tab to gear menu in TitleBar
- Extract Hardware modules (Printer/Cashier/Flasher/Card Reader) to separate app
- Add ADR-014 (Tab 3 split), ADR-015 (Hardware extraction), ADR-016 (gear menu), ADR-017 (secureCredentialStore)
- Generic naming throughout: Android/Embedded Terminal, no internal API names
- PROJECT.md fully rewritten in English to match actual repo state
```

---

## [0.3.3] — 2026-05-14

### Refactored
- **PDF Section 2 — per-component blocks with inline images** (replaces the 8-column "Test cases" table). Each MOD/FIX renders as a standalone unit starting on a new page with full-width inline images. Compact TOC table with internal hyperlinks (Nr/Component/Version/Result/Page) lands immediately under Section 1 on page 1.
- Footer back-link "Back to TOC" on every Section 2 page (pages 2..N-1, simple page-range rule).
- Anchor markers as tiny text nodes — pdfmake registers them most reliably; table-wrapper IDs get lost during layout decomposition.

### Added
- 9 new pdfGenerator modules: `constants`, `blockBuilder`, `tocBuilder`, `footerBuilder`, `tiptapToPdfContent`, `imageHelper`, `resolveImageDimensions` — each with unit tests.
- Full TipTap StarterKit support in PDF: headings (H1–H6), bulletList, orderedList, blockquote, codeBlock, horizontalRule, image. Inline marks: bold, italic, strike, underline, code (gray background).
- Empty-content placeholder: "No test content provided" rendered when `currentResult` is empty / whitespace-only.
- PDF document metadata: title, author, creator, subject set on docDefinition.
- `compress: false` in pdfmake docDef for crisp zoom-in image readability.
- Defensive tests in `scopeParser.test.ts`: 3 MOD/FIX under one component → 3 separate ParsedChange entries with sequential global `nr`.

### Fixed
- Conditional image sizing for A4 landscape: natural size when both width ≤ 782pt AND height ≤ 480pt; otherwise scale-down via `fit: [782, 480]`. Prevents images overflowing onto the footer.
- TOC page-number cells: removed conflicting `linkToDestination` (pdfmake auto-hyperlinks `pageReference` text).
- `tsconfig.web.json`: removed deprecated `baseUrl`, made `paths` relative (TS 7.0 deprecation).
- Removed Unicode glyphs (`✓`, `↑`, environment-state symbols) from labels — pdfmake's bundled Roboto VFS does not include them; they rendered as "tofu" boxes.

### New ADRs
- **ADR-018** — PDF Section 2 as per-component blocks (replaces test cases table).
- **ADR-019** — TOC anchor placement and pageReference vs. linkToDestination conflict avoidance.

---

## [0.3.1] — 2026-05-10

### Changed
- `scopeParser`: component headers now detected by lookahead (next non-empty line is MOD/FIX); version optional — lines without version produce `version: ""`.
- `scopeParser` tests: +2 cases for versionless header; 30 tests total.
- PDF Section 2 reverted from `tiptapToContent` to `tiptapToText` due to rich-text layout issues in pdfmake.

### Added
- Vendor input required before Parse scope — inline error on Vendor input.
- `vendorWarning` state + `setVendorWarning` action in `reportStore`.
- `Input` component gains `required` prop (red asterisk).

---

## [0.3.0] — 2026-05-08

### Added
- pdfmake v0.3.8 PDF generation pipeline: renderer builds doc + base64, main saves via dialog.
- `reportTemplate.ts`: full pdfmake doc — header, Section 1 (changes table), Section 2 (test cases), Section 3 (summary), page footer.
- `pdfGenerator.ts`: `createPdfBase64(docDef) → Promise<string>` wrapper.
- `pdf.handler.ts`: IPC handler with save dialog + fs.writeFile + `IpcResult` typed returns.
- `PdfPreview.tsx`: "Generate report PDF" button + inline success/error status.
- TipTap rich text editor in "Current result": Ctrl+V image paste, file picker, drag&drop; images as base64 data URIs.
- Auto-save: draft saved every 30s to `userData/drafts/current.json`; load dialog on app start.
- `__APP_VERSION__` Vite define injected from `package.json` — TitleBar + TabBar version display.

### Fixed
- `pdfGenerator.ts`: "addVirtualFileSystem is not a function" — bundler wraps both dynamic imports in `.default`; added `pdfMakeRaw`/`vfsFontsRaw` intermediates with `.default ?? raw` unwrap.
- Zustand selectors: per-field selectors in `ChangesTable`, `ScopeInput`, `TestCasesTable`, `PdfPreview`, `MetaForm` — components re-render only when their own slice changes.
- `useDraft` hook: missing `[]` in useEffect (interval was resetting every render → autosave never fired).
- `TabBar.tsx`: replaced hardcoded `v0.1.0` with `v{__APP_VERSION__}`.

---

## [0.2.0] — 2026-05-07

### Added
- `scopeParser.ts` with full Vitest test suite (markdown ticket, bracketed ticket, bare ticket, no ticket, iteration suffix, version normalization).
- `ScopeInput`: textarea + Parse button + unparsed-lines warning.
- `ChangesTable`: all columns inline editable, type shown as colored badge-select.
- `TestCasesTable`: read-only mirror of ChangesTable + Current result textarea + POSITIVE badge.
- `reportStore`: `updateChange` action.
- Vendor field in `ReportMeta` and MetaForm — when filled, ticket cells render as hyperlinks.

### Changed
- MetaForm: TEST/STAGE checkboxes inline right of "Environment" label.
- IPC channels standardized: `store:get` / `store:set` (was `store:read` / `store:write`).
- Renderer IPC pattern: `window.electronAPI.<domain>.<method>()` only.

### Removed
- `TestChecklist` (1D) from Tab 1 — duplicated Tab 3 (Terminal Regression). Spec correction.
- Checklist PDF from Tab 1 PDF generation and v0.3.0 roadmap.

### Parser hardening
- `ChangeStatus` extended with `'In Progress'` and `'Documentation'`.
- Bare ticket fallback added (`TICKET_BARE_RE = /\b([A-Z]+-\d+)\b/`).
- Polish suffix `(z iteracji R_...)` added to ignored patterns.
- Non-MOD/FIX lines silently skipped; orphan MOD/FIX → `unparsedLines[]`.

---

## [0.1.0] — 2026-05-07

### Added
- Project initialization: electron-vite + React 18 + TypeScript + Tailwind CSS v3 + Zustand.
- Full folder structure matching PROJECT.md architecture.
- Custom TitleBar with macOS/Windows window controls (no system frame).
- Left sidebar navigation (TabBar) — 5 tabs with icons, active state, version badge.
- Tab 1: Report Generator with MetaForm (all fields implemented).
  - Deployment number: `R_01.00.XX.00` format with prefix/suffix display.
  - DatePicker: calendar popup with dark Slate Pro theme.
  - Environment checkboxes: TEST / STAGE.
  - Tester dropdown with preset management and inline add-new.
- Generic UI components: Button, Input, Checkbox, Textarea, DatePicker.
- PageWrapper layout component.
- Zustand stores: `reportStore`, `scheduleStore`, `regressionStore`, `terminalMonitorStore`.
- TypeScript types: report, schedule, regression, terminalMonitor.
- Electron IPC architecture: preload bridge, store handler, PDF stub, terminal monitor stub.
- JSON store for `userData` persistence (`config.json`, drafts).
- Parser stubs: `scopeParser`, `scheduleParser` with full Vitest test suites.
- Regression test data: `regression-terminal-a.json`, `regression-terminal-b.json` (later renamed to `*-android.json` / `*-embedded.json` in v0.5 planning).
- Hooks: `useTesters`, `useDraft`, `useSchedule`.
- CI: GitHub Actions workflow (lint + type-check + tests).
- ESLint + Prettier configuration.
- Tabs 2–5 visible as navigable placeholders with correct version labels.

### Decisions
- ADR-001 through ADR-013 documented in `PROJECT.md`.
- Slate Pro dark layout selected as UI design.
- Error handling strategy formalized (`IpcResult<T>` + typed `IpcErrorCode`).
