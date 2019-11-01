const moment = require('moment')
const sha512 = require('crypto-js/sha512')

var Datastore = require('nedb')
var spawnables = new Datastore({ filename: 'data/spawnables.db', autoload: true })

// Load required classes for express
const path = require('path')
const express = require('express')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const sessionStore = require('session-file-store')(session)
const bodyParser = require('body-parser')

const server = express()
const port = 8000

// Connection is by sessionID
var att_connection = []
var att_sessions = []
var att_servers = []

//Utility helper functions and prototypes
function ts()
{ 
    return "["+ moment().format() +"]"
}

function getConnection( req )
{
    return ( !!att_connection[req.sessionID] ) ? att_connection[req.sessionID] : undefined
}

function setConnection( req, serverName )
{
    var { Connection } = require('att-websockets')
    // requires are cached which prevents instantiation
    // so remove the cache entry after loading
    delete require.cache[require.resolve('att-websockets')]

    att_connection[ req.sessionID ] = new Connection( serverName )

    att_connection[ req.sessionID ].onError = ( e ) => {
        console.log( e )
        throw( e )
    }
}

function setATTSession( req )
{
    var { Sessions, Servers } = require('alta-jsapi')
    // requires are cached which prevents instantiation
    // so remove the cache entry after loading
    delete require.cache[require.resolve('alta-jsapi')]
    
    att_sessions[ req.sessionID ] = Sessions
    att_servers[ req.sessionID ] = Servers
}

function getATTSession( req ) 
{
    return ( !!att_sessions[req.sessionID]) ? att_sessions[req.sessionID] : undefined
}

function getATTServers( req )
{
    return ( !!att_servers[req.sessionID]) ? att_servers[req.sessionID] : undefined
}

function authenticated( req )
{
    return  ( req.session !== undefined )
            && !!req.session.userAuthenticated
            && ( getATTSession(req) !== undefined )
            && getATTSession(req).getUserId()
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
server.use( bodyParser.urlencoded({ extended: false }) )
server.use( bodyParser.json() )
server.use( session({secret: 'RTHV6fzTyb31rHUIETuX', resave: false, saveUninitialized: true, store: new sessionStore() }))


server.get('/', ( req, res ) => {
    if ( authenticated( req ) )
    {
        res.redirect('/servers')
    } else {
        res.redirect('/login')
    }
        
})

server.get('/login', ( req, res ) => {
    if ( !!req.query.error )
    {
        res.render('login', { error: req.query.error })
    } else {
        res.render('login', { error: false })
    }
})

server.post('/login', asyncMid( async(req, res, next) => {
    let resp = await attLogin( req.body.username, req.body.password, req );
    if ( resp.authenticated == true )
    {
        req.session.userAuthenticated = true
        req.session.alta_username = getATTSession(req).getUsername();
        res.redirect('/')
        return
    }
    res.redirect( 'login?error='+ resp.error )
}))

server.get('/servers', asyncMid( async (req, res, next) => {
    if( authenticated( req ) )
    {
        var servers = await getATTServers(req).getOnline()
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
        var servers = await getATTServers(req).getOnline()
        var serverId = req.body.selectServer;
        var selectedServer = servers.find( item => item.id.toString() == serverId )
        console.log( selectedServer )
        try {
            var details = await getATTServers(req).joinConsole( serverId )
            if ( details.allowed )
            {
                console.log("Connected to server: "+ selectedServer.name )
                setConnection( req, selectedServer.name )
                await getConnection(req).connect( details.connection.address, details.connection.websocket_port, details.token )
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

server.get('/control', ( req, res, next ) => {
    if ( authenticated( req ))
    {
        req.session.rotateAngle = 10;
        req.session.distanceMag = 0.1;

        let sname = "Not connected";
        if ( !!req.query.serverName ) {
            sname = req.query.serverName
        }
        
        try {
            spawnables.find({}).sort({name: 1}).exec( (err, docs) => {
                res.render("control", { serverName: sname, spawnableItems: docs })
            })
            return
        } catch ( e ) {
            console.log( e )
            res.redirect('/login?error=Server error')
            return
        }
    } else {
        res.redirect('login?error=Logged out')
    }
})

server.post('/ajax', asyncMid( async( req, res, next ) => {
    console.log( req.body )
    let response = {}
    let command = undefined;
    let responseSent = false;
    if ( authenticated( req ) )
    {
        try {
            if ( !!getConnection(req) )
            {
                getConnection(req).onMessage = ( message ) => {
                    console.log( message )
                    let data = {}
                    if ( !!message.data )
                    {
                        data = message.data
                    }
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
                    await getConnection(req).send( command )
                return;

                case "rotate":
                    let raxis = ( req.body.axis === undefined ) ? 'yaw' : req.body.axis;
                    let rotateAngle = ( req.body.direction == 'ccw') ? 360 + ( -1 * req.session.rotateAngle ): req.session.rotateAngle;
                    command = "select rotate "+ raxis +" "+ rotateAngle
                    console.log( command )
                    await getConnection(req).send( command )                
                return;

                case "look-at":
                    command = "select look-at "+ getATTSession(req).getUsername()
                    console.log( command )
                    response = { "result": "OK" }
                    await getConnection(req).send( command )
                return;

                case "snap-ground":
                    command = "select snap-ground"
                    console.log( command )
                    await getConnection(req).send( command )
                return;

                case "select_find":
                    let distance = 20;
                    command = "select find "+ getATTSession(req).getUsername() +" "+ distance 
                    console.log( command )
                    await getConnection(req).send( command )
                return;

                case "select_prefab":
                    command = "select "+ req.body.prefabId 
                    console.log( command )
                    await getConnection(req).send( command )
                return;

                // Expects a hash ID from 'spawn list' command
                case "select_nearest":
                    console.log("select nearest")
                    command = "select prefab "+ req.body.hash +" "+ getATTSession(req).getUsername()
                    console.log( command )
                    await getConnection(req).send( command )
                return;

                case "select_get":
                    console.log( "select get" )
                    command = "select get"
                    await getConnection(req).send( command )
                return;

                case "spawn_prefab":
                    command = "spawn "+ getATTSession(req).getUsername() +" "+ req.body.hash
                    console.log( command )
                    await getConnection(req).send( command )
                return;

                case "destroy_prefab":
                    command = "select destroy"
                    await getConnection(req).send( command )
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
async function attLogin( username, password, req ) 
{
    console.log( "Connecting to ATT" )
    let hashPassword = sha512( password ).toString()
    let resp = {}
    setATTSession( req )
    await getATTSession(req).loginWithUsername( username, hashPassword )
        .then(() => {
            if ( getATTSession(req).getUserId() ) {
                console.log( "Connected as "+ getATTSession(req).getUsername() )
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
