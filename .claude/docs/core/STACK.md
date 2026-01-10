# GenHub - Technology Stack

> Technology versions and project structure reference.

---

## Technology Stack

### Core
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.9 | App Router, Server Components |
| React | 19.0.0 | UI framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4.1 | Styling |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | - | PostgreSQL + RLS + Realtime |
| NextAuth | 5.0.0-beta.30 | Authentication |
| @auth/supabase-adapter | 1.7.4 | Auth storage |

### UI
| Technology | Purpose |
|------------|---------|
| Aceternity UI | Modern animated components |
| Radix UI | Accessible primitives |
| Lucide React | Icons (ONLY icon library) |
| Framer Motion | Animations |

### Services
| Service | Purpose |
|---------|---------|
| Stripe | Payments (feature-flagged) |
| Nodemailer/Resend | Email |
| Vercel Blob | File storage |
| Zod | Validation |
| SerpAPI | Home Depot search |
| FCM | Push notifications |

---

## Project Structure

```
app/
├── app/                    # Protected routes
│   ├── layout.tsx          # App shell (Sidebar, Header)
│   ├── page.tsx            # Dashboard
│   ├── projects/           # Project management
│   ├── tasks/              # Kanban/List/Gantt
│   ├── materials/          # Materials + Home Depot
│   ├── expenses/           # Expense tracking
│   ├── team/               # Team management
│   ├── chat/               # Real-time messaging
│   ├── client/             # Client portal
│   └── settings/
│
├── actions/                # Server Actions (by feature)
│   ├── projects.ts
│   ├── tasks.ts
│   ├── materials.ts
│   ├── expenses.ts
│   ├── chat.ts
│   ├── spatial.ts
│   └── ...
│
├── api/                    # API routes
│   ├── auth/[...nextauth]/ # NextAuth handlers
│   └── webhook/            # External webhooks
│
├── layout.tsx              # Root layout
└── page.tsx                # Public landing

components/
├── app/                    # App shell (Sidebar, Header)
├── projects/               # Project components
├── tasks/                  # Task board, Kanban
├── materials/              # Material search/cards
├── expenses/               # Expense forms/tables
├── chat/                   # Chat UI
├── team/                   # Team management
├── ui/                     # Base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── BaseModal.tsx       # Use instead of Dialog
│   └── aceternity/         # Aceternity UI
└── user/

lib/
├── auth.ts                 # NextAuth config
├── hooks/                  # React hooks
│   ├── useChatRooms.ts
│   ├── useMessages.ts
│   └── usePushNotifications.ts
└── utils.ts

utils/supabase/
├── client.ts               # ❌ DO NOT use in client components
├── server.ts               # ✅ Server Actions, API routes
└── user.ts

types/
├── database.types.ts       # Supabase types (auto-generated)
└── next-auth.d.ts          # Session extensions

.claude/
├── agents/                 # Agent configurations
├── skills/                 # Task-specific patterns
├── docs/                   # Documentation
│   ├── core/               # Core rules & stack
│   ├── backend/            # Backend patterns
│   ├── frontend/           # Frontend patterns
│   ├── indexes/            # Quick lookup tables
│   └── law/                # Authoritative docs
└── commands/kc/            # Custom commands
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TaskCard.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| Server Actions | feature.ts | `tasks.ts` |
| Pages | page.tsx | `app/app/tasks/page.tsx` |
| Layouts | layout.tsx | `app/app/layout.tsx` |

---

## Import Order

```typescript
// 1. React/Next
import { useState } from 'react';
import Link from 'next/link';

// 2. Third-party
import { motion } from 'framer-motion';
import { z } from 'zod';

// 3. Internal utilities
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// 4. Types
import type { Task } from '@/types/database.types';
```

---

## Environment Variables

### Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_JWT_SECRET=

# NextAuth
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Email
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=
```

### Optional Services
```env
# Stripe (feature-flagged)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_PAYMENTS_ENABLED=false

# SerpAPI (Home Depot)
SERPAPI_API_KEY=

# Firebase (Push Notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FCM_SERVER_KEY=
```

---

## See Also

- Core rules: `core/RULES.md`
- Server Action patterns: `backend/SERVER_ACTIONS.md`
- UI patterns: `frontend/DESIGN_SYSTEM.md`
