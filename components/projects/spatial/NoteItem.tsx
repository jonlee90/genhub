/**
 * NoteItem Component - P3.7
 * - Display note with markdown rendering
 * - Edit/delete buttons (creator only)
 * - Threaded replies (1 level deep)
 */

'use client'

import { useState } from 'react'
import { m as motion, AnimatePresence } from 'framer-motion'
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import MessageSquare from 'lucide-react/icons/message-square';
import Edit from 'lucide-react/icons/edit';
import Trash2 from 'lucide-react/icons/trash2';
import MoreVertical from 'lucide-react/icons/more-vertical';
import { cn } from '@/lib/utils'
import { parseMarkdown } from '@/lib/text-formatting'
import { format } from 'date-fns'
import type { MarkerContent } from '@/types/db/spatial'

interface NoteItemProps {
  note: MarkerContent
  currentUserId: string
  onEdit?: (noteId: string, content: string) => Promise<void>
  onDelete?: (noteId: string) => Promise<void>
  onReply?: (parentNoteId: string) => void
  replies?: MarkerContent[]
  level?: number // 0 = top-level, 1 = reply
}

export function NoteItem({
  note,
  currentUserId,
  onEdit,
  onDelete,
  onReply,
  replies = [],
  level = 0,
}: NoteItemProps) {
  console.log('[NoteItem] Rendering', { noteId: note.id, level })

  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(note.note_text || '')

  const isCreator = note.created_by === currentUserId
  const canReply = level === 0 // Only allow replies to top-level notes

  const handleEdit = async () => {
    if (!onEdit || !editContent.trim()) return

    console.log('[NoteItem] Editing note:', note.id)
    await onEdit(note.id, editContent)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!onDelete) return

    if (!confirm('Delete this note?')) return

    console.log('[NoteItem] Deleting note:', note.id)
    await onDelete(note.id)
  }

  // Render markdown content
  const renderedContent = parseMarkdown(note.note_text || '')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn('group', level === 1 && 'ml-12 mt-2')}
    >
      <div
        className={cn(
          'flex gap-3 p-3 rounded-lg',
          level === 0 && 'border-2 border-gray-200',
          level === 1 && 'border-l-2 border-gray-300 bg-gray-50'
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-construction-blue flex items-center justify-center text-xs text-white font-bold">
            {note.created_by?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-sm font-bold text-gray-900">
                {note.created_by || 'Unknown User'}
              </p>
              <p className="text-xs text-gray-500">
                {note.created_at && format(new Date(note.created_at), 'MMM d, yyyy · h:mm a')}
                {note.updated_at && note.updated_at !== note.created_at && ' (edited)'}
              </p>
            </div>

            {/* Menu */}
            {isCreator && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 z-20 mt-1 w-32 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setEditing(true)
                          setShowMenu(false)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDelete()
                          setShowMenu(false)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Note content */}
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-construction-blue focus:outline-none resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className={cn(
                    'px-3 py-1 rounded-lg text-sm font-bold',
                    'bg-construction-blue text-white',
                    'hover:bg-[#002B71] transition-colors'
                  )}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setEditContent(note.note_text || '')
                  }}
                  className={cn(
                    'px-3 py-1 rounded-lg text-sm font-medium',
                    'border border-gray-300 text-gray-700',
                    'hover:bg-gray-50 transition-colors'
                  )}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className="text-sm text-gray-900 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
              />

              {/* Reply button */}
              {canReply && onReply && (
                <button
                  onClick={() => onReply(note.id)}
                  className={cn(
                    'flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg text-xs font-medium',
                    'text-gray-600 hover:text-construction-blue hover:bg-gray-100 transition-colors',
                    'opacity-0 group-hover:opacity-100'
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Reply
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="space-y-2">
          {replies.map((reply) => (
            <NoteItem
              key={reply.id}
              note={reply}
              currentUserId={currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
              level={1}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
