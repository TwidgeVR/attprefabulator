var loc = window.location
var wsProt = (( loc.protocl == 'https:') ? "wss:" : "ws:" )
var wsPort = Number( loc.port ) + 1
var wsUri = wsProt +"//"+ loc.hostname +":"+ wsPort

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
    try {
        console.log( "websocket send: ", JSON.stringify( data ))
        webSocket.send( JSON.stringify( data ))
    } catch( e ) {
        console.log( "Error sending websocket message: "+ e.message )
        return false
    }
    return true
}

const webSocket = new WebSocket( wsUri )
webSocket.onopen = (event) => {
    webSocket.send("ping")
}
webSocket.onerror = (event) => {
    console.log( "WebSocket error: ", event )
}

webSocket.addEventListener('message', (event) => {
    try {
        let eventObj = JSON.parse( event.data )
        // Call the handler matching the action name, if present
        if ( !!eventObj.data && !!eventObj.data.action )
        {
            console.log( "trying event handler: "+ eventObj.data.action )
            let handler = wsGetHandler( eventObj.data.action )
            if ( !!handler )
            {
                return handler( eventObj )
            }
            console.log( "No handler for action: "+ eventObj.data.action )
        }
        if ( !!eventObj.type )
        {
            console.log( "trying event handler by type: "+ eventObj.type )
            let handler = wsGetHandler( eventObj.type )
            if ( !!handler )
                return handler( eventObj )
        }
        console.log( "Unhandled socket event: ", eventObj )
        
    } catch( e ) {
        console.log( "Error processing websocket message: "+ e.message )
        console.log( event )
    }
})

