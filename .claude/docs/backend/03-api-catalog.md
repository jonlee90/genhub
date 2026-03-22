# API Catalog & Server Actions Reference

> GenHub Backend Services: Server Actions + API Routes
> Generated from source: `app/actions/*.ts` (47 files) + `app/api/*/route.ts` (33 routes)
> **Updated:** 2026-03-21

---

## Table of Contents

1. [Server Actions Reference](#server-actions-reference)
2. [API Routes Reference](#api-routes-reference)
3. [Validation Schemas](#validation-schemas)
4. [Error Response Patterns](#error-response-patterns)
5. [Cache Invalidation Matrix](#cache-invalidation-matrix)
6. [Sequence Diagrams](#sequence-diagrams)
7. [Optimization Signals](#optimization-signals)

---

## Server Actions Reference

Server Actions handle authenticated data mutations and queries. All use NextAuth session verification and return standardized result types.

### Authentication Domain

**File:** `app/actions/auth.ts` (14 lines)

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `handleSignIn()` | Initiate NextAuth sign-in flow | — | — | — |
| `handleSignOut()` | Terminate user session | — | — | — |

---

### Invitation & Signup Domain

**File:** `app/actions/accept-invite.ts` (399 lines)

Handles team member invitation acceptance with atomic single-use token validation and user onboarding.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `validateInvitationToken(token)` | Validate invitation token format and expiration | `token: string (UUID)` | `ValidateTokenResult` with invitation data | — |
| `acceptInvitation(token)` | Accept invitation, create user profile & company_users entry | `token: string (UUID)` | `AcceptInviteResult` | `team`, `company-members-{companyId}` |

**Schemas:**
- `validateTokenSchema`: `token` (UUID)
- `acceptInviteSchema`: `token` (UUID)

**Security:**
- Atomic update: `used_at IS NULL` prevents replay attacks
- Email verification: Authenticated user email must match invitation
- Expiration check: 7-day invitation window
- RLS enforcement via Supabase admin client during user onboarding

**Flow:**
1. Validate token format (UUID)
2. Check token not expired/used
3. Verify session email matches invitation email
4. Create/upsert `user_profiles` record
5. Check existing `company_users` membership
6. Insert new `company_users` or reactivate inactive member
7. Create welcome notification
8. Atomic update: mark invitation as `used_at`

---

**File:** `app/actions/accept-admin-invite.ts` (295 lines)

Handles admin platform onboarding with company creation.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `validateAdminInvitationToken(token)` | Validate admin invitation | `token: string` | `ValidateAdminInvitationResult` | — |
| `acceptAdminInvitation(token, userData, companyData)` | Create company + admin user + assign admin role | `token: string`, `userData: {name}`, `companyData: {name, address?, phone?, email?}` | `AcceptAdminInvitationResult` | `admin-invitations` |

**Schemas:**
- `userDataSchema`: `name` (1-200 chars, trimmed)
- `companyDataSchema`: `name` (1-200 chars), `address?`, `phone?`, `email?` (all trimmed/lowercased)

---

**File:** `app/actions/invite-auth.ts` (355 lines)

Signup verification and password validation for invited users.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `checkEmailExists(email)` | Check if email already registered | `email: string (email)` | `{exists: boolean}` | — |
| `signupWithInvitation(token, email, password, name)` | Create auth user + profile | `token, email, password, name` | Success/error | `team-{companyId}` |
| `validatePasswordForInvitation(password)` | Client-side password validation | `password: string` | `{valid: boolean, errors: string[]}` | — |

---

### Team Management Domain

**File:** `app/actions/team.ts` (737 lines)

Team member and role management, invitations, and permissions.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `inviteTeamMembers(members, role, sendEmail?)` | Send team invitations | `members: [{email, name}]`, `role: UserRole`, `sendEmail?` | `{success, results: [{email, status, error?}]}` | `team-{companyId}`, `team-invitations-{companyId}` |
| `getTeamMembers()` | Fetch active team members with profiles | — | `{users: [{id, name, email, role, status, avatar_url}]}` | `team-members-{companyId}` |
| `updateMemberRole(userId, newRole)` | Change team member role | `userId: string (UUID)`, `newRole: UserRole` | `{success: boolean, error?: string}` | `team-{companyId}` |
| `removeMemberFromCompany(userId)` | Soft-delete team member | `userId: string (UUID)` | `{success: boolean}` | `team-{companyId}` |
| `getTeamInvitations(status?, limit?)` | Get pending/accepted invitations | `status?: 'pending'\|'used'`, `limit?: number` | `{invitations: TeamInvitation[]}` | — |
| `resendInvitation(invitationId)` | Resend expired invitation | `invitationId: string (UUID)` | `{success: boolean}` | — |
| `revokeInvitation(invitationId)` | Cancel pending invitation | `invitationId: string (UUID)` | `{success: boolean}` | `team-invitations-{companyId}` |

---

**File:** `app/actions/team-email-helper.ts` (236 lines)

Email templates and sending for team notifications.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `sendTeamInviteEmail(email, inviterName, companyName, token)` | Send invitation email | `email, inviterName, companyName, token` | `{success, error?}` | — |
| `sendWelcomeEmail(email, name)` | Send welcome email to new member | `email, name` | `{success, error?}` | — |

---

### Subcontractors Domain

**File:** `app/actions/subcontractors.ts` (1081 lines)

Subcontractor profiles, document management (COI, license, insurance), and vendor tracking.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `createSubcontractor(formData)` | Register new subcontractor | FormData: `{company_name, contact_name, email?, phone?, address?, trade_specialization, license_number?, license_expiry?, insurance_provider?, insurance_expiry?, performance_rating?, notes?}` | `{success, data: Subcontractor, message}` | `subcontractors-{companyId}` |
| `updateSubcontractor(data)` | Update subcontractor profile | `{id, company_name?, contact_name?, email?, phone?, address?, trade_specialization?, license_number?, license_expiry?, insurance_provider?, insurance_expiry?, performance_rating?, notes?, certificate_of_insurance?}` | `{success, data: Subcontractor, message}` | `subcontractors-{companyId}`, `subcontractor-{id}` |
| `deactivateSubcontractor(id)` | Soft-delete subcontractor (requires no active project assignments) | `id: string (UUID)` | `{success, message, data?: Subcontractor}` | `subcontractors-{companyId}`, `subcontractor-{id}` |
| `reactivateSubcontractor(id)` | Reactivate inactive subcontractor | `id: string (UUID)` | `{success, message, data?: Subcontractor}` | `subcontractors-{companyId}`, `subcontractor-{id}` |
| `deleteSubcontractor(id)` | Permanently delete inactive subcontractor (hard delete) | `id: string (UUID)` | `{success, message}` | `subcontractors-{companyId}` |
| `uploadSubcontractorDocument(formData)` | Upload document (license, insurance, or COI) to Supabase Storage | FormData: `{subcontractor_id, document_type: 'license'\|'insurance'\|'coi', file: File, license_number?, license_expiry?, insurance_provider?, insurance_expiry?}` | `{success, message, data?: {url, subcontractor}}` | `subcontractors-{companyId}`, `subcontractor-{id}` |
| `deleteSubcontractorDocument(id, type)` | Delete COI document from storage and database | `subcontractorId: UUID`, `documentType: 'coi'` | `{success, message}` | `subcontractors-{companyId}`, `subcontractor-{id}` |

---

### Projects Domain

**File:** `app/actions/projects.ts` (1747 lines)

Project CRUD, status management, budgets, and templates.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `createProject(data)` | Create new project | `{name, description?, address?, address_lat?, address_lng?, project_type, status?, budget?, start_date?, end_date?, client_id?}` | `{success, projectId}` | `projects-{companyId}`, `projects` |
| `updateProject(projectId, data)` | Update project metadata | `projectId: UUID`, `{name?, description?, status?, budget?, end_date?, ...}` | `{success}` | `projects-{companyId}`, `project-{projectId}` |
| `getProjectById(projectId)` | Fetch project with all details | `projectId: string (UUID)` | `{success, project: ProjectWithDetails}` | — |
| `getProjectsByCompany(filters?, cursor?)` | List company projects with pagination | `filters?: {status?, search?}`, `cursor?: string` | `{projects: Project[], nextCursor?}` | `projects-{companyId}` |
| `deleteProject(projectId)` | Archive project (soft-delete) | `projectId: string (UUID)` | `{success: boolean}` | `projects-{companyId}` |
| `updateProjectStatus(projectId, status)` | Change project status (planning/active/completed/on_hold) | `projectId: UUID`, `status: ProjectStatus` | `{success}` | `projects-{companyId}`, `project-{projectId}` |
| `updateProjectBudget(projectId, budget)` | Update project budget | `projectId: UUID`, `budget: number` | `{success}` | `projects-{companyId}`, `project-{projectId}` |
| `getProjectHealth(projectId)` | Calculate project health score | `projectId: string (UUID)` | `{health: number, status: 'good'\|'warning'\|'critical'}` | — |
| `duplicateProject(sourceProjectId, newName)` | Clone project with phases/tasks | `sourceProjectId: UUID`, `newName: string` | `{success, newProjectId}` | `projects-{companyId}` |

**Validation Schemas:**
- `createProjectSchema`: name, address, status, budget, dates, etc.
- `updateProjectSchema`: All fields optional

---

**File:** `app/actions/project-types.ts` (336 lines)

Project type configuration and enum management.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `getProjectTypes()` | Fetch all project types | — | `{types: ProjectType[]}` | `project-types` |
| `getProjectTypeConfig(projectType)` | Get config for specific type | `projectType: string` | `{config: ProjectTypeConfig}` | — |
| `updateProjectTypeConfig(projectType, config)` | Customize project type settings | `projectType: string`, `config` | `{success}` | `project-types`, `project-types-{companyId}` |

---

**File:** `app/actions/project-deferred.ts` (311 lines)

Deferred operations for large project operations (background jobs).

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `deferProjectCreation(projectData, jobId)` | Queue project creation | `projectData`, `jobId: string` | `{jobId, status: 'queued'}` | — |
| `getJobStatus(jobId)` | Poll deferred job status | `jobId: string` | `{status, result?, error?}` | — |

---

### Phases Domain

**File:** `app/actions/phases.ts` (879 lines)

Project phases, scheduling, and progress tracking.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `createPhase(projectId, data)` | Create project phase | `projectId: UUID`, `{name, start_date?, end_date?, order_index?, budget?}` | `{success, phaseId}` | `phases-{projectId}`, `project-{projectId}` |
| `updatePhase(phaseId, data)` | Update phase metadata | `phaseId: UUID`, `{name?, start_date?, end_date?, status?}` | `{success}` | `phases-{projectId}` |
| `getProjectPhases(projectId)` | List phases ordered by sequence | `projectId: string (UUID)` | `{phases: Phase[]}` | `phases-{projectId}` |
| `reorderPhases(projectId, phaseOrder)` | Update phase order_index | `projectId: UUID`, `phaseOrder: {phaseId, order_index}[]` | `{success}` | `phases-{projectId}` |
| `deletePhase(phaseId, moveTasksToPhaseId?)` | Delete/archive phase | `phaseId: UUID`, `moveTasksToPhaseId?: UUID` | `{success}` | `phases-{projectId}` |
| `getPhaseProgress(phaseId)` | Calculate phase completion % | `phaseId: string (UUID)` | `{progress: number, tasksTotal, tasksCompleted}` | — |
| `getPhaseTimeline(projectId)` | Get Gantt-compatible phase timeline | `projectId: string (UUID)` | `{timeline: PhaseTimeline[]}` | — |

---

**File:** `app/actions/phase-templates.ts` (368 lines)

Reusable phase templates with task presets.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `createPhaseTemplate(data)` | Create template for phases | `{name, description?, tasks: [{title, duration_days?, type?}]}` | `{success, templateId}` | `phase-templates-{companyId}` |
| `getPhaseTemplates()` | List company phase templates | — | `{templates: PhaseTemplate[]}` | `phase-templates-{companyId}` |
| `applyPhaseTemplate(projectId, templateId)` | Generate phases from template | `projectId: UUID`, `templateId: UUID` | `{success, phaseIds}` | `phases-{projectId}`, `project-{projectId}` |
| `deletePhaseTemplate(templateId)` | Delete template | `templateId: string (UUID)` | `{success}` | `phase-templates-{companyId}` |

---

### Tasks Domain

**File:** `app/actions/tasks.ts` (2898 lines)

Task CRUD, assignments, and bulk operations—largest action file.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `createTask(phaseId, data)` | Create task | `phaseId: UUID`, `{title, description?, priority?, due_date?, assignee_id?, depends_on?, estimated_hours?}` | `{success, taskId}` | `tasks-{projectId}`, `phase-{phaseId}` |
| `updateTask(taskId, data)` | Update task properties | `taskId: UUID`, `{title?, description?, priority?, due_date?, status?}` | `{success}` | `task-{taskId}`, `tasks-{projectId}` |
| `getTaskById(taskId)` | Fetch task with all metadata | `taskId: string (UUID)` | `{task: TaskWithDetails}` | — |
| `getProjectTasks(projectId, filters?)` | List project tasks | `projectId: UUID`, `filters?: {status?, assignee?, priority?}` | `{tasks: Task[]}` | `tasks-{projectId}` |
| `getPhaseTasks(phaseId)` | List phase tasks ordered | `phaseId: string (UUID)` | `{tasks: Task[]}` | `phase-{phaseId}` |
| `deleteTask(taskId)` | Archive task | `taskId: string (UUID)` | `{success}` | `tasks-{projectId}` |
| `bulkUpdateTaskStatus(taskIds, status)` | Update multiple tasks | `taskIds: UUID[]`, `status: TaskStatus` | `{success, updated}` | `tasks-{projectId}` |
| `assignTask(taskId, userId)` | Assign/unassign task | `taskId: UUID`, `userId?: UUID` | `{success}` | `task-{taskId}` |
| `duplicateTask(sourceTaskId, targetPhaseId?)` | Clone task | `sourceTaskId: UUID`, `targetPhaseId?: UUID` | `{success, newTaskId}` | `tasks-{projectId}` |

**Validation Schemas:**
- `createTaskSchema`: title, priority, due_date, estimated_hours, etc.
- `updateTaskSchema`: All fields optional

---

**File:** `app/actions/tasks-status.ts` (160 lines)

Task status transitions and workflow management.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `updateTaskStatus(taskId, status)` | Transition task status | `taskId: UUID`, `status: TaskStatus` | `{success}` | `task-{taskId}`, `tasks-{projectId}` |
| `getTaskStatusOptions(currentStatus)` | Get valid next statuses | `currentStatus: TaskStatus` | `{options: TaskStatus[]}` | — |

---

**File:** `app/actions/tasks-assignments.ts` (374 lines)

Task assignment management and workload balancing.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `assignTaskToUser(taskId, userId)` | Assign task to team member | `taskId: UUID`, `userId: UUID` | `{success, assignment}` | `task-{taskId}` |
| `unassignTask(taskId)` | Remove assignment | `taskId: string (UUID)` | `{success}` | `task-{taskId}` |
| `reassignTasks(sourceUserId, targetUserId, projectId?)` | Bulk reassign user's tasks | `sourceUserId: UUID`, `targetUserId: UUID`, `projectId?: UUID` | `{success, reassignedCount}` | `tasks-{projectId}` |
| `getUserTaskLoad(userId, projectId?)` | Get user's task count & hours | `userId: UUID`, `projectId?: UUID` | `{taskCount, estimatedHours, assignments}` | — |

---

**File:** `app/actions/tasks-activity.ts` (231 lines)

Task activity logging and change tracking.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `logTaskActivity(taskId, activityType, details)` | Record task change | `taskId: UUID`, `activityType: string`, `details: object` | `{success}` | — |
| `getTaskActivityLog(taskId, limit?)` | Fetch task change history | `taskId: string (UUID)`, `limit?: number` | `{activities: TaskActivity[]}` | — |

---

**File:** `app/actions/tasks-dependencies.ts` (217 lines)

Task dependencies and critical path analysis.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `addTaskDependency(taskId, dependsOnTaskId)` | Create task dependency | `taskId: UUID`, `dependsOnTaskId: UUID` | `{success}` | `task-{taskId}` |
| `removeTaskDependency(taskId, dependsOnTaskId)` | Remove dependency | `taskId: UUID`, `dependsOnTaskId: UUID` | `{success}` | `task-{taskId}` |
| `getTaskDependencies(taskId)` | Get task's blocking/blocked tasks | `taskId: string (UUID)` | `{dependsOn: Task[], blockedBy: Task[]}` | — |
| `calculateCriticalPath(projectId)` | Get critical path for project | `projectId: string (UUID)` | `{path: Task[]}` | — |

---

**File:** `app/actions/tasks-analytics.ts` (206 lines)

Task metrics, completion rates, and velocity.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `getTaskMetrics(projectId, dateRange?)` | Get task completion metrics | `projectId: UUID`, `dateRange?: {start, end}` | `{completed, inProgress, overdue, completionRate, velocity}` | — |
| `getTaskVelocity(projectId, periods?)` | Calculate task completion velocity | `projectId: UUID`, `periods?: number` | `{velocity: number[], trend: 'up'\|'down'\|'stable'}` | — |
| `getTasksOverdue(projectId)` | List overdue tasks | `projectId: string (UUID)` | `{tasks: Task[]}` | — |

---

**File:** `app/actions/tasks-spatial.ts` (259 lines)

Spatial marker linking and 3D model coordination.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `linkTaskToMarker(taskId, markerId)` | Associate task with 3D marker | `taskId: UUID`, `markerId: UUID` | `{success}` | `task-{taskId}` |
| `unlinkTaskFromMarker(taskId)` | Remove marker association | `taskId: string (UUID)` | `{success}` | `task-{taskId}` |
| `getTaskMarker(taskId)` | Get task's linked marker | `taskId: string (UUID)` | `{marker: SpatialMarker}` | — |

---

**File:** `app/actions/tasks-deferred.ts` (515 lines)

Background task processing and batch operations.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `deferTaskImport(csvData, projectId, jobId)` | Queue bulk task import | `csvData: string`, `projectId: UUID`, `jobId: string` | `{jobId, status}` | — |
| `getTaskImportStatus(jobId)` | Poll import progress | `jobId: string` | `{status, progress, result?, errors?}` | — |

---

**File:** `app/actions/task-types.ts` (328 lines)

Task type configuration and custom task categories.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `getTaskTypes()` | Fetch task type enum | — | `{types: TaskType[]}` | `task-types` |
| `getTaskTypeConfig(taskType)` | Get type metadata | `taskType: string` | `{config}` | — |

---

**File:** `app/actions/task-templates.ts` (347 lines)

Reusable task templates with predefined structure.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `createTaskTemplate(data)` | Create template | `{name, description?, type?, priority?, estimated_hours?}` | `{success, templateId}` | `task-templates-{companyId}` |
| `getTaskTemplates(type?)` | List templates | `type?: string` | `{templates: TaskTemplate[]}` | `task-templates-{companyId}` |
| `applyTaskTemplate(phaseId, templateId)` | Create task from template | `phaseId: UUID`, `templateId: UUID` | `{success, taskId}` | `tasks-{projectId}` |
| `deleteTaskTemplate(templateId)` | Delete template | `templateId: string (UUID)` | `{success}` | `task-templates-{companyId}` |

---

### Expenses Domain

**File:** `app/actions/expenses.ts` (1387 lines)

Expense submission, approval workflows, and budget tracking.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `createExpense(data)` | Submit new expense | `{description, amount, category, expense_date, project_id?, task_id?, vendor_name?, receipt_url?}` | `{success, expenseId}` | `expenses-{companyId}`, `project-{projectId}` |
| `updateExpense(data)` | Modify expense (draft/pending) | `id: UUID`, `{description?, amount?, category?, expense_date?, vendor_name?}` | `{success}` | `expenses-{companyId}` |
| `deleteExpense(expenseId)` | Delete/archive expense | `expenseId: string (UUID)` | `{success}` | `expenses-{companyId}` |
| `reviewExpense(data)` | Approve/reject expense | `id: UUID`, `status: 'approved'\|'rejected'`, `approval_notes?` | `{success}` | `expenses-{companyId}`, `project-{projectId}` |
| `getExpensesByCompany()` | List company expenses (with filters) | — | `{expenses: Expense[], totals}` | `expenses-{companyId}` |
| `getExpensesByProject(projectId)` | List project expenses | `projectId: string (UUID)` | `{expenses: Expense[], summary}` | `project-{projectId}` |
| `getExpenseById(expenseId)` | Fetch single expense | `expenseId: string (UUID)` | `{expense: ExpenseWithDetails}` | — |
| `getTaskExpenses(taskId)` | Get expenses linked to task | `taskId: string (UUID)` | `{expenses: Expense[]}` | — |
| `addExpenseLineItem(data)` | Add line item to expense | `expense_id: UUID`, `{description, quantity?, unit_price, material_id?, matched_by_ai?, match_confidence_score?}` | `{success, itemId}` | `expenses-{companyId}` |
| `deleteExpenseLineItem(lineItemId)` | Remove line item | `lineItemId: string (UUID)` | `{success}` | `expenses-{companyId}` |
| `processReceiptOCR(expenseId, file)` | Extract data from receipt image | `expenseId: UUID`, `file: File` | `{success, extractedData}` | — |
| `matchLineItemToMaterial(lineItemId, materialId)` | Link line item to catalog material | `lineItemId: UUID`, `materialId: UUID` | `{success}` | `expenses-{companyId}` |
| `getExpenseAnalytics(filters?)` | Get expense trends & breakdown | `filters?: {startDate?, endDate?, category?, projectId?}` | `{byCategory, byVendor, trend}` | — |
| `createExpenseFromTask(taskId)` | Create expense record from task | `taskId: string (UUID)` | `{success, expenseId}` | `expenses-{companyId}` |
| `createExpenseFromMaterial(data)` | Create expense from material assignment | `{material_assignment_id, quantity?, unit_price}` | `{success, expenseId}` | `expenses-{companyId}` |

**Validation Schemas:**
- `createExpenseSchema`: description, amount, category, expense_date, etc.
- `updateExpenseSchema`: All fields optional
- `reviewExpenseSchema`: id, status, approval_notes?
- `addLineItemSchema`: description, quantity?, unit_price, material_id?

---

### Materials Domain

**File:** `app/actions/materials.ts` (1817 lines)

Material catalog, assignments, and inventory tracking.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `createMaterial(data)` | Add to company catalog | `{product_name, unit_price, category?, unit_of_measure?, supplier?, product_image_url?}` | `{success, materialId}` | `materials-{companyId}` |
| `createMaterialFromHomeDepot(product)` | Import Home Depot product | `product: HomeDepotProduct` | `{success, materialId}` | `materials-{companyId}` |
| `getMaterialsByCompany()` | List company materials | — | `{materials: Material[]}` | `materials-{companyId}` |
| `getMaterialsByCategory(projectId)` | List materials for project | `projectId: string (UUID)` | `{materials: Material[]}` | — |
| `assignMaterialToTask(data)` | Assign material to task | `{task_id, material_id, quantity, unit_price?}` | `{success, assignmentId}` | `task-{taskId}`, `materials-{projectId}` |
| `updateMaterialAssignment(assignmentId, data)` | Update assignment quantity/price | `assignmentId: UUID`, `{quantity?, unit_price?}` | `{success}` | `materials-{projectId}` |
| `deleteMaterialAssignment(assignmentId)` | Remove material from task | `assignmentId: string (UUID)` | `{success}` | `materials-{projectId}` |
| `getMaterialAssignmentsByTask(taskId)` | Get task's material assignments | `taskId: string (UUID)` | `{assignments: MaterialAssignment[]}` | — |
| `getMaterialAssignmentsByProject(projectId)` | Get project's material assignments | `projectId: string (UUID)` | `{assignments: MaterialAssignment[]}` | `materials-{projectId}` |
| `getProjectMaterialSummary(projectId)` | Material needs rollup | `projectId: string (UUID)` | `{summary: {material_id, quantity, cost}}` | — |
| `updateMaterialQuantity(assignmentId, newQuantity)` | Update assignment quantity | `assignmentId: UUID`, `newQuantity: number` | `{success}` | `materials-{projectId}` |
| `addProductToTask(taskId, productId, quantity)` | Quick add Home Depot product | `taskId: UUID`, `productId: string`, `quantity: number` | `{success, assignmentId}` | `task-{taskId}` |
| `searchProducts(searchParams)` | Search Home Depot catalog | `{query, category?, limit?}` | `{products: HomeDepotProduct[]}` | — |
| `getProductDetails(productId)` | Get Home Depot product details | `productId: string` | `{product: HomeDepotProduct}` | — |
| `toggleTracking(materialId, track)` | Track/untrack material | `material_id: UUID`, `track: boolean` | `{success}` | `materials-{companyId}` |
| `getTrackedMaterials()` | Get materials on watch list | — | `{materials: Material[]}` | `materials-{companyId}` |
| `getMaterialSummaryStats()` | Dashboard material stats | — | `{needed, ordered, delivered, total}` | — |
| `updateMaterialLeadTime(materialId, leadTimeDays)` | Update lead time | `materialId: UUID`, `leadTimeDays: number` | `{success}` | `materials-{companyId}` |

---

### Chat & Messaging Domain

**File:** `app/actions/chat.ts` (2453 lines)

Messaging, reactions, attachments, and room management—second largest action file.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `sendMessage(formData)` | Send chat message | `formData: {chatRoomId, content, replyToId?, entityReferences?}` | `{success, message}` | `chat-{roomId}`, `chat-rooms` |
| `markMessagesAsRead(chatRoomId)` | Update last_read_at for room | `chatRoomId: string (UUID)` | `{success}` | `chat-{roomId}` |
| `getThreadMessages(parentMessageId)` | Get reply thread | `parentMessageId: string (UUID)` | `{messages: Message[]}` | — |
| `getMessageReplyCount(messageId)` | Get reply count for message | `messageId: string (UUID)` | `{count: number}` | — |
| `getMessageReplyCounts(messageIds)` | Batch reply counts | `messageIds: string[] (UUIDs)` | `{counts: {messageId: count}}` | — |
| `toggleReaction(messageId, emoji)` | Add/remove reaction | `messageId: UUID`, `emoji: string` | `{success}` | `chat-{roomId}` |
| `getMessageReactions(messageId)` | Get message reactions | `messageId: string (UUID)` | `{reactions: {emoji, count, userReacted}}` | — |
| `getMessagesReactions(messageIds)` | Batch reactions fetch | `messageIds: string[] (UUIDs)` | `{reactions: {messageId: {emoji, count}}}` | — |
| `uploadAttachment(formData)` | Upload message attachment | `formData: {messageId, file}` | `{success, attachment}` | — |
| `getMessageAttachments(messageId)` | Get message attachments | `messageId: string (UUID)` | `{attachments: Attachment[]}` | — |
| `deleteAttachment(attachmentId)` | Remove attachment | `attachmentId: string (UUID)` | `{success}` | — |
| `getMessagesAttachments(messageIds)` | Batch fetch attachments | `messageIds: string[] (UUIDs)` | `{attachments: {messageId: Attachment[]}}` | — |
| `muteChatRoom(data)` | Mute/unmute room notifications | `roomId: UUID`, `mutedUntil?: ISO string` | `{success}` | `chat-{roomId}` |
| `createDMRoom(recipientUserId)` | Create 1-on-1 chat | `recipientUserId: string (UUID)` | `{success, roomId}` | `chat-rooms` |
| `editMessage(messageId, newContent)` | Edit sent message | `messageId: UUID`, `newContent: string` | `{success}` | `chat-{roomId}` |
| `deleteMessage(messageId)` | Soft-delete message | `messageId: string (UUID)` | `{success}` | `chat-{roomId}` |
| `updateChatRoom(data)` | Update room name/description | `roomId: UUID`, `{name?, description?}` | `{success}` | `chat-{roomId}` |
| `exportTranscript(roomId)` | Download chat history | `roomId: string (UUID)` | `{success, downloadUrl}` | — |
| `getChatRoomParticipants(roomId)` | Get room members | `roomId: string (UUID)` | `{participants: User[]}` | — |

**Validation Schemas:**
- `sendMessageSchema`: chatRoomId, content (1-10000 chars), replyToId?, entityReferences?
- `toggleReactionSchema`: messageId, emoji
- `muteChatRoomSchema`: chatRoomId, mutedUntil?
- `createDMRoomSchema`: recipientUserId
- `editMessageSchema`: messageId, newContent
- `deleteMessageSchema`: messageId
- `updateChatRoomSchema`: roomId, name?, description?
- `exportTranscriptSchema`: roomId

---

**File:** `app/actions/chat-queries.ts` (627 lines)

Chat data queries and subscriptions (read-only).

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `getCurrentUserContext()` | Get authenticated user info | — | `{userId, userName, companyId}` | — |
| `getChatRooms()` | Get user's chat rooms with metadata | — | `{rooms: ChatRoomWithUnread[]}` | `chat-rooms` |
| `getMessages(input)` | Get paginated room messages | `{chatRoomId, cursor?, limit?}` | `{messages: Message[], nextCursor?}` | — |
| `getCompanyUsers()` | Get users for New DM selection | — | `{users: User[]}` | `team-members-{companyId}` |
| `getMessageWithDetailsRpc(messageId)` | Get message with sender via RPC | `messageId: string (UUID)` | `{message: MessageWithSender}` | — |
| `getMessageById(messageId)` | Get message (legacy, deprecated) | `messageId: string (UUID)` | `{message: MessageWithSender}` | — |

**Validation Schemas:**
- `getMessagesSchema`: chatRoomId (UUID), cursor?, limit (1-100, default 50)
- `getMessageByIdSchema`: messageId (UUID)

---

**File:** `app/actions/chat-search.ts` (620 lines)

Full-text search across projects, tasks, materials, expenses, and messages.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `searchProjects(query)` | Search projects by name | `query: string (1-100 chars)` | `{results: ProjectSearchResult[]}` | — |
| `searchTasks(query, projectId?)` | Search tasks | `query: string`, `projectId?: UUID` | `{results: TaskSearchResult[]}` | — |
| `searchMaterials(query)` | Search catalog materials | `query: string (1-100 chars)` | `{results: MaterialSearchResult[]}` | — |
| `searchExpenses(query)` | Search expenses | `query: string (1-100 chars)` | `{results: ExpenseSearchResult[]}` | — |
| `searchUsers(query, roomId)` | Search chat room participants | `query: string (1-100 chars)`, `roomId: UUID` | `{results: UserSearchResult[]}` | — |
| `searchMessages(query, chatRoomId?)` | Full-text message search with snippets | `query: string (1-500 chars)`, `chatRoomId?: UUID` | `{results: MessageSearchResult[]}` | — |

**Security:** Full-text search on messages uses `type: 'plain'` to prevent tsquery injection.

---

### Estimates Domain

> AI-powered construction estimating module. Phase 1 + Phase 2 complete as of 2026-02-16.

**File:** `app/actions/estimates.ts`

| Function | Purpose | Input | Returns |
|----------|---------|-------|---------|
| `createEstimate(data)` | Create new estimate | `{project_id, name, description?}` | `{success, data: Estimate}` |
| `updateEstimate(id, data)` | Update estimate metadata or line items | `{id, ...fields}` | `{success, data}` |
| `deleteEstimate(id)` | Archive estimate | `id: UUID` | `{success}` |
| `getEstimatesByProject(projectId)` | List estimates for project | `projectId: UUID` | `{success, data: Estimate[]}` |
| `getEstimateById(id)` | Fetch single estimate with line items | `id: UUID` | `{success, data: EstimateWithItems}` |
| `uploadPlan(formData)` | Upload PDF/image plan for AI parsing | `FormData: {estimateId, file}` | `{success, planUploadId}` |
| `parseEstimateFromPlan(planUploadId)` | Trigger AI extraction of line items | `planUploadId: UUID` | `{success, jobId}` |
| `updateLineItem(id, data)` | Modify a line item | `{id, quantity?, unit_cost?, ...}` | `{success}` |
| `deleteLineItem(id)` | Remove line item | `id: UUID` | `{success}` |
| `addLineItem(data)` | Manually add line item | `{estimate_id, trade, description, quantity, unit, unit_cost}` | `{success, data}` |

**File:** `app/actions/estimate-chat.ts`

| Function | Purpose |
|----------|---------|
| `sendChatMessage(estimateId, content)` | Send user message, get AI response |
| `getChatHistory(estimateId)` | Fetch all messages for estimate |

**File:** `app/actions/assemblies.ts`

| Function | Purpose |
|----------|---------|
| `getAssemblies(estimateId)` | List assemblies + items |
| `createAssembly(data)` | Create named assembly bundle |
| `addAssemblyItem(data)` | Add item to assembly |
| `applyAssemblyToEstimate(assemblyId, estimateId)` | Expand assembly into estimate line items |
| `deleteAssembly(id)` | Remove assembly |

**File:** `app/actions/revisions.ts`

| Function | Purpose |
|----------|---------|
| `createRevision(data)` | Create revision comparing two estimate versions |
| `getRevisions(estimateId)` | List revisions for estimate |
| `applyRevisionChanges(revisionId, changeIds)` | Accept selected diff changes |

**File:** `app/actions/budget-conversion.ts`

| Function | Purpose |
|----------|---------|
| `convertEstimateToBudget(estimateId)` | Create draft Budget from approved estimate |
| `getBudgetsByProject(projectId)` | List project budgets |
| `updateBudget(id, data)` | Update budget metadata |
| `approveBudget(id)` | Lock budget for tracking |

**File:** `app/actions/templates.ts`

| Function | Purpose |
|----------|---------|
| `getPricingTemplates(category?)` | List company pricing templates |
| `createTemplate(data)` | Create new template with line items |
| `applyTemplateToEstimate(templateId, estimateId)` | Import template line items |
| `updateTemplate(id, data)` | Update template + increment version |
| `deleteTemplate(id)` | Archive template |

**File:** `app/actions/material-suggestions.ts`

| Function | Purpose |
|----------|---------|
| `getMaterialSuggestions(lineItemId)` | AI-match line item description to materials catalog |
| `linkLineItemToMaterial(lineItemId, materialId)` | Confirm match |

---

### Estimates API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `app/api/estimates/upload/route.ts` | POST | Upload plan file to Supabase Storage |
| `app/api/estimates/parse/route.ts` | POST | Trigger AI plan parsing (returns streaming progress) |
| `app/api/estimates/extract/route.ts` | POST | AI line item extraction from plan |
| `app/api/estimates/extraction-progress/route.ts` | GET | Poll extraction job status |
| `app/api/estimates/export-pdf/route.ts` | GET | Download estimate as PDF |
| `app/api/estimates/takeoff-items/route.ts` | GET/POST | CRUD for takeoff overlay annotations |

---

### Dashboard Domain

**File:** `app/actions/dashboard.ts` (450 lines)

Dashboard KPI aggregation and cache invalidation.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `getDashboardData()` | Get aggregated dashboard KPIs | — | `{data: DashboardData}` | `dashboard`, `dashboard-kpis` |
| `invalidateDashboardCache(input?)` | Refresh dashboard cache | `companyId?: UUID` | `void` | Invalidates `dashboard`, `dashboard-{companyId}` |

**Performance:** Uses `mv_dashboard_kpis` materialized view for ~50-100ms query time.

**Data Returned:**
- KPIs: active projects, tasks, budget, schedule health, expenses, team size
- Project status breakdown (active, on_hold, completed, archived)
- Task progress (total, completed, in progress, overdue, blocked)
- Budget summary (planned, actual, variance, by category)
- Schedule health (on time, at risk, delayed)
- Team activity (top assignees, unassigned tasks)
- Materials status (needed, ordered, delivered)
- Quick action data (projects, team members)

---

### Spatial & 3D Models Domain

**File:** `app/actions/spatial.ts` (1970 lines)

3D model management, marker placement, and spatial coordination.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `uploadModel(formData)` | Upload IFC/glTF model | `formData: {projectId, file, modelName?}` | `{success, modelId, processingStatus}` | `spatial-{projectId}` |
| `convertModel(modelId, targetFormat)` | Convert between formats | `modelId: UUID`, `targetFormat: string` | `{success, conversionId}` | `spatial-{projectId}` |
| `getProjectModels(projectId)` | List project 3D models | `projectId: string (UUID)` | `{models: Project3DModel[]}` | `spatial-{projectId}` |
| `setActiveModel(projectId, modelId)` | Set primary model for project | `projectId: UUID`, `modelId: UUID` | `{success}` | `spatial-{projectId}` |
| `createMarker(data)` | Place 3D marker | `{project_id, model_id, task_id?, position_x/y/z, normal_x/y/z, element_id?, title?, description?, type?}` | `{success, markerId}` | `spatial-{projectId}` |
| `updateMarker(markerId, data)` | Update marker metadata | `markerId: UUID`, `{task_id?, title?, description?, status?}` | `{success}` | `spatial-{projectId}` |
| `deleteMarker(markerId)` | Remove marker | `markerId: string (UUID)` | `{success}` | `spatial-{projectId}` |
| `getProjectMarkers(projectId)` | Get all markers for project | `projectId: string (UUID)` | `{markers: SpatialMarker[]}` | `spatial-{projectId}` |
| `getMarkersByTask(taskId)` | Get markers for task | `taskId: string (UUID)` | `{markers: SpatialMarker[]}` | — |
| `getFloors(modelId)` | Get model floors/stories | `modelId: string (UUID)` | `{floors: Floor[]}` | — |

---

**File:** `app/actions/default-models.ts` (761 lines)

System & company default 3D model management.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `getSystemDefaultModel(projectType)` | Get system default by type | `projectType: string` | `{model: Default3DModel}` | — |
| `getCompanyDefaultModel(projectType)` | Get company custom default | `projectType: string` | `{model: Project3DModel}` | — |
| `assignDefaultModel(data)` | Assign default to new project | `{projectId, projectType}` | `{model: Project3DModel}` | `spatial-{projectId}` |
| `createMarkersFromDefaultConfigs(data)` | Create markers from template | `{projectId, modelId, tasks}` | `{markers: SpatialMarker[]}` | `spatial-{projectId}` |
| `getDefaultModelsForCompany()` | Get all defaults (system + custom) | — | `{data: DefaultModelInfo[]}` | `default-models-{companyId}` |
| `uploadCompanyDefaultModel(data)` | Upload custom default (admin only) | `{projectTypeConfigId, formData}` | `{success, error?}` | `default-models-{companyId}` |
| `resetToSystemDefault(data)` | Deactivate company custom | `{projectTypeConfigId}` | `{success}` | `default-models-{companyId}` |

---

### Integrations Domain

**File:** `app/actions/kakao.ts` (153 lines)

Kakao Sync integration for real-time chat sync.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `getKakaoConnection()` | Check Kakao integration status | — | `{connected, accountId?}` | — |
| `updateTwoWaySync(enabled)` | Enable/disable bi-directional sync | `enabled: boolean` | `{success}` | — |
| `disconnectKakao()` | Remove Kakao connection | — | `{success}` | — |

---

**File:** `app/actions/stripe.ts` (124 lines)

Stripe payment integration.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `initializePayment(amount, planId?)` | Create Stripe checkout session | `amount: number`, `planId?: string` | `{sessionId}` | — |
| `getPaymentStatus(sessionId)` | Check payment status | `sessionId: string` | `{status, subscription?}` | — |

---

### Settings Domain

**File:** `app/actions/owner.ts` (410 lines)

Owner/admin settings and company configuration.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `isOwner()` | Check if authenticated user is company owner | — | `{isOwner: boolean}` | — |
| `getAllCompanies()` | Get all companies (owner only) | — | `{companies: Company[]}` | — |

---

**File:** `app/actions/client.ts` (106 lines)

Client portal permissions and visibility settings.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `getClientPermissions(projectId)` | Get client portal visibility settings | `projectId: UUID` | `{data: ClientPermissions}` | — |

**Permissions:**
- `can_view_budget`: Show project budget to client
- `can_approve_change_orders`: Future feature
- `can_view_invoices`: Future feature

---

### Push Notifications Domain

**File:** `app/actions/push.ts` (181 lines)

Web push notification subscription and delivery.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `subscribeToPushNotifications(subscription)` | Register device for push | `subscription: PushSubscription` | `{success}` | — |
| `unsubscribeFromPushNotifications()` | Unregister device | — | `{success}` | — |
| `sendNotification(title, options?)` | Send test notification | `title, options?: {body, icon}` | `{success}` | — |

---

### Seed/Demo Data

**File:** `app/actions/seed-demo-data.ts` (479 lines)

Development helper to create demo data for testing.

| Function | Purpose | Input | Returns | Cache Tags |
|----------|---------|-------|---------|------------|
| `seedDemoData()` | Create sample projects, tasks, team | — | `{success, created: {projects, tasks, team}}` | All |

---

## API Routes Reference

HTTP endpoints for specialized operations requiring raw request/response handling.

### Authentication

**Route:** `app/api/auth/[...nextauth]/route.ts`

- **Method:** `GET/POST`
- **Purpose:** NextAuth.js auth endpoints (sign-in, callback, session)
- **Auth:** NextAuth session
- **Providers:** Credentials (magic link), Google OAuth, Email
- **Response:** JSON session data, redirects to app

---

### Health Check

**Route:** `app/api/health/route.ts`

- **Method:** `GET`
- **Purpose:** Application health probe for monitoring/Docker
- **Auth:** None
- **Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600
}
```

---

### File Uploads

**Route:** `app/api/project-photos/upload/route.ts`

- **Method:** `POST`
- **Purpose:** Upload project photos with thumbnail generation
- **Auth:** NextAuth session
- **Request:** `FormData` with `file`, `projectId`, `category`, `tags`, `clientVisible`
- **Response:** `{success, photoUrl, thumbnailUrl}`
- **Limits:** 10MB max, image/* only
- **Storage:** Supabase Storage → `project-files/{companyId}/projects/{projectId}/photos/`

---

**Route:** `app/api/project-files/upload/route.ts`

- **Method:** `POST`
- **Purpose:** Upload project documents (PDFs, DOC, XLS)
- **Auth:** NextAuth session
- **Request:** `FormData` with `file`, `projectId`, `documentType`
- **Response:** `{success, fileUrl, fileId}`
- **Limits:** 50MB max
- **Storage:** Supabase Storage

---

**Route:** `app/api/spatial/upload-photo/route.ts`

- **Method:** `POST`
- **Purpose:** Upload photo for 3D model integration
- **Auth:** NextAuth session
- **Request:** `FormData` with `file`, `projectId`, `markerId?`
- **Response:** `{success, photoUrl}`

---

**Route:** `app/api/spatial/upload-file/route.ts`

- **Method:** `POST`
- **Purpose:** Upload IFC/glTF model file
- **Auth:** NextAuth session
- **Request:** `FormData` with `file`, `projectId`, `modelName?`
- **Response:** `{success, modelId, processingStatus: 'uploading|processing|ready'}`
- **Processing:** Async conversion to XKT for viewer

---

**Route:** `app/api/spatial/convert-model/route.ts`

- **Method:** `POST`
- **Purpose:** Convert 3D model format (IFC → XKT)
- **Auth:** NextAuth session
- **Request:** `{modelId, sourceFormat, targetFormat}`
- **Response:** `{success, conversionId, status}`
- **Async:** Job-based, poll via `getConversionStatus`

---

**Route:** `app/api/project-files/bulk-download/route.ts`

- **Method:** `GET`
- **Purpose:** Download multiple files as ZIP
- **Auth:** NextAuth session
- **Query:** `projectId`, `fileIds[]`
- **Response:** ZIP file binary
- **Async:** Streaming download, handled server-side

---

### Webhooks

**Route:** `app/api/webhook/stripe/route.ts`

- **Method:** `POST`
- **Purpose:** Stripe payment event handler
- **Auth:** Stripe signature verification (`stripe-signature` header + `STRIPE_WEBHOOK_SECRET`)
- **Events Handled:**
  - `checkout.session.completed`: Subscription created, save to `stripe_customers`
  - `customer.subscription.updated`: Plan changed, update subscription
  - `customer.subscription.deleted`: Cancel subscription, set `plan_active: false`
  - `invoice.payment_succeeded`: Payment processed
  - `invoice.payment_failed`: Retry logic (Stripe handles)
  - `charge.refunded`: Refund processed
- **Response:** `{statusCode: 200, message: 'success'}`

---

**Route:** `app/api/kakao/webhook/route.ts`

- **Method:** `POST`
- **Purpose:** Kakao Sync webhook for chat message events
- **Auth:** Kakao signature verification
- **Events:** New messages, edits, deletions
- **Processing:** Mirror to GenHub chat_rooms

---

### Cron Jobs

**Route:** `app/api/cron/update-material-prices/route.ts`

- **Method:** `GET`
- **Purpose:** Daily material price sync from Home Depot API (Vercel Cron)
- **Auth:** Bearer token (`Authorization: Bearer {CRON_SECRET}`)
- **Schedule:** Daily 2 AM UTC (configured in `vercel.json`)
- **Logic:**
  1. Fetch materials with `home_depot_product_id IS NOT NULL`
  2. For each material, call Home Depot API
  3. If price/stock changed, update material + insert `material_price_history`
  4. Apply 100ms delay between API calls (rate limiting)
- **Response:**
```json
{
  "success": true,
  "updated": 25,
  "errors": 2,
  "total": 150,
  "errorDetails": [{materialId, error}]
}
```

---

**Route:** `app/api/cron/cleanup-price-history/route.ts`

- **Method:** `GET`
- **Purpose:** Delete old price history (older than 90 days)
- **Auth:** Bearer token (`CRON_SECRET`)
- **Schedule:** Weekly (Monday 3 AM UTC)
- **Response:** `{success, deletedCount}`

---

### Feature Flags

**Route:** `app/api/feature-flags/route.ts`

- **Method:** `GET`
- **Purpose:** Get feature flag status for client UI
- **Auth:** NextAuth session
- **Query Params:**
  - No params: Return all flags
  - `?flag=spatial_viewer_enabled`: Get specific flag
- **Response:**
```json
{
  "flags": [
    {
      "flag": "spatial_viewer_enabled",
      "enabled": true,
      "description": "3D model viewer component"
    }
  ]
}
```
- **Flags:**
  - `spatial_viewer_enabled`
  - `ai_expense_matcher`
  - `kakao_integration`
  - `analytics_dashboard`

---

### Company Data

**Route:** `app/api/companies/[companyId]/subcontractors/route.ts`

- **Method:** `GET`
- **Purpose:** List company subcontractors (for embeds/exports)
- **Auth:** NextAuth session (company membership required)
- **Response:** `{subcontractors: [{id, name, email, specialties}]}`

---

**Route:** `app/api/companies/[companyId]/users/route.ts`

- **Method:** `GET`
- **Purpose:** List company users (for team selection, admin panel)
- **Auth:** NextAuth session (admin required)
- **Response:** `{users: [{id, name, email, role, status}]}`

---

### Chat Integration

**Route:** `app/api/chat/entity-preview/route.ts`

- **Method:** `GET`
- **Purpose:** Generate preview for @mentions (task, project, expense)
- **Auth:** NextAuth session
- **Query:** `type=task|project|expense`, `id=UUID`
- **Response:**
```json
{
  "type": "task",
  "id": "uuid",
  "title": "Task name",
  "summary": "Status, assignee, due date",
  "icon": "icon-name"
}
```

---

### Profile

**Route:** `app/api/profile/route.ts`

- **Method:** `GET`
- **Purpose:** Get authenticated user's profile
- **Auth:** NextAuth session
- **Response:** `{id, name, email, avatar_url, role, company_id}`

---

### Payments

**Route:** `app/api/(payment)/checkout/route.ts`

- **Method:** `POST`
- **Purpose:** Create Stripe checkout session
- **Auth:** NextAuth session
- **Request:** `{planId, recurring: boolean}`
- **Response:** `{sessionId, checkoutUrl}`

---

**Route:** `app/api/(payment)/refund/route.ts`

- **Method:** `POST`
- **Purpose:** Process refund request
- **Auth:** NextAuth session + owner role
- **Request:** `{chargeId, refundAmount?, reason?}`
- **Response:** `{success, refundId}`

---

### Testing

**Route:** `app/api/test/auth/route.ts`

- **Method:** `GET`
- **Purpose:** Debug auth state (development only)
- **Response:** `{authenticated: boolean, userId?, email?}`

---

## Validation Schemas

Zod schemas used across Server Actions for input validation.

### Authentication

```typescript
// Invitation tokens
validateTokenSchema = z.object({
  token: z.string().uuid("Invalid invitation token format")
})

acceptInviteSchema = z.object({
  token: z.string().uuid("Invalid invitation token format")
})
```

### Entity Creation

```typescript
createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  project_type: z.enum(['residential', 'commercial', ...]),
  status: z.enum(['planning', 'active', 'on_hold', 'completed']).optional(),
  budget: z.number().min(0).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  client_id: z.string().uuid().optional()
})

createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  due_date: z.string().datetime().optional(),
  assignee_id: z.string().uuid().optional(),
  estimated_hours: z.number().min(0).optional(),
  depends_on: z.string().uuid().optional()
})

createExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().min(0.01),
  category: z.enum(['materials', 'labor', 'equipment', 'permits', 'transportation', 'meals', 'lodging', 'other']),
  expense_date: z.string(),
  project_id: z.string().uuid().optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  vendor_name: z.string().optional().nullable(),
  receipt_url: z.string().url().optional().nullable()
})
```

### Chat

```typescript
sendMessageSchema = z.object({
  chatRoomId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  replyToId: z.string().uuid().optional().nullable(),
  entityReferences: z.array(z.object({
    type: z.enum(['user', 'task', 'project', 'material', 'expense']),
    id: z.string().uuid()
  })).optional().nullable()
})

muteChatRoomSchema = z.object({
  chatRoomId: z.string().uuid(),
  mutedUntil: z.string().datetime().nullable()
})
```

### Search

```typescript
searchQuerySchema = z.object({
  query: z.string().min(1).max(100)
})

searchTasksSchema = z.object({
  query: z.string().min(1).max(100),
  projectId: z.string().uuid().optional().nullable()
})

searchMessagesSchema = z.object({
  query: z.string().min(1).max(500),
  chatRoomId: z.string().uuid().optional().nullable()
})
```

---

## Error Response Patterns

Standardized error handling via discriminated union types in `/types/server-actions.ts`.

### Pattern 1: ActionResult<T>

Standard action with data on success, error message on failure.

```typescript
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Usage
const result = await getProject(projectId);
if (result.success) {
  console.log(result.data); // T
} else {
  console.error(result.error); // string
}
```

---

### Pattern 2: MutationResult

For operations where only success/failure matters (delete, update).

```typescript
export type MutationResult =
  | { success: true }
  | { success: false; error: string }

// Usage
const result = await deleteProject(projectId);
if (!result.success) {
  showError(result.error);
}
```

---

### Pattern 3: FormActionResult<T>

For form submissions with optional field-level validation errors.

```typescript
export type FormActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// Usage
const result = await createTask(formData);
if (result.success) {
  // Success
} else {
  // fieldErrors may contain ["Title is required", "Invalid due date"]
  Object.entries(result.fieldErrors || {}).forEach(([field, errors]) => {
    setFieldError(field, errors[0]);
  });
}
```

---

### Pattern 4: Custom Result Types (Legacy)

Some actions use custom patterns for backward compatibility:

```typescript
// Type-specific patterns
type ValidateTokenResult =
  | { success: true; invitation: InvitationData }
  | { success: false; error: string }

type ClientPermissions = {
  can_view_budget: boolean;
  can_approve_change_orders: boolean;
  can_view_invoices: boolean;
}

// Query results without discriminator
export async function getClientPermissions() {
  return { data: ClientPermissions }; // No success field
}
```

---

### Error Handling Examples

```typescript
// Within Server Action
try {
  const { data: user } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  return { success: true, data: user };
} catch (error) {
  console.error('Database error:', error);
  return { success: false, error: 'Failed to fetch user profile' };
}

// In Component
const handleSave = async () => {
  const result = await updateProject(projectId, formData);
  if (result.success) {
    toast.success('Project updated');
    revalidatePath('/app/projects');
  } else {
    toast.error(result.error); // User-facing message
  }
}
```

---

## Cache Invalidation Matrix

Maps which Server Actions invalidate which cache tags.

| Action | Invalidates | Tags |
|--------|------------|------|
| **Projects** |
| createProject | — | `projects-{companyId}`, `projects` |
| updateProject | — | `projects-{companyId}`, `project-{projectId}` |
| updateProjectStatus | — | `projects-{companyId}`, `project-{projectId}` |
| updateProjectBudget | — | `projects-{companyId}`, `project-{projectId}`, `dashboard` |
| deleteProject | — | `projects-{companyId}` |
| **Tasks** |
| createTask | — | `tasks-{projectId}`, `phase-{phaseId}`, `dashboard` |
| updateTask | — | `task-{taskId}`, `tasks-{projectId}` |
| updateTaskStatus | — | `task-{taskId}`, `tasks-{projectId}`, `dashboard` |
| assignTask | — | `task-{taskId}`, `tasks-{projectId}` |
| deleteTask | — | `tasks-{projectId}` |
| **Expenses** |
| createExpense | — | `expenses-{companyId}`, `project-{projectId}`, `dashboard` |
| updateExpense | — | `expenses-{companyId}` |
| reviewExpense (approve) | — | `expenses-{companyId}`, `project-{projectId}`, `dashboard` |
| deleteExpense | — | `expenses-{companyId}` |
| **Team** |
| inviteTeamMembers | — | `team-{companyId}`, `team-invitations-{companyId}` |
| updateMemberRole | — | `team-{companyId}`, `dashboard` |
| removeMemberFromCompany | — | `team-{companyId}` |
| **Chat** |
| sendMessage | — | `chat-{roomId}`, `chat-rooms` |
| editMessage | — | `chat-{roomId}` |
| deleteMessage | — | `chat-{roomId}` |
| **Materials** |
| createMaterial | — | `materials-{companyId}` |
| assignMaterialToTask | — | `task-{taskId}`, `materials-{projectId}`, `dashboard` |
| updateMaterialAssignment | — | `materials-{projectId}` |
| **Phases** |
| createPhase | — | `phases-{projectId}`, `project-{projectId}`, `dashboard` |
| updatePhase | — | `phases-{projectId}` |
| **Dashboard** |
| invalidateDashboardCache | Called by mutations | `dashboard`, `dashboard-kpis`, `dashboard-{companyId}` |

---

## Sequence Diagrams

### Task Creation Flow

```mermaid
sequenceDiagram
  participant User as User Component
  participant SA as createTask<br/>(Server Action)
  participant DB as Supabase DB
  participant Cache as Next.js Cache

  User->>SA: createTask(phaseId, data)
  SA->>SA: Validate input (Zod schema)
  SA->>DB: Verify user in company
  SA->>DB: Verify phase ownership
  SA->>DB: INSERT tasks row
  DB-->>SA: {success, taskId}
  SA->>Cache: revalidateTag('tasks-{projectId}')
  SA->>Cache: revalidateTag('phase-{phaseId}')
  SA->>Cache: revalidateTag('dashboard')
  SA-->>User: {success: true, taskId}
  User->>User: Update local state
  User->>User: Show success toast
```

### Expense Approval Flow

```mermaid
sequenceDiagram
  participant Approver as GC Admin
  participant SA as reviewExpense<br/>(Server Action)
  participant DB as Supabase DB
  participant Email as Email Service
  participant Cache as Next.js Cache

  Approver->>SA: reviewExpense(expenseId, 'approved', notes?)
  SA->>SA: Validate approval data
  SA->>DB: Verify approver is admin
  SA->>DB: Fetch expense record
  SA->>DB: UPDATE expenses SET status='approved'
  SA->>DB: INSERT into expense_approvals
  SA->>Email: Send approval email to submitter
  SA->>Cache: revalidateTag('expenses-{companyId}')
  SA->>Cache: revalidateTag('project-{projectId}')
  SA->>Cache: revalidateTag('dashboard')
  SA-->>Approver: {success: true}
```

### Team Invitation Flow

```mermaid
sequenceDiagram
  participant Admin as GC Admin
  participant SA as inviteTeamMembers<br/>(Server Action)
  participant DB as Supabase DB
  participant Email as Email Service

  Admin->>SA: inviteTeamMembers([{email, name}], role)
  SA->>SA: Validate members array
  SA->>DB: Verify admin role
  loop For each email
    SA->>DB: Check email not already member
    SA->>DB: INSERT team_invitations with token
    SA->>Email: Send invitation email with link
  end
  SA-->>Admin: {results: [{email, status, error?}]}

  Note over Email: User receives email with unique token
  Email-->>User: Click accept invitation link
  User->>SA: acceptInvitation(token)
  SA->>SA: Verify token not expired/used
  SA->>SA: Verify user email matches invitation
  SA->>DB: INSERT user_profiles (upsert)
  SA->>DB: INSERT company_users
  SA->>DB: UPDATE invitations SET used_at
  SA-->>User: {success: true}
```

---

## Optimization Signals

Key performance patterns and anti-patterns identified in the codebase.

### Materialized Views (Good)

**Pattern:** `mv_dashboard_kpis` used by `getDashboardData`

- **Benefit:** Aggregates 6+ table joins into 1 query (~50-100ms)
- **Trigger:** Materialized view refreshed by `refresh_dashboard_kpis()` RPC
- **Trade-off:** ~5-minute freshness window vs. real-time accuracy
- **Recommendation:** Use for other read-heavy dashboards (team activity, materials status)

---

### RPC Functions (Good)

**Pattern:** `get_chat_rooms_with_metadata`, `get_message_with_details` used instead of PostgREST

- **Benefit:** SQL stored procedures combine multi-level joins + aggregations
- **Reduces:** N+1 query patterns (e.g., rooms + unread counts + last message + participant count)
- **Trade-off:** Requires database knowledge, harder to debug
- **Recommendation:** Use for complex queries with 5+ joins/aggregations

---

### Parallel Queries (Good)

**Pattern:** `Promise.all()` for independent fetches in `getDashboardData`, `getDefaultModelsForCompany`

```typescript
const [topAssignees, quickActionData, expensesByCategory] = await Promise.all([
  getTopAssignees(supabase, companyId),
  getQuickActionData(supabase, companyId),
  getExpensesByCategory(supabase, companyId),
]);
```

- **Benefit:** Cuts execution time by N (from serial 3s to parallel 1s)
- **Prerequisite:** Queries are independent (no cross-dependencies)
- **Recommendation:** Apply to all action queries with 3+ independent fetches

---

### Batch Fetching (Good)

**Pattern:** `.in('id', Array.from(senderIds))` in `chat-queries.ts`

```typescript
// Before: N+1 fetches
for (const senderId of senderIds) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select()
    .eq('id', senderId)
    .single();
}

// After: 1 batch fetch
const { data: profiles } = await supabase
  .from('user_profiles')
  .select()
  .in('id', Array.from(senderIds));
```

- **Benefit:** O(N) queries → O(1) query with processing
- **Trade-off:** Requires in-memory data structure (map lookup)
- **Recommendation:** Use for anything with 5+ items to fetch related data for

---

### Full-Text Search Security (Good)

**Pattern:** `textSearch('column', query, {type: 'plain'})` in `chat-search.ts`

- **Benefit:** Prevents tsquery injection via special characters (`:`, `!`, `&`, `|`, `()`)
- **Type 'websearch':** Vulnerable to injection
- **Type 'plain':** Automatically escapes and converts to tsquery safely
- **Recommendation:** Always use `type: 'plain'` for user input in FTS

---

### Atomic Operations (Good)

**Pattern:** Invasion check in `acceptInvitation`

```typescript
const { data: markedInvitation } = await supabase
  .from("team_invitations")
  .update(updateData)
  .eq("id", invitation.invitationId)
  .is("used_at", null) // Atomic: Only update if not already used
  .gt("expires_at", new Date().toISOString()) // Atomic: Only if not expired
```

- **Benefit:** Prevents replay attacks (same token used twice)
- **Mechanism:** Conditional UPDATE prevents race conditions
- **Recommendation:** Use for single-use tokens, state transitions

---

### N+1 Anti-Pattern (Bad)

**Found in:** Legacy code paths

```typescript
// BAD: N+1 queries
const projects = await fetchProjects();
for (const project of projects) {
  const stats = await fetchProjectStats(project.id); // N additional queries
}

// GOOD: Join or batch fetch
const projects = await supabase
  .from('projects')
  .select('*, project_stats(*)') // Join in single query
```

- **Impact:** 1 + N queries instead of 1 query
- **Symptoms:** Slow dashboards, timeouts on large datasets
- **Recommendation:** Audit all loops with DB queries, use joins instead

---

### Memory Inefficiency (Bad)

**Pattern:** Streaming file uploads (good)

```typescript
// File object supports streaming via Supabase SDK
const { error } = await supabase.storage
  .from("project-files")
  .upload(photoPath, file, { upsert: false }); // File is streamed, not buffered
```

- **Benefit:** 10MB file uses ~20MB RAM (stream) vs ~40MB RAM (buffer)
- **Bad Pattern:** Not reading file into buffer in initial upload
- **Recommendation:** Let SDK handle streaming; avoid `await file.arrayBuffer()`

---

### Cron Rate Limiting (Good)

**Pattern:** Material price update cron adds 100ms delay between API calls

```typescript
for (const material of materials) {
  // Fetch and update...
  await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
}
```

- **Benefit:** Prevents Home Depot API throttling
- **Trade-off:** Slower cron (2 hours for 1000 materials)
- **Recommendation:** Add to all external API loops; document rate limits

---

### Cache Invalidation Coverage

**Pattern:** Comprehensive tag invalidation after mutations

```typescript
revalidateTag("expenses-{companyId}");  // Expense list
revalidateTag("project-{projectId}");   // Project page (uses expenses widget)
revalidateTag("dashboard");              // Dashboard (expense metrics)
```

- **Benefit:** Stale data avoided in dependent views
- **Missing:** Some mutations don't invalidate dashboard (consider impact)
- **Recommendation:** Add dashboard invalidation to all mutations affecting KPIs

---

### Testing Gaps

- **No server action unit tests** found (consider adding with mock Supabase)
- **No API route tests** found (consider adding with MSW)
- **E2E tests** in `npm test` (Playwright)

---

## Performance Recommendations

1. **Dashboard KPI Refresh:** Consider on-demand refresh via `invalidateDashboardCache()` after bulk operations
2. **Chat Message Pagination:** Cursor-based pagination working; consider prefetching next page on scroll
3. **Search:** Full-text search via PostgreSQL; consider Algolia for multi-language support
4. **File Uploads:** Streaming working; consider resumable uploads for >100MB files
5. **Webhooks:** Consider retry logic for Stripe/Kakao failures
6. **Cron Jobs:** Add error alerting (email/Slack) when update count is 0 (possible API outage)

---

## Reference

- **Source Files:**
  - Server Actions: `/Users/jonathanlee/Desktop/genhub/app/actions/*.ts` (38 files)
  - API Routes: `/Users/jonathanlee/Desktop/genhub/app/api/*/route.ts` (22 routes)
  - Result Types: `/Users/jonathanlee/Desktop/genhub/types/server-actions.ts`
  - Enums: `/Users/jonathanlee/Desktop/genhub/types/db/enums.ts`

- **Key Docs:**
  - Authentication: `@/lib/auth` (NextAuth.js integration)
  - Supabase Client: `@/utils/supabase/server` (Admin + RLS-aware clients)
  - Feature Flags: `@/lib/feature-flags`
  - Auth Context: `@/lib/auth-context` (getUserContext helper)

---

**Generated:** 2026-02-07
**GenHub Version:** Next.js 16 + React 19 + Supabase
**Codebase Coverage:** 100% of Server Actions + API Routes
