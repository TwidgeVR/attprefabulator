const version = process.env.npm_package_version
const fs = require('fs')
const moment = require('moment')
const clone = require('clone')
const sha512 = require('crypto-js/sha512')
const ieee754 = require('ieee754')
const THREE = require('three')
const dotenv = require('dotenv')
dotenv.config()

// Load required classes for express
const path = require('path')
const express = require('express')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')


var Datastore = require('nedb')
var spawnables = new Datastore({ filename: path.join(__dirname, 'data/spawnables.db'), autoload: true })
var spawnableItemsList = []
var loadedPrefabLists = {}
var subscriptionList = []
var subscribedSubscriptions = {}

var prefabGroups = {}
var selectedPrefabGroup = undefined
var selectedPrefabId = undefined

const rotationEulerOrder = 'YXZ'
const translationDirs = {
    "up"        : [ 0, 1, 0 ],
    "down"      : [ 0,-1, 0 ],
    "forward"   : [ 0, 0, 1 ],
    "back"      : [ 0, 0,-1 ],
    "right"     : [ 1, 0, 0 ],
    "left"      : [-1, 0, 0 ]
}

const server = express()
const port = Number(process.env.PORT) || 21129
const useSavedPassword = ( process.env.USE_SAVED_PASS === undefined )
    ? true
    : ( process.env.USE_SAVED_PASS == 1 )

// These items should never be saved or cloned
const blacklistItems = {
    '0' : 'Respawn Point',
    '37940' : 'Discovery Landmark',
    '49582': 'VR Player Character New'
}

// Websocket Service
const ws = require('ws')
const wssPort = port + 1
const wss = new ws.Server({ port: wssPort })
var wsSocket;
var wsHandlers = {}

function wsAddHandler( name, handler )
{
    wsHandlers[name] = handler

}
function wsGetHandler( name )
{
    return ( !!wsHandlers[name] ) ? wsHandlers[name] : undefined
}
function wsSendJSON( data )
{
    if ( !!wsSocket )
        wsSocket.send( JSON.stringify( data ) )
}

// Main connections (used by websocket handlers)
var attSession;
var attServer;
// The websocket connections to server
var attConsole;
var attSubscriptions;
var attSaveLoad;

const builderKeyPrefabString = "39744,117,39744,3292217970,1130291577,3265257749,1032887442,3211394956,1065353216,3184467828,1051372203,1454441398,32,3392848145,2290978823,418,3292217970,1130291577,3265257749,1032887442,3211394956,1053152122,3184467828,3221225472,0,0,0,0,0,0,0,0,"
//Utility helper functions and prototypes
function ts()
{ 
    return "["+ moment().format() +"]"
}

function setConnection( serverName )
{
    var { Connection } = require('att-websockets')
    // requires are cached which prevents instantiation
    // so remove the cache entry after loading
    delete require.cache[require.resolve('att-websockets')]

    attConsole = new Connection( serverName )
    attConsole.onError = ( e ) => {
        console.log( e )
        throw( e )
    }
}

function setSubscrptionsConnection( serverName )
{
    var { Connection } = require('att-websockets')
    delete require.cache[require.resolve('att-websockets')]

    attSubscriptions = new Connection( serverName )
    attSubscriptions.onError = ( e ) => {
        console.log( e )
        throw( e )
    }
    attSubscriptions.onMessage = ( message ) => {
        if ( !!wsSocket )
        {
            wsSendJSON( message )
        }
    }
}

function setSaveLoadConnection( serverName )
{
    var { Connection } = require('att-websockets')
    delete require.cache[require.resolve('att-websockets')]

    attSaveLoad = new Connection( serverName )
    attSaveLoad.onError = ( e ) => {
        console.log( e )
        throw( e )
    }
    attSaveLoad.onMessage = ( message ) => {
        if ( !!wsSocket )
        {
            wsSendJSON( message )
        }
    }
}

function setATTSession( )
{
    var { Sessions, Servers } = require('alta-jsapi')
    attSession = Sessions
    attServer = Servers
}

function authenticated( req )
{
    return  ( req.session !== undefined )
            && !!req.session.userAuthenticated
            && ( attSession !== undefined )
            && attSession.getUserId()
}

// This middleware handles passing errors in async functions back to express
const asyncMid = fn => 
    (req, res, next) => {
        let username = req.session.alta_username;
        console.log( ts() +" "+ req.sessionID +"  "+ req.method +"  "+ req.path +"  "+ username )
        Promise.resolve(fn( req, res, next ))
        .catch( next )
    }


server.set('views', path.join(__dirname, 'views'))
server.set('view engine', 'pug')
server.use( express.static(path.join(__dirname, "public")))
server.use( cookieParser() )
server.use( fileUpload() )
server.use( bodyParser.urlencoded({ extended: false }) )
server.use( bodyParser.json() )
server.use( session({
        secret: 'RTHV6fzTyb31rHUIETuX', 
        resave: false, 
        saveUninitialized: true
    }))

// WebSocket connections
wss.on('connection',  socket => {
    wsSocket = socket
    socket.on('message', message => {
        console.log("websocket message: "+ message )
        if ( message == "ping" )
        {
            wsSendJSON( { message : "pong", action: "test" } )
        } else {
            // Find and call a handler for the specified action type
            if ( !!attConsole )
            {
                try {
                    let data = JSON.parse( message )
                    let handler = wsGetHandler( data.action )
                    if ( !!handler ) 
                    {
                        handler( data )
                    } else {
                        console.log( "Unknown WebSocket handler: "+ data.action )
                    }
                } catch ( e ) {
                    wsSendJSON({ error: e })
                }
            } else {
                wsSendJSON({ result: 'Fail', error: 'No console connected' })
            }
        }
    })
})

server.get('/', ( req, res ) => {
    if ( authenticated( req ) )
    {
        res.redirect('/servers')
    } else {
        res.redirect('/login')
    }
        
})

server.get('/login', ( req, res ) => {
    console.log( "login")
    let savedLogin = { show:'false', 'checked': '', 'username': null, 'password': null }
    if ( useSavedPassword )
    {
        savedLogin.show = 'true'
        let credData = loadCredData()
        if ( !!credData.username && !!credData.password )
        {
            savedLogin.checked = 'checked'
            savedLogin.username = credData.username
            savedLogin.password = 'xxxxxxxxxxxx'
        }
    }
    if ( !!req.query.error )
    {
        res.render('login', { version: version, error: req.query.error, 'savedLogin': savedLogin })
    } else {
        res.render('login', { version: version, error: false, 'savedLogin': savedLogin })
    }
})

server.post('/login', asyncMid( async(req, res, next) => {
    let lUsername = req.body.username
    let lPassword = req.body.password
    let hashPassword = sha512(lPassword).toString()
    let savePass = req.body.savePassword

    if ( useSavedPassword )
    {
        if ( savePass )
        {
            console.log( "processing creds")
            let credData = {}
            try {
                credData = loadCredData()
            } catch ( e ) {
                console.log( "error loading credentials.json: "+ e.message )
            }
            credData.username = lUsername
            if ( lPassword == 'xxxxxxxxxxxx' )
            {
                hashPassword = credData.password
            } else {
                credData.password = hashPassword
            }
            saveCredData( credData )
        } else {
            saveCredData({})
        }

    }    
    lPassword = hashPassword

    let resp = await attLogin( lUsername, lPassword, req );
    if ( resp.authenticated == true )
    {
        req.session.userAuthenticated = true
        req.session.alta_username = attSession.getUsername();
        res.redirect('/')
        return
    }
    res.redirect( 'login?error='+ resp.error )
}))

server.get('/servers', asyncMid( async (req, res, next) => {
    if( authenticated( req ) )
    {
        var servers = await attServer.getConsoleServers()
        console.log( servers )
        if ( !!servers )
        {
            if ( !!req.query.error )
            {
                res.render("servers", { error: ( !!req.query.error ) ? req.query.error : null, serverList: servers })
                return
            } else {
                res.render("servers", { serverList: servers })
                return
            }
        }
    } else {
        res.redirect('/login?error=Logged out')
    }
}))

server.post('/servers', asyncMid( async(req, res, next) =>{
    if ( authenticated(req) )
    {
        var servers = await attServer.getOnline()
        var serverId = req.body.selectedServer;
        var selectedServer = servers.find( item => item.id.toString() == serverId )
        console.log( req.body )
        console.log( selectedServer )
        try {
            var details = await attServer.joinConsole( serverId )
            if ( details.allowed )
            {
                console.log( "Connecting to server: "+ selectedServer.name )
                setConnection( selectedServer.name )
                setSubscrptionsConnection( selectedServer.Name )
                setSaveLoadConnection( selectedServer.name )
                await attConsole.connect( details.connection.address, details.connection.websocket_port, details.token )
                await attSubscriptions.connect( details.connection.address, details.connection.websocket_port, details.token )
                await attSaveLoad.connect( details.connection.address, details.connection.websocket_port, details.token )
                console.log("Connected to server: "+ selectedServer.name )
                res.redirect('/control?serverName='+ selectedServer.name )
                return
            } else {
                console.log("Error connecting to server: ")
                console.log( details )
                res.redirect('/servers?error='+ details.message )
                return
            }
        } catch (e) {
            console.log("Error connecting to server:"+ e.message)
            res.redirect('/servers?error='+ e.message )
            return
        }
    } else {
        res.redirect('/login?error=Logged out')
    }
}))

server.get('/control', asyncMid( async ( req, res, next ) => {
    if ( authenticated( req ))
    {
        wsMap.rotateAngle = 10;
        wsMap.distanceMag = 0.1;
        req.session.rotateAngle = 10;
        req.session.distanceMag = 0.1;

        let userId = attSession.getUserId()
        let userName = attSession.getUsername()
        let sname = "Not connected";
        if ( !!req.query.serverName ) {
            sname = req.query.serverName
        }
        
        try {
            await loadSpawnableItems(req)
            await loadSubscriptions(req)
            //console.log( subscriptionList )
            console.log( "rendering control" )
            res.render("control", { version: version, serverUserId: userId, serverUsername: userName, serverName: sname, spawnableItems: spawnableItemsList, subscriptions: subscriptionList, subscribed: subscribedSubscriptions })
            return
        } catch ( e ) {
            console.log( e )
            res.redirect('/login?error=Server error')
            return
        }
    } else {
        res.redirect('login?error=Logged out')
    }
}))

server.post('/save_prefabs', asyncMid( async( req, res, next ) => {
    if ( authenticated( req ) )
    {
        console.log( req.body )
        let response = {}
        let itemNames = {}
        let itemList = req.body.items
        let useExactCoordinates = true
        let positionList = []
        attConsole.onMessage = ( message ) => {
            //console.log( "save_prefabs command response message")
            //console.log( message, message.data.Result, message.data.BufferResultString )
            if ( message.data.Command.FullName == 'select.tostring')
            {
                let resultString = (message.data.ResultString.split('|',1))[0]
                let words = resultString.split(',')
                let prefab = itemNames[words[0]]

                let item = {
                    'string' : resultString,
                    'hash' : words[0],
                    'Name' : prefab,
                    'Position' : new THREE.Vector3( 
                        unpackfloat( words[3] ), // x
                        unpackfloat( words[4] ), // y
                        unpackfloat( words[5] )  // z
                    ),
                    'scale' : unpackfloat( words[10] )
                }

                let rotOrder = 'YXZ'
                
                let rotQuaternion = new THREE.Quaternion(
                    unpackfloat( words[6] ), // x
                    unpackfloat( words[7] ), // y
                    unpackfloat( words[8] ), // z
                    unpackfloat( words[9] ), // w
                )
                item.rotquaternion = {
                    x : rotQuaternion.x,
                    y : rotQuaternion.y,
                    z : rotQuaternion.z,
                    w : rotQuaternion.w
                }

                let rotEuler = new THREE.Euler()
                rotEuler.setFromQuaternion( rotQuaternion, rotOrder )

                item.roteuler = {
                    x : rotEuler.x,
                    y : rotEuler.y,
                    z : rotEuler.z,
                    order : rotEuler.order
                }

                item.Rotation = {
                    x : rad2deg( item.roteuler.x ),
                    y : rad2deg( item.roteuler.y ),
                    z : rad2deg( item.roteuler.z ),
                }
                //console.log( "item tostring:", item )
                positionList.push(item)                
            }
        }

        console.log( itemList )
        console.log("getting positions")
        for ( let i = 0; i < itemList.length; i++ )
        {
            let item = itemList[i]
            itemNames[ item.hash ] = item.name 

            let cmd = "select "+ item.id
            await attConsole.send(cmd)
            await attConsole.send("select tostring")
        }
        // wait for positionList to fill
        console.log( "waiting for positions" )
        let retries = 20;
        function waitForPositions() {
            if ( positionList.length > 0 
                && ( positionList.length == itemList.length || retries == 0 ) )
            {
                console.log( "final positions: ")
                console.log( positionList )


                // Write it out to the file
                let ts = moment().format("YYYYMMDD_kkmmss_SSSS")
                let fprefix = req.sessionID + "_"
                let filename = ts + ".json"
                let jsonDataset = { 
                    'header' : {
                        'player': attSession.getUsername(),
                        'timestamp': ts,
                        'exact': useExactCoordinates
                    },
                    'prefabs' : positionList
                }
                let jsonString =  JSON.stringify( jsonDataset, ( k, v ) => { return v.toFixed ? Number(v.toFixed(6)) : v }, 4 )
                                    
                fs.writeFile( path.join(__dirname, 'data/'+ fprefix + filename ), jsonString, function( err ) {
                    if ( err )
                    {
                        console.log( err );
                    } else {
                        console.log( "New prefab group saved: data/"+ fprefix + filename );
                    }
                });
                res.send({'result': 'OK', 'filename': filename })
                return
            } else {
                if ( retries > 0 )
                {
                    retries--;
                    setTimeout( waitForPositions, 1000 )
                } else {
                    console.log( "save_prefabs: ran out of retries" )
                    res.send({'result':'Fail'})
                    return
                }           
            }
        }
        waitForPositions()
    }
}))

server.get('/download_prefab', asyncMid( async ( req, res, next ) => {
    if ( authenticated( req ) )
    {
        if ( !!req.query.filename )
        {
            let fprefix = req.sessionID + "_"
            let filename = req.query.filename
            res.download( path.join(__dirname, 'data/'+ fprefix + filename ), filename, next )
            return
        } else {
            res.status(404).end()
            return
        }
    } else {
        console.log("not authenticated")
        res.send( { "err": "not authenticated" } )
        return
    }
}))

server.post('/load_prefabs_input', asyncMid( async( req, res, next ) => {
    if ( authenticated( req ) )
    {
        let filename = req.files.prefablist.name
        let md5sum = req.files.prefablist.md5
        let fileData = req.files.prefablist.data.toString('utf-8')
        let jsonData = JSON.parse( fileData )
        if ( jsonData.prefabs.length )
        {
            loadedPrefabLists[ md5sum ] = jsonData
        }
        console.log( loadedPrefabLists )
        res.send({'result':'OK', 'md5': md5sum, 'filename': filename, 'data': jsonData})
    } else {
        res.status( 401 ).end()
        return
    }
}))

server.post('/load_prefabs', asyncMid( async( req, res, next ) => {
    if ( authenticated( req ) )
    {
        console.log( req.body )
        let prefabList = loadedPrefabLists[ req.body.md5sum ]
        let useExactCoordinates = parseBool( req.body.useExactCoords )
        let userId = attSession.getUserId()      
        let moffset = [ 
            parseFloat(req.body.moffset_x), 
            parseFloat(req.body.moffset_y),
            parseFloat(req.body.moffset_z)
        ]
        let translatedPrefabs = clone( prefabList.prefabs )
        let prefabFileName = req.body.filename

        // If a persistent offset is specified, also apply it
        if ( !!prefabList.header.offset )
        {
            let poffset = [
                parseFloat( prefabList.header.offset[0] ),
                parseFloat( prefabList.header.offset[1] ),
                parseFloat( prefabList.header.offset[2] ),
            ]
            moffset[0] = moffset[0] + poffset[0]
            moffset[1] = moffset[1] + poffset[1]
            moffset[2] = moffset[2] + poffset[2]
        }
                
        console.log( "group position offset:")
        console.log( moffset )
        let keyCoords = {
            Position : [ 0, 0, 0 ],
            Rotation : [ 0, 0, 0 ]
        }
        let conn = attConsole

        // Apply the offset to the supplied coordinates
        //console.log("original prefabs list")
        //console.log( prefabList.prefabs)
        //console.log("slice copy")
        //console.log( translatedPrefabs )
        console.log( "useExactCoordinates: ", useExactCoordinates )
        if ( !useExactCoordinates )
        {
            // Find the smallest values for x,y,z 
            min_x = translatedPrefabs[0].Position.x;
            min_y = translatedPrefabs[0].Position.y;
            min_z = translatedPrefabs[0].Position.z;
            for ( let i = 0; i < translatedPrefabs.length; i++ )
            {
                let item = translatedPrefabs[i]
                if ( item.Position.x < min_x ) { min_x = item.Position.x }
                if ( item.Position.y < min_y ) { min_y = item.Position.y }
                if ( item.Position.z < min_z ) { min_z = item.Position.z }
            }

            // remove the minimum offsets to bring the item to root
            console.log( "min_x: "+ min_x )
            console.log( "min_y: "+ min_y )
            console.log( "min_z: "+ min_z )
            for ( let i = 0; i < translatedPrefabs.length; i++ )
            {
                let item = translatedPrefabs[i]
                item.Position.x = item.Position.x - min_x
                item.Position.y = item.Position.y - min_y
                item.Position.z = item.Position.z - min_z
                translatedPrefabs[i] = item;
            }
            console.log("offset positions:")
            console.log( translatedPrefabs )
        }

        for( let i = 0; i < translatedPrefabs.length; i++ )
        {
            let item = translatedPrefabs[i]
            item.Position.x = parseFloat(item.Position.x) + moffset[0]
            item.Position.y = parseFloat(item.Position.y) + moffset[1]
            item.Position.z = parseFloat(item.Position.z) + moffset[2]
            
            translatedPrefabs[i] = item
        }
        //console.log("original")
        //console.log( prefabList.prefabs )
        //console.log("slice copy with predefined offsets")
        //console.log( translatedPrefabs )

        if ( useExactCoordinates )
        {
            conn.onMessage = (message) => {
                console.log( message )
                return
            }
            spawnPrefabsFromList()
        } else {
            // First get coords of the Builder Key
            new Promise( ( resolve, reject ) => {
                conn.onMessage = function ( message ) {
                    console.log( message )
                    if ( !!message.data.Exception ) {
                        reject()                        
                        return
                    }
                    if ( message.data.Command.FullName == 'select.prefab' )
                    {
                        // After selecting the key, find it's position
                        conn.send("select get")
                    } else if ( message.data.Command.FullName == 'select.get' ) {
                        // Update the position of the key                        
                        if ( message.data.Result.Name.match(/Key\ Standard/) )
                        {
                            keyCoords.Position = message.data.Result.Position
                            keyCoords.Rotation = message.data.Result.Rotation
                            console.log("got key coordinates:")
                            console.log( keyCoords )

                            // Update the coordinates
                            for ( let i = 0; i < translatedPrefabs.length; i++ )
                            {
                                let item = translatedPrefabs[i]
                                item.Position.x = Number( item.Position.x + keyCoords.Position[0] ).toFixed(6)
                                item.Position.y = Number( item.Position.y + keyCoords.Position[1] ).toFixed(6)
                                item.Position.z = Number( item.Position.z + keyCoords.Position[2] ).toFixed(6)
                                
                                translatedPrefabs[i] = item
                            }
                            resolve()
                        }
                    }                    
                }                
                conn.send( "select prefab keystandard "+ userId )
            }).then( () => {
                spawnPrefabsFromList()
            })
        }

        let spawnedFromList = []
        function spawnPrefabsFromList( ind ) {
            return new Promise( (resolve, reject) => {
                if ( ind === undefined ) ind = 0
                if ( translatedPrefabs.length > 0 && ind < translatedPrefabs.length )
                {
                    //console.log("spawning prefab from list ["+ ind +"]")
                    let titem = translatedPrefabs[ind]
                    //console.log( titem )
                    let pos = titem.Position
                    let rot = titem.Rotation
    
                    conn.onMessage = ( message ) => {
                        //console.log( "spawnPrefabsFromList message:")
                        //console.log( message )
                        if ( !!message.data.Command )
                        {
                            let command = ''
                            switch( message.data.Command.FullName )
                            {
                                case 'spawn.exact':
                                    // nothing more to do, should be at it's exact position
                                    resolve()
                                break
                                case 'spawn.string':
                                    console.log( message.data.Result )
                                    if ( !!message.data.Result[0] )
                                    {
                                        spawnedFromList.push( message.data.Result[0] )
                                    }
                                    command = `select rotate exact ${rot.x},${rot.y},${rot.z}`
                                break
                                case 'select rotate.exact':
                                    command = `select move exact ${pos.x},${pos.y},${pos.z}`
                                break
                                case 'select move.exact':
                                    // Last step, resolve the promise
                                    resolve()
                                break
                            }
                            if ( command != '' )
                            {
                                console.log( command )
                                conn.send(command)
                            }
                        }
                    }
                    let itemCount = 1
                    //TODO: convert to spawn string-raw when working
                    let command = `spawn string ${userId} ${titem.string}`
/*                    
                    let command = "spawn exact "
                            + pos[0].toString() +"," + pos[1].toString() +"," + pos[2].toString() +" "
                            + rot[0].toString() +"," + rot[1].toString() +"," + rot[2].toString() +" "
                            + item.Name.replace(/\s/g,'') +" "
                            + itemCount
*/                            
                    //let command = 'spawn '+ userId +' '+ item.Name.replace(/\s/g,'')
                    conn.send( command )

                } else {
                    if ( ind >= translatedPrefabs.length ) 
                    {
                        console.log("finished spawning prefab list", spawnedFromList )
                        wsSendJSON( { result: 'OK', data: { action: 'load_prefabs', filename: prefabFileName, items: spawnedFromList } } )
                        resolve()
                    } else {
                        console.log("finished prematurely, empty prefab list?")
                        reject()
                    }
                }
            }).then( () => {
                if ( ind < translatedPrefabs.length )
                {
                    console.log("spawning next prefab")
                    spawnPrefabsFromList( ind + 1 )
                }
            })
        }

        res.send({'result':'OK'})
        return

    } else {
        res.status( 401 ).end()
        return
    }
}))

wsAddHandler('server_time_get', async(data) => {
    attSubscriptions.onMessage = ( message ) => {
        switch( message.data.Command.FullName )
        {
            case "time.":
                console.log( message )
                wsSendJSON({ 'result': 'OK', time: message.data.Result, data: data })
            break
        }
    }
    await attSubscriptions.send('time')
})

// attSubscription websocket controls
wsAddHandler( 'subscribe', async ( data ) => {
    attSubscriptions.onMessage = ( message ) => {
        if ( !!wsSocket )
        {
            wsSendJSON( message )
        }
    }
    if ( !!data.subscription && !subscribedSubscriptions[ data.subscription ] == true )
    {
        subscribedSubscriptions[ data.subscription ] = true
        await attSubscriptions.send("websocket subscribe "+ data.subscription )
    }
})

wsAddHandler( 'unsubscribe', async ( data ) => {
    attSubscriptions.onMessage = ( message ) => {
        if ( !!wsSocket )
        {
            wsSendJSON( message )
        }
    }
    if ( !!data.subscription && subscribedSubscriptions[ data.subscription ] == true )
    {
        subscribedSubscriptions[ data.subscription ] = false
        await attSubscriptions.send("websocket unsubscribe "+ data.subscription )
    }
})

// Subscription socket controls
var wsMap = {}
wsAddHandler( 'send_command', async ( data ) => {
    attSubscriptions.onMessage = ( message ) => {
        if ( !!wsSocket )
        {
            wsSendJSON( message )
        }
    }
    // Send an arbitrary command to the server
    console.log( "Sending command: ", data.command )
    // Send through the subscriptions channel so it can be logged properly
    await attSubscriptions.send( data.command )
})

// attConsole websocket controls
wsAddHandler( 'set_angle', ( data ) => {
    wsMap.rotateAngle = data.angle
    console.log( "New rotation angle: "+ wsMap.rotateAngle )
    wsSendJSON({ result: 'OK', data: data })
})
wsAddHandler( 'set_distance', ( data ) => {
    wsMap.distanceMag = data.magnitude
    console.log( "New distance magnitude: "+ wsMap.distanceMag )
    wsSendJSON({ result: "OK", data: data })
})

wsAddHandler( 'move', async ( data ) => {
    let mdirection = data.direction;
    command = "select move "+ mdirection +" "+ wsMap.distanceMag
    console.log( command )
    attConsole.onMessage = ( message ) => {
        console.log( message )
    }

    if ( !!data.selectedPrefabId && `${data.selectedPrefabId}`.includes("group") )
    {
        console.log("Move a group of prefabs: ", data )
        let groupId = data.selectedPrefabId.split('_')[1]
        let groupItems = prefabGroups[ groupId ].items

        if ( !!prefabGroups[groupId].tjsGroup )
        {
            let tjsGroup = prefabGroups[ groupId ].tjsGroup
            let boundingBox = prefabGroups[ groupId ].boundingBox
            // Move virtual object by the specified amount
            boundingBox.translateX( translationDirs[ mdirection ][0] * wsMap.distanceMag )
            boundingBox.translateY( translationDirs[ mdirection ][1] * wsMap.distanceMag )
            boundingBox.translateZ( translationDirs[ mdirection ][2] * wsMap.distanceMag )
            boundingBox.updateMatrixWorld()
            for ( let i = 0; i < groupItems.length; i++ )
            {
                let itemId = groupItems[i].Identifier
                let tjsItem = tjsGroup.children.find( x => x.name == itemId )
                let newPos = new THREE.Vector3
                tjsItem.getWorldPosition( newPos )
                console.log("select move exact: ", newPos )
                console.log( `select move exact ${newPos.x},${newPos.y},${newPos.z}` )

                await attConsole.send(`select ${itemId}`)
                await attConsole.send(`select move exact ${newPos.x},${newPos.y},${newPos.z}`)
            }
        }

    } else if ( !!data.selectedPrefabId ) {
        if ( !selectedPrefabId || selectedPrefabId !== data.selectedPrefabId )
        {
            selectedPrefabId = data.selectedPrefabId
            await attConsole.send(`select ${data.selectedPrefabId}`)
        }
        await attConsole.send( command )
    } else {
        // just move the currently selected object
        await attConsole.send( command )
    }
    wsSendJSON({ result: 'OK', data: data })
})

wsAddHandler( 'rotate', async ( data ) => {
    let raxis = ( data.axis === undefined ) ? 'yaw' : data.axis;
    let rotateAngle = ( data.direction == 'ccw') ? 360 + ( -1 * wsMap.rotateAngle ): wsMap.rotateAngle;
    command = "select rotate "+ raxis +" "+ rotateAngle
    console.log( command )
    attConsole.onMessage = ( message ) => {
        console.log( message )
    }

    if ( !!data.selectedPrefabId && `${data.selectedPrefabId}`.includes("group") )
    {
        let groupId = data.selectedPrefabId.split('_')[1]
        let groupItems = prefabGroups[ groupId ].items

        if ( !!prefabGroups[groupId].tjsGroup )
        {
            let tjsGroup = prefabGroups[ groupId ].tjsGroup
            // Move virtual object by the specified amount
            switch( raxis )
            {
                case "pitch":
                    tjsGroup.rotateX( deg2rad( rotateAngle ) )
                break
                case "yaw":
                    tjsGroup.rotateY( deg2rad( rotateAngle ) )
                break
                case "roll":
                    tjsGroup.rotateZ( deg2rad( rotateAngle ) )
                break
            }
            tjsGroup.updateMatrixWorld()
            for ( let i = 0; i < groupItems.length; i++ )
            {
                let itemId = groupItems[i].Identifier
                let tjsItem = tjsGroup.children.find( x => x.name == itemId )
                let newPos = new THREE.Vector3
                let newRot = new THREE.Euler()
                let newQuat = new THREE.Quaternion()
                tjsItem.getWorldQuaternion( newQuat )
                newRot.setFromQuaternion( newQuat, rotationEulerOrder )
                tjsItem.getWorldPosition( newPos )
                let newAng = { x: rad2deg( newRot.x ), y: rad2deg( newRot.y ), z: rad2deg( newRot.z )}
                console.log( `newRot`, newRot)
                console.log( `select rotate exact ${newAng.x},${newAng.y},${newAng.z}`)
                console.log( `select move exact ${newPos.x},${newPos.y},${newPos.z}` )

                await attConsole.send(`select ${itemId}`)
                await attConsole.send(`select rotate exact ${newAng.x},${newAng.y},${newAng.z}`)
                await attConsole.send(`select move exact ${newPos.x},${newPos.y},${newPos.z}`)
            }
        }

    } else if ( !!data.selectedPrefabId ) {
        await attConsole.send(`select ${data.selectedPrefabId}`)
        await attConsole.send( command )
    } else {
        // just move the currently selected object
        await attConsole.send( command )
    }
    wsSendJSON({ result: 'OK', data: data })
})

wsAddHandler('look-at', async( data ) => {
    if ( data.selectedPrefabId.includes("group") )
    {
        console.log("Run look-at on a group of prefabs?: ", data )
        return
    }
    let userId = attSession.getUserId()
    command = `select look-at ${userId}`
    console.log( command )
    if ( !!data.selectedPrefabId ) {
        await attConsole.send( "select "+ data.selectedPrefabId )
    }
    await attConsole.send( command )
    wsSendJSON({ result: 'OK', data: data })
})

wsAddHandler('snap-ground', async( data ) => {
    console.log( `command: select snap-ground ${data.selectedPrefabId}` )
    if ( data.selectedPrefabId.includes("group") )
    {
        console.log("Snap a group of prefabs to the ground (lowest coordinate): ", data )
        let groupId = data.selectedPrefabId.split('_')[1]
        let groupItems = prefabGroups[ groupId ].items
       
        if ( !!prefabGroups[groupId].tjsGroup )
        {
            let minY = undefined
            let lowestObj = undefined
            let lowestObjPos = undefined
            let tjsGroup = prefabGroups[ groupId ].tjsGroup
            let boundingBox = prefabGroups[ groupId ].boundingBox

            attConsole.onMessage = async ( message ) =>
            {
                console.log( message )
                switch( message.data.Command.FullName )
                {
                    case "select.snap-ground":
                        // Wait for teh lowest item to be snap-grounded
                        await attConsole.send( `select get ${lowestObj}`)
                    break
                    case "select.get":
                        if ( !!message.data.Result )
                        {
                            console.log( "select get: ", message.data.Result )
                            // Get the offset between the lowest obj original pos and new
                            let item = message.data.Result
                            let yOffset = lowestObjPos.y - item.Position[1]
                            console.log( "lowest object offset by: ", yOffset)
                            // Apply the offset to the whole group of prefabs
                            boundingBox.translateY( -1 * yOffset )
                            boundingBox.updateMatrixWorld()
                            for ( let i = 0; i < groupItems.length; i++ )
                            {
                                let itemId = groupItems[i].Identifier
                                let tjsItem = tjsGroup.children.find( x => x.name == itemId )
                                let newPos = new THREE.Vector3
                                tjsItem.getWorldPosition( newPos )
                                await attConsole.send(`select ${itemId}`)
                                await attConsole.send(`select move exact ${newPos.x},${newPos.y},${newPos.z}`)
                            }
                            wsSendJSON({ result: 'OK', data: data })                       
                        } else {
                            wsSendJSON({ result: 'Fail', data: data })
                        }
                    break
                }
            }
        
            for( let i = 0; i < groupItems.length; i++)
            {
                let itemId = groupItems[i].Identifier
                let tjsItem = tjsGroup.children.find( x => x.name == itemId )
                let itemPos = new THREE.Vector3
                tjsItem.getWorldPosition( itemPos )
                if ( minY === undefined || itemPos.y < minY )
                {
                    minY = itemPos.y
                    lowestObj = itemId
                    lowestObjPos = itemPos
                }
            }        
            // Select the lowest object, snap it to the ground
            await attConsole.send( `select ${lowestObj}` )
            await attConsole.send( `select snap-ground`)
        }
    } else {
        attConsole.onMessage = ( message ) =>
        {
            console.log( message )
        }
    
        command = `select snap-ground`
        console.log( command )
        if ( !!data.selectedPrefabId ) {
            await attConsole.send( "select "+ data.selectedPrefabId )
        }
        await attConsole.send( command )
        wsSendJSON({ result: 'OK', data: data })
    }
})

// SaveLoad websocket controls
wsAddHandler('select_find_save', async( data ) => {
    let scanDiameter = 10
    if ( !!data.diameter ) { scanDiameter = data.diameter }
    let userId = attSession.getUserId()
    let prefabCount = 0
    let prefabsScanned = 0
    data.scanitems = []

    attSaveLoad.onMessage = ( message ) => {
        // Message handlers for the save system
        //console.log( "select_find_save.onmessage: ", message )

        if ( !!message.data.Exception )
        {
            data.message = message
            wsSendJSON({ result: 'Fail', data: data})
        }

        if ( !!message.data.Command.FullName )
        {
            if ( !message.data.Result )
            {
                data.message = message
                wsSendJSON({ result:"Fail", data: data })
            } else {
                switch( message.data.Command.FullName )
                {
                    case "select.find":
                        // For each result item, run select get <id>
                        console.log( "Found prefabs: ", message.data.Result )
                        prefabCount = message.data.Result.length;
                        for ( let i = 0; i < prefabCount; i++ )
                        {
                            attSaveLoad.send(`select get ${message.data.Result[i].Identifier}`)
                        }
                    break;

                    case "select.get":
                        // For each item, add to save array if ChunkingParent == 0
                        prefabsScanned++
                        if ( message.data.Result.ChunkingParent == 0 )
                        {
                            if ( !blacklistItems[ message.data.Result.PrefabHash ])
                            {
                                console.log( "select.get saveable item: ", message.data.Result )
                                data.scanitems.push( message.data.Result )
                            }
                        }
                        if ( prefabsScanned == prefabCount )
                        {
                            console.log( "sending result: ", data )
                            wsSendJSON({ result: 'OK', data: data })
                        }
                    break;
                }
            }
        }
    }

    console.log( "select find save")
    await attSaveLoad.send( `select find ${userId} ${scanDiameter}` )

})

wsAddHandler( 'select_prefab_group', async( data ) => {
    console.log( "Selecting a prefab group: ", data.id, data.group )
    if ( prefabGroups[ data.id ] == undefined )
    {
        prefabGroups[ data.id ] = data.group
    }
    selectedPrefabGroup = data.id
    let items = prefabGroups[ data.id ].items

    // Find the positions for all of the objects in this group if not known
    // Generate a set of 3D buffer objects to manipulate
    var defMaterial = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    var tjsGroup = new THREE.Group()
    tjsGroup.name = data.id
    tjsGroup.rotation.set( 0,0,0, rotationEulerOrder )
    var scannedItemCount = 0
    var min_x, max_x, min_y, max_y, min_z, max_z;
    attConsole.onMessage = ( message ) => {
        switch( message.data.Command.FullName )
        {
            case "select.get":
                if ( !!message.data.Result )
                {
                    console.log( "select get: ", message.data.Result )
                    let item = message.data.Result

                    scannedItemCount++
                    if ( min_x === undefined || item.Position[0] <= min_x ) { min_x = item.Position[0] }
                    if ( min_y === undefined || item.Position[1] <= min_y ) { min_y = item.Position[1] }
                    if ( min_z === undefined || item.Position[2] <= min_z ) { min_z = item.Position[2] }
                    if ( max_x === undefined || item.Position[0] >= max_x ) { max_x = item.Position[0] }
                    if ( max_y === undefined || item.Position[1] >= max_y ) { max_y = item.Position[1] }
                    if ( max_z === undefined || item.Position[2] >= max_z ) { max_z = item.Position[2] }
                    let geometry = new THREE.BoxBufferGeometry( 1,1,1 )
                    let cube = new THREE.Mesh( geometry, defMaterial )
                    cube.name = `${item.Identifier}`
                    cube.position.set(
                        item.Position[0],
                        item.Position[1],
                        item.Position[2]
                    )
                    cube.rotation.set(
                        deg2rad(item.Rotation[0]),
                        deg2rad(item.Rotation[1]),
                        deg2rad(item.Rotation[2]),
                        rotationEulerOrder
                    )
                    tjsGroup.add( cube )
                }
            break
        }
        if ( scannedItemCount == items.length)
        {
            let center_x = min_x + (( max_x - min_x ) / 2)
            let center_y = min_y + (( max_y - min_y ) / 2)
            let center_z = min_z + (( max_z - min_z ) / 2)
            console.log( `center is: ${center_x},${center_y},${center_z}`)
            tjsGroup.position.set( center_x, center_y, center_z )
            tjsGroup.children.forEach( (child) => {
                child.applyMatrix4( new THREE.Matrix4().makeTranslation( -center_x, -center_y, -center_z ))
            })
            tjsGroup.updateMatrixWorld()
            let boundingBox = new THREE.Object3D()
            boundingBox.add( tjsGroup )
            prefabGroups[ data.id ].tjsGroup = tjsGroup
            prefabGroups[ data.id ].boundingBox = boundingBox
            console.log( "3D buffer geometry ready", boundingBox )
            wsSendJSON({'result': 'OK', data: data })
        }
    }

    console.log( "Getting item list: "+ data.id +": ", prefabGroups[ data.id ])

    for( let i = 0; i < items.length; i++ )
    {
        console.log( "Getting item: ", items[i] )
        await attConsole.send(`select get ${items[i].Identifier}`)
    }
})

wsAddHandler( 'delete_prefab_group', async( data ) => {
    console.log( "Deleting a prefab group: ", data.id, data.group )
    let itemsToDelete = []
    let scanned = 0
    attSaveLoad.onMessage = async ( message ) => {
        console.log( `delete prefab event: `, message )
        if ( !!message.data.Command.FullName )
        {
            switch( message.data.Command.FullName )
            {
                case "select.get":
                    scanned++
                    if ( !blacklistItems[ message.data.Result.PrefabHash ] )
                    {
                        itemsToDelete.push( message.data.Result )
                    }
                    console.log( `scanned: ${scanned}, total: ${itemsToDelete.length}`)
                    if ( scanned == group.items.length )
                    {
                        // Finished scanning, delete the remainder
                        for( let i = 0; i < itemsToDelete.length; i++ )
                        {
                            await attSaveLoad.send(`select ${itemsToDelete[i].Identifier}`)
                            await attSaveLoad.send(`select destroy`)
                        }
                        wsSendJSON({'result': 'OK', data: data })
                    }
                break
            }
        }
    }
    if ( prefabGroups[ data.id ] )
    {
        group = prefabGroups[data.id]
        for( let i = 0; i < group.items.length; i++ )
        {
            let item = group.items[i]
            await attSaveLoad.send(`select get ${item.Identifier}`)
        }
        delete prefabGroups[ data.id ]
    }
})

wsAddHandler( 'reset_prefab_groups', async(data) => {
    prefabGroups = []
})

wsAddHandler( 'clone_prefab', async( data ) => {
    console.log( "Cloning prefab: ", data )
    let player = data.player
    if ( !!data.hash && `${data.hash}`.includes("group") )
    {
        console.log("Clone a group of prefabs: ", data )
        let groupId = data.hash.split('_')[1]
        let groupItems = prefabGroups[ groupId ].items
        console.log("selected group: ", groupItems )
        // Just pass the new items back to UI, which will handle the re-selection process
        // and setup the UI components correctly
        let newGroup = []
        let ind = 0
        let ngi = 0
        let nextItem = () => {
            ind++
            if ( ind < groupItems.length )
            {
                selectItemToString( ind )
            } else {
                // Send back the new group
                console.log( "returning new group: ", newGroup )
                wsSendJSON({ 'result': 'OK', data: data, group: newGroup })
            }
        }
        attSaveLoad.onMessage = async( message ) => {
            console.log( "clone_prefab group onMessage: ", message )
            switch( message.data.Command.FullName )
            {
                case "select.get":
                    if ( blacklistItems[ message.data.Result.PrefabHash ])
                    {
                        console.log( "Item is in blacklist, not cloning:", message.data.Result )
                        nextItem()
                    } else {
                        newGroup[ngi] = {}
                        newGroup[ngi].pos = message.data.Result.Position
                        newGroup[ngi].rot = message.data.Result.Rotation
                        await attSaveLoad.send(`select tostring`)
                    }
                break

                case "select.tostring":
                    let prefabString = message.data.ResultString
                    await attSaveLoad.send(`spawn string ${player} ${prefabString}`)
                break

                case "spawn.string":
                    let prefabId = message.data.Result[0].Identifier
                    newGroup[ngi].Identifier = prefabId
                    newGroup[ngi].Name = message.data.Result[0].Name
                    let pos = newGroup[ngi].pos
                    let rot = newGroup[ngi].rot
                    await attSaveLoad.send(`select ${prefabId}`)
                    await attSaveLoad.send(`select rotate exact ${rot[0]},${rot[1]},${rot[2]}`)
                    await attSaveLoad.send(`select move exact ${pos[0]},${pos[1]+1},${pos[2]}`)
                break

                case "select move.exact":
                    ngi++
                    nextItem()
                break
            }
        }
        let selectItemToString = async ( ind ) => {
            let item = groupItems[ind]
            console.log( "getting item: ", ind, item )
            await attSaveLoad.send(`select ${item.Identifier}`)
            await attSaveLoad.send(`select get ${item.Identifier}`)
        }
        selectItemToString( ind )

    } else {
        let newItem = {}
        attSaveLoad.onMessage = async ( message ) => {
            console.log( "clone_prefab onMessage: ", message )
            switch( message.data.Command.FullName )
            {
                case "select.get":
                    if ( blacklistItems[ message.data.Result.PrefabHash ] )
                    {
                        console.log( "Item is in blacklist: ", data )
                        wsSendJSON({ 'result': 'Fail', data: data })
                    } else {
                        newItem.pos = message.data.Result.Position
                        newItem.rot = message.data.Result.Rotation
                        await attSaveLoad.send('select tostring')
                    }
                break
                case "select.tostring":
                    // Re-spawn from the string
                    console.log( "select.tostring response: ", message.data.ResultString )
                    await attSaveLoad.send(`spawn string ${player} ${message.data.ResultString}`)
                break

                case "spawn.string":
                    // Collect the ID and name and return it to the UI
                    console.log( "moving new item to: ", newItem )
                    let hash = message.data.Result[0].Identifier
                    let pos = newItem.pos
                    let rot = newItem.rot
                    await attSaveLoad.send(`select ${hash}`)
                    console.log( `select rotate exact ${rot[0]},${rot[1]}.${rot[2]}` )
                    console.log( `select move exact ${pos[0]},${pos[1]}.${pos[2]}` )
                    await attSaveLoad.send(`select rotate exact ${rot[0]},${rot[1]},${rot[2]}`)
                    await attSaveLoad.send(`select move exact ${pos[0]},${pos[1]+1},${pos[2]}`)
                    wsSendJSON( { result: 'OK', data: data, prefab: message.data.Result[0] }  )
                break
            }
        }
        await attSaveLoad.send( `select ${data.hash}` )
        await attSaveLoad.send( `select get ${data.hash}`)
    }
})


wsAddHandler( 'player_set_home', async (data) => {
    console.log( `player_set_home`, data )
    let locData = data.data
    let player = locData.player
    let destination = locData.destination
    let pos = locData.position


    attConsole.onMessage = async ( message ) => {
        console.log( `player_set_home message: `, message )
        if ( !!message.data.Command )
        {
            switch( message.data.Command.FullName )
            {
                case "player.detailed":
                    let posString = message.data.Result.Position.replace(/[()\ ]/g, '')
                    let npos = posString.split(',')
                    console.log( `new player home position: ${player} `, npos )
                    await attConsole.send(`player set-home ${player} "${npos[0]},${npos[1]},${npos[2]}"`)
                break

                case "player.set-home":
                    console.log( "player home set: ", message )
                    wsSendJSON({'result': 'OK', data: data })
                break
            }
        }
    }

    switch( destination )
    {
        case "PlayerLoc":
            // Retrieve the current location of the player and use this value
            await attConsole.send(`player detailed ${player}`)
        break

        case "MyLoc":
            // Retrieve my location and use this value
            await attConsole.send(`player detailed ${attSession.getUsername()}`)
        break

        case "Respawn":
            // Reset the value by specifying no location
            await attConsole.send(`player set-home ${player}`)
        break

        case "Exact":
            // Use the specified location
            await attConsole.send(`player set-home ${player} ${pos.x},${pos.y},${pos.z}`)
        break
    }
})


// TODO: replace these with websocket handlers
server.post('/ajax', asyncMid( async( req, res, next ) => {
    console.log( req.body )
    let response = {}
    let command = undefined;
    let responseSent = false;
    let userId = attSession.getUserId()
    if ( authenticated( req ) )
    {
        try {
            if ( !!attConsole )
            {
                attConsole.onMessage = ( message ) => {
                    console.log( message, message.data.Result )
                    let data = {}
                    if ( !!message.data )
                    {
                        data = message.data
                    }
                    if ( !!data.Command && 
                            ( data.Command.FullName != 'select.' || req.body.action == "select_prefab" )
                       )
                    {
                        let result = ( !!message.data.Exception ) ? 'Fail' : 'OK'
                        response = {
                            'result' : result,
                            'data' : data
                        }
                        if ( !responseSent )
                        {
                            responseSent = true;
                            return res.send( response )
                        }
                    }
                }
            } else {
                return res.send({ 'result' : 'Fail' })
            }

            switch( req.body.action )
            {
                case "set_angle":
                    req.session.rotateAngle = req.body.angle;
                    console.log("new rotateAngle: "+ req.session.rotateAngle )
                    response = { "result": "OK"}
                    res.send( response )
                return;

                case "set_distance":
                    req.session.distanceMag = req.body.magnitude
                    console.log("new distance magnitude: "+ req.session.distanceMag)
                    response = { "result": "OK"}
                    res.send( response )
                return;

                case "move":
                    let mdirection = req.body.direction;
                    command = "select move "+ mdirection +" "+ req.session.distanceMag
                    console.log( command )
                    if ( !!req.body.selectedPrefabId ) {
                        console.log( "selecting prefab: "+ req.body.selectedPrefabId )
                        await attConsole.send( "select "+ req.body.selectedPrefabId )
                    }
                    await attConsole.send( command )
                return;

                case "rotate":
                    let raxis = ( req.body.axis === undefined ) ? 'yaw' : req.body.axis;
                    let rotateAngle = ( req.body.direction == 'ccw') ? 360 + ( -1 * req.session.rotateAngle ): req.session.rotateAngle;
                    command = "select rotate "+ raxis +" "+ rotateAngle
                    console.log( command )
                    if ( !!req.body.selectedPrefabId ) {
                        await attConsole.send( "select "+ req.body.selectedPrefabId )
                    }
                    await attConsole.send( command )                
                return;

                case "look-at":
                    command = `select look-at ${userId}`
                    console.log( command )
                    if ( !!req.body.selectedPrefabId ) {
                        await attConsole.send( "select "+ req.body.selectedPrefabId )
                    }
                    await attConsole.send( command )
                return;

                case "snap-ground":
                    command = "select snap-ground"
                    console.log( command )
                    if ( !!req.body.selectedPrefabId ) {
                        await attConsole.send( "select "+ req.body.selectedPrefabId )
                    }
                    await attConsole.send( command )
                return;

                case "select_find":
                    let diameter = 20;
                    if ( !!req.body.diameter )
                    {
                        diameter = req.body.diameter    
                    }
                    command = `select find ${userId} ${diameter}` 
                    console.log( command )
                    await attConsole.send( command )
                return;

                case "select_prefab":
                    command = "select "+ req.body.prefabId 
                    console.log( command )
                    await attConsole.send( command )
                return;

                // Expects a hash ID from 'spawn list' command
                case "select_nearest":
                    console.log("select nearest")
                    command = `select prefab ${req.body.hash} ${userId}`
                    console.log( command )
                    await attConsole.send( command )
                return;

                case "select_get":
                    console.log( "select get" )
                    command = "select get"
                    await attConsole.send( command )
                return;

                case "select_tostring":
                    console.log( "select tostring" )
                    command = "select tostring"
                    await attConsole.send( command )
                return;

                case "post_prefab":
                    if ( !!req.body.player && !!req.body.hash )
                    {
                        command = "trade post "+ req.body.player +" "+ req.body.hash
                        if ( req.body.count > 1 )
                            command += " "+ req.body.count
                        if ( !!req.body.args )
                            command += " "+ req.body.args
                        console.log( command )
                        await attConsole.send( command )
                    } else {
                        res.send({'result':'Fail'})
                    }
                return;

                case "spawn_string":
                    if ( !!req.body.player && !!req.body.prefabString )
                    {
                        let prefabString = req.body.prefabString
                        if ( prefabString == "builderkey" ) 
                        {
                            prefabString = builderKeyPrefabString
                        }
                        command = `spawn string ${req.body.player} ${prefabString}`
                        console.log( command )
                        await attConsole.send( command )
                    } else {
                        res.send({'result':'Fail'})
                    }
                return;
                    
                case "spawn_prefab":
                    if ( !!req.body.player && !!req.body.hash )
                    {
                        command = "spawn "+ req.body.player +" "+ req.body.hash
                        if ( req.body.count > 1 )
                            command += " "+ req.body.count
                        if ( !!req.body.args )
                            command += " "+ req.body.args

                        console.log( command )
                        await attConsole.send( command )
                    } else {
                        res.send({'result':'Fail'})
                    }
                return;

                case "destroy_prefab":
                    command = "select destroy"
                    if( !!req.body.selectedPrefabId ) 
                    {
                        await attConsole.send("select "+ req.body.selectedPrefabId)
                    }
                    await attConsole.send( command )                    
                return;

                case "get_server_config":
                    command = "settings list server"
                    console.log( command )
                    await attConsole.send( command )
                return;

                case "set_server_config":
                    let parameter = ( !!req.body.name ) ? req.body.name : ''
                    let value = ( !!req.body.value ) ? req.body.value : ''
                    if ( !!parameter && !!value )
                    {
                        switch( parameter )
                        {
                            case "ServerTime":
                                console.log( "set server time: ", value)
                                let timeValue = value.replace(/:/,'.')
                                command = `time set ${timeValue}`
                            break
                            default:
                                command = "settings changeSetting server "+ parameter +" "+ value
                            break
                        }
                        console.log( command )
                        await attConsole.send( command )
                    } else {
                        res.send({'result':'Fail'})
                    }
                return;

                case "get_player_config":
                    if ( !!req.body.player )
                    {
                        userId = req.body.player 
                    }
                    command = "player list-stat "+ userId
                    console.log( command )
                    await attConsole.send( command )
                return;

                case "get_player_stat":
                    // not yet supported
                    let stat = ( !!req.body.name )
                        ? req.body.name
                        : 'health'
                    let player = ( !!req.body.player )
                        ? req.body.player
                        : userId
                    command = `player check-stat ${player} ${stat}`
                    console.log( command )
                    await attConsole.send( command )
                return;

                case "set_player_stat":
                    if ( !!req.body.name && !!req.body.value )
                    {
                        let player = ( !!req.body.player )
                            ? req.body.player
                            : userId

                        let statName = req.body.name
                        let statVal = req.body.value
                        switch( statName ) {
                            case "health":
                                if ( statVal <= 0 ) statVal = 0.1
                            break
                        }
                        command = `player set-stat ${player} ${statName} ${statVal}`
                        console.log( command )
                        await attConsole.send( command )
                    } else {
                        res.send({'result': 'Fail'})
                    }
                return;

                case "set_player_godmode":
                    let gmplayer = ( !!req.body.player )
                        ? req.body.player
                        : userId
                    let state = (req.body.value == "true")
                    command = `player god-mode ${gmplayer} ${state}`
                    console.log( command )
                    await attConsole.send( command )
                return

                case "get_player_list":
                    command = "player list"
                    console.log( command )
                    await attConsole.send( command )
                return

                case "teleport_players":
                    let players = req.body.players
                    let destination = req.body.destination
                    command = "player teleport "+ players +" "+ destination
                    console.log( command )
                    await attConsole.send( command )
                return;

                case "send_message":
                    if ( !!req.body.players )
                    {
                        let players = req.body.players
                        let message = req.body.message
                        let duration = req.body.duration
                        command = 'player message '+ players +' "'+ message +'" '+ duration
                        console.log( command )
                        await attConsole.send( command )
                    } else {
                        res.send({'result':'Fail'})
                    }
                return;

                case "player_kill":
                    if ( !!req.body.player )
                    {
                        command = "player kill "+ req.body.player
                        console.log( command )
                        await attConsole.send( command )
                    } else {
                        res.send({'result': 'Fail'})
                    }
                return;

                case "player_kick":
                        if ( !!req.body.player )
                        {
                            command = "player kick "+ req.body.player
                            console.log( command )
                            await attConsole.send( command )
                        } else {
                            res.send({'result': 'Fail'})
                        }
                return;
                        
                default:
                    res.send({'result':'Unknown Endpoint'})
                return;

            }
        } catch ( e ) {
            console.log( e.message )
            return
        }
    } else {
        console.log("not authenticated")
        res.send( { "err": "not authenticated" } )
    }
}))

server.listen( port, (err) => {
    if ( err ) {
        console.log("Error starting server:")
        return console.log( err )
    }

    console.log("Server is started on port: "+ port)
})


// ATT Connection
async function attLogin( username, hashPassword, req ) 
{
    console.log( "Connecting to ATT" )
    let resp = {}
    setATTSession()
    await attSession.loginWithUsername( username, hashPassword )
        .then(() => {
            if ( attSession.getUserId() ) {
                console.log( "Connected as "+ attSession.getUsername() )
                resp.authenticated = true;        
            }
        })
        .catch( (err) => { 
            console.log( err )
            let errMsg = JSON.parse( err.error )
            console.log( "Authentication error: "+ errMsg.message ) 
            resp.error = errMsg.message
        });
    return resp
}

async function loadSpawnableItems( req )
{
    return new Promise( ( resolve, reject ) => {
        let conn = attConsole
        if ( !!conn ) 
        {
            conn.onMessage = (data) => {
                if ( !!data.data.Result && data.data.Result.length > 0 )
                {
                    spawnableItemsList = data.data.Result
                    spawnableItemsList.sort((a, b) => {
                        al = a.Name.toLowerCase()
                        bl = b.Name.toLowerCase()
                        return ( al > bl ) ? 1 : -1
                    })
                    return resolve()
                } else {
                    return reject()
                }
            }
            console.log( "loadSpawnableItems getting spawnables list" )
            conn.send( "spawn list" )  
            //conn.send("spawn infodump")
        }
    })
}

async function loadSubscriptions( req )
{
    return new Promise( (resolve, reject) => {
        let conn = attSubscriptions
        if ( !!conn )
        {
            conn.onMessage = (data) => {
                if ( !!data.data.Result && data.data.Result.length > 0 )
                {
                    subscriptionList = data.data.Result
                    return resolve()
                } else {
                    return reject()
                }
            }
            console.log( "loadSubscriptions getting subscription targets")
            conn.send("websocket subscriptions")
        }
    })
}

function loadCredData()
{
    console.log( "loadCredData" )
    let parsed = {}
    try {
        let raw = fs.readFileSync( path.join(__dirname, 'data/credentials.json') )
        parsed = JSON.parse( raw )
    } catch ( e ) {
        console.log( "error reading data/credentials.json: "+ e.message )        
    }
    return parsed
}

function saveCredData( creds )
{
    console.log( "saveCredData" )
    console.log( creds )
    fs.writeFile(path.join(__dirname, 'data/credentials.json'), JSON.stringify( creds, null, 4 ), function( err ) {
        if ( err )
        {
            console.log( err );
        } else {
            console.log( "New credentials.json saved" );
        }
    });   
}

function unpackfloat( value )
{
    let buffer = Buffer.from(new Uint8Array(4))
    buffer.writeUInt32LE( value )
    let unpackedFloat = ieee754.read( buffer, 0, true, 23, 4)
    return unpackedFloat
}

function rad2deg( angle )
{
    return angle * ( 180 / Math.PI )
}

function deg2rad( angle )
{
    return angle * ( Math.PI / 180 )
}

function parseBool(val)
{
    return val === true || val === "true"
}