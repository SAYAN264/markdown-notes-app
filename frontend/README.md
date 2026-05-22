# Notes App — React + Vite Frontend

## Stack
- **React 18** with hooks
- **Vite 5** — lightning-fast HMR
- **CSS Modules** — scoped styles per component
- **Axios** — HTTP client with `/api` base URL
- **react-markdown** — Markdown rendering

## Features
- 3 editor modes: **Edit**, **Split** (side-by-side), **Preview**
- **Autosave** with 800ms debounce — no save button needed
- **Live search** filters by title and content
- **Tab key** support in textarea (2-space indent)
- **Word / char / line** count in status bar
- **Relative timestamps** (e.g. "3m ago")
- **Skeleton loading** animation on first fetch
- **Error banner** for API connection failures

## Setup

```bash
npm install
npm run dev       # → http://localhost:3000
```

> Requires the Express backend running on port 5000.
> Vite proxies `/api/*` → `http://localhost:5000` automatically.

## File Structure

```
src/
├── main.jsx              # React entry point
├── index.css             # Global CSS variables + resets
├── App.jsx               # Root component, all state
├── App.module.css
├── api.js                # Axios helpers (getNotes, createNote, etc.)
└── components/
    ├── Sidebar.jsx       # Notes list + search + new/delete
    ├── Sidebar.module.css
    ├── Editor.jsx        # Title + textarea + markdown preview
    └── Editor.module.css
```

## Design

Editorial dark theme — deep ink backgrounds with warm amber accents.  
Typography: **Fraunces** (display serif) + **Geist Mono** (body/code).
