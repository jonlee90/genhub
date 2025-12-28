# GenHub PWA Requirements Document

## Introduction

### What is GenHub

GenHub is a Progressive Web Application (PWA) designed specifically for small-to-midsize General Contractors who need powerful, easy-to-use construction management tools without the complexity or cost of enterprise systems like Procore.

As a PWA, GenHub delivers:
- **Native app experience** - Installable on iOS, Android, desktop
- **Offline mode** - For job sites with poor reception
- **Instant updates** - Without app store approvals
- **High performance** - On low-end devices common on job sites

GenHub unifies project management, communication, budgeting, materials, bid management, client transparency, and AI automation into one platform accessible from any device — phone, tablet, or desktop.

### Who GenHub Serves

GenHub is optimized for four core user groups, each with tailored permissions and workflows:

| Role | Description |
|------|-------------|
| **General Contractors (GC)** | See all projects, budgets, approvals, material usage, and team/subcontractor performance |
| **Project Managers (PM)** | Execute daily operations: tasks, schedules, expenses, materials, communication, and client interactions |
| **Subcontractors & Field Workers** | Receive assigned tasks, submit daily logs, upload photos, message the team, and manage materials or expenses |
| **Clients / Owners** | Access curated updates, schedules, photos, documents, invoices, and change order approvals through a secure, simplified client interface |

### Tech Stack

- Next.js 15 with Turbopack
- Supabase for database & auth (with next-auth integration)
- Stripe for payments/subscriptions
- aceternity/ui + Tailwind CSS + Lucide icons
- PWA support (installable, offline-capable)

---

## Requirements

---

### Requirement 1: User Authentication and Role-Based Access Control

**User Story:** As a general contractor, I want secure authentication and role-based access control, so that only authorized team members can access sensitive project and company information based on their role.

#### Acceptance Criteria

1. WHEN a user navigates to the application THEN the system SHALL redirect unauthenticated users to a login page
2. WHEN a user submits valid credentials THEN the system SHALL authenticate the user and grant access based on their assigned role
3. WHEN a user submits invalid credentials THEN the system SHALL display an error message and prevent access
4. IF a user is authenticated THEN the system SHALL maintain the session across page refreshes and browser restarts
5. WHEN a user logs out THEN the system SHALL terminate the session and redirect to the login page
6. IF a user has the role "GC Admin" THEN the system SHALL grant full access to all features, projects, budgets, approvals, material usage, and team/subcontractor performance
7. IF a user has the role "Project Manager" THEN the system SHALL grant access to execute daily operations: tasks, schedules, expenses, materials, communication, and client interactions
8. IF a user has the role "Subcontractor" or "Field Worker" THEN the system SHALL grant access to assigned tasks, daily logs, photo uploads, team messaging, and materials/expense management
9. IF a user has the role "Client/Owner" THEN the system SHALL grant access only to curated updates, schedules, photos, documents, invoices, and change order approvals
10. WHEN a user attempts to access a feature without proper permissions THEN the system SHALL deny access and display an appropriate message

---

### Requirement 2: Dashboard and Navigation

**User Story:** As a user, I want a clear dashboard with intuitive navigation, so that I can quickly access the features and information I need without confusion.

#### Acceptance Criteria

1. WHEN an authenticated user logs in THEN the system SHALL display a role-appropriate dashboard as the default landing page
2. WHEN the dashboard loads THEN the system SHALL display a sidebar navigation menu with all accessible features
3. IF a user is on a desktop device THEN the system SHALL display the sidebar expanded by default
4. IF a user is on a mobile device THEN the system SHALL display a collapsible hamburger menu
5. WHEN a user clicks a navigation item THEN the system SHALL navigate to the corresponding page without full page reload
6. WHEN the GC/PM dashboard loads THEN the system SHALL display: project list, health scores, pending approvals, budget overview, and activity feed
7. IF a user has no projects THEN the system SHALL display an onboarding message with a call-to-action to create their first project
8. WHEN a user navigates between pages THEN the system SHALL highlight the active navigation item
9. WHEN the application is used as a PWA THEN the system SHALL provide native-like navigation without browser chrome
10. WHEN displaying the activity feed THEN the system SHALL show recent updates across projects, tasks, bids, and communications

---

### Requirement 3: Company Profile and Multi-Tenant Management

**User Story:** As a GC admin, I want to set up and manage my company profile with multi-tenant architecture, so that all projects and communications reflect accurate company information and proper data isolation.

#### Acceptance Criteria

1. WHEN a GC admin first logs in THEN the system SHALL prompt them to complete their company profile
2. WHEN creating a company profile THEN the system SHALL require company name, address, phone, and primary contact email
3. WHEN saving a company profile THEN the system SHALL validate all required fields and display errors for missing information
4. IF the company profile is saved successfully THEN the system SHALL confirm the save and return to the dashboard
5. WHEN a company logo is uploaded THEN the system SHALL accept common image formats (PNG, JPG, SVG) and resize appropriately
6. IF the uploaded image exceeds 5MB THEN the system SHALL reject the upload and display a size limit error
7. WHEN multiple companies use GenHub THEN the system SHALL ensure complete data isolation between tenants
8. WHEN a company updates branding THEN the system SHALL apply custom branding to client-facing areas (client portal)
9. WHEN integrations are configured THEN the system SHALL support QuickBooks integration (planned) for accounting sync

---

### Requirement 4: Team Member Management

**User Story:** As a GC admin, I want to invite and manage team members with specific roles, so that I can control who has access to our projects and assign appropriate permissions.

#### Acceptance Criteria

1. WHEN a GC admin accesses the team management page THEN the system SHALL display a list of all current team members
2. WHEN a GC admin clicks "Invite Team Member" THEN the system SHALL display a form requesting email, name, and role (GC Admin, Project Manager, Foreman, Field Worker)
3. WHEN a GC admin submits an invitation THEN the system SHALL send an email invitation to the specified address
4. WHEN an invited user clicks the invitation link THEN the system SHALL allow them to set up their account with the pre-assigned role
5. IF an invitation is sent to an email already in the system THEN the system SHALL prevent duplicate accounts
6. WHEN a GC admin views team members THEN the system SHALL display each member's name, email, role, status (active/invited), and project assignments
7. WHEN a GC admin changes a team member's role THEN the system SHALL update their permissions immediately
8. WHEN a GC admin deactivates a team member THEN the system SHALL revoke their access while preserving historical data
9. IF a deactivated user attempts to log in THEN the system SHALL deny access with an appropriate message

---

### Requirement 5: Subcontractor Directory Management

**User Story:** As a GC admin, I want to maintain a comprehensive directory of subcontractors with their profiles, so that I can easily invite them to bid on projects, track their work, and verify their credentials.

#### Acceptance Criteria

1. WHEN a GC admin navigates to the Subcontractors page THEN the system SHALL display a list of all registered subcontractors
2. WHEN a GC admin clicks "Add Subcontractor" THEN the system SHALL display a form requesting: company name, trade specialization, contact name, email, phone, license info, and insurance documents
3. WHEN a subcontractor is added THEN the system SHALL save their profile and make them available for project assignments and bid invitations
4. WHEN viewing subcontractors THEN the system SHALL display company name, trade, contact info, license status, insurance expiry, and performance rating
5. WHEN a GC admin searches for subcontractors THEN the system SHALL filter by company name, trade specialization, or contact name
6. WHEN uploading subcontractor documents (license, insurance) THEN the system SHALL store them securely with expiry date tracking
7. IF a subcontractor's license or insurance is expiring within 30 days THEN the system SHALL display a warning indicator
8. IF a subcontractor is deactivated THEN the system SHALL prevent them from being assigned to new projects while preserving historical data
9. WHEN a subcontractor completes work THEN the system SHALL update their performance metrics (reliability, quality, cost adherence)

---

### Requirement 6: Project Creation with Type-Specific Templates

**User Story:** As a project manager, I want to create new projects with type-specific templates, so that I can start with pre-built phases and recommended tasks appropriate for the project type.

#### Acceptance Criteria

1. WHEN a user with project creation permissions clicks "New Project" THEN the system SHALL display a project creation form
2. WHEN creating a project THEN the system SHALL require: project name, client name, address, project type, and start date
3. WHEN selecting project type THEN the system SHALL offer: Residential, Restaurant/Cafe, Commercial Office, and Industrial
4. WHEN a project type is selected THEN the system SHALL load pre-built phase templates and recommended tasks for that type
5. WHEN creating a project THEN the system SHALL allow optional fields for end date, budget, and project description
6. WHEN a project is saved THEN the system SHALL generate a unique project ID and redirect to the project detail page
7. IF required fields are missing THEN the system SHALL prevent submission and highlight the missing fields
8. WHEN a project is created THEN the system SHALL automatically assign the creator as a project manager
9. WHEN a new project is created THEN the system SHALL initialize with universal phases: Initiation, Pre-Construction, Procurement, Construction, Post-Construction
10. WHEN a project is created THEN the system SHALL allow immediate assignment of team members and subcontractors

---

### Requirement 7: Project List and Filtering

**User Story:** As a user, I want to view and filter my projects with health indicators, so that I can quickly find specific projects and understand their current status.

#### Acceptance Criteria

1. WHEN a user navigates to the Projects page THEN the system SHALL display all projects they have access to
2. WHEN displaying projects THEN the system SHALL show project name, client, project type, current phase, health score, and progress percentage
3. WHEN a user clicks on a project card THEN the system SHALL navigate to the project detail page
4. WHEN a user applies a status filter THEN the system SHALL display only projects matching the selected status (Active, On Hold, Completed, Archived)
5. WHEN a user applies a type filter THEN the system SHALL display only projects matching the selected type (Residential, Restaurant/Cafe, Commercial, Industrial)
6. WHEN a user searches by project name or client THEN the system SHALL filter the list in real-time
7. WHEN a user sorts projects THEN the system SHALL support sorting by name, start date, health score, or completion percentage
8. IF a user has no projects matching the filter THEN the system SHALL display a message indicating no results found
9. WHEN the project list loads THEN the system SHALL display active projects by default

---

### Requirement 8: Metro Journey View (Project Phases Visualization)

**User Story:** As a project manager, I want to visualize project phases as a metro/subway map journey where each "station" represents a milestone, so that I can easily see progress and communicate status to stakeholders.

#### Acceptance Criteria

1. WHEN a user opens a project detail page THEN the system SHALL display the Metro Journey View as the primary visualization
2. WHEN the Metro Journey View loads THEN the system SHALL display project phases as connected stations on a horizontal timeline
3. WHEN displaying phase stations THEN the system SHALL visually indicate: completed phases (filled), current phase (highlighted/animated), and upcoming phases (outlined)
4. WHEN a user clicks on a phase station THEN the system SHALL expand to show: tasks, dependencies, budgets, materials, chat, documents, and progress percentage
5. WHEN a phase is 100% complete THEN the system SHALL automatically mark it as completed and update the visual indicator
6. WHEN a user updates a phase status manually THEN the system SHALL update the Metro Journey visualization in real-time
7. IF all phases are completed THEN the system SHALL mark the entire project as completed
8. WHEN viewing the Metro Journey on mobile THEN the system SHALL provide a horizontal scrollable view with touch-friendly stations
9. WHEN a phase contains overdue tasks THEN the system SHALL display a warning indicator on the phase station
10. WHEN a phase contains blocked tasks THEN the system SHALL display a blocker indicator on the phase station

---

### Requirement 9: Task Creation and Assignment

**User Story:** As a project manager, I want to create and assign tasks with comprehensive properties, so that work can be organized, tracked, and linked to materials and budgets effectively.

#### Acceptance Criteria

1. WHEN a user with task creation permissions clicks "New Task" THEN the system SHALL display a task creation form
2. WHEN creating a task THEN the system SHALL require: task title and associated project/phase
3. WHEN creating a task THEN the system SHALL allow optional fields: description, assignee, due date, priority, planned cost, and dependencies
4. WHEN a task is created THEN the system SHALL set the default status to "To Do"
5. WHEN setting task priority THEN the system SHALL offer levels: Low, Medium, High, Critical
6. WHEN a task is assigned to a team member or subcontractor THEN the system SHALL send a notification to the assignee
7. WHEN saving a task THEN the system SHALL validate required fields and display errors for missing information
8. IF a task is saved successfully THEN the system SHALL add it to the appropriate project phase and task list
9. WHEN a task has dependencies THEN the system SHALL enable auto-blocking of dependent tasks until prerequisites are complete
10. WHEN a task is created with a due date THEN the system SHALL track the task for deadline alerts
11. WHEN materials are assigned to a task THEN the system SHALL link them from the Home Depot integration

---

### Requirement 10: Task Board Views (Kanban and List)

**User Story:** As a user, I want to view tasks in both Kanban board and list formats with offline support, so that I can work in the view that best suits my workflow even without internet.

#### Acceptance Criteria

1. WHEN a user navigates to the Tasks page THEN the system SHALL display a toggle to switch between Kanban and List views
2. WHEN the Kanban view is active THEN the system SHALL display columns for: To Do, In Progress, Review, Blocked, Completed
3. WHEN a user drags a task between Kanban columns THEN the system SHALL update the task status immediately
4. WHEN the List view is active THEN the system SHALL display tasks in a sortable, filterable table with fast editing
5. WHEN a user clicks on a task in either view THEN the system SHALL open a task detail panel
6. WHEN tasks are displayed THEN the system SHALL show: task title, assignee avatar, due date, priority indicator, and material badge if applicable
7. IF a task is overdue THEN the system SHALL highlight it with a visual warning (red indicator)
8. IF a task is blocked THEN the system SHALL display a blocker icon with reason tooltip
9. WHEN a user filters tasks by assignee, project, phase, or priority THEN the system SHALL display only matching tasks
10. WHEN viewing tasks on mobile THEN the system SHALL optimize the layout for touch interaction and drag-and-drop
11. WHEN offline THEN the system SHALL allow viewing and updating cached tasks with sync when online

---

### Requirement 11: Task Detail and Activity

**User Story:** As a task assignee, I want to view comprehensive task details including chatroom, materials, and activity history, so that I can manage my work and coordinate with the team.

#### Acceptance Criteria

1. WHEN a user clicks on a task THEN the system SHALL display a detail view with all task information
2. WHEN viewing task details THEN the system SHALL display: title, description, assignee, project/phase, due date, priority, status, planned cost, and dependencies
3. WHEN a user with edit permissions updates a task field THEN the system SHALL save the change immediately
4. WHEN a task is updated THEN the system SHALL log the change in the activity history with timestamp and user
5. WHEN viewing task details THEN the system SHALL display a task-level chatroom for micro-coordination
6. WHEN a user adds a message in the task chatroom THEN the system SHALL notify task participants
7. WHEN a task status changes to "Completed" THEN the system SHALL update the associated project phase completion percentage
8. IF a task is marked as blocked THEN the system SHALL require a reason and notify the project manager
9. WHEN viewing task details THEN the system SHALL display assigned materials from Home Depot with quantities and procurement status
10. WHEN a user attaches a file to a task THEN the system SHALL accept common file formats and store them securely
11. IF a task has dependent tasks THEN the system SHALL display them with their current status

---

### Requirement 12: AI-Powered Bid Package Creation

**User Story:** As a GC/PM, I want AI to assist in creating bid packages with generated scopes of work, so that I can quickly prepare professional bid documents without manual effort.

#### Acceptance Criteria

1. WHEN a user navigates to Bids and clicks "Create Bid Package" THEN the system SHALL display a bid creation wizard
2. WHEN creating a bid THEN the system SHALL require: associated project, phase, and trade category
3. WHEN a trade category is selected THEN the AI SHALL generate a scope of work based on project type and phase
4. WHEN the AI generates scope THEN the system SHALL suggest trade breakdowns and line items
5. WHEN creating a bid package THEN the AI SHALL recommend relevant documents to attach based on project type
6. WHEN a user reviews the AI-generated scope THEN the system SHALL allow editing and customization
7. WHEN a bid package is saved THEN the system SHALL generate a unique bid package ID
8. WHEN a bid package is finalized THEN the system SHALL make it available for subcontractor invitations
9. WHEN viewing bid packages THEN the system SHALL display: trade, status, number of invites sent, number of bids received

---

### Requirement 13: Subcontractor Bid Invitations

**User Story:** As a PM, I want to invite subcontractors to submit bids via SMS or email with a login-free option, so that subs can easily respond without friction.

#### Acceptance Criteria

1. WHEN a bid package is ready THEN the system SHALL allow inviting subcontractors from the directory
2. WHEN inviting subcontractors THEN the system SHALL support both SMS and email invitations
3. WHEN an invitation is sent THEN the system SHALL include a unique link to the bid submission form
4. WHEN a subcontractor clicks the invitation link THEN the system SHALL display a mobile-first bid submission form
5. IF the subcontractor is not registered THEN the system SHALL allow login-free bid submission with email verification
6. WHEN a subcontractor is invited THEN the system SHALL send auto-reminders at configurable intervals
7. WHEN viewing invited subcontractors THEN the system SHALL display: name, trade, invitation status, and response status
8. WHEN a subcontractor submits a bid THEN the system SHALL notify the PM and update the bid package status
9. WHEN a bid deadline approaches THEN the system SHALL send reminder notifications to non-responding subcontractors

---

### Requirement 14: AI Bid Comparison and Analysis (Bid Tab)

**User Story:** As a GC/PM, I want AI to automatically compare and analyze submitted bids, so that I can quickly identify the best value and any missing scope items.

#### Acceptance Criteria

1. WHEN multiple bids are received THEN the system SHALL display a "Bid Tab" comparison view
2. WHEN the Bid Tab loads THEN the AI SHALL automatically normalize bids for apples-to-apples comparison
3. WHEN analyzing bids THEN the AI SHALL flag missing scope items in each submission
4. WHEN analyzing bids THEN the AI SHALL detect cost anomalies (unusually high or low line items)
5. WHEN analyzing bids THEN the AI SHALL highlight potential milestone impacts
6. WHEN displaying bid comparison THEN the system SHALL show: subcontractor name, total bid, line item breakdown, missing items, and anomaly flags
7. WHEN AI scores subcontractors THEN the system SHALL consider: reliability history, cost adherence, and current bid value
8. WHEN a user hovers over an anomaly flag THEN the system SHALL display an explanation tooltip
9. WHEN viewing the Bid Tab THEN the system SHALL allow sorting by total cost, score, or trade category

---

### Requirement 15: Bid Award and Contract Generation

**User Story:** As a GC/PM, I want to award bids with one click and auto-generate contracts, so that I can quickly move from selection to execution.

#### Acceptance Criteria

1. WHEN a user selects a winning bid THEN the system SHALL display a confirmation with bid details
2. WHEN a bid is awarded THEN the system SHALL auto-generate a contract with scope, cost, and timeline
3. WHEN a contract is generated THEN the system SHALL allow review and editing before finalization
4. WHEN a contract is finalized THEN the system SHALL notify the winning subcontractor
5. WHEN a bid is awarded THEN the system SHALL automatically create tasks in the project timeline for the awarded scope
6. WHEN tasks are created from bid award THEN the system SHALL assign them to the winning subcontractor
7. WHEN a bid is awarded THEN the system SHALL update the project budget with the awarded amount
8. WHEN non-winning subcontractors exist THEN the system SHALL send courtesy notifications of the award decision

---

### Requirement 16: Project Chatroom

**User Story:** As a project team member, I want a centralized project chatroom, so that all project communication is in one place with photo/video sharing and system updates.

#### Acceptance Criteria

1. WHEN a user opens a project THEN the system SHALL provide access to the project chatroom
2. WHEN viewing the project chatroom THEN the system SHALL display messages from all project participants
3. WHEN a user sends a message THEN the system SHALL deliver it in real-time to online participants
4. WHEN a user is offline THEN the system SHALL queue messages and sync when online
5. WHEN sending messages THEN the system SHALL support photo, video, and file attachments
6. WHEN project events occur (task completed, bid received, etc.) THEN the system SHALL post system-generated updates to the chatroom
7. WHEN searching the chatroom THEN the system SHALL allow filtering by sender, date, or content
8. WHEN a user is mentioned (@name) THEN the system SHALL send them a notification

---

### Requirement 17: Direct Messaging

**User Story:** As a user, I want to send direct messages to individuals or groups, so that I can have private conversations outside of project chatrooms.

#### Acceptance Criteria

1. WHEN a user clicks on another user's profile THEN the system SHALL offer a "Send Message" option
2. WHEN starting a DM THEN the system SHALL create a one-on-one conversation thread
3. WHEN a user wants to message multiple people THEN the system SHALL allow creating group DM threads
4. WHEN sending DMs THEN the system SHALL support file attachments
5. WHEN a DM is received THEN the system SHALL show read receipts
6. WHEN searching DMs THEN the system SHALL provide searchable history across all conversations
7. WHEN a user receives a DM THEN the system SHALL send a notification

---

### Requirement 18: KakaoTalk Integration

**User Story:** As a user, I want to integrate with KakaoTalk, so that subcontractors and clients familiar with KakaoTalk can receive and respond to messages through their preferred app.

#### Acceptance Criteria

1. WHEN a user accesses settings THEN the system SHALL offer KakaoTalk account linking
2. WHEN KakaoTalk is linked THEN the system SHALL sync project messages to the user's KakaoTalk
3. WHEN a message is sent in GenHub THEN the system SHALL push notifications to linked KakaoTalk accounts
4. WHEN a user replies via KakaoTalk THEN the system SHALL sync the response back into GenHub
5. WHEN KakaoTalk sync is enabled THEN the system SHALL support two-way communication
6. WHEN viewing integration settings THEN the system SHALL display sync status and last sync time
7. IF KakaoTalk sync fails THEN the system SHALL display an error and retry options

---

### Requirement 19: Materials Management with Home Depot Integration

**User Story:** As a PM/worker, I want to search Home Depot products with live pricing and assign materials to tasks , so that I can manage procurement with precision.

#### Acceptance Criteria

1. WHEN a user navigates to Materials THEN the system SHALL display a Home Depot product search interface
2. WHEN searching products THEN the system SHALL show: live pricing, stock levels, product specs, images, and categories
3. WHEN viewing search results THEN the system SHALL allow comparing multiple products side by side
4. WHEN a user selects a product THEN the system SHALL allow assigning it to a specific task
5. WHEN assigning materials to a task THEN the system SHALL require: quantity and purchaser assignment (GC, PM, or subcontractor)
6. WHEN materials are assigned THEN the system SHALL track: cost impact and procurement status (Needed, Ordered, Delivered, Installed)
7. WHEN material status changes THEN the system SHALL update the project budget in real-time
8. WHEN viewing a task THEN the system SHALL display all assigned materials with status

---

### Requirement 20: Expense Automation via AI OCR

**User Story:** As a user, I want to upload receipts and have AI automatically extract and match items to materials, so that expenses are tracked accurately without manual data entry.

#### Acceptance Criteria

1. WHEN a user submits an expense THEN the system SHALL allow uploading a receipt photo (mobile camera or file upload)
2. WHEN a receipt is uploaded THEN the AI OCR SHALL extract: vendor name, line items, and totals
3. WHEN items are extracted THEN the AI SHALL attempt to match them to corresponding Home Depot products
4. WHEN matches are found THEN the system SHALL auto-link materials to tasks
5. WHEN expenses are matched THEN the system SHALL automatically update the project budget
6. IF AI cannot match an item THEN the system SHALL allow manual matching or entry
7. WHEN viewing an expense THEN the system SHALL display the original receipt image alongside extracted data
8. WHEN OCR extraction is complete THEN the system SHALL show confidence scores for each extracted item

---

### Requirement 21: Project-Wide Materials Dashboard

**User Story:** As a PM/GC, I want a comprehensive materials dashboard, so that I can see all materials, costs, procurement status, and identify issues across the project.

#### Acceptance Criteria

1. WHEN a user views the project materials dashboard THEN the system SHALL display: all materials needed vs. purchased
2. WHEN displaying materials THEN the system SHALL show: total costs, cost by category, and cost by subcontractor
3. WHEN viewing the dashboard THEN the system SHALL display procurement status breakdown (Needed, Ordered, Delivered, Installed)
4. WHEN materials have lead times THEN the system SHALL display estimated delivery dates
5. IF material costs exceed budget THEN the system SHALL highlight cost overruns with warnings
6. WHEN materials are delivered THEN the system SHALL track installation status
7. WHEN exporting materials data THEN the system SHALL support CSV and PDF formats

---

### Requirement 22: Expense Management Workflow

**User Story:** As a user, I want to submit expenses with a Submit → Review → Approve workflow, so that all costs are tracked with full accountability.

#### Acceptance Criteria

1. WHEN a user submits an expense THEN the system SHALL require: amount, category, and receipt attachment
2. WHEN an expense is submitted THEN the system SHALL set status to "Submitted" and notify reviewers
3. WHEN a PM/GC reviews an expense THEN the system SHALL allow: Approve, Reject, or Request More Info
4. WHEN an expense is approved THEN the system SHALL update the project budget in real-time
5. WHEN an expense is rejected THEN the system SHALL require a reason and notify the submitter
6. WHEN viewing expenses THEN the system SHALL display: amount, category, status, linked task/material, and submitter
7. WHEN expenses are approved THEN the system SHALL link them to associated tasks and materials
8. WHEN exporting expenses THEN the system SHALL generate accounting-ready reports

---

### Requirement 23: Daily Site Reports with AI Summaries

**User Story:** As a PM/field worker, I want to log daily site reports and get AI-generated summaries, so that I can capture essential job site data and communicate progress efficiently.

#### Acceptance Criteria

1. WHEN a user creates a daily report THEN the system SHALL provide a form with: weather (auto-filled from location), work performed, crew count, photos, safety notes, and equipment used
2. WHEN weather is auto-filled THEN the system SHALL use device location to fetch current conditions
3. WHEN submitting a report THEN the system SHALL allow multiple photo uploads from mobile camera
4. WHEN a report is submitted THEN the AI SHALL generate two summaries: Internal (risks, delays, blockers) and Client (clean, friendly progress update)
5. WHEN viewing reports THEN the system SHALL display a list with date, status, and key metrics
6. WHEN a client views their portal THEN the system SHALL display the client-friendly AI summary
7. WHEN safety issues are noted THEN the system SHALL flag them for immediate review
8. WHEN reports are submitted THEN the system SHALL track submission compliance by team member

---

### Requirement 24: Analytics Dashboard

**User Story:** As a GC/PM, I want comprehensive analytics dashboards, so that I can monitor project health, budget vs. actual, material usage, and subcontractor performance.

#### Acceptance Criteria

1. WHEN a user views the main dashboard THEN the system SHALL display: project health scores, pending approvals, budget overview, and activity feed
2. WHEN a user views a project dashboard THEN the system SHALL display: phase progression, task completion %, materials used, budget vs. actual
3. WHEN viewing project analytics THEN the system SHALL show subcontractor performance metrics
4. WHEN viewing budget analytics THEN the system SHALL display variance analysis with drill-down capability
5. WHEN a project is behind schedule THEN the system SHALL calculate and display estimated days remaining
6. WHEN viewing analytics THEN the system SHALL support date range filtering
7. WHEN exporting analytics THEN the system SHALL generate PDF reports with charts and summaries

---

### Requirement 25: Client Portal

**User Story:** As a client/owner, I want a secure portal to view curated project updates, so that I can stay informed and take action on approvals without accessing internal project details.

#### Acceptance Criteria

1. WHEN a client logs in THEN the system SHALL display only their assigned projects with curated views
2. WHEN viewing a project THEN the system SHALL display: curated timeline view with visual progress bar
3. WHEN viewing updates THEN the system SHALL show: progress photos organized by date
4. WHEN viewing summaries THEN the system SHALL display AI-generated client-friendly summaries from daily logs
5. WHEN change orders require approval THEN the system SHALL display them prominently with Approve/Reject options
6. WHEN viewing documents THEN the system SHALL show relevant contracts, drawings, and permits
7. WHEN viewing financials THEN the system SHALL display invoices and payment status
8. WHEN a client approves/rejects a change order THEN the system SHALL notify the PM and GC immediately
9. WHEN the client portal is accessed on mobile THEN the system SHALL provide PWA installation option

---

### Requirement 26: Change Order Engine

**User Story:** As a PM/GC, I want to create change orders with AI-predicted cost and timeline impact, so that clients can make informed approval decisions.

#### Acceptance Criteria

1. WHEN a PM creates a change order THEN the system SHALL require: description and affected scope
2. WHEN a change order is created THEN the AI SHALL calculate: estimated cost impact and timeline impact
3. WHEN AI calculates impact THEN the system SHALL display breakdown by labor, materials, and schedule
4. WHEN a change order is submitted THEN the system SHALL route it to the client for approval
5. WHEN a client approves a change order THEN the system SHALL automatically update: project budget and task schedule
6. WHEN a client rejects a change order THEN the system SHALL notify the PM with rejection reason
7. WHEN a change order is approved THEN the system SHALL notify: PM, GC, and affected subcontractors
8. WHEN viewing change orders THEN the system SHALL display: description, status, impact, and approval history

---

### Requirement 27: Notification System

**User Story:** As a user, I want to receive notifications through multiple channels, so that I stay informed about important events regardless of how I access the system.

#### Acceptance Criteria

1. WHEN a notification-triggering event occurs THEN the system SHALL create a notification record
2. WHEN notifications are delivered THEN the system SHALL support channels: email, in-app, PWA push, and KakaoTalk
3. WHEN a user accesses settings THEN the system SHALL allow configuring notification preferences per channel
4. WHEN displaying in-app notifications THEN the system SHALL show in a dropdown with unread count badge
5. WHEN a user clicks a notification THEN the system SHALL navigate to the related item
6. Notification triggers SHALL include: task assignments, bid statuses, change order updates, daily log submissions, material updates, and expense approvals
7. WHEN high-priority events occur (overdue tasks, blocked items) THEN the system SHALL send immediate notifications
8. WHEN a user marks notifications as read THEN the system SHALL update the unread count

---

### Requirement 28: PWA Installation and Offline Support

**User Story:** As a field user, I want to install GenHub as a PWA and work offline, so that I can access and update information on job sites with poor connectivity.

#### Acceptance Criteria

1. WHEN a user visits GenHub on a supported browser THEN the system SHALL prompt PWA installation
2. WHEN a user installs the PWA THEN the system SHALL add an app icon to their device home screen
3. WHEN the installed PWA is launched THEN the system SHALL open in standalone mode without browser chrome
4. WHEN online THEN the system SHALL cache essential data for offline access
5. WHEN offline THEN the system SHALL allow: viewing cached projects, tasks, and materials
6. WHEN offline THEN the system SHALL allow: creating/updating tasks with local storage
7. WHEN the device comes back online THEN the system SHALL automatically sync queued changes
8. IF a sync conflict occurs THEN the system SHALL notify the user and offer resolution options
9. WHEN offline THEN the system SHALL display an offline indicator banner
10. WHEN offline THEN the system SHALL cache: PWA assets, recent project data, and user preferences

---

### Requirement 29: Mobile Responsiveness

**User Story:** As a field worker, I want the application to work seamlessly on my mobile device, so that I can access and update information while on the job site.

#### Acceptance Criteria

1. WHEN the application is accessed on a mobile device THEN the system SHALL display a mobile-optimized layout
2. WHEN viewing navigation on mobile THEN the system SHALL provide a collapsible hamburger menu
3. WHEN interacting with touch elements THEN the system SHALL provide appropriately sized tap targets (minimum 44x44px)
4. WHEN viewing the Metro Journey on mobile THEN the system SHALL provide horizontal scrolling with touch-friendly stations
5. WHEN viewing the Kanban board on mobile THEN the system SHALL optimize for touch-based drag and drop
6. WHEN forms are displayed on mobile THEN the system SHALL use appropriate input types (date picker, number pad, camera access)
7. WHEN viewing tables on mobile THEN the system SHALL provide horizontal scrolling or card-based layouts
8. WHEN capturing photos THEN the system SHALL access the device camera directly

---

### Requirement 30: Search and Global Navigation

**User Story:** As a user, I want to search across projects, tasks, team members, and materials, so that I can quickly find what I need without navigating through multiple pages.

#### Acceptance Criteria

1. WHEN a user clicks the search icon THEN the system SHALL display a global search overlay with keyboard focus
2. WHEN a user types THEN the system SHALL provide real-time suggestions grouped by: Projects, Tasks, People, Materials, Documents
3. WHEN a user selects a result THEN the system SHALL navigate to the corresponding detail page
4. WHEN searching THEN the system SHALL match against: project names, client names, task titles, team member names, material names
5. IF no results are found THEN the system SHALL display a "No results found" message with suggestions
6. WHEN pressing ESC key THEN the system SHALL close the search overlay
7. IF a user has limited permissions THEN the system SHALL only display search results they have access to
8. WHEN searching on mobile THEN the system SHALL provide a full-screen search experience

---

### Requirement 31: Performance and Error Handling

**User Story:** As a user, I want the application to load quickly on low-end devices and provide clear feedback during operations, so that I have a smooth experience even on job site devices.

#### Acceptance Criteria

1. WHEN a page is loading THEN the system SHALL display skeleton loaders
2. WHEN initial page load occurs THEN the system SHALL display critical content within 2 seconds on 3G connection
3. WHEN data is being saved THEN the system SHALL display a saving indicator
4. WHEN data save completes THEN the system SHALL display a success toast notification
5. IF a data save fails THEN the system SHALL display an error message with retry option
6. WHEN large lists load THEN the system SHALL implement pagination or infinite scroll
7. IF a network error occurs THEN the system SHALL display a user-friendly error with retry option
8. WHEN authentication expires THEN the system SHALL redirect to login preserving intended destination
9. IF a 404 error occurs THEN the system SHALL display a helpful error page with navigation options
10. WHEN forms have validation errors THEN the system SHALL display inline error messages with correction guidance

---

## Summary Table

| # | Requirement | Category |
|---|-------------|----------|
| 1 | User Authentication and Role-Based Access Control | Core |
| 2 | Dashboard and Navigation | Core |
| 3 | Company Profile and Multi-Tenant Management | Core |
| 4 | Team Member Management | Team |
| 5 | Subcontractor Directory Management | Team |
| 6 | Project Creation with Type-Specific Templates | Projects |
| 7 | Project List and Filtering | Projects |
| 8 | Metro Journey View (Project Phases) | Projects |
| 9 | Task Creation and Assignment | Tasks |
| 10 | Task Board Views (Kanban and List) | Tasks |
| 11 | Task Detail and Activity | Tasks |
| 12 | AI-Powered Bid Package Creation | Bidding |
| 13 | Subcontractor Bid Invitations | Bidding |
| 14 | AI Bid Comparison and Analysis | Bidding |
| 15 | Bid Award and Contract Generation | Bidding |
| 16 | Project Chatroom | Communication |
| 17 | Direct Messaging | Communication |
| 18 | KakaoTalk Integration | Communication |
| 19 | Materials Management with Home Depot | Materials |
| 20 | Expense Automation via AI OCR | Materials |
| 21 | Project-Wide Materials Dashboard | Materials |
| 22 | Expense Management Workflow | Finance |
| 23 | Daily Site Reports with AI Summaries | Reports |
| 24 | Analytics Dashboard | Analytics |
| 25 | Client Portal | Client |
| 26 | Change Order Engine | Change Orders |
| 27 | Notification System | Notifications |
| 28 | PWA Installation and Offline Support | PWA |
| 29 | Mobile Responsiveness | PWA |
| 30 | Search and Global Navigation | UX |
| 31 | Performance and Error Handling | UX |

---

## The GenHub Advantage

GenHub gives small General Contractors the tools normally reserved for large construction companies — but in a simple, mobile-first, offline-capable PWA that works on any device.

GenHub is the next-generation operating system for small construction companies. A fast, offline-ready PWA that brings together project management, materials, communication, bidding, budgets, analytics, and client transparency — powered by AI and designed for the real-world job site.
