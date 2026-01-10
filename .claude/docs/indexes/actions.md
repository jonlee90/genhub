# GenHub Server Actions Index

> Quick lookup for Server Actions. For patterns, see `.claude/skills/backend/server-action.md`

Last updated: 2026-01-10

---

## Quick Lookup by File

### Dashboard (`app/actions/dashboard.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getDashboardData | Aggregated KPIs, widgets data | - |

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
| getProjectAssignees | Get team + subcontractors for dropdown | - |
| createTask | Create task | /app/tasks |
| updateTask | Update task fields | /app/tasks |
| updateTaskStatus | Change task status | /app/tasks |
| addTaskDependency | Add task dependency | /app/tasks |
| removeTaskDependency | Remove task dependency | /app/tasks |
| addTaskComment | Add comment | /app/tasks/[id] |
| deleteTask | Delete task | /app/tasks |
| updateApprovalStatus | Change approval status | /app/tasks |
| getProjectTasks | Get tasks for a project | - |
| updateTaskDueDate | Update single due date | /app/tasks |
| updateTaskDates | Update start/end dates | /app/tasks |
| getTaskDependencies | Get dependencies for tasks | - |
| linkTaskToMarker | Link task to spatial marker | - |
| getTasksByMarker | Get tasks for a marker | - |
| logTaskCompletionToMarker | Log completion to marker | - |
| getTaskDetails | Get full task details | - |
| getTaskActivity | Get task history | - |
| getTaskAttachments | Get task attachments | - |
| getTaskAnalytics | Get task analytics data | - |

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
| getExpenseAnalytics | Get expense summary stats | - |

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
| setProjectPrimaryPhoto | Set/clear cover image | /app/projects/[id], /app/projects |

### Auth (`app/actions/auth.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| handleSignIn | NextAuth sign in | - |
| handleSignOut | NextAuth sign out | / |

### Owner (`app/actions/owner.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| isOwner | Check if user is platform owner | - |
| getAllCompanies | List all companies (owner only) | - |
| getAllUsers | List all users (owner only) | - |
| inviteAdmin | Send admin invitation email | /app/owner/invites |
| getPendingAdminInvitations | List pending admin invites | - |
| revokeAdminInvitation | Cancel pending invite | /app/owner/invites |
| getOwnerDashboardStats | Platform statistics | - |

### Admin Invite (`app/actions/accept-admin-invite.ts`)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| validateAdminInvitationToken | Validate invite token | - |
| acceptAdminInvitation | Accept invite, create user/company | - |

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
| `owner.ts` | Owner/platform management |
| `accept-admin-invite.ts` | Admin invitation acceptance |

---

## By Domain

| Domain | Action Count | Files |
|--------|--------------|-------|
| Dashboard | 1 | dashboard.ts |
| Projects | 6 | projects.ts |
| Tasks | 20 | tasks.ts |
| Phases | 3 | phases.ts |
| Materials | 5 | materials.ts |
| Expenses | 6 | expenses.ts |
| Team | 5 | team.ts |
| Subcontractors | 4 | subcontractors.ts |
| Chat | 5 | chat.ts, chat-queries.ts |
| Spatial | 7 | spatial.ts |
| Files/Photos | 11 | project-files.ts, project-photos.ts |
| Owner | 7 | owner.ts |
| Admin Invite | 2 | accept-admin-invite.ts |
| **Total** | ~86+ | 29 files |

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
