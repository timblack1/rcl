#!/bin/bash

# Usage: This script is intended to be run from the root rcl directory, like this:
# ./scripts/deploy-from-local.sh

git checkout production
git merge master

# Run gulp task to prep for deployment, and commit dist directory to git

# Usually these commands won't be needed, so I've commented them out to make the 
#   script run faster.
# They can be run manually when the deploy process fails.

# rm -rf node_modules
# npm install

echo "Running gulp default to create dist directory..."
gulp default
echo "Removing dist from .gitignore..."
sed -i '/dist/d' ./.gitignore

git add dist
git commit -am "add dist directory"

git push deploy

echo "Installing dependencies on production server..."
ssh timblack1@timblack1.webfactional.com 'cd ~/webapps/rcl && git checkout && npm install --production && bower install'

echo "Restarting app on production server..."
ssh timblack1@timblack1.webfactional.com 'cd ~/webapps/rcl && git checkout && npm start-production'

git checkout -f develop