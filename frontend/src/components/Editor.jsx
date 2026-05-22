import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import styles from './Editor.module.css'

export default function Editor({ note, onSave, saving }) {
  const [title, setTitle]     = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [mode, setMode]       = useState('edit') // 'edit' | 'preview' | 'split'
  const timer                 = useRef(null)
  const textareaRef           = useRef(null)

  // Sync on note switch
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
  }, [note._id]) // eslint-disable-line

  const scheduleAutosave = (t, c) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onSave(note._id, { title: t, content: c }), 800)
  }

  const handleTitle = e => {
    setTitle(e.target.value)
    scheduleAutosave(e.target.value, content)
  }

  const handleContent = e => {
    setContent(e.target.value)
    scheduleAutosave(title, e.target.value)
  }

  // Tab support in textarea
  const handleKeyDown = e => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const { selectionStart, selectionEnd } = e.target
      const newContent = content.substring(0, selectionStart) + '  ' + content.substring(selectionEnd)
      setContent(newContent)
      scheduleAutosave(title, newContent)
      requestAnimationFrame(() => {
        textareaRef.current.selectionStart = selectionStart + 2
        textareaRef.current.selectionEnd   = selectionStart + 2
      })
    }
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const charCount = content.length
  const lineCount = content.split('\n').length

  return (
    <div className={styles.editor}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          className={styles.titleInput}
          value={title}
          onChange={handleTitle}
          placeholder="untitled"
        />

        <div className={styles.toolbarRight}>
          <div className={`${styles.saveStatus} ${saving ? styles.saving : ''}`}>
            {saving
              ? <><span className={styles.dot} />saving</>
              : <><span className={styles.dotSaved} />saved</>
            }
          </div>

          <div className={styles.modeToggle}>
            {['edit', 'split', 'preview'].map(m => (
              <button
                key={m}
                className={`${styles.modeBtn} ${mode === m ? styles.modeActive : ''}`}
                onClick={() => setMode(m)}
                title={m}
              >
                {m === 'edit' ? '✎' : m === 'split' ? '⊟' : '◉'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={`${styles.body} ${mode === 'split' ? styles.split : ''}`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className={`${styles.pane} ${styles.editPane}`}>
            {mode === 'split' && <div className={styles.paneLabel}>markdown</div>}
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={content}
              onChange={handleContent}
              onKeyDown={handleKeyDown}
              placeholder={'# Start writing...\n\nMarkdown supported — **bold**, _italic_, `code`, > quotes'}
              spellCheck
            />
          </div>
        )}

        {mode === 'split' && <div className={styles.divider} />}

        {(mode === 'preview' || mode === 'split') && (
          <div className={`${styles.pane} ${styles.previewPane}`}>
            {mode === 'split' && <div className={styles.paneLabel}>preview</div>}
            <div className={styles.preview}>
              {content
                ? <ReactMarkdown>{content}</ReactMarkdown>
                : <p className={styles.previewEmpty}>nothing to preview yet</p>
              }
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <span>{wordCount} words</span>
        <span className={styles.dot2} />
        <span>{charCount} chars</span>
        <span className={styles.dot2} />
        <span>{lineCount} lines</span>
        <span className={styles.statusRight}>
          {new Date(note.updatedAt).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  )
}
