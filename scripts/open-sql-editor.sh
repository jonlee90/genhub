#!/bin/bash

# Extract project ref from .env
PROJECT_REF=$(grep NEXT_PUBLIC_SUPABASE_URL .env | sed 's/.*https:\/\/\([^.]*\).*/\1/')

echo "╔═══════════════════════════════════════════════════════╗"
echo "║     Apply Migration 045 - Open SQL Editor            ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Opening Supabase SQL Editor in your browser..."
echo ""
echo "📋 Instructions:"
echo "   1. Copy the contents of this file:"
echo "      supabase/migrations/045_auto_create_phases_tasks_from_templates.sql"
echo ""
echo "   2. Paste into the SQL Editor"
echo "   3. Click 'Run' button"
echo "   4. Wait for success message"
echo "   5. Run: node scripts/verify-migration-applied.mjs"
echo ""

# Open browser
open "https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"

echo "✅ SQL Editor opened in browser!"
echo ""
