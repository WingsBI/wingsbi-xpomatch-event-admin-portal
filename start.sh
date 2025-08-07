#!/bin/sh

# Startup script for Next.js application
echo "Starting XPO Match Event Admin Portal..."

# Set environment variables
export NODE_ENV=production

# Copy environment file if it exists
if [ -f .env.test ]; then
    echo "Using .env.test configuration"
    cp .env.test .env.production
elif [ -f .env.production ]; then
    echo "Using .env.production configuration"
else
    echo "No environment file found, using defaults"
fi

# Start the application
echo "Starting Next.js application..."
exec npm start
