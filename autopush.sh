#!/bin/sh

# Kill forked process
cleanup(){
  echo $!
  kill $!
  return $?
}

# run if user hits control-c
control_c(){
  echo -en "\n*** Exiting ***\n"
  cleanup
  exit $?
}
 
# trap keyboard interrupt (control-c)
trap control_c INT

# Activate the virtualenv
. ../bin/activate

# Get the randomly-generated port for desktopcouch
PORT=$(dbus-send --session --dest=org.desktopcouch.CouchDB    --print-reply --type=method_call /    org.desktopcouch.CouchDB.getPort | sed -e 's/^.* //' | tail -1)

# Start the Node.js changes listener
curl -s "http://localhost:$PORT/rcl/_design/rcl" | python -c "import json, sys; print(json.loads(''.join(sys.stdin.readlines()))['changes'])" | node
# TODO: Kill the Node.js process when killing this file's process.  The kill command above doesn't work.

# sleep 20
# exit

# TODO: If I start nosetests from this file too, and run autopush in the background, I can use this example to kill the autopush process before killing this process:  http://hacktux.com/bash/control/c
# TODO: Here is how to start the forked process and kill it afterward:  1
#couchapp autopush http://local:local@localhost:45773/rcl
# TODO: The watchdog command is like this:  watchmedo shell-command --patterns="*.py;*.txt" --recursive --command='nosetests' .

# Launch the application in the browser
couchapp browse . http://localhost:$PORT/rcl
# Start watching the filesystem for changes, and push new changes into the database
AUTH=$(cat auth.txt)
couchapp autopush --update-delay 1 http://$AUTH@localhost:$PORT/rcl

