# 📝 Markdown Notes App

A full-stack notes app built with **React**, **Node/Express**, and **MongoDB**.
**Live Link** - https://notesmarkdownapp.netlify.app/

## Tech Stack
- **Frontend**: React 18, react-markdown, axios
- **Backend**: Node.js, Express
- **Database**: MongoDB via Mongoose

## Features
- Create, edit, delete notes
- Live Markdown preview (toggle Edit / Preview)
- Auto-save (800ms debounce)
- Responsive dark UI

---

## 🚀 Setup & Run

### Prerequisites
- Node.js (v16+)
- MongoDB running locally on port 27017 (or update `.env`)

### 1. Start the backend
```bash
cd server
npm install
npm run dev       # or: npm start
# → http://localhost:5000
```

### 2. Start the frontend
```bash
cd client
npm install
npm start
# → http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint         | Description      |
|--------|-----------------|------------------|
| GET    | /api/notes      | Get all notes    |
| GET    | /api/notes/:id  | Get single note  |
| POST   | /api/notes      | Create note      |
| PUT    | /api/notes/:id  | Update note      |
| DELETE | /api/notes/:id  | Delete note      |

---

## Environment Variables (server/.env)

```
MONGO_URI=mongodb://localhost:27017/notesapp
PORT=5000
```

Use a MongoDB Atlas URI for cloud deployment.
