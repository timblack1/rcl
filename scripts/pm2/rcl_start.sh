#export HOODIE_BIND_ADDRESS=0.0.0.0:11411
#export COUCH_URL=http://127.0.0.1:11411
hoodie start -n --custom-ports 20188,19911,27069 -w dist
# TODO: Decide whether the following is what we need instead of the above
# gulp serve:dist