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
PORT=$(./get_port.sh)
# Get the admin username and password for couchdb
AUTH=$(cat auth.txt)

echo "Starting the Node.js changes listener..."
# Uncomment for debugging
#curl -s "http://localhost:$PORT/rcl/_design/rcl" | python -c "import json, sys; print(json.loads(''.join(sys.stdin.readlines()))['changes'])" | node --debug-brk
# Uncomment when not debugging
curl -s "http://$AUTH@localhost:$PORT/rcl/_design/rcl" | python -c "import json, sys; print(json.loads(''.join(sys.stdin.readlines()))['changes'])" | node

# TODO: Kill the Node.js process when killing this file's process.  The kill command above doesn't work.

# You can run node-inspector like this:  node-inspector &

# sleep 5
# exit

# TODO: If I start nosetests from this file too, and run autopush in the background, I can use this example to kill the autopush process before killing this process:  http://hacktux.com/bash/control/c
# TODO: Here is how to start the forked process and kill it afterward:  http://hacktux.com/bash/ampersand
#couchapp autopush http://local:local@localhost:45773/rcl
# TODO: The watchdog command is like this:  watchmedo shell-command --patterns="*.py;*.txt" --recursive --command='nosetests' .

# Push app into database if this has not been done yet
if [ ! -e .couchapprc ];
then
    cp .couchapprc.template .couchapprc
    sed -i "s/username:password/$AUTH/g" .couchapprc
    sed -i "s/60434/$PORT/g" .couchapprc
    couchapp push http://$AUTH@localhost:$PORT/rcl
fi

# Launch the application in the browser
couchapp browse . http://$AUTH@localhost:$PORT/rcl
# Start watching the filesystem for changes, and push new changes into the database
couchapp autopush --update-delay 1 http://$AUTH@localhost:$PORT/rcl

