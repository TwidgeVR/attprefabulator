$(document).ready(() => {

    $("#turnleft").click( () => controlClick( 'yaw', 'ccw', $("#turnleft") ))
    $("#up").click( () => controlClick( 'move', 'up', $("#up") ))
    $("#turnright").click( () => controlClick( 'yaw', 'cw', $("#turnright") ))

    $("#left").click( () => controlClick( 'move', 'left', $("#left") ))
    $("#look-at").click( () => controlClick( 'look-at', null, $("#look-at") ))
    $("#right").click( () => controlClick( 'move', 'right', $("#right") ))

    $("#pitchup").click( () => controlClick( 'pitch', 'up', $("#pitchup") ))
    $("#down").click( () => controlClick( 'move', 'down', $("#down") ))
    $("#pitchdown").click( () => controlClick( 'pitch', 'down', $("#pitchdown") ))

    $("#forward").click( () => controlClick( 'move', 'forward', $("#forward") ))
    $("#back").click( () => controlClick( 'move', 'back', $("#back") ))

    $("#spinccw").click( () => controlClick( 'roll', 'ccw', $("#spinccw") ))
    $("#snap-ground").click( () => controlClick( 'snap-ground', null, $("#snap-ground") ))
    $("#spincw").click( () => controlClick( 'roll', 'cw', $("#spincw") ))

    $("#ControlsNav").click( () => {
        $(".topnav").toggleClass("active", false)
        $("#ControlsNavLi").toggleClass("active")
        $("div#Controls").show()
        $("div#Select").hide()
        $("div#Search").hide()
    })

    $("#SelectNav").click( () => {
        $(".topnav").toggleClass("active", false)
        $("#SelectNavLi").toggleClass("active")
        $("div#Select").show()
        $("div#Controls").hide()
        $("div#Search").hide()
    })

    $("#SearchNav").click( () => {
        $(".topnav").toggleClass("active", false)
        $("#SearchNavLi").toggleClass("active")
        $("div#Search").show()
        $("div#Controls").hide()
        $("div#Select").hide()
    })

    $("#RotateAngle1").click( () => setAngle( 1, $("#RotateAngle1") ))
    $("#RotateAngle10").click( () => setAngle( 10, $("#RotateAngle10") ))
    $("#RotateAngle45").click( () => setAngle( 45, $("#RotateAngle45") ))
    $("#RotateAngle90").click( () => setAngle( 90, $("#RotateAngle90") ))    

    $("#Distance1cm").click( () => setDistance( 0.01, $("#Distance1cm") ))
    $("#Distance10cm").click( () => setDistance( 0.1, $("#Distance10cm") ))
    $("#Distance1m").click( () => setDistance( 1, $("#Distance1m") ))
    $("#Distance10m").click( () => setDistance( 10, $("#Distance10m") ))

    $(".FindablePrefab").click( (e) => {
        $(".FindablePrefab").toggleClass("active", false)
        $(e.target).toggleClass("active")
    })

    $("#SelectFind").click( () => selectFind( $("#SelectFindItems")) )

    $("#SelectFindItems").on( 'click', '.SelectablePrefab', (e) => { 
        selectPrefabById( e.target.id, e.target.name, $("#ClosestPrefab b") )
    })

    $("#SearchNearestItems").keyup( (e) => {
        var value = $(e.target).val().trim().toLowerCase()
        if ( value == '' )
        {
            $(".FindablePrefab").show()
        } else {
            $(".FindablePrefab").each( function() {
                if ( $(this).text().toLowerCase().indexOf( value ) > -1 )
                    $(this).show()
                else
                    $(this).hide()  
            })
        }
    })

    $("#SearchFindNearest").click( () => {
        let activeItem = $("#SelectNearestItems").find("button.active").attr('id')
        if ( activeItem !== undefined )
            findNearestPrefabById( activeItem, $("#ClosestPrefab b"))
        else
            flash( $("#SearchFindNearest"), "255, 20, 20")
    })

    $("#SearchSpawnItem").click( () => {
        let activeItem = $("#SelectNearestItems").find("button.active").attr('id')
        if ( activeItem !== undefined )
            spawnPrefab( activeItem, $("#ClosestPrefab b"))
        else
            flash( $("#SearchFindNearest"), "255, 20, 20")
    })
})

function selectPrefabById( id, name, selectDisplay ) {
    $.ajax({
        type:'post',
        url:'/ajax',
        data: {'action': 'select_prefab', 'prefabId': id, 'prefabName': name  },
        dataType: 'json'
    })
    .done( (data) => {
        $(selectDisplay).html( data.selectedPrefab )
    })
}

function findNearestPrefabById( id, selectDisplay ) {
    $.ajax({
        type:'post',
        url:'/ajax',
        data: {'action': 'select_nearest', 'hash': id },
        dataType: 'json'
    })
    .done( (data) => {
        console.log( data )
        if ( data.result == 'Success' )
        {
            let color = "20, 255, 20"
            flash( $("#SearchFindNearest"), color )
            $.ajax({
                type:'post',
                url:'/ajax',
                data: {'action': 'select_get'},
                dataType: 'json'
            })
            .done( (data) => {
                $(selectDisplay).html( data.selectedPrefab )
            })
        } else {
            let color = "255, 20, 20"
            flash( $("#SearchFindNearest"), color )
            updateServer( data )
        }
    })
}

function spawnPrefab( id, selectDisplay ) {
    $.ajax({
        type:'post',
        url:'/ajax',
        data: {'action': 'spawn_prefab', 'hash': id },
        dataType: 'json'
    })
    .done( (data) => {
        console.log( data )
        if ( data.result == 'Success' )
        {
            let color = "20, 255, 20"
            flash( $("#SearchSpawnItem"), color )
            $.ajax({
                type:'post',
                url:'/ajax',
                data: {'action': 'select_get'},
                dataType: 'json'
            })
            .done( (data) => {
                $(selectDisplay).html( data.selectedPrefab )
            })
        } else {
            let color = "255, 20, 20"
            flash( $("#SearchSpawnItem"), color )
            updateServer( data )
        }
    })
}


function selectFind( e ) {
    $.ajax({
        type:'post',
        url:'/ajax',
        data: {'action': 'select_find'},
        dataType: 'json'
    })
    .done( (data) => {
        console.log( data.result )
        if ( data.result !== undefined )
        {
            $("#SelectFind").remove($(".SelectablePrefab"))
            for( var i = 0; i < data.result.length; i++ ){
                let item = data.result[i]
                $(e).append("<button class='SelectablePrefab list-group-item list-group-item-action' id='"+ item.Identifier +"' name='"+ item.Name +"'> "+ item.Identifier +" - "+ item.Name +"</button>")
            }
        }
        updateServer(data)
    })
}

function setAngle( angle, e ){
    $.ajax({ 
        type:'post', 
        url:'/ajax', 
        data: {'action': 'set_angle', 'angle': angle },
        dataType: 'text'
    })
    .done( (data) => {
        $("a.rotateangle").toggleClass("active", false )
        $(e).toggleClass("active") 
    })
}

function setDistance( magnitude, e ){
    $.ajax({ 
        type:'post', 
        url:'/ajax', 
        data: {'action': 'set_distance', 'magnitude': magnitude },
        dataType: 'text'
    })
    .done( (data) => {
        $("a.distancemag").toggleClass("active", false )
        $(e).toggleClass("active") 
    })
}

function flash( e, color ){
    let opacity = 100;
    var interval = setInterval(()=>{
        opacity -= 5;
        if ( opacity <= 0) clearInterval( interval )
        $(e).css({background: "rgba("+ color +", "+ opacity/100 +")"})
    }, 30)
    $(e).css({opacity:0})
    $(e).animate({opacity: 1}, 700)
}

var rotations = [ 'yaw', 'roll', 'pitch' ]
var standalones = [ 'look-at', 'snap-ground']
function controlClick( action, direction, e ){
    dataSet = {}
    if ( rotations.includes( action ) ) 
    {
        dataSet.action = 'rotate'
        dataSet.axis = action
        dataSet.direction = direction
    } else if ( standalones.includes( action ) )
    {
        dataSet.action = action;
    } else {
        dataSet.action = 'move'
        dataSet.direction = direction
    }
    
    $.ajax({
        type: 'post',
        url: '/ajax',
        data: dataSet,
        dataType: 'json'
    })
    .done( (data) => {
        let color = "20, 255, 20"
        if ( data.err !== undefined ) color = "255, 20, 20"
        flash( $(e), color )
        updateServer( data )
    })
}

function updateServer( data )
{
    console.log( data )
    if ( data.err !== undefined )
    {
        $("#ServerName").html( data.err )
    }
}
