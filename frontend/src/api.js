import axios from 'axios'

const API = axios.create({ baseURL: 'https://markdown-notes-app-production-85db.up.railway.app/api' })

export const getNotes   = ()         => API.get('/notes')
export const createNote = (data)     => API.post('/notes', data)
export const updateNote = (id, data) => API.put(`/notes/${id}`, data)
export const deleteNote = (id)       => API.delete(`/notes/${id}`)
