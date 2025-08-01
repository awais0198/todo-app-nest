#!/bin/sh

echo "🚀 Starting Todo API..."

if [ -n "$DATABASE_URL" ]; then
  echo "☁️ Cloud deployment detected - using DATABASE_URL"
else
  echo "🐳 Local development - waiting for postgres service..."
  while ! nc -z postgres 5432; do
    sleep 1
  done
  echo "✅ Database is ready!"
  
  echo "🗄️ Initializing database..."
  npm run db:init || echo "Database already initialized"
fi

echo "🔄 Starting production server..."
npm run start:prod