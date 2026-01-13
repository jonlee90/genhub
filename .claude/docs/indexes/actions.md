# GenHub Server Actions Index

> Auto-generated. Do not edit manually.

Last updated: 2026-01-12

---

## Quick Lookup by File

### accept-admin-invite.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| validateAdminInvitationToken | validate admin invitation token | - |
| acceptAdminInvitation | accept admin invitation | - |

### accept-invite.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| validateInvitationToken | validate invitation token | - |
| acceptInvitation | accept invitation | - |

### auth.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| handleSignIn | handle sign in | - |
| handleSignOut | handle sign out | - |

### chat-queries.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getCurrentUserContext | get current user context | - |
| getChatRooms | get chat rooms | - |
| getMessages | get messages | - |
| getCompanyUsers | get company users | - |
| getMessageById | get message by id | - |

### chat-search.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| searchProjects | search projects | - |
| searchTasks | search tasks | - |
| searchMaterials | search materials | - |
| searchExpenses | search expenses | - |
| searchUsers | search users | - |
| searchMessages | search messages | - |

### chat.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| sendMessage | send message | - |
| markMessagesAsRead | mark messages as read | /app/chat |
| getThreadMessages | get thread messages | - |
| getMessageReplyCount | get message reply count | - |
| getMessageReplyCounts | get message reply counts | - |
| toggleReaction | toggle reaction | - |
| getMessageReactions | get message reactions | - |
| getMessagesReactions | get messages reactions | - |
| uploadAttachment | upload attachment | - |
| getMessageAttachments | get message attachments | - |
| deleteAttachment | delete attachment | /app/chat |
| getMessagesAttachments | get messages attachments | - |
| muteChatRoom | mute chat room | /app/chat |
| createDMRoom | create d m room | - |
| editMessage | edit message | /app/chat |
| deleteMessage | delete message | /app/chat |
| updateChatRoom | update chat room | - |
| exportTranscript | export transcript | - |
| getChatRoomParticipants | get chat room participants | - |
| isUserGcAdmin | is user gc admin | - |

### client.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getClientPermissions | get client permissions | - |

### dashboard.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getDashboardData | get dashboard data | - |

### default-models.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getSystemDefaultModel | get system default model | - |
| getCompanyDefaultModel | get company default model | - |
| createMarkersFromDefaultConfigs | create markers from default configs | - |
| assignDefaultModel | assign default model | - |
| getDefaultModelsForCompany | get default models for company | - |
| uploadCompanyDefaultModel | upload company default model | /app/settings/default-models |
| resetToSystemDefault | reset to system default | /app/settings/default-models |

### expenses.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| createExpense | create expense | - |
| updateExpense | update expense | /app/expenses |
| reviewExpense | review expense | - |
| deleteExpense | delete expense | /app/expenses |
| getExpensesByProject | get expenses by project | - |
| getExpensesByCompany | get expenses by company | - |
| getExpenseById | get expense by id | - |
| addExpenseLineItem | add expense line item | - |
| deleteExpenseLineItem | delete expense line item | - |
| processReceiptOCR | process receipt o c r | - |
| matchLineItemToMaterial | match line item to material | - |
| getTaskExpenses | get task expenses | - |
| createExpenseFromMaterial | create expense from material | - |
| getMaterialExpenseLink | get material expense link | - |
| getExpenseAnalytics | get expense analytics | - |

### kakao.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getKakaoConnection | get kakao connection | - |
| updateTwoWaySync | update two way sync | /app/settings |
| disconnectKakao | disconnect kakao | /app/settings |

### materials.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| searchProducts | search products | - |
| getProductDetails | get product details | - |
| createMaterial | create material | /app/materials |
| createMaterialFromHomeDepot | create material from home depot | - |
| getMaterialsByCompany | get materials by company | - |
| assignMaterialToTask | assign material to task | /app/materials |
| updateMaterialAssignment | update material assignment | - |
| deleteMaterialAssignment | delete material assignment | /app/materials |
| getMaterialAssignmentsByTask | get material assignments by task | - |
| getMaterialAssignmentsByProject | get material assignments by project | - |
| getProjectMaterialSummary | get project material summary | - |
| getMaterialsByCategory | get materials by category | - |
| getProjectPhases | get project phases | - |
| getPhaseTasks | get phase tasks | - |
| getTaskMaterials | get task materials | - |
| removeMaterialFromTask | remove material from task | /app/materials |
| updateMaterialQuantity | update material quantity | /app/materials |
| addProductToTask | add product to task | - |
| linkMaterialToMarker | link material to marker | /app/materials |
| getMaterialsByMarker | get materials by marker | - |
| getTaskLinkedMaterials | get task linked materials | - |
| getTrackedMaterials | get tracked materials | - |
| toggleTracking | toggle tracking | - |
| getMaterialSummaryStats | get material summary stats | - |
| updateMaterialLeadTime | update material lead time | /app/materials |

### owner.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| isOwner | is owner | - |
| getAllCompanies | get all companies | - |
| getAllUsers | get all users | - |
| inviteAdmin | invite admin | - |
| getPendingAdminInvitations | get pending admin invitations | /app/owner/invites |
| revokeAdminInvitation | revoke admin invitation | /app/owner/invites |
| getOwnerDashboardStats | get owner dashboard stats | - |

### phase-templates.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getPhaseTemplates | get phase templates | - |
| createPhaseTemplate | create phase template | /app/settings |
| updatePhaseTemplate | update phase template | /app/settings |
| deletePhaseTemplate | delete phase template | /app/settings |
| reorderPhaseTemplates | reorder phase templates | /app/settings |

### phases.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| updatePhaseStatus | update phase status | - |
| updatePhase | update phase | - |
| getProjectPhases | get project phases | - |
| startNextPhase | start next phase | - |
| completeCurrentPhase | complete current phase | - |
| createPhase | create phase | - |
| updatePhaseName | update phase name | - |
| deletePhase | delete phase | - |
| applyTaskTemplates | apply task templates | - |

### project-files.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectFiles | get project files | - |
| deleteProjectFile | delete project file | - |
| updateFileCategory | update file category | - |
| getFileVersionHistory | get file version history | - |
| bulkDeleteFiles | bulk delete files | - |

### project-photos.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectPhotosWithReceipts | get project photos with receipts | - |
| setProjectPrimaryPhoto | set project primary photo | - |
| deleteProjectPhoto | delete project photo | - |

### project-types.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectTypes | get project types | - |
| createProjectType | create project type | /app/settings |
| updateProjectType | update project type | /app/settings |
| deleteProjectType | delete project type | /app/settings |

### projects.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| createProject | create project | - |
| updateProject | update project | - |
| updateProjectStatus | update project status | /app/projects |
| assignProjectTeamMember | assign project team member | - |
| addProjectTeamMember | add project team member | - |
| removeProjectTeamMember | remove project team member | - |
| addSubcontractorToProject | add subcontractor to project | - |
| removeSubcontractorFromProject | remove subcontractor from project | - |
| getProjectsWithStats | get projects with stats | - |
| getProjectWithStats | get project with stats | - |

### push.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| registerPushSubscription | register push subscription | - |
| unregisterPushSubscription | unregister push subscription | - |
| getUserPushSubscriptions | get user push subscriptions | - |

### seed-demo-data.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| seedDemoData | seed demo data | - |

### spatial.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| uploadIFCFile | upload i f c file | - |
| createModelRecord | create model record | - |
| getProjectModels | get project models | - |
| getActiveModel | get active model | - |
| updateModelProcessingStatus | update model processing status | - |
| setActiveModelVersion | set active model version | - |
| deleteModelVersion | delete model version | - |
| replaceActiveModel | replace active model | - |
| createMarker | create marker | - |
| getProjectMarkers | get project markers | - |
| getMarkerById | get marker by id | - |
| updateMarker | update marker | - |
| deleteMarker | delete marker | - |
| attachContentToMarker | attach content to marker | - |
| getMarkerContent | get marker content | - |
| deleteMarkerContent | delete marker content | - |
| getMarkersByPhase | get markers by phase | - |
| findNearestMarker | find nearest marker | - |
| getMarkersByProject | get markers by project | - |
| uploadMarkerAttachment | upload marker attachment | - |
| createTaskAtLocation | create task at location | - |

### stripe.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getStripeCustomerId | get stripe customer id | - |
| createPortalSession | create portal session | - |
| refund | refund | - |

### subcontractors.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| createSubcontractor | create subcontractor | - |
| updateSubcontractor | update subcontractor | - |
| deactivateSubcontractor | deactivate subcontractor | - |
| uploadSubcontractorDocument | upload subcontractor document | - |

### task-templates.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getTaskTemplates | get task templates | - |
| createTaskTemplate | create task template | - |
| updateTaskTemplate | update task template | /app/settings |
| deleteTaskTemplate | delete task template | /app/settings |
| reorderTaskTemplates | reorder task templates | /app/settings |

### task-types.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getTaskTypes | get task types | - |
| getAllTaskTypes | get all task types | - |
| createTaskType | create task type | /app/settings |
| updateTaskType | update task type | /app/settings |
| deleteTaskType | delete task type | /app/settings |

### tasks.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectAssignees | get project assignees | - |
| createTask | create task | - |
| updateTask | update task | - |
| updateTaskStatus | update task status | - |
| addTaskDependency | add task dependency | - |
| removeTaskDependency | remove task dependency | /app/tasks |
| addTaskComment | add task comment | /app/tasks |
| deleteTask | delete task | /app/tasks |
| updateApprovalStatus | update approval status | - |
| getProjectTasks | get project tasks | - |
| updateTaskDueDate | update task due date | /app/tasks |
| updateTaskDates | update task dates | /app/tasks |
| getTaskDependencies | get task dependencies | - |
| linkTaskToMarker | link task to marker | /app/tasks |
| getTasksByMarker | get tasks by marker | - |
| logTaskCompletionToMarker | log task completion to marker | - |
| getTaskDetails | get task details | - |
| getTaskActivity | get task activity | - |
| getTaskAttachments | get task attachments | - |
| getTaskAnalytics | get task analytics | - |

### team-email-helper.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| sendTeamInvitationEmail | send team invitation email | - |

### team.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| inviteTeamMember | invite team member | - |
| updateTeamMemberRole | update team member role | - |
| deactivateTeamMember | deactivate team member | - |

---

## Summary

| Domain | Action Count |
|--------|--------------|
| materials | 25 |
| spatial | 21 |
| chat | 20 |
| tasks | 20 |
| expenses | 15 |
| phases | 9 |
| projects | 10 |
| default-models | 7 |
| owner | 7 |
| chat-search | 6 |
| chat-queries | 5 |
| phase-templates | 5 |
| project-files | 5 |
| task-templates | 5 |
| task-types | 5 |
| project-types | 4 |
| subcontractors | 4 |
| kakao | 3 |
| project-photos | 3 |
| push | 3 |
| stripe | 3 |
| team | 3 |
| accept-admin-invite | 2 |
| accept-invite | 2 |
| auth | 2 |
| client | 1 |
| dashboard | 1 |
| seed-demo-data | 1 |
| team-email-helper | 1 |
| **Total** | 198 |
