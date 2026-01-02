/**
 * NotesList Component - P3.7
 * - Rich text editor with @mentions
 * - Threaded notes (1 level deep)
 * - Edit/delete functionality
 */

'use client'

import { useState } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NoteEditor } from './NoteEditor'
import { NoteItem } from './NoteItem'
import { useMarkerMutations } from '@/hooks/use-marker-mutations'
import type { MarkerContent } from '@/types/spatial'

export interface NotesListProps {
  markerId: number
  notes: MarkerContent[]
  currentUserId: string
}

/**
 * NotesList - Threaded notes/comments view
 */
export function NotesList({ markerId, notes, currentUserId }: NotesListProps) {
  console.log('[NotesList] Rendering', { markerId, noteCount: notes.length })

  const [showEditor, setShowEditor] = useState(false)
  const [replyToNoteId, setReplyToNoteId] = useState<number | null>(null)
  const { createNote, updateContent, deleteContent } = useMarkerMutations()

  // Separate top-level notes and replies
  const topLevelNotes = notes.filter((note) => !note.parent_content_id)
  const noteReplies = notes.reduce((acc, note) => {
    if (note.parent_content_id) {
      if (!acc[note.parent_content_id]) {
        acc[note.parent_content_id] = []
      }
      acc[note.parent_content_id].push(note)
    }
    return acc
  }, {} as Record<number, MarkerContent[]>)

  // Handle create note
  const handleCreateNote = async (content: string, mentions: string[]) => {
    console.log('[NotesList] Creating note', { markerId, mentions })

    await createNote({
      marker_id: markerId,
      type: 'note',
      content,
      metadata: { mentions },
      parent_content_id: replyToNoteId || undefined,
    })

    setShowEditor(false)
    setReplyToNoteId(null)
  }

  // Handle edit note
  const handleEditNote = async (noteId: number, content: string) => {
    console.log('[NotesList] Editing note', { noteId })
    await updateContent(noteId, { content })
  }

  // Handle delete note
  const handleDeleteNote = async (noteId: number) => {
    console.log('[NotesList] Deleting note', { noteId })
    await deleteContent(noteId)
  }

  // Handle reply
  const handleReply = (parentNoteId: number) => {
    console.log('[NotesList] Replying to note', { parentNoteId })
    setReplyToNoteId(parentNoteId)
    setShowEditor(true)
  }

  if (topLevelNotes.length === 0 && !showEditor) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="font-bold text-[#001B51] mb-2 uppercase tracking-tight">No Notes Yet</h3>
        <p className="text-sm text-gray-600 mb-4">Add notes and comments to discuss this marker.</p>
        <button
          onClick={() => setShowEditor(true)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-[#001B51] text-white font-bold',
            'hover:bg-[#002B71] transition-colors'
          )}
        >
          <Plus className="w-4 h-4" />
          ADD NOTE
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add note button */}
      {!showEditor && (
        <button
          onClick={() => setShowEditor(true)}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
            'bg-[#001B51] text-white font-bold',
            'hover:bg-[#002B71] transition-colors'
          )}
        >
          <Plus className="w-4 h-4" />
          ADD NOTE
        </button>
      )}

      {/* Note editor */}
      {showEditor && (
        <div>
          {replyToNoteId && (
            <p className="text-sm text-gray-600 mb-2">
              Replying to note...
            </p>
          )}
          <NoteEditor
            markerId={markerId}
            parentNoteId={replyToNoteId || undefined}
            onSave={handleCreateNote}
            onCancel={() => {
              setShowEditor(false)
              setReplyToNoteId(null)
            }}
            placeholder={replyToNoteId ? 'Write a reply...' : 'Write a note...'}
          />
        </div>
      )}

      {/* Notes list */}
      {topLevelNotes.length > 0 && (
        <div className="space-y-3">
          {topLevelNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              currentUserId={currentUserId}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onReply={handleReply}
              replies={noteReplies[note.id] || []}
            />
          ))}
        </div>
      )}
    </div>
  )
}
