import { useState, useEffect, useCallback } from 'react'
import { getNotes, createNote, updateNote, deleteNote } from './api'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import styles from './App.module.css'

export default function App() {
  const [notes, setNotes]       = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)

  const fetchNotes = useCallback(async () => {
    try {
      const { data } = await getNotes()
      setNotes(data)
      if (data.length) setSelected(prev => prev ?? data[0])
    } catch {
      setError('Could not connect to server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const handleCreate = async () => {
    try {
      const { data } = await createNote({ title: 'Untitled', content: '' })
      setNotes(prev => [data, ...prev])
      setSelected(data)
    } catch {
      setError('Failed to create note.')
    }
  }

  const handleSave = async (id, payload) => {
    setSaving(true)
    try {
      const { data } = await updateNote(id, payload)
      setNotes(prev => prev.map(n => n._id === id ? data : n))
      setSelected(data)
    } catch {
      setError('Failed to save note.')
    } finally {
      setTimeout(() => setSaving(false), 800)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteNote(id)
      const remaining = notes.filter(n => n._id !== id)
      setNotes(remaining)
      setSelected(selected?._id === id ? (remaining[0] ?? null) : selected)
    } catch {
      setError('Failed to delete note.')
    }
  }

  return (
    <div className={styles.app}>
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      <Sidebar
        notes={notes}
        selected={selected}
        loading={loading}
        onSelect={setSelected}
        onCreate={handleCreate}
        onDelete={handleDelete}
      />
      <div className={styles.main}>
        {selected
          ? <Editor note={selected} onSave={handleSave} saving={saving} />
          : <Empty onCreate={handleCreate} loading={loading} />
        }
      </div>
    </div>
  )
}

function Empty({ onCreate, loading }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '20px',
      color: 'var(--muted)', padding: '40px'
    }}>
      {loading
        ? <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em' }}>
            loading notes...
          </p>
        : <>
            <div style={{ fontSize: '48px', opacity: 0.3 }}>◈</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 300, color: 'var(--parchment-2)' }}>
              No note selected
            </p>
            <p style={{ fontSize: '12px', letterSpacing: '0.08em', color: 'var(--muted)' }}>
              select a note or create a new one
            </p>
            <button onClick={onCreate} style={{
              marginTop: '8px', background: 'var(--amber)', color: 'var(--ink)',
              padding: '10px 24px', borderRadius: 'var(--r)', fontSize: '13px',
              fontFamily: 'var(--font-mono)', fontWeight: 500, letterSpacing: '0.06em',
              transition: 'all 0.2s'
            }}
              onMouseEnter={e => e.target.style.background = 'var(--amber-2)'}
              onMouseLeave={e => e.target.style.background = 'var(--amber)'}
            >
              + new note
            </button>
          </>
      }
    </div>
  )
}
