#!/bin/python

import sys
import time
import logging
from watchdog.observers import Observer
from watchdog.events import LoggingEventHandler, FileSystemEventHandler
import subprocess

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')
    event_handler = LoggingEventHandler()
    # Test code to see if we can work around the loop caused by changes_listener_temp.js
#    event_handler = FileSystemEventHandler()
#    def reload():
#        # Run shell script here
#        # TODO: Test for whether the changes_listener_temp.js file changed.
#        #if ()
#        auth = ''
#        port = ''
#        cmd = "couchapp push http://%@localhost:%/rcl" % (auth, port)
#        subprocess.call(cmd.split(' '))
#    event_handler.on_any_event = reload
    observer = Observer()
    observer.schedule(event_handler, path=sys.argv[1], recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()