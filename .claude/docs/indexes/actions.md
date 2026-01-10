# GenHub Server Actions Index

> Quick lookup for Server Actions. For patterns, see `.claude/skills/backend/server-action.md`

Last updated: 2026-01-09

---

## Quick Lookup by File

### Projects (`app/actions/projects.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjects | List all company projects | - |
| getProjectById | Get single project | - |
| createProject | Create new project | /app/projects |
| updateProject | Update project | /app/projects/[id] |
| deleteProject | Delete project | /app/projects |
| getProjectSummary | Dashboard stats | - |

### Tasks (`app/actions/tasks.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getTasks | List tasks (with filters) | - |
| getTaskById | Get single task | - |
| createTask | Create task | /app/tasks |
| updateTask | Update task fields | /app/tasks |
| updateTaskStatus | Change task status | /app/tasks |
| deleteTask | Delete task | /app/tasks |
| addTaskComment | Add comment | /app/tasks/[id] |
| getTaskActivity | Get task history | - |

### Phases (`app/actions/phases.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectPhases | List project phases | - |
| updatePhase | Update phase | /app/projects/[id] |
| updatePhaseStatus | Change phase status | /app/projects/[id] |

### Materials (`app/actions/materials.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getMaterials | List company materials | - |
| createMaterial | Add material | /app/materials |
| assignMaterial | Assign to task | /app/tasks |
| getTaskMaterials | Get task materials | - |
| updateMaterialStatus | Update procurement | /app/materials |

### Expenses (`app/actions/expenses.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getExpenses | List expenses | - |
| getExpenseById | Get single expense | - |
| createExpense | Submit expense | /app/expenses |
| updateExpense | Update expense | /app/expenses |
| updateExpenseStatus | Approve/reject | /app/expenses |

### Team (`app/actions/team.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getTeamMembers | List company team | - |
| inviteTeamMember | Send invitation | /app/team |
| updateMemberRole | Change role | /app/team |
| removeTeamMember | Remove member | /app/team |
| getProjectTeam | List project team | - |

### Subcontractors (`app/actions/subcontractors.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getSubcontractors | List subs | - |
| createSubcontractor | Add sub | /app/team/subcontractors |
| updateSubcontractor | Update sub | /app/team/subcontractors |
| deleteSubcontractor | Delete sub | /app/team/subcontractors |

### Chat (`app/actions/chat.ts`, `chat-queries.ts`, `chat-search.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getChatRooms | List user's rooms | - |
| getMessages | Get room messages | - |
| sendMessage | Send message | - (realtime) |
| createChatRoom | Create room | /app/chat |
| addParticipant | Add to room | - |
| searchMessages | Search chat history | - |

### Spatial (`app/actions/spatial.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectModels | List 3D models | - |
| getActiveModel | Get current model | - |
| getSpatialMarkers | Get markers | - |
| createMarker | Add marker | - |
| updateMarker | Update marker | - |
| deleteMarker | Remove marker | - |
| linkMarkerToTask | Connect to task | - |

### Project Files (`app/actions/project-files.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectFiles | List files | - |
| uploadFile | Upload file | /app/projects/[id] |
| deleteFile | Delete file | /app/projects/[id] |
| updateFileCategory | Change category | - |
| getFileVersionHistory | Get versions | - |

### Project Photos (`app/actions/project-photos.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectPhotos | List photos | - |
| uploadPhoto | Upload photo | /app/projects/[id] |
| deletePhoto | Delete photo | /app/projects/[id] |
| updatePhotoCategory | Change category | - |

### Auth (`app/actions/auth.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| handleSignIn | NextAuth sign in | - |
| handleSignOut | NextAuth sign out | / |

### Other Actions
| File | Actions |
|------|---------|
| `client.ts` | Client portal access |
| `push.ts` | Push notification management |
| `kakao.ts` | KakaoTalk integration |
| `stripe.ts` | Stripe billing |
| `accept-invite.ts` | Team invite acceptance |
| `default-models.ts` | Default 3D model management |
| `phase-templates.ts` | Phase template CRUD |
| `task-templates.ts` | Task template CRUD |
| `task-types.ts` | Task type configuration |
| `project-types.ts` | Project type configuration |
| `seed-demo-data.ts` | Demo data seeding (admin) |
| `team-email-helper.ts` | Email utilities (internal) |

---

## By Domain

| Domain | Action Count | Files |
|--------|--------------|-------|
| Projects | 6 | projects.ts |
| Tasks | 8 | tasks.ts |
| Phases | 3 | phases.ts |
| Materials | 5 | materials.ts |
| Expenses | 5 | expenses.ts |
| Team | 5 | team.ts |
| Subcontractors | 4 | subcontractors.ts |
| Chat | 5 | chat.ts, chat-queries.ts |
| Spatial | 7 | spatial.ts |
| Files/Photos | 10 | project-files.ts, project-photos.ts |
| **Total** | ~60+ | 26 files |

---

## Common Patterns

### Return Types
All actions return `{ data }` or `{ error }`:
```typescript
export async function getEntity(): Promise<{ data?: Entity[]; error?: string }>
```

### User Context
All actions use `getUserContext()` helper:
```typescript
const ctx = await getUserContext();
if ('error' in ctx) return ctx;
// ctx.userId, ctx.companyId, ctx.supabase available
```

### Revalidation
Mutations call `revalidatePath()`:
```typescript
revalidatePath('/app/entities');
```

---

## Deep Dive

For action patterns: `.claude/skills/backend/server-action.md`
For validation: `.claude/skills/backend/validation.md`
