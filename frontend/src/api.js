import axios from 'axios'

const API = axios.create({
	baseURL: `${import.meta.env.VITE_API_URL}/api`,
	headers: {
		'x-api-key': import.meta.env.VITE_API_KEY
	}
})

export const getNotes   = ()         => API.get('/notes')
export const createNote = (data)     => API.post('/notes', data)
export const updateNote = (id, data) => API.put(`/notes/${id}`, data)
export const deleteNote = (id)       => API.delete(`/notes/${id}`)
