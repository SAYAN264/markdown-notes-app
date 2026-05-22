import { useState } from 'react'
import styles from './Sidebar.module.css'

function timeAgo(date) {
  const diff = Date.now() - new Date(date)
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function Sidebar({ notes, selected, loading, onSelect, onCreate, onDelete }) {
  const [search, setSearch] = useState('')

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>◈</span>
          <span className={styles.logoText}>notes</span>
        </div>
        <button className={styles.newBtn} onClick={onCreate} title="New note (Ctrl+N)">
          <span>+</span>
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* Count */}
      <div className={styles.count}>
        {loading ? '...' : `${filtered.length} note${filtered.length !== 1 ? 's' : ''}`}
        {search && ` matching "${search}"`}
      </div>

      {/* List */}
      <div className={styles.list}>
        {loading && (
          <div className={styles.loadingList}>
            {[1,2,3].map(i => <div key={i} className={styles.skeleton} style={{ animationDelay: `${i*0.1}s` }} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>
            {search ? `no results for "${search}"` : 'no notes yet'}
          </div>
        )}

        {filtered.map(note => (
          <NoteItem
            key={note._id}
            note={note}
            active={selected?._id === note._id}
            onSelect={() => onSelect(note)}
            onDelete={() => onDelete(note._id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span>{notes.length} total · MongoDB</span>
      </div>
    </aside>
  )
}

function NoteItem({ note, active, onSelect, onDelete }) {
  const preview = note.content.replace(/[#*`>\-_\[\]]/g, '').slice(0, 72)

  return (
    <div className={`${styles.item} ${active ? styles.active : ''}`} onClick={onSelect}>
      <div className={styles.itemInner}>
        <div className={styles.itemTop}>
          <p className={styles.itemTitle}>{note.title || 'Untitled'}</p>
          <span className={styles.itemTime}>{timeAgo(note.updatedAt)}</span>
        </div>
        {preview && (
          <p className={styles.itemPreview}>{preview}{preview.length === 72 ? '…' : ''}</p>
        )}
      </div>
      <button
        className={styles.deleteBtn}
        onClick={e => { e.stopPropagation(); onDelete() }}
        title="Delete note"
      >
        ✕
      </button>
    </div>
  )
}
