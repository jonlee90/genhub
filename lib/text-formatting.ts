/**
 * Text Formatting Utilities for Spatial Viewer
 * - Markdown parsing and sanitization
 * - @mention extraction and formatting
 */

import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * Parse markdown to HTML with sanitization
 */
export function parseMarkdown(markdown: string): string {
  console.log('[parseMarkdown] Parsing markdown')

  // Configure marked
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert \n to <br>
  })

  // Parse markdown to HTML
  const html = marked.parse(markdown) as string

  // Sanitize HTML to prevent XSS
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'ul',
      'ol',
      'li',
      'a',
      'code',
      'pre',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'class', 'data-mention', 'data-user-id'],
  })

  return sanitized
}

/**
 * Extract @mentions from text
 * Returns array of mentioned user IDs
 */
export function extractMentions(text: string): string[] {
  console.log('[extractMentions] Extracting mentions from text')

  const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g
  const mentions: string[] = []

  let match
  while ((match = mentionPattern.exec(text)) !== null) {
    mentions.push(match[2]) // User ID
  }

  console.log('[extractMentions] Found mentions:', mentions)
  return mentions
}

/**
 * Format @mentions in markdown text for display
 * Converts @[John Doe](user-id-123) to styled mention
 */
export function formatMentions(text: string): string {
  console.log('[formatMentions] Formatting mentions')

  return text.replace(
    /@\[([^\]]+)\]\(([^)]+)\)/g,
    '<span class="mention" data-user-id="$2">@$1</span>'
  )
}

/**
 * Convert plain text with @mentions to markdown
 * For use in the editor before saving
 */
export function plainTextToMarkdown(text: string, mentions: Array<{ name: string; id: string }>): string {
  console.log('[plainTextToMarkdown] Converting plain text to markdown')

  let result = text

  // Replace @mentions with markdown format
  mentions.forEach((mention) => {
    const pattern = new RegExp(`@${mention.name}`, 'g')
    result = result.replace(pattern, `@[${mention.name}](${mention.id})`)
  })

  return result
}

/**
 * Get preview text from markdown (strip formatting, limit length)
 */
export function getMarkdownPreview(markdown: string, maxLength = 100): string {
  // Strip markdown formatting
  let text = markdown
    .replace(/[#*_`~\[\]()]/g, '') // Remove markdown symbols
    .replace(/\n+/g, ' ') // Replace newlines with space
    .trim()

  // Truncate
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...'
  }

  return text
}
