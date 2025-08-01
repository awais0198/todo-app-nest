#!/bin/sh

echo "🚀 Starting Todo API..."

echo "⏳ Waiting for database to be ready..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ Database is ready!"

echo "🗄️ Initializing database..."
npm run db:init || echo "Database already initialized"

echo "🔄 Starting development server..."
npm run start:dev