#!/bin/sh

# Get the randomly-generated port for desktopcouch
PORT=$(dbus-send --session --dest=org.desktopcouch.CouchDB    --print-reply --type=method_call /    org.desktopcouch.CouchDB.getPort | sed -e 's/^.* //' | tail -1)
echo $PORT
