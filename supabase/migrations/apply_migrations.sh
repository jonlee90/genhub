#!/bin/bash
# Script to apply migrations using Supabase CLI
# Run this script to deploy the file management migrations

set -e

echo "Applying file management migrations..."

# Migration 1: Enum types
echo "1. Creating enum types..."
npx supabase db execute < /Users/jonathanlee/Desktop/genhub/supabase/migrations/20260106000001_create_file_enums.sql

# Migration 2: project_files table
echo "2. Creating project_files table..."
npx supabase db execute < /Users/jonathanlee/Desktop/genhub/supabase/migrations/20260106000002_create_project_files.sql

# Migration 3: project_photos table
echo "3. Creating project_photos table..."
npx supabase db execute < /Users/jonathanlee/Desktop/genhub/supabase/migrations/20260106000003_create_project_photos.sql

# Migration 4: file_audit_log table
echo "4. Creating file_audit_log table..."
npx supabase db execute < /Users/jonathanlee/Desktop/genhub/supabase/migrations/20260106000004_create_file_audit_log.sql

echo "✓ All migrations applied successfully!"
echo ""
echo "Next steps:"
echo "1. Regenerate TypeScript types: npm run db:types"
echo "2. Verify schema in Supabase dashboard"
