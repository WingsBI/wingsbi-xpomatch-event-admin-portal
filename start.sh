#!/bin/sh

# Startup script for Next.js application in Docker container

# Set default environment if not provided
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

# Copy test environment to .env.local if it exists
if [ -f .env.test ]; then
    cp .env.test .env.local
    echo "Using test environment variables"
elif [ -f .env.production ]; then
    cp .env.production .env.local
    echo "Using production environment variables"
else
    echo "No environment file found, using defaults"
fi

# Wait for any dependencies (if needed)
# Example: wait for database
# while ! nc -z $DB_HOST $DB_PORT; do
#   echo "Waiting for database..."
#   sleep 1
# done

# Start the Next.js application
echo "Starting Next.js application..."
exec npm start
