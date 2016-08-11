# Problems this software solves

1. It's hard to find a conservative Reformed church in an unfamiliar location.
  1. Because Google's search doesn't tell you whether a church is conservative, or actually Reformed.
  2. Because it's hard to search multiple church directories in order to find a church.
2. It's hard to get summary data on all conservative Reformed churches.
3. It's hard for central and regional denominational offices to keep church directory information up-to-date.

We would also like to solve the following problems in the future:
1. It's hard to discover who in your geographical region would like to form a Reformed church.

# Goals

Reformed Churches Locator is a web application that will provide a searchable, user-editable map and directory of all Reformed churches in the world. It will aggregate congregations' contact info via data feeds from various sources, and provide a JavaScript widget containing a map & directory that can be embedded into your website using a simple code snippet (like embedding a YouTube video). It will federate filtered sets of congregation data to other Reformed Churches Locator nodes via CouchDB's filtered replications. The intended result is that Reformed Churches Locator will become the source of the most up-to-date contact info for Reformed churches, and will simplify the job of creating a denominational church directory.

Reformed Churches Locator will recreate the map & congregations components of PresbyterySite (http://sourceforge.net/projects/presbyterysite), but host & serve the congregation data in a federated or peer-to-peer fashion in order to manage data from all Reformed churches rather than from only one presbytery.

# Functional Requirements

# Application architecture

Please note that older Reformed Churches Locator issues which describe the overall application architecture are hosted at https://blueprints.launchpad.net/reformedchurcheslocator.

Reformed Churches Locator is an "Offline first" application, meaning it will run well offline, then sync its data to the server when it has an internet connection. It uses Hoodie to store the app's data locally using PouchDB, and syncs to CouchDB on the server through Hoodie's server-side API.

## Technologies used for the implementation

1. Hoodie 2.1.1 (CouchDB on the server, synced by Hoodie with Hoodie's localStorage database in the browser)
2. Node
3. Polymer - for frontend

# Database model
# Interfaces to other systems
# Background tasks
# User dialogs and control flow
# Non-functional requirements (response times, security, ...)
# Dictionary for all relevant concepts/entities
