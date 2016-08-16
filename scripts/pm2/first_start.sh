#!/bin/sh

# This script permits you to start the application for the first time.
# Because Hoodie requires an admin password, you should rename
# hoodie_admin_password.txt.template to hoodie_admin_password.txt and
# place your password in that file.  Don't commit that file to
# version control!

password=`cat hoodie_admin_password.txt`
HOODIE_ADMIN_PASSWORD=$password pm2 start rcl_start.sh