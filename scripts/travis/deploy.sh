#!/bin/sh

# Run gulp task to prep for deployment

gulp default
git add .
git commit -am "add dist directory"

# Copy files to production server

eval "$(ssh-agent -s)" #start the ssh agent
chmod 600 ~/.ssh/id_rsa # this key should have push access
ssh-add ~/.ssh/id_rsa
# Add SSH key fingerprint to known_hosts
echo "|1|oHsg/KauDxCV9IrVipFmiQ8ZtQE=|NX0LlPZE1+MO6Sxf9SlGb6fHMmI= ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA3V+waEkDMazM7oWm3dpqr8YXMUD86NJgcOl2N9UkPQmozqnHVvrFhABoEwnFb3oreTRrXG/NTyevpvs7eOwWzXkBvGHCwcr70CISWM3do9KreQBBKoYFXW5fUe2/z2wYwrLydPMsnKUBtyiSggsOdWRBnJYI4M0Wdh49TnhNktVbV+i2N/FQnGUNTm/YwI3Lykjy7qMIE8WUMeifpHh3md8c51WK8gzIqsjej614uWFn4q0LqRx2QhpvLKHVicUfACzkF3GfHQ9xlhdCgWqYoaI6ECS9JeZKKFOXIgfidBWZqKniQUrQFgNL2dLIWROE8yFEpxUUhQyfLI4wzqFiow==" >> ~/.ssh/known_hosts
git remote add deploy ssh://timblack1@timblack1.webfactional.com:webapps/rcl
git push deploy

# Update npm dependencies on production server

ssh timblack1@timblack1.webfactional.com 'cd webapps/rcl && npm update'

# Restart app on production server

ssh timblack1@timblack1.webfactional.com 'cd webapps/rcl && npm run start-production'