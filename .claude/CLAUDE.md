...
Append below to your CLAUDE.md

## Design System
**GenHub PWA - Construction Industry Theme**
- **Primary Color**: #001B51 (Navy Blue - professional, trustworthy)
- **Accent Color**: #3C3C3C (Dark Gray - industrial, professional)
- **Accent Light**: #7A7A7A (Mid Gray - lighter shade for accents)
- **Background**: White, clean modern design
- **Industry**: Construction (hard hats, blueprints, tools, building materials)
- **Icons**: Construction-themed (Lucide icons with construction context)
- **Aesthetic**: Professional, trustworthy, industrial strength

## Frontend Design
Use aceternity-ui-expert for all UI/UX component building and tweaking with construction-themed design

## Rules
- Before you do any work, MUST view files in .claude/tasks/context_session_x.md file to get the full context (x being the id of the session we are operate, if file doesnt exist, then create one)
- context_session_x.md should contain most of context of what we did, overall plan, and sub agents will continusly add context to the file
- After you finish the work, MUST update the .claude/tasks/context_session_x.md file to make sure others can get full context of what you did

### Sub agents
You have access to 11 sub agents:
- **vercel-ai-sdk-v5-expert**: all task related to vercel ai sdk HAVE TO consult this agent
- **aceternity-ui-expert**: all task related to Aceternity UI component building & tweaking with CONSTRUCTION-THEMED DESIGN HAVE TO consult this agent
- **code-reviewer**: expert code review for full stack applications, security vulnerabilities, and best practices
- **frontend-expert**: frontend development, UI/UX, and user-facing development tasks with construction-themed design
- **kiro-design**: create comprehensive feature design documents from approved requirements
- **kiro-executor**: execute specific tasks from design specifications and technical specs with focused implementation
- **kiro-plan**: create actionable implementation task lists from approved feature designs
- **kiro-requirement**: requirements analysis and specification development using Kiro methodology
- **nextjs-expert**: Next.js application development, optimization, and architecture including PWA features
- **supabase-nextjs-expert**: Supabase + Next.js integration expert for authentication flows, database patterns, realtime subscriptions, RLS policies, and React Server Components architecture
- **technical-documentation-writer**: create comprehensive user manuals, tutorials, and technical documentation

Sub agents will do research about the implementation, but you will do the actual implementation;
When passing task to sub agent, make sure you pass the context file, e.g. '.claude/tasks/session_context_x.md', 
After each sub agent finish the work, make sure you read the related documentation they created to get full context of the plan before you start executing

# Docs
.agent
- Tasks: PRD & implementation plan for each feature
- System: Document the current state of the system (project structure, tech stack, integration points, 
  database schema, and core functionalities such as agent architecture, LLM layer, etc.)
- SOP: Best practices of execute certain tasks (e.g. how to add a schema migration, how to add a new 
  page route, etc.)
- README.md: an index of all the documentations we have so people know what & where to look for things

# Project Rules (from .claude/rules/)
Reference these rule files for specific guidelines:
- [add_new_files_project_structure_rules.md](rules/add_new_files_project_structure_rules.md) - GenHub PWA project structure
- [create_supabase_table.md](rules/create_supabase_table.md) - Postgres/Supabase table creation guidelines
- [frontend_mdc.md](rules/frontend_mdc.md) - Frontend component implementation rules
- [git.md](rules/git.md) - Git conventional commits format
- [project_requirements.md](rules/project_requirements.md) - GenHub PWA feature requirements breakdown
- [run_aceternity_cmd_line_mdc.md](rules/run_aceternity_cmd_line_mdc.md) - aceternity CLI usage
- [set_database_and_state.md](rules/set_database_and_state.md) - Database schema and state management
- [supabase_types.md](rules/supabase_types.md) - Supabase TypeScript type generation
- [supabase_use.md](rules/supabase_use.md) - Supabase client implementation guidelines