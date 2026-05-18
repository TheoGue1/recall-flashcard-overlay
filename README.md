# Recall

**Recall** is a Windows desktop overlay for spaced-repetition flashcards. It stays on top of your work, uses Anki-style SM-2 scheduling, supports CSV import, and can nudge you on a timer to complete a short study session.

![Windows](https://img.shields.io/badge/platform-Windows%2010%2F11-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D20.19-brightgreen)

## Features

- **Always-on-top overlay** — frameless window with acrylic-style glass (Windows 10/11)
- **Spaced repetition (SM-2)** — Again, Hard, Good, Easy with learning steps and ease factor
- **CSV import** — bulk load decks (`front,back` or `question,answer`)
- **Manual card entry** — add one card at a time from the UI
- **Study timer** — e.g. every 30 minutes, complete 5 cards before you can hide the window
- **System tray** — show, trigger study, or quit from the tray icon
- **Local data** — all cards stored on your machine (no account, no cloud)

## Screenshots

> Place the overlay anywhere on screen. It remembers your cards between sessions.

## Requirements (Windows)

| Requirement | Notes |
|-------------|--------|
| **OS** | Windows 10 (1903+) or Windows 11, 64-bit |
| **Node.js** | 20.19+ or 22.12+ ([nodejs.org](https://nodejs.org/)) |
| **npm** | Comes with Node |
| **RAM** | ~200 MB while running |
| **Disk** | ~500 MB with dev dependencies; ~150 MB installed app |

Optional for building the installer:

- [Windows Build Tools](https://github.com/nodejs/node-gyp#on-windows) if native modules fail (usually not needed for this project)

## Quick start (from source)

### 1. Clone the repository

```powershell
git clone https://github.com/theo13015/recall-flashcard-overlay.git
cd recall-flashcard-overlay
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Run in development

Starts Vite and Electron together (hot reload for the UI):

```powershell
npm run dev
```

### 4. Run production build locally

```powershell
npm run build
npm start
```

### 5. Build a Windows installer (optional)

Produces an NSIS installer under `release/`:

```powershell
npm run dist
```

Install from `release\Recall Setup x.x.x.exe`. Windows SmartScreen may warn on unsigned builds — choose **More info → Run anyway**, or sign the binary for distribution.

## First-time setup

1. Launch the app — a small overlay appears at the bottom-right of your screen.
2. **Import a deck**: Settings (gear) → **Import CSV**, or use the sample [`example-deck.csv`](example-deck.csv).
3. **Study**: click the card to flip, then rate with buttons or keys `1`–`4`.
4. **Timer** (optional): Settings → enable reminders, set interval (minutes) and cards per session.

## CSV format

Header row required. Supported column names:

| Column A | Column B | Also accepted |
|----------|----------|----------------|
| `front` | `back` | `question` / `answer`, `term` / `definition` |

Example:

```csv
front,back
What is spaced repetition?,Reviewing at increasing intervals to strengthen memory
Capital of France?,Paris
```

Without headers, the first two columns are used as front and back.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Space` | Flip card |
| `1` | Again (forgot) |
| `2` | Hard |
| `3` | Good |
| `4` | Easy |

## How scheduling works (SM-2)

Recall uses a simplified **SuperMemo 2 / Anki-style** algorithm:

1. **New cards** enter **learning** with short steps (default: 1 minute, then 10 minutes).
2. **Good** advances steps; after the last step, the card **graduates** to **review** (default interval: 1 day).
3. **Easy** on new/learning graduates faster (default: 4 days).
4. **Review cards** use an **ease factor** (default 2.5, minimum 1.3):
   - **Again** → relearning, ease −20%
   - **Hard** → shorter interval, ease −15%
   - **Good** → interval × ease
   - **Easy** → longer interval, ease +15%

Adjust learning steps in **Settings → Spaced repetition**.

## Study timer

When enabled, a background timer fires every *N* minutes (default 30). The app will:

1. Bring the overlay to the front
2. Show a **Study break** banner
3. Require you to rate *M* cards (default 5) before hiding or closing

During a mandatory session, cards that are not yet “due” can still be shown so you can finish the quota.

## Data & privacy

All data is stored locally:

```
%APPDATA%\recall-flashcard-overlay\flashcards.json
```

To back up: copy that file. To reset: delete it while the app is closed.

## Windows-specific notes

- **Always on top**: the overlay stays above normal windows; use the tray icon or taskbar to focus it.
- **Acrylic / Mica**: on Windows 11, the window uses `backgroundMaterial: 'acrylic'` when supported; otherwise a translucent dark panel is used.
- **Hide vs quit**: clicking **×** hides to tray; use tray → **Quit** to exit fully.
- **Multiple monitors**: drag the overlay by the title bar (top strip) to reposition.
- **Antivirus**: Electron apps are sometimes flagged heuristically; building from source avoids third-party installers.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank window on `npm start` | Run `npm run build` first, or use `npm run dev` |
| `ERR_CONNECTION_REFUSED` | You ran `npm start` without a build; use `npm run dev` or build first |
| Timer never fires | Check Settings → timer enabled; restart app after changing interval |
| CSV import empty | Ensure `front` and `back` columns exist and rows are not blank |
| Node engine warnings | Upgrade to Node 20.19+ or 22.12+ |

## Scripts reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Development: Vite + Electron |
| `npm run build` | Compile TypeScript and bundle UI to `dist/` |
| `npm start` | Run Electron against production `dist/` |
| `npm run dist` | Build Windows NSIS installer |
| `npm run lint` | Run ESLint |

## Tech stack

- [Electron](https://www.electronjs.org/) — desktop shell, overlay, tray, timers
- [React](https://react.dev/) + [Vite](https://vitejs.dev/) — UI
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Papa Parse](https://www.papaparse.com/) — CSV import

## Contributing

Issues and pull requests are welcome. Please run `npm run build` before submitting.

## License

[MIT](LICENSE) — Copyright (c) 2026 Theo
