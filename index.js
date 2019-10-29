// Load required classes for ATT
const { Servers, Sessions } = require('alta-jsapi');
const { Connection, Message } = require('att-websockets')
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

var att_connection;

//Utility helper functions and prototypes
function ts()
{ 
    return "["+ moment().format() +"]"
}

function strrep( str, n )
{
    if ( n < 1 ) return '';
    var result = str;
    while( n-- > 0 )
    {
        result += str;
    }
    return result;
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
    if ( !!req.session.userAuthenticated )
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
    let resp = await attLogin( req.body.username, req.body.password );
    if ( resp.authenticated == true )
    {
        req.session.userAuthenticated = true
        req.session.alta_username = Sessions.getUsername();
        res.redirect('/')  
    } else {
        res.redirect( 'login?error='+ resp.error )
    }
}))

server.get('/servers', asyncMid( async (req, res, next) => {
    if ( !!req.session.userAuthenticated && Sessions.getUserId() )
    {
        var servers = await Servers.getOnline()
        if ( !!servers )
        {
            if ( !!req.query.error )
            {
                res.render("servers", { error: req.query.error, serverList: servers })
            } else {
                res.render("servers", { serverList: servers })
            }
        } else {
            res.send( "No servers available" )
        }
    } else {
        res.redirect('/login')
    }
}))

server.post('/servers', asyncMid( async(req, res, next) =>{
    if ( !!req.session.userAuthenticated && Sessions.getUserId() )
    {
        var servers = await Servers.getOnline()
        var serverId = req.body.selectServer;
        var selectedServer = servers.find( item => item.id.toString() == serverId )
        console.log( selectedServer )
        try {
            var details = await Servers.joinConsole( serverId )
            if ( details.allowed )
            {
                console.log("Connected to server: "+ selectedServer.name )
                att_connection = new Connection(selectedServer.name)
                await att_connection.connect( details.connection.address, details.connection.websocket_port, details.token )
                //console.log( att_connection )
                
                
                res.redirect('/control?serverName='+ selectedServer.name )
                return;
            } else {
                console.log("Error connecting to server: ")
                console.log( details )
                res.redirect('/servers?error='+ details.message )
                return;
            }
        } catch (e) {
            console.log("Error connecting to server:"+ e.message)
            res.redirect('/servers?error='+ e.message )
            return;
        }
    }
    res.redirect('/login')
}))

server.get('/control', ( req, res, next ) => {
    req.session.rotateAngle = 10;
    req.session.distanceMag = 0.1;

    let sname = "Not connected";
    console.log( req.query )
    if ( !!req.query.serverName )
        sname = req.query.serverName
    spawnables.find({}).sort({name: 1}).exec( (err, docs) => {
        res.render("control", { serverName: sname, spawnableItems: docs })
    })
})

server.post('/ajax', asyncMid( async( req, res, next ) => {
    console.log( req.body )
    let response = {}
    let command = undefined;
    if ( !!req.session.userAuthenticated && Sessions.getUserId() )
    {
        switch( req.body.action )
        {
            case "set_angle":
                req.session.rotateAngle = req.body.angle;
                console.log("new rotateAngle: "+ req.session.rotateAngle )
                response = { "result": "OK"}
                res.send( response )
            break;

            case "set_distance":
                req.session.distanceMag = req.body.magnitude
                console.log("new distance magnitude: "+ req.session.distanceMag)
                response = { "result": "OK"}
                res.send( response )
            break;

            case "move":
                let mdirection = req.body.direction;
                command = "select move "+ mdirection +" "+ req.session.distanceMag
                console.log( command )
                att_connection.onMessage = ( message ) => {
                    console.log( message )
                    response = { "result": "OK"}
                    res.send( response )
                }
                await att_connection.send( command )                
            break;

            case "rotate":
                let raxis = ( req.body.axis === undefined ) ? 'yaw' : req.body.axis;
                let rotateAngle = ( req.body.direction == 'ccw') ? -1 * req.session.rotateAngle : req.session.rotateAngle;
                command = "select rotate "+ raxis +" "+ rotateAngle
                console.log( command )
                att_connection.onMessage = ( message ) => {
                    console.log( message )
                    response = { "result": "OK"}
                    res.send( response )
                }
                await att_connection.send( command )                
            break;

            case "look-at":
                command = "select look-at "+ Sessions.getUsername()
                console.log( command )
                response = { "result": "OK"}
                att_connection.onMessage = ( message ) => {
                    console.log( message )
                    response = { "result": "OK"}
                    res.send( response )
                }
                await att_connection.send( command )                
            break;

            case "snap-ground":
                command = "select snap-ground"
                console.log( command )
                att_connection.onMessage = ( message ) => {
                    console.log( message )
                    response = { "result": "OK"}
                    res.send( response )
                }
                await att_connection.send( command )                
            break;

            case "select_find":
                let distance = 20;
                command = "select find "+ Sessions.getUsername() +" "+ distance 
                console.log( command )
                att_connection.onMessage = ( message ) => {
                    console.log( message )
                    res.send( { result: message.data.Result } )
                }
                await att_connection.send( command )
            break;

            case "select_prefab":
                console.log("select prefab")
                command = "select "+ req.body.prefabId 
                console.log( command )
                att_connection.onMessage = ( message ) => {
                    console.log( message )
                    if ( message.data.ResultString == 'Success' )
                        response = { "selectedPrefab" : req.body.prefabId +" - "+ req.body.prefabName }
                    else 
                        response = { "selectedPrefab" : "None selected"}
                    res.send( response )
                }
                await att_connection.send( command )
            break;

            // Expects a hash ID from 'spawn list' command
            case "select_nearest":
                console.log("select nearest")
                command = "select prefab "+ req.body.hash +" "+ Sessions.getUsername()
                console.log( command )
                att_connection.onMessage = ( message ) => {
                    console.log( message )
                    if ( message.data.ResultString == 'Success' )
                    {
                        response = { "result" : 'Success' }
                    } else {
                        response = { "result" : 'Fail' }
                    }
                    res.send( response )
                }
                await att_connection.send( command )
            break;

            case "select_get":
                console.log( "select get" )
                command = "select get"
                att_connection.onMessage = ( message ) => {
                    console.log( message)
                    response = { "selectedPrefab" : message.data.ResultString }
                    res.send( response)
                }
                await att_connection.send( command )
            break;

            case "spawn_prefab":
                command = "spawn "+ Sessions.getUsername() +" "+ req.body.hash
                console.log( command )
                att_connection.onMessage = ( message ) => {
                    console.log( message )
                    if ( message.data.ResultString == 'Success' )
                    {
                        response = { "result" : 'Success' }
                    } else {
                        response = { "result" : 'Fail' }
                    }
                    res.send( response )
                }
                await att_connection.send( command )
            break;
        }
    } else {
        console.log("not authenticated")
        res.send( { "err": "not authenticated" })
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
async function attLogin( username, password ) 
{
    console.log( "Connecting to ATT" )
    let hashPassword = sha512( password ).toString()
    let resp = {}
    await Sessions.loginWithUsername( username, hashPassword )
        .then(() => {
            if ( Sessions.getUserId() ) {
                console.log( "Connected as "+ Sessions.getUsername() )
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
