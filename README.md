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
| v0.1.0 | Foundation & Layout — current |
| v0.2.0 | Parser + Tables |
| v0.3.0 | Rich Text + PDF |
| v0.4.0 | Deployment Schedule |
| v0.5.0 | Terminal Regression |
| v0.6.0 | Terminal Update Monitor |
| v0.7.0 | Persistence + UX Polish |
| v0.8.0 | AIO TC-GEN |

See [PROJECT.md](./PROJECT.md) for full architecture documentation and roadmap.
