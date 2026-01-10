# Skill: Vercel AI SDK Integration

> AI SDK v5 patterns for GenHub

## When to Use

- Text generation (summaries, descriptions)
- Streaming responses
- Structured data extraction
- AI-powered features

## Prerequisites

- Vercel AI SDK v5 installed
- API keys configured (ANTHROPIC_API_KEY, OPENAI_API_KEY)
- Server-side only (no AI calls in client components)

---

## Quick Reference

### Installation
```bash
npm install ai @ai-sdk/anthropic @ai-sdk/openai
```

### Basic Generation
```typescript
// app/actions/ai.ts
'use server'

import { generateText, generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

export async function summarizeText(content: string) {
  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    prompt: `Summarize the following in 2-3 sentences:\n\n${content}`,
  })

  return { summary: text }
}
```

### Structured Output
```typescript
export async function extractProjectInfo(description: string) {
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: z.object({
      projectName: z.string(),
      estimatedBudget: z.number().optional(),
      keyMilestones: z.array(z.string()),
      risks: z.array(z.string()),
    }),
    prompt: `Extract project information from:\n\n${description}`,
  })

  return object
}
```

---

## Streaming Patterns

### Server Action with Stream
```typescript
// app/actions/ai.ts
'use server'

import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createStreamableValue } from 'ai/rsc'

export async function streamSummary(content: string) {
  const stream = createStreamableValue('')

  ;(async () => {
    const { textStream } = await streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `Summarize this project report:\n\n${content}`,
    })

    for await (const delta of textStream) {
      stream.update(delta)
    }

    stream.done()
  })()

  return { output: stream.value }
}
```

### Client Component for Stream
```tsx
'use client'

import { useEffect, useState } from 'react'
import { readStreamableValue } from 'ai/rsc'
import { streamSummary } from '@/app/actions/ai'

export function AISummary({ content }: { content: string }) {
  const [summary, setSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const generate = async () => {
    setIsLoading(true)
    setSummary('')

    const { output } = await streamSummary(content)

    for await (const delta of readStreamableValue(output)) {
      setSummary(prev => prev + delta)
    }

    setIsLoading(false)
  }

  return (
    <div>
      <button onClick={generate} disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Summary'}
      </button>
      {summary && <p className="mt-4">{summary}</p>}
    </div>
  )
}
```

---

## GenHub AI Features

### Daily Report Summary
```typescript
export async function generateDailyReportSummary(report: {
  weather: string
  crewSize: number
  workCompleted: string[]
  issues: string[]
  safetyNotes: string[]
}) {
  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `You are a construction project assistant. Generate concise daily report summaries for clients and stakeholders.`,
    prompt: `Generate a professional daily report summary:

Weather: ${report.weather}
Crew Size: ${report.crewSize}
Work Completed: ${report.workCompleted.join(', ')}
Issues: ${report.issues.join(', ') || 'None'}
Safety Notes: ${report.safetyNotes.join(', ') || 'None'}

Write a 3-4 sentence summary suitable for client communication.`,
  })

  return { summary: text }
}
```

### Bid Analysis
```typescript
const BidAnalysisSchema = z.object({
  recommendation: z.enum(['accept', 'negotiate', 'reject']),
  priceAssessment: z.string(),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  suggestedQuestions: z.array(z.string()),
})

export async function analyzeBid(bid: {
  scope: string
  amount: number
  timeline: string
  subcontractorInfo: string
  marketRate: number
}) {
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: BidAnalysisSchema,
    prompt: `Analyze this construction bid:

Scope: ${bid.scope}
Bid Amount: $${bid.amount}
Market Rate: $${bid.marketRate}
Timeline: ${bid.timeline}
Subcontractor: ${bid.subcontractorInfo}

Provide analysis with recommendation.`,
  })

  return object
}
```

### Task Description Generation
```typescript
export async function generateTaskDescription(context: {
  projectName: string
  phaseName: string
  taskTitle: string
  relatedMaterials?: string[]
}) {
  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    prompt: `Generate a clear, actionable task description for a construction project:

Project: ${context.projectName}
Phase: ${context.phaseName}
Task: ${context.taskTitle}
Materials: ${context.relatedMaterials?.join(', ') || 'Not specified'}

Write 2-3 sentences describing what needs to be done, any safety considerations, and expected outcome.`,
  })

  return { description: text }
}
```

---

## API Routes for Streaming

### Streaming API Route
```typescript
// app/api/ai/stream/route.ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const result = await streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    prompt,
  })

  return result.toDataStreamResponse()
}
```

### Client with useChat
```tsx
'use client'

import { useChat } from 'ai/react'

export function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
  })

  return (
    <div>
      {messages.map(m => (
        <div key={m.id} className={m.role === 'user' ? 'text-right' : ''}>
          {m.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  )
}
```

---

## Model Selection

### Recommended Models
```typescript
// Fast responses, good for simple tasks
anthropic('claude-haiku-3-5-20240307')

// Balanced, good for most tasks
anthropic('claude-sonnet-4-20250514')

// Best quality, complex reasoning
anthropic('claude-opus-4-20250514')

// OpenAI alternatives
openai('gpt-4o')
openai('gpt-4o-mini')
```

### Model by Use Case
| Use Case | Recommended Model |
|----------|-------------------|
| Summaries | claude-haiku-3-5-20240307 |
| Analysis | claude-sonnet-4-20250514 |
| Complex reasoning | claude-opus-4-20250514 |
| Structured extraction | claude-sonnet-4-20250514 |
| Real-time chat | claude-haiku-3-5-20240307 |

---

## Error Handling

```typescript
export async function safeGenerate(prompt: string) {
  try {
    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt,
      maxTokens: 1000,
    })
    return { data: text }
  } catch (error) {
    if (error instanceof Error) {
      console.error('[AI Generation Error]', error.message)

      // Rate limit
      if (error.message.includes('rate_limit')) {
        return { error: 'Too many requests. Please try again later.' }
      }

      // Token limit
      if (error.message.includes('max_tokens')) {
        return { error: 'Content too long. Please shorten your input.' }
      }
    }
    return { error: 'Failed to generate. Please try again.' }
  }
}
```

---

## Anti-Patterns

```typescript
// WRONG: AI in client component
'use client'
import { generateText } from 'ai'  // Will expose API key!

// CORRECT: Server Action
'use server'
import { generateText } from 'ai'

// WRONG: No error handling
const { text } = await generateText(...)  // May throw!

// CORRECT: Handle errors
try {
  const { text } = await generateText(...)
} catch (error) {
  return { error: 'Generation failed' }
}

// WRONG: Hardcoded prompts without context
prompt: 'Summarize this'

// CORRECT: Contextual prompts
prompt: `As a construction project assistant, summarize this daily report for the project manager: ${content}`
```

---

## Checklist

- [ ] Server Action or API route (not client)
- [ ] Appropriate model for task
- [ ] Error handling implemented
- [ ] Loading state in UI
- [ ] Context provided in prompts
- [ ] Token limits considered
- [ ] Rate limiting handled
