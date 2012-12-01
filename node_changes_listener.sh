#!/bin/sh

PORT=5984
# Get the admin username and password for couchdb
AUTH=$(cat auth.txt)

# Uncomment for debugging
#curl -s "http://$AUTH@localhost:$PORT/rcl/_design/rcl" | python -c "import json, sys; print(json.loads(''.join(sys.stdin.readlines()))['changes'])" | node --debug-brk

# Uncomment when not debugging
curl -s "http://$AUTH@localhost:$PORT/rcl/_design/rcl" | python -c "import json, sys; print(json.loads(''.join(sys.stdin.readlines()))['changes'])" | node

# Uncomment for production - runs as a background process
#curl -s "http://$AUTH@localhost:$PORT/rcl/_design/rcl" | python -c "import json, sys; print(json.loads(''.join(sys.stdin.readlines()))['changes'])" | node &
