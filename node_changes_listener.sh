#!/bin/sh

PORT=5984
# Get the admin username and password for couchdb
LOGIN=$(cat login.txt)
DOMAIN=localhost
DOMAIN=arwd.iriscouch.com

# Uncomment for debugging
#curl -s "http://$LOGIN@$DOMAIN:$PORT/rcl/_design/rcl" | python -c "import json, sys; print(json.loads(''.join(sys.stdin.readlines()))['changes'])" | nodejs --debug-brk

# Uncomment when not debugging
curl -s "http://$LOGIN@$DOMAIN:$PORT/rcl/_design/rcl" | python -c "import json, sys; print(json.loads(''.join(sys.stdin.readlines()))['changes'])" | nodejs

# Uncomment for production - runs as a background process
#curl -s "http://$LOGIN@$DOMAIN:$PORT/rcl/_design/rcl" | python -c "import json, sys; print(json.loads(''.join(sys.stdin.readlines()))['changes'])" | nodejs &
