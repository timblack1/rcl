#!/bin/sh -e

# start:
# call node_modules/hoodie-server/bin/start manually
# pipe stdout & stderr into files
# send to bg
# capture pid
# write pid to pidfile

# stop
# read pidfile
# if no pidfile,
#   say no process
# kill -INT pid # so couchdb can stop gracefully
# rm the pidfile

userhome=/home/timblack1
apphome=$userhome/webapps/rcl
pidfile=$apphome/data/hoodie.pid
stdoutfile=$userhome/logs/user/hoodie.stdout
stderrfile=$userhome/logs/user/hoodie.stderr
#hoodie_user=hoodie

# mkdir -p $apphome/log
# mkdir -p $apphome/run

cd $apphome

case "$1" in
  start)
    # if pidfile exists, report and exit
    # expect user to clean up stale pidfile
    if [ -f "$pidfile" ]; then
      echo "Pidfile still exists: $pidfile:"
      cat $pidfile
      exit 2
    fi

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
    COUCH_URL=http://127.0.0.1:6003 \
    HOODIE_ADMIN_USER=admin \
    HOODIE_ADMIN_PASS="$HOODIE_ADMIN_PASS" \
    HOME=$apphome \
    node node_modules/hoodie-server/bin/start --custom-ports 20188,19911,27069 -w dist \
    1>>$stdoutfile \
    2>>$stderrfile \
    &

    pid=$!
    echo $pid > $pidfile
    echo "Started."
  ;;

  stop)
    if [ ! -f "$pidfile" ]; then
      echo "Pidfile $pidfile does not exist."
      exit 3
    fi
    pid=$(<$pidfile)
    kill -INT $pid
    rm $pidfile
    echo "Stopped."
  ;;

  *)
    echo "Invalid or missing command. Try 'start' or 'stop'."
  ;;
esac
