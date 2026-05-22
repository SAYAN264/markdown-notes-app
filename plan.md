# 📝 Markdown Notes App — Interview Project Plan

> **Stack:** React (Vite) · Node.js · Express · MongoDB (Mongoose)  
> **Build time:** ~25–30 minutes  
> **Project type:** Full-stack CRUD app with Markdown support

---

## 1. Project Overview

A full-stack **Markdown Notes App** where users can create, edit, delete, search, and preview notes written in Markdown. The app autosaves changes so users never lose work.

### Why this project?
- Demonstrates the **full MERN stack** (minus Next.js)
- Covers every core full-stack concept: REST API design, database modeling, state management, component architecture
- Looks polished and real-world — not a toy "to-do list"
- Easy to explain in an interview because every decision is intentional

---

## 2. Architecture

```
Browser (React + Vite)
      │
      │  HTTP (Axios)  [Vite dev proxy: /api/* → localhost:5000]
      ▼
Express Server (Node.js)          ← REST API layer
      │
      │  Mongoose ODM
      ▼
MongoDB Database                  ← Persistent storage
```

### Separation of concerns
- **Frontend (React + Vite)** — UI, state, user interactions, live search
- **Backend (Express)** — Business logic, routing, validation
- **Database (MongoDB)** — Persistence via Mongoose schemas

---

## 3. Folder Structure

```
notes-app/
├── server/
│   ├── index.js               ← Express app + Mongoose + all routes
│   ├── .env                   ← MONGO_URI, PORT
│   └── package.json
│
└── notes-vite/                ← Vite frontend
    ├── index.html             ← Single HTML entry point (Vite style)
    ├── vite.config.js         ← Vite config + API proxy
    ├── package.json
    └── src/
        ├── main.jsx           ← React entry point
        ├── index.css          ← Global CSS variables + resets
        ├── App.jsx            ← Root component, all shared state
        ├── App.module.css
        ├── api.js             ← Axios helpers (getNotes, createNote, etc.)
        └── components/
            ├── Sidebar.jsx    ← Notes list + live search + new/delete
            ├── Sidebar.module.css
            ├── Editor.jsx     ← Title + textarea + 3-mode view + status bar
            └── Editor.module.css
```

---

## 4. Why Vite over Create React App?

| | Create React App | Vite |
|---|---|---|
| Dev server start | ~5–10s | ~300ms |
| Hot Module Reload | Slow (webpack) | Instant (native ESM) |
| Build output | Larger bundles | Optimised with Rollup |
| Config | Hidden (react-scripts) | Transparent `vite.config.js` |
| Proxy setup | `"proxy"` in package.json | `server.proxy` in vite.config.js |
| Maintenance | Deprecated by Meta | Actively maintained |

**Key talking point:** Vite uses native ES modules in the browser during development — it doesn't bundle at all during dev, which is why startup is near-instant. CRA bundles everything with Webpack on every start.

---

## 5. Backend Deep Dive

### 5.1 Server Setup (`server/index.js`)

```
Express app
  ├── cors()             → Allows cross-origin requests in production
  ├── express.json()     → Parses JSON request bodies
  └── mongoose.connect() → Connects to MongoDB on startup
```

**Key talking point:** In development, `vite.config.js` has a `server.proxy` block that forwards `/api/*` calls to `localhost:5000`. This means no CORS errors during dev, and in production you'd deploy both behind the same domain or set `cors()` origin explicitly.

### 5.2 Mongoose Schema

```javascript
const noteSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  content:   { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

**Key talking points:**
- `trim: true` on title strips accidental whitespace at the DB level
- `required: true` means Express returns a 400 error if title is missing — validation at the DB layer, not just the frontend
- MongoDB auto-generates `_id` (ObjectId) — no need to manage IDs manually
- `updatedAt` is manually set on PUT requests so the sidebar can sort by most recently modified

### 5.3 REST API Endpoints

| Method | Route | Action | Status Codes |
|--------|-------|--------|--------------|
| GET | `/api/notes` | Fetch all notes, sorted by `updatedAt` desc | 200, 500 |
| GET | `/api/notes/:id` | Fetch one note by MongoDB ObjectId | 200, 404, 500 |
| POST | `/api/notes` | Create a note, returns the created doc | 201, 400, 500 |
| PUT | `/api/notes/:id` | Update title + content, returns updated doc | 200, 404, 500 |
| DELETE | `/api/notes/:id` | Delete by id, returns confirmation message | 200, 404, 500 |

**Key talking points:**
- Used `findByIdAndUpdate` with `{ new: true }` to return the **updated** document (not the old one) — important for keeping React state in sync without a second fetch
- `runValidators: true` ensures Mongoose schema validation also runs on updates, not just creates
- All routes wrapped in `try/catch` with meaningful error messages — never let the server crash silently

---

## 6. Frontend Deep Dive

### 6.1 Vite Proxy Config (`vite.config.js`)

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

**Key talking point:** This is the Vite equivalent of CRA's `"proxy"` field. Any request to `/api/*` in the browser gets transparently forwarded to the Express server. No CORS headers needed in development.

### 6.2 API Layer (`api.js`)

A single Axios instance so the base URL is defined once:

```javascript
const API = axios.create({ baseURL: '/api' })

export const getNotes   = ()         => API.get('/notes')
export const createNote = (data)     => API.post('/notes', data)
export const updateNote = (id, data) => API.put(`/notes/${id}`, data)
export const deleteNote = (id)       => API.delete(`/notes/${id}`)
```

**Why?** If the API URL changes (e.g., moving to a cloud host), update one line, not every component. Also makes it trivial to add request interceptors for auth headers later.

### 6.3 State Management (`App.jsx`)

All shared state lives in the root `App` component and flows down as props:

```
App
 ├── notes[]        → Full list of notes from MongoDB
 ├── selected       → Currently open note object
 ├── saving         → Boolean: drives the save status indicator
 ├── loading        → Boolean: drives skeleton loading UI
 ├── error          → String | null: drives the error banner
 │
 ├── Sidebar        ← receives: notes, selected, loading, onSelect, onCreate, onDelete
 └── Editor         ← receives: note (selected), onSave, saving
```

**Key talking point:** Classic "lifting state up" — Sidebar and Editor never communicate directly. All data flows through App. This is intentional: it makes the data flow easy to trace and debug without needing Redux or Context.

### 6.4 Autosave with Debounce (`Editor.jsx`)

```javascript
const timer = useRef(null)

const scheduleAutosave = (t, c) => {
  clearTimeout(timer.current)           // Cancel any pending save
  timer.current = setTimeout(() => {    // Schedule new save in 800ms
    onSave(note._id, { title: t, content: c })
  }, 800)
}
```

**Key talking points:**
- `useRef` stores the timer ID without causing a re-render — if it were `useState`, every keystroke would re-render the component unnecessarily
- Debouncing fires the API call 800ms **after the user stops typing**, not on every character — prevents hundreds of PUT requests per paragraph
- The animated dot indicator (blinking = saving, solid green = saved) gives clear feedback without interrupting focus

### 6.5 Three Editor Modes

The Editor has three view modes toggled by a button group:

| Mode | What renders | Best for |
|------|-------------|----------|
| `edit` | Textarea only | Writing, distraction-free |
| `split` | Textarea + Preview side by side | Seeing formatting while writing |
| `preview` | Rendered Markdown only | Reading final output |

The mode is local state in `Editor.jsx` — it doesn't need to live in `App` because nothing else cares about it.

### 6.6 Live Search (`Sidebar.jsx`)

```javascript
const [search, setSearch] = useState('')

const filtered = notes.filter(n =>
  n.title.toLowerCase().includes(search.toLowerCase()) ||
  n.content.toLowerCase().includes(search.toLowerCase())
)
```

**Key talking point:** This is client-side filtering — all notes are already in memory, so there's no extra API call. For a large dataset (thousands of notes) you'd move search to the server with a MongoDB `$text` index or regex query instead.

### 6.7 Tab Key Support

```javascript
const handleKeyDown = e => {
  if (e.key === 'Tab') {
    e.preventDefault()                          // Stop focus jumping
    const { selectionStart, selectionEnd } = e.target
    const newContent = content.substring(0, selectionStart) + '  ' + content.substring(selectionEnd)
    setContent(newContent)
    scheduleAutosave(title, newContent)
    requestAnimationFrame(() => {               // Restore cursor after state update
      textareaRef.current.selectionStart = selectionStart + 2
      textareaRef.current.selectionEnd   = selectionStart + 2
    })
  }
}
```

**Key talking point:** `requestAnimationFrame` is used to restore the cursor position after React re-renders — if you set `selectionStart` synchronously, React's re-render wipes it out.

### 6.8 CSS Modules

Every component has its own `.module.css` file. Class names are auto-scoped to the component at build time (e.g., `.title` becomes `.Editor_title__x3kQp`). No global class name collisions, no need for BEM naming conventions.

---

## 7. Data Flow — Creating a Note (End to End)

```
1. User clicks "+ new note" button in Sidebar
2. App.handleCreate() fires POST /api/notes { title: "Untitled", content: "" }
3. Vite proxy forwards the request to Express on port 5000
4. Express validates body, calls Note.create()
5. MongoDB creates document, returns it with _id and timestamps
6. Express sends 201 response with the new note object
7. React prepends it to notes[] state array
8. setSelected(newNote) opens it in the Editor immediately
9. User starts typing → Editor debounces 800ms → PUT /api/notes/:id fires
10. MongoDB updates document → Express returns updated doc → React syncs state
```

---

## 8. Data Flow — Deleting a Note

```
1. User hovers a note item → delete button fades in (CSS opacity: 0 → 1)
2. Click calls App.handleDelete(id), stopPropagation() prevents selecting the note
3. DELETE /api/notes/:id → MongoDB removes document
4. React filters the note out of local state (no refetch needed)
5. If deleted note was selected → auto-selects remaining[0] or null
```

---

## 9. Key Technical Decisions

| Decision | What I chose | Why |
|----------|-------------|-----|
| Build tool | Vite 5 | Instant dev server, native ESM, replaces deprecated CRA |
| Database | MongoDB + Mongoose | Flexible schema, document model suits notes perfectly |
| ORM/ODM | Mongoose | Schema validation + clean query API over raw driver |
| HTTP client | Axios | Cleaner than `fetch`, single base URL config, easy to extend with interceptors |
| State management | `useState` + `useRef` | App is simple enough — Redux/Context would be overengineering |
| Autosave | Debounce 800ms | Balances UX responsiveness with API efficiency |
| Markdown | react-markdown | Battle-tested, XSS-safe, renders full CommonMark spec |
| Styling | CSS Modules | Zero global conflicts, scoped by default, no extra runtime |
| Editor modes | Edit / Split / Preview | Covers different workflows without adding libraries |
| Search | Client-side filter | All notes already in memory; no extra API call needed at this scale |

---

## 10. What I'd Add With More Time

- **Authentication** (JWT + bcrypt) — each user has their own notes, stored with a `userId` field on the Note schema
- **MongoDB text index** — `noteSchema.index({ title: 'text', content: 'text' })` for server-side full-text search at scale
- **Tags/categories** — one schema field addition, zero migration needed (MongoDB's schema flexibility shines here)
- **Keyboard shortcuts** — Ctrl+N new note, Ctrl+S force save, Ctrl+F focus search
- **Drag-to-reorder** notes in the sidebar using the HTML5 drag API
- **Export to PDF** — `jsPDF` or a `/export/:id` endpoint that streams a PDF
- **Deployment** — Vite frontend on Vercel, Express backend on Render, MongoDB on Atlas (all free tiers)

---

## 11. How to Run Locally

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI

```bash
# Terminal 1 — Backend
cd notes-app/server
npm install
npm run dev          # nodemon watches for changes
# → API at http://localhost:5000

# Terminal 2 — Frontend
cd notes-vite
npm install
npm run dev          # Vite HMR
# → App at http://localhost:3000
```

### Environment Variables (`server/.env`)
```
MONGO_URI=mongodb://localhost:27017/notesapp
PORT=5000
```

Swap `MONGO_URI` for a **MongoDB Atlas connection string** for cloud hosting.

---

## 12. Interview Talking Points Cheat Sheet

> Use these when the interviewer asks open-ended questions.

- **"Walk me through your architecture"** → Use the diagram in Section 2. Client → Vite proxy → Express → Mongoose → MongoDB.
- **"Why Vite instead of Create React App?"** → CRA is deprecated, uses Webpack which is slow. Vite uses native ES modules — dev server starts in ~300ms, HMR is instant.
- **"Why MongoDB for this?"** → Notes are documents — title, content, timestamps. No relational joins needed. Schema-free means I can add tags, pinned, colour without migrations.
- **"How does autosave work?"** → Debounce pattern with `useRef`. Timer resets on every keystroke, fires the PUT request 800ms after the user stops. `useRef` avoids unnecessary re-renders.
- **"How does the Vite proxy work?"** → `vite.config.js` tells the Vite dev server to forward any `/api/*` request to `localhost:5000`. No CORS headers needed in development.
- **"Why CSS Modules?"** → Class names are scoped at build time. No accidental global overrides, no BEM naming gymnastics, no runtime overhead unlike CSS-in-JS.
- **"How does live search work?"** → Client-side filter on the in-memory `notes[]` array. Fast at this scale. For thousands of notes I'd use a MongoDB `$text` index and debounced server query.
- **"How do you handle errors?"** → Every Express route has `try/catch`. React shows a dismissable error banner. Mongoose validates at schema level before any DB write.
- **"How would you add auth?"** → JWT on the backend, `userId` field on Note schema. React stores the token in memory (not localStorage), sends it as `Authorization: Bearer <token>` header via an Axios interceptor.
- **"How would you scale this?"** → MongoDB indexes on `updatedAt` and a text index for search. Paginate the notes list. Stateless JWT so backend scales horizontally. CDN for the Vite build output.
- **"What would you test?"** → Mongoose model validation with Jest, Express routes with `supertest`, React components with React Testing Library. E2E with Playwright for the autosave flow.
