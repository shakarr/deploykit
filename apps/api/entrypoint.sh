#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/apps/api
tsx src/db/migrate.ts 2>&1 || {
  echo "Migration failed — trying drizzle-kit push as fallback..."
  npx drizzle-kit push --force 2>&1 || echo "Warning: migrations may need manual attention"
}

echo "Starting API server..."
cd /app
exec tsx apps/api/src/index.ts
