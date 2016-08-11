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

## Installation

The following instructions are specific to installing this application on Ubuntu Linux.  Installation
on other operating systems is not documented.

### Install system-level dependencies

Install Node.js, CouchDB, & Git

```bash
$ sudo apt-get install couchdb nodejs git
```

Verify you're running Node 0.12.x or above:

```bash
$ node --version
```

The version should be at or above 0.12.x.

If you don't have Node.js installed, or you have a lower version, go to [nodejs.org](https://nodejs.org)
and click on the big green Install button.

### Install user- and app-level dependencies

```bash
$ npm install -g gulp bower && npm install && bower install
```

### Set Hoodie's admin password

```bash
$ hoodie start -n
```

Enter an admin password here.  If you don't, you'll need to remove the data directory with this command:
```bash
$ # rm -rf data
```
then run `hoodie start` again to enter the password.

After you set the password, type CTRL-C in the terminal to kill the Hoodie process.

### Run Reformed Churches Locator

Then run Reformed Churches Locator by running the following commands in your terminal:

```bash
$ git clone https://github.com/timblack1/rcl.git
$ npm start
```

This should open up a copy of the application in your web browser.

### Development workflow

#### Serve / watch

```bash
$ npm start
```

This outputs an IP address you can use to locally test and another that can be used on devices 
connected to your network.

#### Run tests

```bash
$ npm test
```

This runs the unit tests defined in the `app/test` directory through 
[web-component-tester](https://github.com/Polymer/web-component-tester).

To run tests Java 7 or higher is required. To update Java go to 
http://www.oracle.com/technetwork/java/javase/downloads/index.html and download ***JDK*** and 
install it.

### Further developer documentation

[Further developer documentation](docs/development.md) is currently a work in progress.

## Deployment

Because the application is still in development, we have not yet documented how to deploy it to a server.  Though, the [default Hoodie deployment docs](docs/deployment.md) are a helpful beginning.

## Frequently Asked Questions

### Something has failed during installation. How do I fix this?

Our most commonly reported issue is around system permissions for installing Node.js dependencies.
We recommend following the 
[fixing npm permissions](https://github.com/sindresorhus/guides/blob/master/npm-global-without-sudo.md)
guide to address any messages around administrator permissions being required. If you use `sudo`
to work around these issues, this guide may also be useful for avoiding that.

If you run into an exception that mentions five optional dependencies failing (or an `EEXIST` error), you
may have run into an npm [bug](https://github.com/npm/npm/issues/6309). We recommend updating to npm 2.11.0+
to work around this. You can do this by opening a Command Prompt/terminal and running 
`npm install npm@2.11.0 -g`. If you are on Windows, Node.js (and npm) may have been installed into 
`C:\Program Files\`. Updating npm by running `npm install npm@2.11.0 -g` will install npm into `%AppData%\npm`, 
but your system will still use the npm version. You can avoid this by deleting your older npm from 
`C:\Program Files\nodejs` as described [here](https://github.com/npm/npm/issues/6309#issuecomment-67549380).

If the issue is to do with a failure somewhere else, you might find that due to a network issue
a dependency failed to correctly install. We recommend running `npm cache clean` and deleting the 
`node_modules` directory followed by `npm install` to see if this corrects the problem. If not, please check 
the [issue tracker](https://github.com/PolymerElements/polymer-starter-kit/issues) in case there is a 
workaround or fix already posted.

# Recipes for further development of this app

* [Add ES2015 (formally ES6) support using Babel](add-es2015-support-babel.md)
* [Polymer Performance Recipe](polymer-perf.md)
* [Deploy to Github Pages](deploy-to-github-pages.md)
* [Deploy to Firebase using Pretty URLs](deploy-to-firebase-pretty-urls.md)
* [Use PSK for Mobile Chrome Apps](mobile-chrome-apps.md)
