#!/bin/sh -e

# This file does the following:
# call node_modules/hoodie-server/bin/start manually
# pipe stdout & stderr into files

userhome=/home/timblack1
apphome=$userhome/webapps/rcl
pidfile=$apphome/data/hoodie.pid
stdoutfile=$userhome/logs/user/rcl.stdout.log
stderrfile=$userhome/logs/user/rcl.stderr.log
#hoodie_user=hoodie

# mkdir -p $apphome/log
# mkdir -p $apphome/run

cd $apphome

# ---------------------------------------------------------------------
# This block is the version of this file from before we integrated code
# from Jan's hoodie-daemon.sh.
#export HOODIE_BIND_ADDRESS=0.0.0.0:11411
#export COUCH_URL=http://127.0.0.1:11411
# hoodie start -n --custom-ports 20188,19911,27069 -w dist
# TODO: Decide whether the following is what we need instead of the above
# gulp serve:dist
# ---------------------------------------------------------------------

# the command
# sudo -u $hoodie_user \
# COUCH_URL=http://127.0.0.1:6003 \
HOODIE_ADMIN_USER=admin \
HOODIE_ADMIN_PASS="$HOODIE_ADMIN_PASS" \
HOME=$apphome \
node node_modules/hoodie-server/bin/start --custom-ports 20188,19911,27069 -w dist \
1>>$stdoutfile \
2>>$stderrfile \

