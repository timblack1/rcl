#!/bin/sh

# Run gulp task to prep for deployment, and commit dist directory to git

echo "Running gulp default..."
gulp default
git add .
git commit -am "add dist directory"

# Copy files to production server

eval "$(ssh-agent -s)" #start the ssh agent
chmod 600 ~/.ssh/id_dsa # this key should have push access
ssh-add ~/.ssh/id_dsa
# chmod 600 ~/.ssh/id_rsa # this key should have push access
# ssh-add ~/.ssh/id_rsa
# Add SSH key fingerprint to known_hosts
echo "|1|oHsg/KauDxCV9IrVipFmiQ8ZtQE=|NX0LlPZE1+MO6Sxf9SlGb6fHMmI= ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA3V+waEkDMazM7oWm3dpqr8YXMUD86NJgcOl2N9UkPQmozqnHVvrFhABoEwnFb3oreTRrXG/NTyevpvs7eOwWzXkBvGHCwcr70CISWM3do9KreQBBKoYFXW5fUe2/z2wYwrLydPMsnKUBtyiSggsOdWRBnJYI4M0Wdh49TnhNktVbV+i2N/FQnGUNTm/YwI3Lykjy7qMIE8WUMeifpHh3md8c51WK8gzIqsjej614uWFn4q0LqRx2QhpvLKHVicUfACzkF3GfHQ9xlhdCgWqYoaI6ECS9JeZKKFOXIgfidBWZqKniQUrQFgNL2dLIWROE8yFEpxUUhQyfLI4wzqFiow==" >> ~/.ssh/known_hosts
echo "|1|h9vGsRLcjfPVOaFDemRRFrBTQhU=|bhvBkO38uMeNwfHAsu7zG1Nr3js= ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA3V+waEkDMazM7oWm3dpqr8YXMUD86NJgcOl2N9UkPQmozqnHVvrFhABoEwnFb3oreTRrXG/NTyevpvs7eOwWzXkBvGHCwcr70CISWM3do9KreQBBKoYFXW5fUe2/z2wYwrLydPMsnKUBtyiSggsOdWRBnJYI4M0Wdh49TnhNktVbV+i2N/FQnGUNTm/YwI3Lykjy7qMIE8WUMeifpHh3md8c51WK8gzIqsjej614uWFn4q0LqRx2QhpvLKHVicUfACzkF3GfHQ9xlhdCgWqYoaI6ECS9JeZKKFOXIgfidBWZqKniQUrQFgNL2dLIWROE8yFEpxUUhQyfLI4wzqFiow==" >> ~/.ssh/known_hosts
echo "|1|V44YyF7R1eFyn+mxJBlmP4neB/8=|S1izmqdEdeCix9AoTU5CQVpeLRI= ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA3V+waEkDMazM7oWm3dpqr8YXMUD86NJgcOl2N9UkPQmozqnHVvrFhABoEwnFb3oreTRrXG/NTyevpvs7eOwWzXkBvGHCwcr70CISWM3do9KreQBBKoYFXW5fUe2/z2wYwrLydPMsnKUBtyiSggsOdWRBnJYI4M0Wdh49TnhNktVbV+i2N/FQnGUNTm/YwI3Lykjy7qMIE8WUMeifpHh3md8c51WK8gzIqsjej614uWFn4q0LqRx2QhpvLKHVicUfACzkF3GfHQ9xlhdCgWqYoaI6ECS9JeZKKFOXIgfidBWZqKniQUrQFgNL2dLIWROE8yFEpxUUhQyfLI4wzqFiow==" >> ~/.ssh/known_hosts
echo "|1|2WS094AuKUEKrVFgmQQhlGi/npc=|hK7oz6AY/WYcLwb6whngTACng5w= ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA3V+waEkDMazM7oWm3dpqr8YXMUD86NJgcOl2N9UkPQmozqnHVvrFhABoEwnFb3oreTRrXG/NTyevpvs7eOwWzXkBvGHCwcr70CISWM3do9KreQBBKoYFXW5fUe2/z2wYwrLydPMsnKUBtyiSggsOdWRBnJYI4M0Wdh49TnhNktVbV+i2N/FQnGUNTm/YwI3Lykjy7qMIE8WUMeifpHh3md8c51WK8gzIqsjej614uWFn4q0LqRx2QhpvLKHVicUfACzkF3GfHQ9xlhdCgWqYoaI6ECS9JeZKKFOXIgfidBWZqKniQUrQFgNL2dLIWROE8yFEpxUUhQyfLI4wzqFiow==" >> ~/.ssh/known_hosts
echo "|1|WCA7QffbfOse2kmkNFxPfBYsFzo=|7doD/PASp/PX+Gu4j3KebXlVsww= ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAIEAx7Td272cgnoVeBPINklRhV8EwAQDHrUEcLMMshWwhg7bANN889gaZVvLzKYlKTasJ1qeF7Gq+J+d4Kg2aVoP++EmvCid/5ukDYxDJHPIojYHp6iY1S1KhhgMlfgWWY5Tk3CeItby7lQHQXfTXaunKN3OJKRcIOaJQl9fiKsDJ6k=" >> ~/.ssh/known_hosts
git remote add deploy timblack1@timblack1.webfactional.com:webapps/rcl
echo "Pushing to master on production server..."
git push deploy master

# Update npm dependencies on production server

echo "Updating npm dependencies on production server..."
ssh timblack1@timblack1.webfactional.com 'cd webapps/rcl && npm update'

# Restart app on production server

echo "Restarting app on production server..."
ssh timblack1@timblack1.webfactional.com 'cd webapps/rcl && npm run start-production'