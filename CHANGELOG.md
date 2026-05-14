# Changelog

All notable changes to QA Release HUB follow [Semantic Versioning](https://semver.org/).

---

## [0.3.5] — 2026-05-15

Patch — repo hygiene + tag policy decision. Closes all surfaced TODOs from v0.3.4 before v0.4.0 (Tab 6 AIO TC-GEN) starts. No source-code changes — pure config, docs, and process.

### Changed
- **`package.json` test scripts** — `"test": "vitest"` → `"test": "vitest run"` (single-run; the watch-mode default was hanging the quality-gate script). Added `"test:watch": "vitest"` for explicit watch mode.
- **`README.md` Versioning table** — full re-sync with `PROJECT.md` roadmap. Previously only the "current" marker was bumped; v0.4–v0.8 still listed stale feature mapping and v0.9–v1.0 were missing.
- **Tag policy: annotated from v0.3.5+.** `CLAUDE.md` Definition of Done § 4 (patch) and § 9 (minor) updated to require `git tag -d vX.Y.Z && git tag -a vX.Y.Z -m "release: vX.Y.Z"` immediately after `npm version`, so `git push --follow-tags` actually pushes the tag. Existing `v0.1.0` and `v0.3.4` stay lightweight — no retroactive rewrite.
- **`CHANGELOG.md`** — removed the stale `[Unreleased] — 2026-05-12` section (Roadmap expansion / strategic docs). The decisions live canonically in `PROJECT.md` ADR-014..017 + § Changelog headlines, so the duplicate was only noise.

### Added
- **`.gitignore`** — `PDFS/` excluded (manual smoke-test artefacts; previously showed up as untracked after every PDF generation run).

### Files changed
- `package.json` (test scripts)
- `.gitignore` (PDFS/)
- `README.md` (Versioning table)
- `CLAUDE.md` (Definition of Done § 4, § 9; Current Status; Session Log)
- `PROJECT.md` (Changelog headline; Last updated)
- `CHANGELOG.md` ([Unreleased] removed; this entry added)

### Manual test
- `npm run test` exits cleanly (single-run, no watch).
- `npm run test:watch` enters watch mode (Ctrl+C to leave).
- `git status` after release shows clean tree; `git cat-file -t v0.3.5` returns `tag` (annotated).

---

## [0.3.4] — 2026-05-14

### Added
- **TipTap toolbar** in `ResultEditorModal.tsx`: 6 new buttons — Heading 1, Heading 2, Bullet List, Ordered List, Blockquote, Code Block. StarterKit already registered the node types and the PDF generator already rendered them (v0.3.3); the editor UI was the missing piece. Editor preview gets matching Tailwind variant styles so formatting is visible while editing, not only in the exported PDF.
- **Low-resolution image warning on paste**: after every paste / drop / file-pick in `ResultEditorModal.tsx`, natural image dimensions are probed (`new Image().onload`), converted px → pt with the same `PX_TO_PT_RATIO` used by the PDF generator, and compared against `IMAGE_MAX_WIDTH_PT * 0.25` and `IMAGE_MAX_HEIGHT_PT * 0.5`. If both fall below threshold, a dismissable amber panel appears between toolbar and editor — informational only, never blocks insertion.
- **`setTestResults(record)`** bulk-replace action in `reportStore` — needed to restore the entire `testResults` map from a draft in a single set call.

### Changed
- **Auto-save now persists TipTap rich content.** `DraftData` in `useDraft.ts` gained an optional `testResults?: Record<number, string>` field; `saveDraft` includes it, `loadDraft` restores it via the new `setTestResults` action. Before v0.3.4, a crash wiped all text + base64 images entered in "Current result" cells — only `meta`, `rawScope`, `changes` survived the autosave/reload cycle.
- Backfilled `[0.3.2]` entry that had been missing from this CHANGELOG since 2026-05-10 (auto-save dialog + base64 images in PDF Section 2 — content was only in `CLAUDE.md` session log).

### Known follow-ups (out of v0.3.4 scope)
- `package.json` `"test": "vitest"` defaults to watch mode — should be `vitest run`, with a separate `test:watch` script. Surfaced during this session when full quality gates hung on the test step.
- `README.md` Versioning table lags the roadmap in `PROJECT.md` (Tab order, version-to-feature mapping). Only the "current" marker was bumped in v0.3.4 — full re-sync deferred.

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

## [0.3.2] — 2026-05-10

### Added
- **Draft restore dialog** on app start (`DraftRestoreDialog.tsx`): "Draft detected" modal with formatted `savedAt` timestamp and Load / Discard buttons. Rendered as a global overlay so autosave behaves identically regardless of the active tab.
- `useDraft.peekDraft()` — returns `savedAt | null` without loading full draft content (used to decide whether to show the restore dialog on startup).
- `useDraft.clearDraft()` — writes `null` to `userData/drafts/current.json` when the user chooses Discard.
- **Inline base64 images in PDF Section 2** "Current result" cells: text + images now render together inside `{ stack: [...] }` cell content, width clamped to 120pt.

### Changed
- `useDraft.ts`: all exported functions wrapped in `useCallback`; the autosave `useEffect` now has the correct `[saveDraft]` dependency.
- `App.tsx`: `useDraft` lifted to the root component; `peekDraft` runs once on mount; restore dialog mounted as overlay above all tabs.
- `reportTemplate.ts`: Section 2 "Current result" cell switched from plain-text (`tiptapToText`) to rich-content (`tiptapToCell`). New helpers: `TipTapNode` interface, `PdfRun` type, `parseParagraphInlines` (bold / italic / hardBreak).

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
