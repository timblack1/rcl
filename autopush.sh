#!/bin/sh

# This file is for you, the developer, to run while developing the code.  It automatically pushes
#   your new changes into couchdb whenever you save a file.

MODE="dev-local"
#MODE="prod-webfaction"

if [ "$MODE" = 'dev-local' ];
then
  # # Development copy - local
  # # Get the admin username and password for couchdb
  LOGIN=$(cat login.txt)
  PORT=5984
  HOST=localhost
  # HOST=arwd.cloudant.com
  DBNAME=rcl-dev;
fi;

if [ "$MODE" = 'prod-webfaction' ];
then
  # Production copy
  # Get the admin username and password for couchdb
  LOGIN=$(cat login.txt)
  PORT=80
  HOST=rcl.alwaysreformed.com/_api
  DBNAME=rcl;
fi;

URL=http:///$LOGIN@$HOST:$PORT/$DBNAME

# Create .couchapprc file if this has not been done yet
# TODO: erica loads .couchapprc.* so we need to rename this file to not start with the dot.
if [ ! -e .couchapprc ];
then
    cp couchapprc.template .couchapprc
    sed -i "s/username:password/$LOGIN/g" .couchapprc
    sed -i "s/5984/$PORT/g" .couchapprc
fi

# Push app's db functions (views, updates, etc.) into database in case this has not been done yet
erica -v push $URL
# couchapp push $URL
# couchdb-push $URL

# Start watching the filesystem for changes, and push new changes into the database
# Avoid multiple pushes caused by text editors saving the file more than once.
inotifywait -mr . --exclude .git -e close_write --format '%w %e %T' --timefmt '%H%M%S' | while read file event tm; do
    current=$(date +'%H%M%S')
    delta=`expr $current - $tm`
    if [ $delta -lt 2 -a $delta -gt -2 ] ; then
        sleep 1  # sleep 1 second to let file operations end
        ~/bin/erica -v push $URL
        # couchdb-push $URL
    fi
done
