# Skill: API Routes

> Next.js API route patterns for GenHub

## When to Use

- Webhooks (Stripe, external services)
- Third-party integrations
- Public API endpoints
- Server-side only operations not suitable for Server Actions

## Prerequisites

- Prefer Server Actions for client-initiated mutations
- API routes for: webhooks, external APIs, cron jobs, streaming

---

## Quick Reference

### Basic API Route
```typescript
// app/api/{route}/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello' })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json({ received: body })
}
```

### With Auth Check
```typescript
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Authenticated logic here
  return NextResponse.json({ user: session.user })
}
```

### With Supabase
```typescript
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('projects').select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
```

---

## Route Types

### 1. Webhook Handler
```typescript
// app/api/webhook/stripe/route.ts
import { createAdminClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()  // Admin for webhooks

  switch (event.type) {
    case 'checkout.session.completed':
      // Handle payment success
      break
    case 'customer.subscription.deleted':
      // Handle subscription cancelled
      break
  }

  return NextResponse.json({ received: true })
}
```

### 2. Dynamic Route
```typescript
// app/api/projects/[id]/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ data })
}
```

### 3. Cron Job Endpoint
```typescript
// app/api/cron/daily-report/route.ts
import { createAdminClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Daily report logic
  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .eq('status', 'active')

  // Generate and send reports...

  return NextResponse.json({ processed: projects?.length ?? 0 })
}
```

### 4. File Download
```typescript
// app/api/export/[type]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  // Generate CSV/PDF based on type
  const csv = 'id,name\n1,Project A\n2,Project B'

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${params.type}-export.csv"`,
    },
  })
}
```

### 5. Streaming Response
```typescript
// app/api/ai/stream/route.ts
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { prompt } = await request.json()

  const stream = new ReadableStream({
    async start(controller) {
      // Stream chunks
      for (const chunk of ['Hello', ' ', 'World']) {
        controller.enqueue(new TextEncoder().encode(chunk))
        await new Promise(r => setTimeout(r, 100))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
```

### 6. Non-Blocking Post-Response Operations (Vercel)

Use Vercel's `after()` for operations that don't need to block the response:

```typescript
// app/api/events/route.ts
import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Critical: Save event to database
  await saveEvent(body)

  // Return response immediately
  const response = NextResponse.json({ success: true })

  // Non-blocking: Send analytics, notifications, etc.
  after(async () => {
    await sendAnalytics(body)
    await notifyWebhooks(body)
    await updateCache()
  })

  return response
}
```

**When to use `after()`:**
- Analytics tracking
- Webhook notifications
- Cache warming
- Non-critical logging
- Background cleanup

---

## HTTP Methods

```typescript
// All methods in single file
export async function GET(request: NextRequest) { /* Read */ }
export async function POST(request: NextRequest) { /* Create */ }
export async function PUT(request: NextRequest) { /* Update (full) */ }
export async function PATCH(request: NextRequest) { /* Update (partial) */ }
export async function DELETE(request: NextRequest) { /* Delete */ }
```

---

## Request Handling

### Query Parameters
```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get('page') || '1'
  const limit = searchParams.get('limit') || '10'
  const filter = searchParams.get('filter')

  // Use params...
}
```

### Request Body
```typescript
export async function POST(request: NextRequest) {
  // JSON body
  const body = await request.json()

  // Form data
  const formData = await request.formData()
  const file = formData.get('file') as File

  // Raw text
  const text = await request.text()
}
```

### Headers
```typescript
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const contentType = request.headers.get('content-type')
}
```

---

## Response Patterns

### Success Responses
```typescript
// JSON
return NextResponse.json({ data: result })
return NextResponse.json({ data: result }, { status: 201 })

// Empty success
return new NextResponse(null, { status: 204 })

// Redirect
return NextResponse.redirect(new URL('/success', request.url))
```

### Error Responses
```typescript
return NextResponse.json({ error: 'Not found' }, { status: 404 })
return NextResponse.json({ error: 'Bad request', details: errors }, { status: 400 })
return NextResponse.json({ error: 'Internal error' }, { status: 500 })
```

---

## Anti-Patterns

```typescript
// WRONG: Using API route for simple mutations
// app/api/tasks/create/route.ts
export async function POST(request: NextRequest) {
  // Just use a Server Action instead!
}

// WRONG: No error handling
export async function GET(request: NextRequest) {
  const { data } = await supabase.from('tasks').select()  // Error ignored!
  return NextResponse.json(data)
}

// WRONG: Exposing sensitive data
return NextResponse.json({ user, password: user.password })

// WRONG: No auth check on protected route
export async function DELETE(request: NextRequest) {
  // Anyone can delete!
}
```

---

## File Structure

```
app/api/
├── auth/
│   └── [...nextauth]/route.ts    # NextAuth handler
├── webhook/
│   ├── stripe/route.ts           # Stripe webhooks
│   └── supabase/route.ts         # Supabase webhooks
├── cron/
│   └── daily-report/route.ts     # Scheduled jobs
├── export/
│   └── [type]/route.ts           # File exports
└── projects/
    ├── route.ts                  # /api/projects
    └── [id]/route.ts             # /api/projects/:id
```

---

## Affected Documentation

After creating API route:
- Update `docs/indexes/routes.md` (API section)
- Add to relevant domain documentation

---

## Checklist

- [ ] Auth check if protected endpoint
- [ ] Error handling with appropriate status codes
- [ ] Input validation
- [ ] Admin client for webhooks/cron
- [ ] CORS headers if needed
- [ ] Rate limiting considered
- [ ] Logging for debugging
