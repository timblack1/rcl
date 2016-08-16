# Notes on deployment on Webfaction

We're using pm2 to keep processes alive on the server.

```sh
npm install -g pm2
```

## Starting the app on the server

Because Hoodie requires an admin password, you should rename
scripts/pm2/hoodie_admin_password.txt.template to 
scripts/pm2/hoodie_admin_password.txt and
place your password in that file.  Don't commit that file to
version control!

### Start it manually

You can start the app manually on the server by running a command like the following:

```sh
npm run start-production-first
```

This command uses the hoodie_admin_password.txt file you created.

### Configure cron jobs to restart the app

Hoodie 2.1.1 had a memory leak which increased memory usage slightly with every
new request to the database. This leak should be fixed in the PouchDB
version of Hoodie, since its API is rewritten using hapi.js.  But to work around
this leak until we migrate to Hoodie's PouchDB version, we configured cron
jobs like the following:

```sh
# Set PM2 to save & restore running processes when server reboots
@reboot rm /home/your_username/webapps/rcl/data/*.pid; pm2 resurrect
# We source .bash_profile in order to get the correct nvm/node/npm environment
*/5 * * * * source ~/.bash_profile; pm2 dump >/dev/null

# Restart Reformed Churches Locator daily to keep its memory usage down
0 1 * * * source ~/.bash_profile; pm2 stop rcl_start  >/dev/null; rm /home/your_username/webapps/rcl/data/*.pid  >/dev/null; HOODIE_ADMIN_PASS=`cat scripts/pm2/hoodie_admin_password.txt` pm2 start rcl_start  >/dev/null
```
