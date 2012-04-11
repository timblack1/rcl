#!/bin/sh

. ../bin/activate
# TODO: If I start nosetests from this file too, and run autopush in the background, I can use this example to kill the autopush process before killing this process:  http://hacktux.com/bash/control/c
# TODO: Here is how to start the forked process and kill it afterward:  http://hacktux.com/bash/ampersand
#couchapp autopush http://local:local@localhost:45773/rcl
# TODO: The watchdog command is like this:  watchmedo shell-command --patterns="*.py;*.txt" --recursive --command='nosetests' .
couchapp browse . desktopcouch://rcl
couchapp autopush --update-delay 1 desktopcouch://rcl

