#!/bin/sh

# Startup script for Next.js application in Docker container

# Set default environment if not provided
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

# Set up environment variables for the application
if [ -f .env.test ]; then
    echo "Using test environment variables"
    # Export variables from .env.test
    export $(cat .env.test | grep -v '^#' | xargs)
elif [ -f .env ]; then
    echo "Using development environment variables"
    # Export variables from .env
    export $(cat .env | grep -v '^#' | xargs)
elif [ -f .env.production ]; then
    echo "Using production environment variables"
    # Export variables from .env.production
    export $(cat .env.production | grep -v '^#' | xargs)
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
