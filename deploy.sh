#! /bin/bash

# wrangler r2 bucket create ab_testing_frontend_files
cd ab-testing-api && npx wrangler deploy
cd ../ab-testing-frontend && npx wrangler deploy

