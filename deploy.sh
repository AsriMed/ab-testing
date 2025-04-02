#!/bin/bash

# Set error handling
set -e

echo "Deploying API..."
cd ab-testing-api && npx wrangler deploy
echo "API deployment complete!"

echo "Deploying Frontend..."
cd ../ab-testing-frontend
# Create a temporary build directory
mkdir -p dist
# Compile the TypeScript to JavaScript
echo "Transpiling TypeScript..."
npx tsc --jsx react --outDir dist --esModuleInterop true src/index.tsx
# Update the wrangler config to use the compiled file
echo "Deploying frontend worker..."
npx wrangler deploy --main dist/index.js
echo "Frontend deployment complete!"

echo "All deployments finished successfully!"

