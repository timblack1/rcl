#!/bin/bash

# Usage: This script is intended to be run from the root rcl directory, like this:
# ./scripts/deploy-from-local.sh
# Note: This script will run whatever branch is checked out on the server; that might not
#   be the same branch you're working on right now.

# Run gulp task to prep for deployment by creating dist directory

# Usually these commands won't be needed since I run them periodically during development,
#   so I've commented them out to make the script run faster. They can be run manually when
#   the deploy process fails.

# rm -rf node_modules
# npm install

echo "Running gulp default to create dist directory..."
gulp default

git push deploy
rsync -avz dist timblack1@timblack1.webfactional.com:webapps/rcl/

echo "Installing dependencies on production server..."
ssh timblack1@timblack1.webfactional.com 'cd ~/webapps/rcl && npm install --production && bower install'

echo "Restarting app on production server..."
ssh timblack1@timblack1.webfactional.com 'cd ~/webapps/rcl && npm run start-production'

# git checkout -f develop