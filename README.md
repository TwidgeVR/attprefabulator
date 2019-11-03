# attprefabulator

Add, remove and modify prefabs in A Township Tale

This browser based application gives a click-driven abstraction to the A Township Tale console's command set


### Release Notes
- v1.0.2 - Added some server configuration options

- v1.0.1  - Should support multiple people using it on the same server without select collision

- v1.0.0  - The first version!  PREFABULATOR supports spawning new objects, moving them around, finding nearby objects, and selecting the nearest object of a specific kind

#### Known issues:
- ~~can only be used by one person at a time on each server, one person selecting items breaks the other player's selections~~


## Usage 

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

Start up the server with:
```
npm start
```

Finally, browse to the app with your favorite web browser, at:

- http://localhost:8000


Login using your A Township Tale user and password, select a server you're currently playing on, and wave the console command line goodbye!
