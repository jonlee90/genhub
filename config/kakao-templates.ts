// AlimTalk Template Configuration for Sendbird Business Messaging
// These templates must be registered in Sendbird Dashboard and approved by KakaoTalk

export const ALIMTALK_TEMPLATES = {
  // Task Assignment Template
  task_assignment: {
    code: 'TASK_ASSIGN_001',
    name: 'Task Assignment Notification',
    params: ['taskTitle', 'dueDate', 'projectName'] as const,
    // Template message format (must match registered template):
    // "새 작업이 할당되었습니다.\n프로젝트: {{projectName}}\n작업: {{taskTitle}}\n마감일: {{dueDate}}"
    // English: "You have been assigned a new task.\nProject: {{projectName}}\nTask: {{taskTitle}}\nDue Date: {{dueDate}}"
  },

  // Expense Status Update Template
  expense_status: {
    code: 'EXPENSE_STATUS_001',
    name: 'Expense Approval Status',
    params: ['status', 'amount', 'comment'] as const,
    // Template message format:
    // "경비 승인 상태: {{status}}\n금액: {{amount}}\n코멘트: {{comment}}"
    // English: "Expense Status: {{status}}\nAmount: {{amount}}\nComment: {{comment}}"
  },

  // Project Milestone Template
  project_milestone: {
    code: 'PROJECT_MILESTONE_001',
    name: 'Project Milestone Update',
    params: ['projectName', 'milestone', 'phase'] as const,
    // Template message format:
    // "프로젝트 마일스톤 업데이트\n프로젝트: {{projectName}}\n단계: {{phase}}\n마일스톤: {{milestone}}"
    // English: "Project Milestone Update\nProject: {{projectName}}\nPhase: {{phase}}\nMilestone: {{milestone}}"
  },
} as const;

export type AlimTalkTemplateKey = keyof typeof ALIMTALK_TEMPLATES;

// Helper function to validate template params
export function validateTemplateParams(
  template: AlimTalkTemplateKey,
  params: Record<string, string>
): boolean {
  const templateConfig = ALIMTALK_TEMPLATES[template];
  const requiredParams = templateConfig.params;

  return requiredParams.every((param) => param in params && params[param] !== undefined);
}

// Retry configuration for AlimTalk sends
export const ALIMTALK_RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
} as const;
