/**
 * NoteEditor Component - P3.7
 * - Rich text editor with bold, italic, lists
 * - @mention autocomplete
 * - Save as markdown
 */

'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Bold from 'lucide-react/icons/bold';
import Italic from 'lucide-react/icons/italic';
import List from 'lucide-react/icons/list';
import ListOrdered from 'lucide-react/icons/list-ordered';
import Send from 'lucide-react/icons/send';
import AtSign from 'lucide-react/icons/at-sign';
import { cn } from '@/lib/utils'
import { extractMentions } from '@/lib/text-formatting'

interface NoteEditorProps {
  markerId: string
  parentNoteId?: string // For threaded replies
  onSave: (content: string, mentions: string[]) => Promise<void>
  onCancel?: () => void
  placeholder?: string
  initialContent?: string
}

interface MentionSuggestion {
  id: string
  name: string
  avatar?: string
}

export function NoteEditor({
  markerId,
  parentNoteId,
  onSave,
  onCancel,
  placeholder = 'Write a note...',
  initialContent = '',
}: NoteEditorProps) {
  console.log('[NoteEditor] Rendering', { markerId, parentNoteId })

  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Mock mention suggestions (in production, fetch from API)
  const allUsers: MentionSuggestion[] = [
    { id: 'user-1', name: 'John Doe' },
    { id: 'user-2', name: 'Jane Smith' },
    { id: 'user-3', name: 'Bob Johnson' },
  ];

  // Performance optimization: Memoize filtered mention suggestions
  const mentionSuggestions = useMemo(() =>
    allUsers.filter((user) => user.name.toLowerCase().includes(mentionSearch.toLowerCase()))
  , [mentionSearch, allUsers]);

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)

    // Check for @ mention trigger
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = newContent.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1 && lastAtIndex === cursorPos - 1) {
      // Just typed @
      setShowMentions(true)
      setMentionSearch('')
      setSelectedMentionIndex(0)
    } else if (lastAtIndex !== -1 && cursorPos > lastAtIndex) {
      // Typing after @
      const search = textBeforeCursor.substring(lastAtIndex + 1)
      if (search.includes(' ')) {
        setShowMentions(false)
      } else {
        setMentionSearch(search)
      }
    } else {
      setShowMentions(false)
    }
  }

  // Performance optimization: Memoize insert mention callback
  const insertMention = useCallback((mention: MentionSuggestion) => {
    console.log('[NoteEditor] Inserting mention:', mention.name)

    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.substring(0, cursorPos)
    const textAfterCursor = content.substring(cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    const newContent =
      textBeforeCursor.substring(0, lastAtIndex) +
      `@[${mention.name}](${mention.id}) ` +
      textAfterCursor

    setContent(newContent)
    setShowMentions(false)

    // Focus textarea
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = lastAtIndex + mention.name.length + 5
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [content]);

  // Handle keyboard navigation in mention dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedMentionIndex((prev) => Math.min(prev + 1, mentionSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedMentionIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (mentionSuggestions[selectedMentionIndex]) {
        insertMention(mentionSuggestions[selectedMentionIndex])
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false)
    }
  }

  // Performance optimization: Memoize save callback
  const handleSave = useCallback(async () => {
    if (!content.trim()) return

    console.log('[NoteEditor] Saving note')
    setSaving(true)

    try {
      const mentions = extractMentions(content)
      await onSave(content, mentions)

      // Reset
      setContent('')
    } catch (error) {
      console.error('[NoteEditor] Save error:', error)
    } finally {
      setSaving(false)
    }
  }, [content, onSave]);

  // Format text (bold, italic, etc.)
  const formatText = (format: 'bold' | 'italic' | 'ul' | 'ol') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    let formattedText = ''

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`
        break
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`
        break
      case 'ul':
        formattedText = `\n- ${selectedText || 'list item'}\n`
        break
      case 'ol':
        formattedText = `\n1. ${selectedText || 'list item'}\n`
        break
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end)
    setContent(newContent)

    // Focus and set cursor
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + formattedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  return (
    <div className="relative border-2 border-gray-200 rounded-lg bg-white focus-within:border-[#001B51] transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4 text-gray-600" />
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4 text-gray-600" />
        </button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <button
          type="button"
          onClick={() => formatText('ul')}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4 text-gray-600" />
        </button>
        <button
          type="button"
          onClick={() => formatText('ol')}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <AtSign className="w-3 h-3" />
          mention
        </span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={4}
        className="w-full p-3 resize-none focus:outline-none"
      />

      {/* Mention autocomplete dropdown */}
      {showMentions && mentionSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 mt-1 w-64 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          {mentionSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => insertMention(suggestion)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-left',
                'hover:bg-gray-50 transition-colors',
                index === selectedMentionIndex && 'bg-blue-50'
              )}
            >
              <div className="w-6 h-6 rounded-full bg-[#001B51] flex items-center justify-center text-xs text-white font-bold">
                {suggestion.name[0]}
              </div>
              <span className="text-sm text-gray-900">{suggestion.name}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between p-2 border-t border-gray-200">
        <p className="text-xs text-gray-400">Markdown supported</p>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium',
                'border border-gray-300 text-gray-700',
                'hover:bg-gray-50 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold',
              'bg-[#001B51] text-white',
              'hover:bg-[#002B71] transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {saving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Send className="w-3.5 h-3.5" />
                </motion.div>
                SAVING...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                {parentNoteId ? 'REPLY' : 'POST NOTE'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
