#!/bin/bash

# Migration Deployment Script for Materials Enhancement
# Task 0050: Materials Enhancement - Database Schema
# Date: 2026-01-04

set -e  # Exit on error

echo "======================================================================"
echo "Materials Enhancement - Database Migration Deployment"
echo "======================================================================"
echo ""

# Check for required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  echo "Please set DATABASE_URL in .env.local"
  exit 1
fi

echo "📋 Migrations to apply:"
echo "  1. 20260104000001_create_tracked_materials.sql"
echo "  2. 20260104000002_create_material_price_history.sql"
echo "  3. 20260104000003_add_material_indexes.sql"
echo ""

# Function to apply a migration
apply_migration() {
  local migration_file=$1
  local migration_name=$(basename "$migration_file" .sql)

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📄 Applying: $migration_name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if psql "$DATABASE_URL" -f "$migration_file"; then
    echo "✅ SUCCESS: $migration_name applied"
    echo ""
    return 0
  else
    echo "❌ FAILED: $migration_name"
    echo ""
    return 1
  fi
}

# Apply migrations in order
cd "$(dirname "$0")/.."

apply_migration "supabase/migrations/20260104000001_create_tracked_materials.sql" || exit 1
apply_migration "supabase/migrations/20260104000002_create_material_price_history.sql" || exit 1
apply_migration "supabase/migrations/20260104000003_add_material_indexes.sql" || exit 1

echo "======================================================================"
echo "✅ All migrations applied successfully!"
echo "======================================================================"
echo ""
echo "📊 Summary:"
echo "  ✓ tracked_materials table created"
echo "  ✓ material_price_history table created"
echo "  ✓ Indexes added to materials and material_assignments"
echo "  ✓ RLS policies enabled"
echo "  ✓ Triggers configured"
echo "  ✓ Max 10 tracking limit enforced"
echo ""
echo "🔍 Verification steps:"
echo "  1. Verify tables: SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%material%';"
echo "  2. Test tracking limit (should fail on 11th insert)"
echo "  3. Verify RLS policies: \\d+ tracked_materials"
echo "  4. Check indexes: \\di public.*material*"
echo ""
echo "💡 Next steps:"
echo "  1. Run: npm run db:types (or npx supabase gen types typescript)"
echo "  2. Verify TypeScript types updated"
echo "  3. Run: npm run build"
echo "  4. Deploy to production"
echo ""
