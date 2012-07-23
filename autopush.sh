#!/bin/sh

# This file is for you, the developer, to run while developing the code.  It automatically pushes
#   your new changes into couchdb whenever you save a file.

# Activate the virtualenv
. ../bin/activate

# Get the randomly-generated port for desktopcouch
PORT=$(./get_port.sh)
# Get the admin username and password for couchdb
AUTH=$(cat auth.txt)

# Create .couchapprc file if this has not been done yet
if [ ! -e .couchapprc ];
then
    cp .couchapprc.template .couchapprc
    sed -i "s/username:password/$AUTH/g" .couchapprc
    sed -i "s/60434/$PORT/g" .couchapprc
fi

# Push app into database in case this has not been done yet
couchapp push http://$AUTH@localhost:$PORT/rcl

echo "Starting the Node.js changes listener as a forked child process..."
#( ./node_changes_listener.sh & )

# You can run node-inspector like this:  node-inspector &

# TODO: If I start nosetests from this file too, and run autopush in the background, 
#   I can use this example to kill the autopush process before killing this process:
#   http://hacktux.com/bash/control/c
# TODO: Here is how to start the forked process and kill it afterward:  http://hacktux.com/bash/ampersand
# Kill forked process
cleanup(){
  # TODO: Kill the Node.js process when killing this file's process.  This kill command doesn't work.
  #     It seems the problem is that $! is not recognized as the PID
  kill $!
  return $?
}

# run if user hits control-c
control_c(){
  printf "\n*** Exiting ***\n\n"
  cleanup
  exit $?
}

# trap keyboard interrupt (control-c)
trap control_c INT

# Launch the application in the browser
couchapp browse . http://$AUTH@localhost:$PORT/rcl &

# Start watching the filesystem for changes, and push new changes into the database
# TODO: This loops--it pushes every second, regardless of whether a file changed.  I'd rather
#   have it only push when a file changes.
#couchapp autopush --update-delay 1 http://$AUTH@localhost:$PORT/rcl
# TODO: Try using watchmedo
# TODO: The --ignore-patterns parameter doesn't seem to work in watchmedo, because the ignored files are the only ones that are changing, yet watchmedo doesn't ignore them.  Consider posting at https://groups.google.com/forum/?fromgroups#!forum/watchdog-python
watchmedo shell-command --wait --ignore-patterns='changes_listeners_temp.js;stdout.txt;sync.txt' --recursive --command="couchapp push http://$AUTH@localhost:$PORT/rcl" .
