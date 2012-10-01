#!/bin/sh

# Get the currently-known port
PORT=$(cat port.txt)
# Get the admin username and password for couchdb
AUTH=$(cat auth.txt)
DB_RESPONSE=$(curl http://$AUTH@localhost:$PORT/)
# Test to see if the currently-known port works
if [ `expr match "$DB_RESPONSE" "{\"couchdb\":\"Welcome\",\"version\".*"` -gt 0 ] ;
then
    echo "We have the right port!  So we aren't modifying the filesystem."
else
    echo "We don't have the right port yet.  So we'll get it and write it to port.txt."
    # Try the default port for couchdb
    DB_RESPONSE=$(curl http://$AUTH@localhost:5984/)
    # Test to see if the currently-known port works
    if [ `expr match "$DB_RESPONSE" "{\"couchdb\":\"Welcome\",\"version\".*"` -gt 0 ] ;
    then
        echo "We have the right port!  So we aren't modifying the filesystem."
        PORT=5984
    else
        # Get the randomly-generated port for desktopcouch
        PORT=$(dbus-send --session --dest=org.desktopcouch.CouchDB    --print-reply --type=method_call /    org.desktopcouch.CouchDB.getPort | sed -e 's/^.* //' | tail -1)
    echo $PORT > port.txt
    fi
fi
