# GenHub Server Actions Index

> Auto-generated. Do not edit manually.

Last updated: 2026-01-19

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
| markMessagesAsRead | mark messages as read | - |
| getThreadMessages | get thread messages | - |
| getMessageReplyCount | get message reply count | - |
| getMessageReplyCounts | get message reply counts | - |
| toggleReaction | toggle reaction | - |
| getMessageReactions | get message reactions | - |
| getMessagesReactions | get messages reactions | - |
| uploadAttachment | upload attachment | - |
| getMessageAttachments | get message attachments | - |
| deleteAttachment | delete attachment | - |
| getMessagesAttachments | get messages attachments | - |
| muteChatRoom | mute chat room | - |
| createDMRoom | create d m room | - |
| editMessage | edit message | - |
| deleteMessage | delete message | - |
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
| invalidateDashboardCache | invalidate dashboard cache | - |

### default-models.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getSystemDefaultModel | get system default model | - |
| getCompanyDefaultModel | get company default model | - |
| createMarkersFromDefaultConfigs | create markers from default configs | - |
| assignDefaultModel | assign default model | - |
| getDefaultModelsForCompany | get default models for company | - |
| uploadCompanyDefaultModel | upload company default model | - |
| resetToSystemDefault | reset to system default | - |

### expenses.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| createExpense | create expense | - |
| updateExpense | update expense | - |
| reviewExpense | review expense | - |
| deleteExpense | delete expense | - |
| getExpensesByProject | get expenses by project | - |
| getExpensesByCompany | get expenses by company | - |
| getExpenseById | get expense by id | - |
| addExpenseLineItem | add expense line item | - |
| deleteExpenseLineItem | delete expense line item | - |
| processReceiptOCR | process receipt o c r | - |
| matchLineItemToMaterial | match line item to material | - |
| getTaskExpenses | get task expenses | - |
| getBatchTaskExpenses | get batch task expenses | - |
| createExpenseFromMaterial | create expense from material | - |
| getMaterialExpenseLink | get material expense link | - |
| getExpenseAnalytics | get expense analytics | - |
| getVendorOptions | get vendor options | - |
| createExpenseFromTask | create expense from task | - |

### kakao.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getKakaoConnection | get kakao connection | - |
| updateTwoWaySync | update two way sync | - |
| disconnectKakao | disconnect kakao | - |

### materials.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| searchProducts | search products | - |
| getProductDetails | get product details | - |
| createMaterial | create material | - |
| createMaterialFromHomeDepot | create material from home depot | - |
| getMaterialsByCompany | get materials by company | - |
| assignMaterialToTask | assign material to task | - |
| updateMaterialAssignment | update material assignment | - |
| deleteMaterialAssignment | delete material assignment | - |
| getMaterialAssignmentsByTask | get material assignments by task | - |
| getMaterialAssignmentsByProject | get material assignments by project | - |
| getProjectMaterialSummary | get project material summary | - |
| getMaterialsByCategory | get materials by category | - |
| getProjectPhases | get project phases | - |
| getPhaseTasks | get phase tasks | - |
| getTaskMaterials | get task materials | - |
| removeMaterialFromTask | remove material from task | - |
| updateMaterialQuantity | update material quantity | - |
| addProductToTask | add product to task | - |
| linkMaterialToMarker | link material to marker | - |
| getMaterialsByMarker | get materials by marker | - |
| getTaskLinkedMaterials | get task linked materials | - |
| getTrackedMaterials | get tracked materials | - |
| toggleTracking | toggle tracking | - |
| getMaterialSummaryStats | get material summary stats | - |
| updateMaterialLeadTime | update material lead time | - |

### owner.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| isOwner | is owner | - |
| getAllCompanies | get all companies | - |
| getAllUsers | get all users | - |
| inviteAdmin | invite admin | - |
| getPendingAdminInvitations | get pending admin invitations | - |
| revokeAdminInvitation | revoke admin invitation | - |
| getOwnerDashboardStats | get owner dashboard stats | - |

### phase-templates.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getPhaseTemplates | get phase templates | - |
| createPhaseTemplate | create phase template | - |
| updatePhaseTemplate | update phase template | - |
| deletePhaseTemplate | delete phase template | - |
| reorderPhaseTemplates | reorder phase templates | - |

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

### project-deferred.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectExpenseStats | get project expense stats | - |
| getProjectTeamCosts | get project team costs | - |
| getProjectTaskDependencies | get project task dependencies | - |
| getProjectDeferredData | get project deferred data | - |

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
| createProjectType | create project type | - |
| updateProjectType | update project type | - |
| deleteProjectType | delete project type | - |

### projects.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| createProject | create project | - |
| updateProject | update project | - |
| updateProjectStatus | update project status | - |
| addProjectTeamMember | add project team member | - |
| addSubcontractorToProject | add subcontractor to project | - |
| removeSubcontractorFromProject | remove subcontractor from project | - |
| removeProjectTeamMember | remove project team member | - |
| getProjectsWithStats | get projects with stats | - |
| getProjectWithStats | get project with stats | - |
| getProjectTeamCostSummary | get project team cost summary | - |
| getProjectsForModal | get projects for modal | - |
| getTeamMembersForModal | get team members for modal | - |
| getModalData | get modal data | - |

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
| updateTaskTemplate | update task template | - |
| deleteTaskTemplate | delete task template | - |
| reorderTaskTemplates | reorder task templates | - |

### task-types.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getTaskTypes | get task types | - |
| getAllTaskTypes | get all task types | - |
| createTaskType | create task type | - |
| updateTaskType | update task type | - |
| deleteTaskType | delete task type | - |

### tasks-activity.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| logTaskActivity | log task activity | - |
| getTaskActivity | get task activity | - |
| addTaskComment | add task comment | - |

### tasks-analytics.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getTaskAnalytics | get task analytics | - |

### tasks-assignments.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectAssignees | get project assignees | - |
| insertTaskAssignees | insert task assignees | - |
| updateTaskAssignees | update task assignees | - |
| removeTaskAssignee | remove task assignee | - |
| setPrimaryAssignee | set primary assignee | - |

### tasks-deferred.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectTasks | get project tasks | - |
| updateTaskDueDate | update task due date | - |
| updateTaskDates | update task dates | - |
| getTaskDetails | get task details | - |
| getTaskAttachments | get task attachments | - |

### tasks-dependencies.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| addTaskDependency | add task dependency | - |
| removeTaskDependency | remove task dependency | - |
| getTaskDependencies | get task dependencies | - |

### tasks-spatial.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| linkTaskToMarker | link task to marker | - |
| getTasksByMarker | get tasks by marker | - |
| logTaskCompletionToMarker | log task completion to marker | - |

### tasks-status.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| updateTaskStatus | update task status | - |

### tasks.ts
| Action | Purpose | Revalidates |
|--------|---------|-------------|
| getProjectAssignees | get project assignees | - |
| createTask | create task | - |
| updateTask | update task | - |
| updateTaskWithExpense | update task with expense | - |
| setPrimaryAssignee | set primary assignee | - |
| updateTaskStatus | update task status | - |
| addTaskDependency | add task dependency | - |
| removeTaskDependency | remove task dependency | - |
| addTaskComment | add task comment | - |
| deleteTask | delete task | - |
| updateApprovalStatus | update approval status | - |
| getProjectTasks | get project tasks | - |
| updateTaskDueDate | update task due date | - |
| updateTaskDates | update task dates | - |
| getTaskDependencies | get task dependencies | - |
| linkTaskToMarker | link task to marker | - |
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

