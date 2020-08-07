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

const server = express()
const port = Number(process.env.PORT) || 21129
const useSavedPassword = ( process.env.USE_SAVED_PASS === undefined )
    ? true
    : ( process.env.USE_SAVED_PASS == 1 )

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
var attConsole;
var attSubscriptions;

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
                console.log("Connected to server: "+ selectedServer.name )
                setConnection( selectedServer.name )
                setSubscrptionsConnection( selectedServer.Name )
                await attConsole.connect( details.connection.address, details.connection.websocket_port, details.token )
                await attSubscriptions.connect( details.connection.address, details.connection.websocket_port, details.token )
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
        let itemList = req.body.items
        let useExactCoordinates = ( req.body.exact == true ) ? true : false
        let positionList = []
        attConsole.onMessage = ( message ) => {
            console.log( "command response message")
            console.log( message, message.data.Result, message.data.BufferResultString )
            if ( message.data.Command.FullName == 'select.tostring')
            {
                let resultString = (message.data.ResultString.split('|',1))[0]
                let words = resultString.split(',')
                let prefab = spawnableItemsList.find( item => item.Hash == words[0] )

                let item = {
                    'string' : resultString,
                    'hash' : words[0],
                    'Name' : ( !!prefab ) ? prefab.Name : '',
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
                    x : rad2dec( item.roteuler.x ),
                    y : rad2dec( item.roteuler.y ),
                    z : rad2dec( item.roteuler.z ),
                }
                console.log( "item tostring:", item )
                positionList.push(item)                
            }
        }

        console.log( itemList )
        console.log("getting positions")
        for ( let i = 0; i < itemList.length; i++ )
        {
            let item = itemList[i]
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

                if ( !useExactCoordinates )
                {
                    // Find the smallest values for x,y,z 
                    min_x = positionList[0].Position.x;
                    min_y = positionList[0].Position.y;
                    min_z = positionList[0].Position.z;
                    for ( let i = 0; i < positionList.length; i++ )
                    {
                        let item = positionList[i]
                        if ( item.Position.x < min_x ) { min_x = item.Position.x }
                        if ( item.Position.y < min_y ) { min_y = item.Position.y }
                        if ( item.Position.z < min_z ) { min_z = item.Position.z }
                    }

                    // remove the minimum offsets to bring the item to root
                    console.log( "min_x: "+ min_x )
                    console.log( "min_y: "+ min_y )
                    console.log( "min_z: "+ min_z )
                    for ( let i = 0; i < positionList.length; i++ )
                    {
                        let item = positionList[i]
                        item.Position.x = item.Position.x - min_x
                        item.Position.y = item.Position.y - min_y
                        item.Position.z = item.Position.z - min_z
                        positionList[i] = item;
                    }
                    console.log("offset positions:")
                    console.log( positionList )
                }

                // Write it out to the file
                let ts = moment().valueOf()
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
        let prefabList = loadedPrefabLists[ req.body.md5sum ]
        let useExactCoordinates = ( prefabList.header.exact )
        let userId = attSession.getUserId()      
        let moffset = [ 
            parseFloat(req.body.moffset_x), 
            parseFloat(req.body.moffset_y),
            parseFloat(req.body.moffset_z)
        ]
        let translatedPrefabs = clone( prefabList.prefabs )

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
        console.log("original prefabs list")
        console.log( prefabList.prefabs)
        console.log("slice copy")
        console.log( translatedPrefabs )
        for( let i = 0; i < translatedPrefabs.length; i++ )
        {
            let item = translatedPrefabs[i]
            item.Position.x = parseFloat(item.Position.x) + moffset[0]
            item.Position.y = parseFloat(item.Position.y) + moffset[1]
            item.Position.z = parseFloat(item.Position.z) + moffset[2]
            
            translatedPrefabs[i] = item
        }
        console.log("original")
        console.log( prefabList.prefabs )
        console.log("slice copy with predefined offsets")
        console.log( translatedPrefabs )


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

        function spawnPrefabsFromList( ind ) {
            return new Promise( (resolve, reject) => {
                if ( ind === undefined ) ind = 0
                if ( translatedPrefabs.length > 0 && ind < translatedPrefabs.length )
                {
                    console.log("spawning prefab from list ["+ ind +"]")
                    let titem = translatedPrefabs[ind]
                    console.log( titem )
                    let pos = titem.Position
                    let rot = titem.Rotation
    
                    conn.onMessage = ( message ) => {
                        console.log( "spawnPrefabsFromList message:")
                        console.log( message )
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
                        console.log("finished spawning prefab list")
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

// attConsole websocket controls
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
    if ( !!data.selectedPrefabId ) {
        console.log( "selecting prefab: "+ data.selectedPrefabId )
        await attConsole.send( "select "+ data.selectedPrefabId )
    }
    await attConsole.send( command )
    wsSendJSON({ result: 'OK', data: data })
})

wsAddHandler( 'rotate', async ( data ) => {
    let raxis = ( data.axis === undefined ) ? 'yaw' : data.axis;
    let rotateAngle = ( data.direction == 'ccw') ? 360 + ( -1 * wsMap.rotateAngle ): wsMap.rotateAngle;
    command = "select rotate "+ raxis +" "+ rotateAngle
    console.log( command )
    if ( !!data.selectedPrefabId ) {
        await attConsole.send( "select "+ data.selectedPrefabId )
    }
    await attConsole.send( command )                
    wsSendJSON({ result: 'OK', data: data })
})

wsAddHandler('look-at', async( data ) => {
    console.log( data )
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
    command = `select snap-ground`
    console.log( command )
    if ( !!data.selectedPrefabId ) {
        await attConsole.send( "select "+ data.selectedPrefabId )
    }
    await attConsole.send( command )
    wsSendJSON({ result: 'OK', data: data })
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
                        command = "settings changeSetting server "+ parameter +" "+ value
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
                    command = `player checkstat ${player} ${stat}`
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
                        command = `player setstat ${player} ${statName} ${statVal}`
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
                    if ( req.body.value == "true" )
                    {
                        command = "player godmodeon "+ gmplayer
                    } else {
                        command = "player godmodeoff "+ gmplayer
                    }
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

function rad2dec( angle )
{
    return angle * ( 180 / Math.PI )
}