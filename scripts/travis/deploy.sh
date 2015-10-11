#!/bin/sh

# Run gulp task to prep for deployment

gulp default
git add .
git commit -am "add dist directory"

# Copy files to production server

eval "$(ssh-agent -s)" #start the ssh agent
chmod 600 ~/.ssh/id_rsa # this key should have push access
ssh-add ~/.ssh/id_rsa
git remote add deploy ssh://timblack1@timblack1.webfactional.com:webapps/rcl
git push deploy

# Update npm dependencies on production server

ssh timblack1@timblack1.webfactional.com 'cd webapps/rcl && npm update'

# TODO: Restart app on production server