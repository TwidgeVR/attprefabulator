# attprefabulator

Add, remove and modify prefabs in A Township Tale

This browser based application gives a click-driven abstraction to the A Township Tale console's command set

### Download
You can download the latest (Windows) executable version of Prefabulator here:
https://github.com/edencomputing/attprefabulator/releases/

<a href="https://github.com/edencomputing/attprefabulator/releases/"><img src="public/images/prefabulator_controls.png" width="30%" height="30%" alt="Prefab Controls"></a>

### Release Notes
- v1.6.0 - Added item grouping, group selection, and moving (and rotating!) groups of objects together

- v1.5.3 - Reworked saves to use prefab parentage instead of builder whitelist, this fixes saving newly introduced items. Moved "use exact coordinates" option from Save to Load, so builder can choose to spawn exact or relative. Made a new connection for Save/Load to prevent interference

- v1.5.2 - Added subscription selections to the console so you can control which events you watch

- v1.5.1 - Finally added the command console, which has been "coming soon" for far too long.

- v1.5.0 - Added websocket listener to backend.  Changed all movement controls to use this interface.  Added click-hold interaction to all movement controls - no more click spam!

- v1.4.0 - Added scaling to prefab spawner.

- v1.3.0 - Changed prefab saving tech to use strings which preserve materials and attachments on items loaded from json file.  Searchable servers, as well as only showing servers you can administer.  Fixed searching with the 'Find Prefabs' tool.  Player stats now show the current values. Finally, removed the default window menu.

- v1.2.0 - Added the ability to scan nearby objects position/rotation, save it to a json file, and spawn teh collection from the file.  This can be used to either duplicate a group of prefabs (eg. a building), or to replace things that are lost during a wipe. These files can be shared to pass these resources between servers.  Some UI consolidation to make room for this interface.  Player stats now show the correct values, the server list is searchable, and spawn commands have a place to put optional arguments.

- v1.1.7 - Loads the list of spawnables on server connect so it remains up to date.  Fixed +/- buttons on spawn dialogs.

- v1.1.6 - Added selection history dropdown, added search to Select -> Find Nearby tool

- v1.1.5 - Added teleporting, server messages, player spawn/post tool and player administration tool

- v1.1.1 - Changed default port to 21129 to avoid issues with other software.  Fixed player config controls.  Added options to configure other players on the server

- v1.1.0 - Made prefabulator an electron app!

- v1.0.4 - Added player config, currently only for the tool user's player

- v1.0.2 - Added some server configuration options

- v1.0.1  - Should support multiple people using it on the same server without select collision

- v1.0.0  - The first version!  PREFABULATOR supports spawning new objects, moving them around, finding nearby objects, and selecting the nearest object of a specific kind

#### Known issues:
- ~~can only be used by one person at a time on each server, one person selecting items breaks the other player's selections~~

- ~~Prefabulator movement controls do not currently work using Oculus dashboard.  I recommend running through SteamVR and using an overlay tool like OVRToolkit or OVRDrop in the meantime.~~ Use the A button on the controller to interact with Prefabulator window controls.  For some reason using the trigger is not sending a complete 'click' event, but using A button allows the new click+hold behavior and acts more like a real mouseclick.


## Usage 

It's recommended to use the latest release version found here:
https://github.com/edencomputing/attprefabulator/releases/

Simply download the version for your operating system, extract the files, and run attPrefabulator

### Running from source

First, install node.js, recommend version 12 LTS

- https://nodejs.org

Next, install git

- https://git-scm.com/downloads

At this point, restart your PC to make sure the PATH is correctly set

Open a command prompt or terminal and type

```
git clone https://github.com/edencomputing/attprefabulator.git

cd attprefabulator/
```

Install the necessary node dependencies to run the app using the **npm** command
```
npm i
```

Start up the application with
```
npm start
```

If you'd like to run this headless as a server, you can alternately run
```
npm run server
```

In this mode, you should set the environment variable USE_SAVED_PASS=0 to prevent setting default credentials, eg:
```
USE_SAVED_PASS=0 npm run server
```

Finally, browse to the app with your favorite web browser, at:

- http://localhost:8000


Login using your A Township Tale user and password, select a server you're currently playing on, and wave the console command line goodbye!
