#!/bin/sh

# This file is for you, the developer, to run while developing the code.  It automatically pushes
#   your new changes into couchdb whenever you save a file.

# Activate the virtualenv
. ../bin/activate

# Get the randomly-generated port for desktopcouch
./get_port.sh
PORT=$(cat port.txt)
# Get the admin username and password for couchdb
AUTH=$(cat auth.txt)

# Create .couchapprc file if this has not been done yet
if [ ! -e .couchapprc ];
then
    cp .couchapprc.template .couchapprc
    sed -i "s/username:password/$AUTH/g" .couchapprc
    sed -i "s/5984/$PORT/g" .couchapprc
fi

# Push app into database in case this has not been done yet
couchapp push http://$AUTH@localhost:$PORT/rcl

#echo "Starting the Node.js changes listener as a forked child process..."
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
watchmedo shell-command --wait --recursive --command="couchapp push http://$AUTH@localhost:$PORT/rcl" .
