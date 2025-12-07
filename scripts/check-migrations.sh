#!/bin/bash
# Check for uncommitted Django migrations
# This script will fail if there are model changes that need migrations

cd "$(dirname "$0")/../backend" || exit 1

# Capture output to check if migrations are needed
MIGRATION_OUTPUT=$(uv run python manage.py makemigrations --check --dry-run 2>&1)
MIGRATION_EXIT_CODE=$?

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "✓ No uncommitted migrations detected"
    exit 0
else
    echo "✗ Uncommitted migrations detected!"
    echo ""
    echo "Model changes detected that require migrations. Run:"
    echo "  uv run python backend/manage.py makemigrations"
    echo ""
    echo "Preview of migrations that would be created:"
    echo "$MIGRATION_OUTPUT"
    exit 1
fi
