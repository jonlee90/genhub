# Command: /kc:research-ai-sdk

> Research Vercel AI SDK v5 patterns and implementation

## Usage

```
/kc:research-ai-sdk [feature-type]
```

## Description

Launches the vercel-ai-sdk-v5-expert agent to research AI SDK patterns, implementation approaches, and best practices.

## Use Cases

- Planning AI-powered features
- Text generation patterns
- Streaming implementation
- Structured output with Zod
- Tool calling patterns

## Workflow

1. **Define AI Need**
   - What AI capability is needed?
   - Input/output requirements?

2. **Research AI SDK v5**
   - Find matching patterns
   - Review official documentation
   - Check examples

3. **Plan Implementation**
   - Recommend approach
   - Document API usage
   - Note server-only requirements

## Output

Returns research findings with:
- Recommended AI SDK functions
- Code examples
- Server Action patterns
- Client integration approach

## Example

```
User: /kc:research-ai-sdk receipt-ocr

Output:
## AI Research: Receipt OCR

### Recommended Approach
Use generateObject with vision capabilities for structured extraction.

### AI SDK Pattern
```typescript
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

const ReceiptSchema = z.object({
  vendor: z.string(),
  total: z.number(),
  date: z.string(),
  items: z.array(z.object({
    name: z.string(),
    price: z.number(),
  })),
})

const { object } = await generateObject({
  model: anthropic('claude-sonnet-4-20250514'),
  schema: ReceiptSchema,
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Extract receipt data:' },
      { type: 'image', image: imageBuffer },
    ],
  }],
})
```

### Implementation Notes
- Use Server Action (never client-side)
- Handle API errors gracefully
- Consider rate limiting for batch uploads
```

## See Also

- `skills/integration/vercel-ai-sdk.md` - AI SDK patterns
- `agents/vercel-ai-sdk-v5-expert.md` - AI SDK expert agent
- `docs/core/STACK.md` - Tech stack overview
