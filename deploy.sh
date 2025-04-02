#! /bin/bash

# wrangler r2 bucket create ab_testing_frontend_files
cd ab-testing-api && wrangler deploy
cd ../ab-testing-frontend && wrangler deploy

