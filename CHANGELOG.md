# Changelog

All notable changes to QA Release HUB follow [Semantic Versioning](https://semver.org/).

---

## [0.1.0] — 2026-05-07

### Added
- Project initialization: electron-vite + React 18 + TypeScript + Tailwind CSS v3 + Zustand
- Full folder structure matching PROJECT.md architecture
- Custom TitleBar with macOS/Windows window controls (no system frame)
- Left sidebar navigation (TabBar) — 5 tabs with icons, active state, version badge
- Tab 1: Report Generator with MetaForm (all fields implemented)
  - Deployment number: `R_01.00.XX.00` format with prefix/suffix display
  - DatePicker: calendar popup with dark Slate Pro theme
  - Environment checkboxes: TEST / STAGE
  - Tester dropdown with preset management and inline add-new
- Generic UI components: Button, Input, Checkbox, Textarea, DatePicker
- PageWrapper layout component (tab header + scrollable content area)
- Zustand stores: reportStore, scheduleStore, regressionStore, terminalMonitorStore
- TypeScript types: report, schedule, regression, terminalMonitor
- Electron IPC architecture: preload bridge, store handler, PDF stub, terminal monitor stub
- JSON store for userData persistence (config.json, drafts)
- Parser stubs: scopeParser, scheduleParser (with full Vitest test suites)
- Regression test data: regression-terminal-a.json, regression-terminal-b.json
- Hooks: useTesters, useDraft, useSchedule
- CI: GitHub Actions workflow (lint + type-check + tests)
- ESLint + Prettier configuration
- Tabs 2–5 visible as navigable placeholders with correct version labels

---

## [Unreleased] — dev

- Project initialization
- PROJECT.md — full documentation of architecture, parsers, roadmap
- ADR-012: Slate Pro dark layout selected as UI design
