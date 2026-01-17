# GenHub Server Actions Index

> Auto-generated. Do not edit manually.

Last updated: 2026-01-16

---

## Quick Lookup by File

### accept-admin-invite.ts
| Action | Purpose | Returns |
|--------|---------|---------|
| validateAdminInvitationToken | Validate admin invitation token | { valid: boolean, invitation?: object, error?: string } |
| acceptAdminInvitation | Accept admin invitation and create company | { success: boolean, error?: string } |

### accept-invite.ts
| Action | Purpose | Returns |
|--------|---------|---------|
| validateInvitationToken | Validate team invitation token | { valid: boolean, invitation?: object, error?: string } |
| acceptInvitation | Accept team invitation | { success: boolean, error?: string } |

### auth.ts
| Action | Purpose | Returns |
|--------|---------|---------|
| handleSignIn | Handle user sign in | void |
| handleSignOut | Handle user sign out | void |

### chat-queries.ts (Query Actions)
| Action | Purpose | Returns |
|--------|---------|---------|
| getCurrentUserContext | Get current user context (company, role) | { userId, companyId, role, supabase } or { error } |
| getChatRooms | Get all chat rooms for user | { data: ChatRoom[], error?: string } |
| getMessages | Get messages for a chat room | { data: Message[], error?: string } |
| getCompanyUsers | Get all users in company | { data: User[], error?: string } |
| getMessageById | Get single message by ID | { data: Message, error?: string } |

### chat-search.ts (Search Actions)
| Action | Purpose | Returns |
|--------|---------|---------|
| searchProjects | Search projects by name | { data: Project[], error?: string } |
| searchTasks | Search tasks by title | { data: Task[], error?: string } |
| searchMaterials | Search materials by name | { data: Material[], error?: string } |
| searchExpenses | Search expenses | { data: Expense[], error?: string } |
| searchUsers | Search users by name/email | { data: User[], error?: string } |
| searchMessages | Search message content | { data: Message[], error?: string } |

### chat.ts (Chat Mutations)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| sendMessage | Send a message in a chat room | - |
| markMessagesAsRead | Mark messages as read | - |
| getThreadMessages | Get thread replies | - |
| getMessageReplyCount | Get reply count for a message | - |
| getMessageReplyCounts | Get reply counts for multiple messages | - |
| toggleReaction | Add/remove reaction to message | - |
| getMessageReactions | Get reactions for a message | - |
| getMessagesReactions | Get reactions for multiple messages | - |
| uploadAttachment | Upload file attachment to message | - |
| getMessageAttachments | Get attachments for a message | - |
| deleteAttachment | Delete attachment | - |
| getMessagesAttachments | Get attachments for multiple messages | - |
| muteChatRoom | Mute/unmute a chat room | - |
| createDMRoom | Create direct message room | - |
| editMessage | Edit message content | - |
| deleteMessage | Delete message | - |
| updateChatRoom | Update chat room details | - |
| exportTranscript | Export chat transcript | - |
| getChatRoomParticipants | Get participants in a room | - |
| isUserGcAdmin | Check if user is GC admin | - |

### client.ts
| Action | Purpose | Returns |
|--------|---------|---------|
| getClientPermissions | Get client user permissions | { canView: boolean[], error?: string } |

### dashboard.ts
| Action | Purpose | Returns |
|--------|---------|---------|
| getDashboardData | Get dashboard KPIs and stats | { data: DashboardData, error?: string } |
| invalidateDashboardCache | Clear dashboard cache | { success: boolean } |

### default-models.ts (3D Model Management)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getSystemDefaultModel | Get system default 3D model | - |
| getCompanyDefaultModel | Get company-specific default model | - |
| createMarkersFromDefaultConfigs | Create markers from default configs | - |
| assignDefaultModel | Assign default model to project | /app/projects/[id]/spatial |
| getDefaultModelsForCompany | Get available default models | - |
| uploadCompanyDefaultModel | Upload company default model | /app/settings |
| resetToSystemDefault | Reset to system default model | /app/settings |

### expenses.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| createExpense | Create new expense | /app/expenses, /app/projects/[id] |
| updateExpense | Update expense | /app/expenses/[id] |
| reviewExpense | Review and approve/reject expense | /app/expenses |
| deleteExpense | Delete expense | /app/expenses |
| getExpensesByProject | Get expenses for a project | - |
| getExpensesByCompany | Get all company expenses | - |
| getExpenseById | Get single expense | - |
| addExpenseLineItem | Add line item to expense | /app/expenses/[id] |
| deleteExpenseLineItem | Delete line item | /app/expenses/[id] |
| processReceiptOCR | Process receipt with OCR | - |
| matchLineItemToMaterial | Match line item to material | - |
| getTaskExpenses | Get expenses for a task | - |
| getBatchTaskExpenses | Get expenses for multiple tasks | - |
| createExpenseFromMaterial | Create expense from material assignment | /app/expenses |
| getMaterialExpenseLink | Get linked expense for material | - |
| getExpenseAnalytics | Get expense analytics | - |
| getVendorOptions | Get vendor dropdown options | - |
| createExpenseFromTask | Create expense linked to task | /app/expenses |

### kakao.ts (KakaoTalk Integration)
| Action | Purpose | Returns |
|--------|---------|---------|
| getKakaoConnection | Get KakaoTalk connection status | { data: Connection, error?: string } |
| updateTwoWaySync | Enable/disable two-way sync | { success: boolean, error?: string } |
| disconnectKakao | Disconnect KakaoTalk | { success: boolean, error?: string } |

### materials.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| searchProducts | Search Home Depot products | - |
| getProductDetails | Get product details from Home Depot | - |
| createMaterial | Create custom material | /app/materials |
| createMaterialFromHomeDepot | Create material from Home Depot product | /app/materials |
| getMaterialsByCompany | Get all company materials | - |
| assignMaterialToTask | Assign material to task | /app/tasks/[id], /app/projects/[id] |
| updateMaterialAssignment | Update material assignment | /app/tasks/[id] |
| deleteMaterialAssignment | Delete material assignment | /app/tasks/[id] |
| getMaterialAssignmentsByTask | Get materials for a task | - |
| getMaterialAssignmentsByProject | Get materials for a project | - |
| getProjectMaterialSummary | Get material summary for project | - |
| getMaterialsByCategory | Get materials by category | - |
| getProjectPhases | Get project phases (for material filtering) | - |
| getPhaseTasks | Get tasks in a phase | - |
| getTaskMaterials | Get materials for a task | - |
| removeMaterialFromTask | Remove material from task | /app/tasks/[id] |
| updateMaterialQuantity | Update material quantities | /app/tasks/[id] |
| addProductToTask | Add Home Depot product directly to task | /app/tasks/[id] |
| linkMaterialToMarker | Link material to spatial marker | /app/projects/[id]/spatial |
| getMaterialsByMarker | Get materials linked to marker | - |
| getTaskLinkedMaterials | Get materials with marker links | - |
| getTrackedMaterials | Get price-tracked materials | - |
| toggleTracking | Toggle price tracking for material | /app/materials |
| getMaterialSummaryStats | Get material summary statistics | - |
| updateMaterialLeadTime | Update material lead time | /app/materials/[id] |

### owner.ts (Platform Owner Actions)
| Action | Purpose | Returns |
|--------|---------|---------|
| isOwner | Check if user is platform owner | { isOwner: boolean } |
| getAllCompanies | Get all companies (owner only) | { data: Company[], error?: string } |
| getAllUsers | Get all users (owner only) | { data: User[], error?: string } |
| inviteAdmin | Invite new admin/company | { success: boolean, error?: string } |
| getPendingAdminInvitations | Get pending admin invitations | { data: Invitation[], error?: string } |
| revokeAdminInvitation | Revoke admin invitation | { success: boolean, error?: string } |
| getOwnerDashboardStats | Get platform-wide statistics | { data: Stats, error?: string } |

### phase-templates.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getPhaseTemplates | Get phase templates for project type | - |
| createPhaseTemplate | Create new phase template | /app/settings |
| updatePhaseTemplate | Update phase template | /app/settings |
| deletePhaseTemplate | Delete phase template | /app/settings |
| reorderPhaseTemplates | Reorder phase templates | /app/settings |

### phases.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| updatePhaseStatus | Update phase status | /app/projects/[id] |
| updatePhase | Update phase details | /app/projects/[id] |
| getProjectPhases | Get phases for a project | - |
| startNextPhase | Start next phase in sequence | /app/projects/[id] |
| completeCurrentPhase | Complete current phase | /app/projects/[id] |
| createPhase | Create custom phase | /app/projects/[id] |
| updatePhaseName | Update phase name | /app/projects/[id] |
| deletePhase | Delete phase | /app/projects/[id] |
| applyTaskTemplates | Apply task templates to phase | /app/projects/[id] |

### project-files.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectFiles | Get files for a project | - |
| deleteProjectFile | Delete project file | /app/projects/[id]/files |
| updateFileCategory | Update file category | /app/projects/[id]/files |
| getFileVersionHistory | Get file version history | - |
| bulkDeleteFiles | Delete multiple files | /app/projects/[id]/files |

### project-photos.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectPhotosWithReceipts | Get project photos with receipt flag | - |
| setProjectPrimaryPhoto | Set primary project photo | /app/projects/[id] |
| deleteProjectPhoto | Delete project photo | /app/projects/[id]/files |

### project-types.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectTypes | Get all project types | - |
| createProjectType | Create custom project type | /app/settings |
| updateProjectType | Update project type | /app/settings |
| deleteProjectType | Delete project type | /app/settings |

### projects.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| createProject | Create new project | /app/projects |
| updateProject | Update project details | /app/projects/[id] |
| updateProjectStatus | Update project status | /app/projects |
| assignProjectTeamMember | Assign team member to project | /app/projects/[id] |
| addProjectTeamMember | Add new team member to project | /app/projects/[id] |
| addSubcontractorToProject | Add subcontractor to project | /app/projects/[id] |
| removeSubcontractorFromProject | Remove subcontractor from project | /app/projects/[id] |
| removeProjectTeamMember | Remove team member from project | /app/projects/[id] |
| getProjectsWithStats | Get projects with statistics | - |
| getProjectWithStats | Get single project with stats | - |
| getProjectTeamCostSummary | Get team cost summary | - |

### push.ts (Push Notifications)
| Action | Purpose | Returns |
|--------|---------|---------|
| registerPushSubscription | Register push notification subscription | { success: boolean, error?: string } |
| unregisterPushSubscription | Unregister push subscription | { success: boolean, error?: string } |
| getUserPushSubscriptions | Get user's push subscriptions | { data: Subscription[], error?: string } |

### seed-demo-data.ts
| Action | Purpose | Returns |
|--------|---------|---------|
| seedDemoData | Seed demo data for testing | { success: boolean, error?: string } |

### spatial.ts (3D/Spatial Features)
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| uploadIFCFile | Upload IFC file | /app/projects/[id]/spatial |
| createModelRecord | Create 3D model record | /app/projects/[id]/spatial |
| getProjectModels | Get 3D models for project | - |
| getActiveModel | Get active 3D model | - |
| updateModelProcessingStatus | Update model processing status | /app/projects/[id]/spatial |
| setActiveModelVersion | Set active model version | /app/projects/[id]/spatial |
| deleteModelVersion | Delete model version | /app/projects/[id]/spatial |
| replaceActiveModel | Replace active model | /app/projects/[id]/spatial |
| createMarker | Create spatial marker | /app/projects/[id]/spatial |
| getProjectMarkers | Get markers for project | - |
| getMarkerById | Get single marker | - |
| updateMarker | Update marker | /app/projects/[id]/spatial |
| deleteMarker | Delete marker | /app/projects/[id]/spatial |
| attachContentToMarker | Attach content to marker | /app/projects/[id]/spatial |
| getMarkerContent | Get marker content | - |
| deleteMarkerContent | Delete marker content | /app/projects/[id]/spatial |
| getMarkersByPhase | Get markers filtered by phase | - |
| findNearestMarker | Find nearest marker to coordinates | - |
| getMarkersByProject | Get all markers for project | - |
| uploadMarkerAttachment | Upload attachment to marker | /app/projects/[id]/spatial |
| createTaskAtLocation | Create task at spatial location | /app/projects/[id]/spatial, /app/tasks |

### stripe.ts (Payment Processing)
| Action | Purpose | Returns |
|--------|---------|---------|
| getStripeCustomerId | Get Stripe customer ID | { customerId: string, error?: string } |
| createPortalSession | Create Stripe portal session | { url: string, error?: string } |
| refund | Process refund | { success: boolean, error?: string } |

### subcontractors.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| createSubcontractor | Create new subcontractor | /app/team |
| updateSubcontractor | Update subcontractor | /app/team |
| deactivateSubcontractor | Deactivate subcontractor | /app/team |
| uploadSubcontractorDocument | Upload subcontractor document | /app/team |

### task-templates.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getTaskTemplates | Get task templates | - |
| createTaskTemplate | Create task template | /app/settings |
| updateTaskTemplate | Update task template | /app/settings |
| deleteTaskTemplate | Delete task template | /app/settings |
| reorderTaskTemplates | Reorder task templates | /app/settings |

### task-types.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getTaskTypes | Get task types for company | - |
| getAllTaskTypes | Get all available task types | - |
| createTaskType | Create custom task type | /app/settings |
| updateTaskType | Update task type | /app/settings |
| deleteTaskType | Delete task type | /app/settings |

### tasks.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectAssignees | Get available assignees for project | - |
| createTask | Create new task | /app/tasks, /app/projects/[id] |
| updateTask | Update task | /app/tasks/[id] |
| updateTaskWithExpense | Update task with expense creation | /app/tasks/[id], /app/expenses |
| setPrimaryAssignee | Set primary assignee for task | /app/tasks/[id] |
| updateTaskStatus | Update task status | /app/tasks |
| addTaskDependency | Add task dependency | /app/tasks/[id] |
| removeTaskDependency | Remove task dependency | /app/tasks/[id] |
| addTaskComment | Add comment to task | /app/tasks/[id] |
| deleteTask | Delete task | /app/tasks |
| updateApprovalStatus | Update task approval status | /app/tasks/[id] |
| getProjectTasks | Get tasks for a project | - |
| updateTaskDueDate | Update task due date | /app/tasks/[id] |
| updateTaskDates | Update task start and due dates | /app/tasks/[id] |
| getTaskDependencies | Get task dependencies | - |
| linkTaskToMarker | Link task to spatial marker | /app/tasks/[id], /app/projects/[id]/spatial |
| getTasksByMarker | Get tasks linked to marker | - |
| logTaskCompletionToMarker | Log task completion to marker | /app/projects/[id]/spatial |
| getTaskDetails | Get detailed task information | - |
| getTaskActivity | Get task activity log | - |
| getTaskAttachments | Get task attachments | - |
| getTaskAnalytics | Get task analytics | - |

### team-email-helper.ts
| Action | Purpose | Returns |
|--------|---------|---------|
| sendTeamInvitationEmail | Send team invitation email | { success: boolean, error?: string } |

### team.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| inviteTeamMember | Invite new team member | /app/team |
| updateTeamMemberRole | Update team member role | /app/team |
| deactivateTeamMember | Deactivate team member | /app/team |

---

## By Feature Domain

### Authentication & Authorization
- **auth.ts**: handleSignIn, handleSignOut
- **accept-invite.ts**: validateInvitationToken, acceptInvitation
- **accept-admin-invite.ts**: validateAdminInvitationToken, acceptAdminInvitation
- **client.ts**: getClientPermissions
- **owner.ts**: isOwner, getAllCompanies, getAllUsers

### Projects
- **projects.ts**: CRUD operations, team management, statistics
- **project-types.ts**: Custom project type management
- **project-files.ts**: File management
- **project-photos.ts**: Photo management

### Tasks
- **tasks.ts**: CRUD operations, assignments, dependencies, analytics
- **task-types.ts**: Custom task type management
- **task-templates.ts**: Task template management

### Phases
- **phases.ts**: Phase lifecycle management
- **phase-templates.ts**: Phase template management

### Materials
- **materials.ts**: Material catalog, assignments, tracking, Home Depot integration

### Expenses
- **expenses.ts**: Expense management, OCR processing, analytics

### Team
- **team.ts**: Team member management
- **subcontractors.ts**: Subcontractor management

### Spatial/3D
- **spatial.ts**: 3D models, markers, spatial features
- **default-models.ts**: Default 3D model management

### Chat
- **chat.ts**: Messaging, reactions, attachments
- **chat-queries.ts**: Chat queries
- **chat-search.ts**: Entity search for mentions

### Integrations
- **kakao.ts**: KakaoTalk integration
- **stripe.ts**: Payment processing
- **push.ts**: Push notifications

### Dashboard
- **dashboard.ts**: Dashboard data and KPIs

### Utilities
- **seed-demo-data.ts**: Demo data seeding
- **team-email-helper.ts**: Email utilities

---

## Common Patterns

### Return Types
All actions follow consistent return patterns:

```typescript
// Success with data
{ data: T, error?: never }

// Error
{ data?: never, error: string }

// Simple success
{ success: boolean, error?: string }
```

### Error Handling
```typescript
export async function exampleAction() {
  const ctx = await getUserContext()
  if ('error' in ctx) return ctx  // Early return on auth error

  const { data, error } = await ctx.supabase
    .from('table')
    .select('*')

  if (error) return { error: error.message }
  return { data }
}
```

### Revalidation
Actions that modify data revalidate affected paths:
```typescript
revalidatePath('/app/tasks')
revalidatePath(`/app/projects/${projectId}`)
```

---

## Usage in Client Components

```typescript
'use client'

import { createTask } from '@/app/actions/tasks'

function TaskForm() {
  const handleSubmit = async (formData) => {
    const result = await createTask(formData)

    if ('error' in result) {
      // Handle error
      toast.error(result.error)
      return
    }

    // Success
    toast.success('Task created')
  }
}
```

---

## Summary

| Metric | Count |
|--------|-------|
| Total Action Files | 29 |
| Total Actions | ~250 |
| Query Actions (read-only) | ~80 |
| Mutation Actions (write) | ~170 |

---

## See Also

- `.claude/docs/indexes/tables.md` - Database schema reference
- `.claude/docs/backend/` - Backend architecture documentation
- `.claude/skills/backend/server-action.md` - Server Action creation guide
