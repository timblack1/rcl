| [![Build Status](https://travis-ci.org/timblack1/rcl.svg?branch=master)](https://travis-ci.org/timblack1/rcl) | [![Coverage Status](https://coveralls.io/repos/timblack1/rcl/badge.svg?branch=master&service=github)](https://coveralls.io/github/timblack1/rcl?branch=master) | [![Dependency Status](https://david-dm.org/timblack1/rcl.svg)](https://david-dm.org/timblack1/rcl/master) | [![devDependency Status](https://david-dm.org/timblack1/rcl/master/dev-status.svg)](https://david-dm.org/timblack1/rcl/master#info=devDependencies) |
| --- | --- | --- | --- |
# Reformed Churches Locator

Want to find a reformed church in Timbuktu?  Reformed Churches Locator is a web application 
that will provide a searchable, user-editable map and directory of all Reformed churches in 
the world. It will aggregate congregations' contact info via data feeds from various 
sources, and provide a JavaScript widget containing a map & directory that can be embedded 
into your website using a simple code snippet (like embedding a YouTube video). It will 
federate filtered sets of congregation data to other Reformed Churches Locator nodes via 
CouchDB's filtered replications.  The intended result is that Reformed Churches Locator will 
become the source of the most up-to-date contact info for Reformed churches, and will 
simplify the job of creating a denominational church directory.

Reformed Churches Locator will recreate the map & congregations components of PresbyterySite 
(http://sourceforge.net/projects/presbyterysite), but host & serve the congregation data in a 
federated or peer-to-peer fashion in order to manage data from all Reformed churches rather 
than from only one presbytery.

# Application Architecture

Please note that older Reformed Churches Locator issues which describe the overall application 
architecture are hosted at https://blueprints.launchpad.net/reformedchurcheslocator.

Reformed Churches Locator is an "Offline first" application, meaning will run well offline, 
then sync its data to the server when it has an internet connection.  It uses Hoodie to store
the app's data locally using PouchDB, and syncs to CouchDB on the server through Hoodie's 
server-side API.

# Installation

To install Reformed Churches Locator, first install its dependencies by running the following 
commands in your terminal.  This command is the syntax used by Ubuntu's package manager.  If 
you're not on Ubuntu, replace `sudo apt-get install` with your package manager's syntax.

```bash
$ sudo apt-get install couchdb nodejs git
```

Then install and run Reformed Churches Locator by running the following commands in your terminal:

```bash
$ git clone https://github.com/timblack1/rcl.git
$ npm install
$ bower install
$ npm start
```

This should open up a copy of the application in your web browser.

# Deployment

Because the application is still in development, we have not yet documented how to deploy it to a server.
