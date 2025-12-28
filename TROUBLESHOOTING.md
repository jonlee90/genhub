# GenHub PWA - Troubleshooting Guide

## Projects Not Saving to Database

If you're experiencing issues where projects aren't being saved to the Supabase database, follow these steps:

### 1. Run Database Diagnostics

First, check if your database is properly set up:

```bash
npm run db:diagnose
```

This will check:
- ✅ If all required tables exist
- ✅ If NextAuth tables are set up
- ✅ If you have active company users
- ✅ If RLS policies are configured

### 2. Common Issues and Solutions

#### Issue: Tables Don't Exist

**Error Message:** `relation "projects" does not exist` or similar

**Solution:** Run the database migrations in order:

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Run these migration files **IN ORDER**:

```bash
# Copy and paste the contents of each file into the SQL Editor:

1. supabase/migrations/01_setup_and_auth.sql
2. supabase/migrations/02_enums.sql
3. supabase/migrations/03_tables.sql
4. supabase/migrations/04_rls_policies.sql
5. supabase/migrations/05_triggers.sql
```

After running all migrations, run diagnostics again:
```bash
npm run db:diagnose
```

#### Issue: No Company Users Found

**Error Message:** `No active company found for user`

**Solution:** You need to create a test company and link your user to it.

Run the automated setup script:

```bash
npm run db:setup
```

This will:
- ✅ Find your user account
- ✅ Create a user profile (if needed)
- ✅ Create a test company
- ✅ Link you to the company as a GC Admin
- ✅ Set your status to "active"

#### Issue: Wrong Role

**Error Message:** `Insufficient permissions to create projects`

**Solution:** You need to be either a **GC Admin** or **Project Manager** to create projects.

The `db:setup` script will automatically set you as GC Admin. If you need to change roles manually:

1. Open Supabase Dashboard → SQL Editor
2. Run this query (replace `YOUR_USER_ID` with your actual user ID):

```sql
UPDATE public.company_users
SET role = 'gc_admin', status = 'active'
WHERE user_id = 'YOUR_USER_ID';
```

#### Issue: Authentication Not Working

**Error Message:** `Not authenticated`

**Solution:** Make sure you're logged in:

1. Go to the login page
2. Sign in with your credentials
3. Check the browser console for any auth errors
4. Verify your `.env.local` has correct Supabase credentials

### 3. Manual Testing

After fixing the issues above, test project creation:

1. Navigate to **Projects** → **New Project**
2. Fill out the form
3. Open browser console (F12)
4. Click "Create Project"
5. Check console for errors

**Expected console output (success):**
```
Creating project with context: { userId: "...", companyId: "...", role: "gc_admin" }
```

**Error console output (RLS blocked):**
```
Error creating project: new row violates row-level security policy
```

### 4. Database Schema Requirements

For reference, the `projects` table requires:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `company_id` | UUID | Yes | Must match your active company |
| `name` | Text | Yes | Project name |
| `client_name` | Text | Yes | Client name |
| `client_email` | Text | No | Client email |
| `client_phone` | Text | No | Client phone |
| `address` | Text | No | Project address |
| `project_type` | Enum | Yes | residential, restaurant_cafe, commercial_office, industrial |
| `status` | Enum | Yes | active, on_hold, completed, archived |
| `start_date` | Date | Yes | Project start date |
| `created_by` | UUID | No | Your user ID |

### 5. RLS Policy Requirements

The RLS policy checks:
```sql
-- User must be in company_users table with:
- user_id = next_auth.uid()  -- Your authenticated user ID
- role = 'gc_admin' OR 'project_manager'
- status = 'active'
- company_id matches the project's company_id
```

If any of these conditions fail, the insert will be blocked.

### 6. Get Additional Help

If you're still experiencing issues:

1. **Check browser console** for detailed error messages
2. **Check Supabase logs**: Dashboard → Logs → Select your project
3. **Verify environment variables** in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SECRET_KEY=your_service_role_key
   ```

### 7. Development Mode Notes

In development mode, if you're not authenticated, the app uses an anonymous Supabase client which will fail RLS checks. Make sure to:

1. Always be logged in when testing
2. Have a valid `supabaseAccessToken` in your session
3. Have an active `company_users` record

---

## Quick Reference

```bash
# Diagnose database issues
npm run db:diagnose

# Set up test data (company + user link)
npm run db:setup

# Check if migrations are needed
ls supabase/migrations/

# View your user ID (run in Supabase SQL Editor)
SELECT id, email FROM next_auth.users;

# View your company links (run in Supabase SQL Editor)
SELECT * FROM public.company_users WHERE user_id = 'YOUR_USER_ID';
```

---

**Last Updated:** 2025-12-05
