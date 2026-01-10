# GenHub Components Index

> Quick lookup for UI components. For patterns, see `.claude/skills/frontend/`

Last updated: 2026-01-10

---

## Quick Lookup by Directory

### UI Base (`components/ui/`)
| Component | Type | Purpose |
|-----------|------|---------|
| Button | Client | Primary actions |
| Card | Client | Content containers |
| BaseModal | Client | Modal dialogs (use instead of Dialog) |
| Input | Client | Text inputs |
| Textarea | Client | Multi-line inputs |
| Label | Client | Form labels |
| Badge | Client | Status labels |
| Avatar | Client | User avatars |
| Tabs | Client | Tab navigation |
| Select | Client | Dropdowns |
| Checkbox | Client | Boolean inputs |
| Skeleton | Client | Loading placeholders |

### App Shell (`components/app/`)
| Component | Type | Purpose |
|-----------|------|---------|
| Sidebar | Client | Main navigation |
| Header | Server | Page header |
| MobileNav | Client | Mobile navigation |
| UserMenu | Client | User dropdown |

### Billing & Profile (`components/app/profile/`, `components/app/billing/`)
| Component | Type | Purpose |
|-----------|------|---------|
| ProfileForm | Client | User profile settings |
| BillingPlans | Client | Plan selection |
| BillingHistory | Client | Payment history |

### Projects (`components/projects/`)
| Component | Type | Purpose |
|-----------|------|---------|
| ProjectCard | Client | Project list item |
| ProjectList | Client | Project grid/list |
| ProjectForm | Client | Create/edit form |
| PhaseTimeline | Client | Metro journey view |
| ProjectSummaryCard | Client | Dashboard widget |
| MetroJourney | Client | Phase visualization |
| ProjectDetailContent | Client | Project detail page content |
| ProjectFilesTab | Client | Files & photos tab container |
| PhotoGallerySection | Client | Photo grid with primary photo selection |
| PhotoLightbox | Client | Full-screen photo viewer with actions |

### Tasks (`components/tasks/`)
| Component | Type | Purpose |
|-----------|------|---------|
| TaskCard | Client | Task list item |
| TaskList | Client | Task list view |
| TaskKanban | Client | Kanban board |
| TaskModal | Client | Task detail modal |
| TaskForm | Client | Create/edit form |
| AssigneeMultiSelect | Client | Multi-user/sub dropdown |
| TaskFilters | Client | Filter controls |
| TaskStatusBadge | Client | Status display |
| TaskPriorityIcon | Client | Priority indicator |
| TaskDependencies | Client | Dependency manager |
| TaskMaterials | Client | Material assignments |
| TaskActivity | Client | Activity timeline |
| GanttView | Client | Gantt chart |

### Materials (`components/materials/`)
| Component | Type | Purpose |
|-----------|------|---------|
| MaterialCard | Client | Material list item |
| MaterialList | Client | Material grid |
| MaterialSearch | Client | Search/filter |
| MaterialAssignModal | Client | Assign to task |
| MaterialStatusBadge | Client | Procurement status |

### Expenses (`components/expenses/`)
| Component | Type | Purpose |
|-----------|------|---------|
| ExpenseCard | Client | Expense list item |
| ExpenseList | Client | Expense table |
| ExpenseForm | Client | Create/edit form |
| ExpenseStatusBadge | Client | Approval status |
| ReceiptUpload | Client | Receipt upload |
| ExpenseSummary | Client | Analytics summary cards |

### Chat (`components/chat/`)
| Component | Type | Purpose |
|-----------|------|---------|
| ChatLayout | Client | Chat container |
| ChatRoomList | Client | Room sidebar |
| MessageList | Client | Message feed |
| MessageItem | Client | Single message |
| MessageInput | Client | Compose input |
| FileUploader | Client | File attachments |
| EntityMentions | Client | @mentions |
| TypingIndicator | Client | Typing status |

### Team (`components/team/`)
| Component | Type | Purpose |
|-----------|------|---------|
| TeamMemberCard | Client | Member list item |
| TeamMemberList | Client | Team table |
| InviteModal | Client | Invite form |
| RoleSelect | Client | Role dropdown |
| SubcontractorCard | Client | Sub profile |
| SubcontractorList | Client | Sub directory |

### Auth (`components/auth/`)
| Component | Type | Purpose |
|-----------|------|---------|
| LoginForm | Client | Sign in form |
| GoogleSignIn | Client | OAuth button |
| SignOutButton | Client | Sign out |

### User & Account (`components/user/`)
| Component | Type | Purpose |
|-----------|------|---------|
| UserCard | Client | User profile card |
| AvatarUpload | Client | Avatar selection |

### Email Templates (`components/email/`)
| Component | Type | Purpose |
|-----------|------|---------|
| InviteEmail | Template | Team invitation |
| NotificationEmail | Template | Notification emails |

### Feature Flags (`components/feature-flags/`)
| Component | Type | Purpose |
|-----------|------|---------|
| FeatureBanner | Client | Feature announcements |
| FeatureGate | Client | Feature availability |

### PWA (`components/pwa/`)
| Component | Type | Purpose |
|-----------|------|---------|
| InstallPrompt | Client | PWA install |
| OfflineBanner | Client | Offline indicator |

### Settings (`components/settings/`)
| Component | Type | Purpose |
|-----------|------|---------|
| SettingsForm | Client | Settings form |
| NotificationSettings | Client | Notification prefs |

---

## By Type

### Client Components (`'use client'`)
~90% of components are client components for interactivity.

Key patterns:
- Receive data as props (not fetched internally)
- Use Server Actions for mutations
- Manage local UI state with useState
- No direct Supabase imports

### Server Components
Limited use cases:
- `Header` - Static header rendering
- Page layouts
- Data-passing wrappers

---

## Common Patterns

### Props Interface
```typescript
interface EntityCardProps {
  entity: Entity;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

### Form Props
```typescript
interface EntityFormProps {
  defaultValues?: Partial<Entity>;
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

### List Props
```typescript
interface EntityListProps {
  entities: Entity[];
  onSelect?: (entity: Entity) => void;
  emptyMessage?: string;
}
```

---

## Design System

### Colors
- Primary: `#001B51` (construction-blue)
- Accent: `#3C3C3C`
- Status colors defined per component

### Icons
- **Only Lucide React** - No other icon libraries
- Construction context where appropriate

### Modals
- **Always use `BaseModal`** - Never use Dialog directly
- Standard props: `isOpen`, `onClose`, `title`, `icon`

---

## Component Stats

| Directory | Count | Type |
|-----------|-------|------|
| ui/ | ~25 | Base components |
| tasks/ | ~40 | Task management (incl. gantt/) |
| projects/ | ~78 | Project views (incl. files/, spatial/) |
| chat/ | ~10 | Chat system |
| materials/ | ~6 | Materials |
| expenses/ | ~5 | Expenses |
| team/ | ~6 | Team management |
| app/ | ~7 | Shell + Profile/Billing |
| auth/ | ~3 | Authentication |
| user/ | ~2 | User components |
| email/ | ~2 | Email templates |
| feature-flags/ | ~2 | Feature management |
| pwa/ | ~2 | PWA components |
| settings/ | ~3 | Settings |
| forms/ | ~8 | Form components |
| admin/ | ~3 | Admin tools |
| **Total** | ~200+ | - |

---

## Deep Dive

For component patterns: `.claude/skills/frontend/component-patterns.md`
For form patterns: `.claude/skills/frontend/form-patterns.md`
For modal patterns: `.claude/skills/frontend/modal-patterns.md`
