#!/bin/sh

# Production settings
#PORT=5984
# Get the admin username and password for couchdb
#LOGIN=$(cat login.txt)
#DOMAIN=localhost
#DOMAIN=arwd.iriscouch.com
#DBNAME=rcl

# Development settings
PORT=5984
# Get the admin username and password for couchdb
LOGIN=$(cat login.txt)
#DOMAIN=localhost
DOMAIN=arwd.iriscouch.com
DBNAME=rcl-dev

# TODO: Convert this to use nodejs rather than Python
# Uncomment for debugging
#curl -s "http://$LOGIN@$DOMAIN:$PORT/$DBNAME/_design/rcl/node_changes_listeners/changes.js" | nodejs --debug-brk

# Uncomment when not debugging
# echo "http://$LOGIN@$DOMAIN:$PORT/$DBNAME/_design/rcl/node_changes_listeners/changes.js"
curl -s "http://$LOGIN@$DOMAIN:$PORT/$DBNAME/_design/rcl/node_changes_listeners/changes.js" | nodejs

# Uncomment for production - runs as a background process
#curl -s "http://$LOGIN@$DOMAIN:$PORT/$DBNAME/_design/rcl/node_changes_listeners/changes.js" | nodejs &
