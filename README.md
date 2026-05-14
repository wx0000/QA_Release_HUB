# QA Release HUB

> Desktop hub for managing QA deployments — PDF reports, test checklists, deployment schedules, terminal update monitoring.

**Stack:** Electron v29 · React 18 · TypeScript · Tailwind CSS v3 · Zustand · electron-vite

---

## Development Setup

**Requirements:** Node.js ≥ 18.x · npm ≥ 9.x

```bash
npm install          # install dependencies
npm run dev          # Electron + React with HMR
npm run type-check   # TypeScript type checking
npm run test         # unit tests (Vitest)
npm run lint         # ESLint
npm run build        # production build
npm run package      # package to .exe / .dmg
```

## Project Structure

```
src/
├── main/           # Electron main process + IPC handlers
├── preload/        # Context bridge (electronAPI)
└── renderer/       # React app
    ├── components/ # UI, layout, and tab components
    ├── store/      # Zustand stores
    ├── types/      # TypeScript interfaces
    ├── hooks/      # Custom React hooks
    ├── modules/    # Parsers, PDF generator
    └── data/       # Regression test case JSON files
```

## Versioning

| Version | Feature |
|---------|---------|
| v0.1.0  | Foundation & Layout |
| v0.2.0  | Parser + Tables |
| v0.3.0  | Rich Text + PDF |
| v0.3.4  | Patch — TipTap toolbar, auto-save testResults, image warning |
| v0.3.5  | Patch — repo hygiene + tag policy — **current** |
| v0.4.0  | Tab 6 — AIO TC-GEN (LLM-based) |
| v0.5.0  | Tab 3a — Android Terminal Regression |
| v0.6.0  | Tab 3b — Embedded Terminal Regression |
| v0.7.0  | Tab 4 — Terminal Update Monitor |
| v0.8.0  | Tab 2 — Deployment Schedule (finish) |
| v0.9.0  | Diagnostic Pack (Log + Parameter parsers) |
| v0.10.0 | Tab 9 — QRCode Generator |
| v0.11.0 | Settings polish (gear menu) |
| v0.12.0 | Tab 10 — SQL Query |
| v0.13.0 | Tab 11 — Card Management |
| v0.14.0 | Tab 12 — Partner Management |
| v1.0.0  | Hardening + .exe installer |

See [PROJECT.md](./PROJECT.md) for full architecture documentation and roadmap.
