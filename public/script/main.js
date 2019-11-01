$(document).ready(() => {

    $("#turnleft").click( ( e ) => controlClick( 'yaw', 'ccw', e.currentTarget ))
    $("#up").click( ( e ) => controlClick( 'move', 'up', e.currentTarget ))
    $("#turnright").click( ( e ) => controlClick( 'yaw', 'cw', e.currentTarget ))

    $("#left").click( ( e ) => controlClick( 'move', 'left', e.currentTarget ))
    $("#look-at").click( ( e ) => controlClick( 'look-at', null, e.currentTarget ))
    $("#right").click( ( e ) => controlClick( 'move', 'right', e.currentTarget ))

    $("#pitchup").click( ( e ) => controlClick( 'pitch', 'ccw', e.currentTarget ))
    $("#down").click( ( e ) => controlClick( 'move', 'down', e.currentTarget ))
    $("#pitchdown").click( ( e ) => controlClick( 'pitch', 'cw', e.currentTarget ))

    $("#forward").click( ( e ) => controlClick( 'move', 'forward', e.currentTarget ))
    $("#back").click( ( e ) => controlClick( 'move', 'back', e.currentTarget ))

    $("#spinccw").click( ( e ) => controlClick( 'roll', 'ccw', e.currentTarget ))
    $("#snap-ground").click( ( e ) => controlClick( 'snap-ground', null, e.currentTarget ))
    $("#spincw").click( ( e ) => controlClick( 'roll', 'cw', e.currentTarget ))

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

    $("#Distance1cm").click( ( e ) => setDistance( 0.01, $("#Distance1cm") ))
    $("#Distance10cm").click( ( e ) => setDistance( 0.1, $("#Distance10cm") ))
    $("#Distance1m").click( ( e ) => setDistance( 1, $("#Distance1m") ))
    $("#Distance10m").click( ( e ) => setDistance( 10, $("#Distance10m") ))

    $(".FindablePrefab").click( (e) => {
        $(".FindablePrefab").toggleClass("active", false)
        $(e.target).toggleClass("active")
    })

    $("#DestroySelectedPrefab").click( ( e ) => deletePrefab( e.currentTarget, $("#ClosestPrefab b")) )

    $("#SelectFind").click( ( e ) => selectFind( e.currentTarget, $("#SelectFindItems") ) )

    $("#SelectFindItems").on( 'click', '.SelectablePrefab', (e) => { 
        selectPrefabById( e.currentTarget, e.target.id, e.target.name, $("#ClosestPrefab b") )
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

    $("#SearchFindNearest").click( ( e ) => {
        let activeItem = $("#SelectNearestItems").find("button.active").attr('id')
        if ( activeItem !== undefined )
            findNearestPrefabById( e.currentTarget, activeItem, $("#ClosestPrefab b"))
        else
            flash( $("#SearchFindNearest"), "255, 20, 20")
    })

    $("#SearchSpawnItem").click( ( e ) => {
        let activeItem = $("#SelectNearestItems").find("button.active").attr('id')
        if ( activeItem !== undefined )
            spawnPrefab( e.currentTarget, activeItem, $("#ClosestPrefab b"))
        else
            flash( e.currentTarget, "255, 20, 20")
    })
})

function deletePrefab( e, selectDisplay ) {
    $.ajax({
        type: 'post',
        url: '/ajax',
        data: {'action': 'destroy_prefab'},
        dataType: 'json'
    })
    .done( (data) => {
        $(selectDisplay).html("None selected")
        $('#DestroySelectedPrefab').hide()
    })
}

function selectPrefabById( elem, id, name, selectDisplay ) {
    $.ajax({
        type:'post',
        url:'/ajax',
        data: {'action': 'select_prefab', 'prefabId': id, 'prefabName': name  },
        dataType: 'json'
    })
    .done( (data) => {
        if ( data.result == 'OK')
        {
            $(selectDisplay).html( id +" - "+ name )
            $('#DestroySelectedPrefab').show()
        } else {
            $(selectDisplay).html( "None selected" )
            $('#DestroySelectedPrefab').hide()
        }

    })
}

function findNearestPrefabById( e, id, selectDisplay ) {
    $.ajax({
        type:'post',
        url:'/ajax',
        data: {'action': 'select_nearest', 'hash': id },
        dataType: 'json'
    })
    .done( (data) => {
        console.log( data )
        if ( data.result == 'OK' )
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
                $(selectDisplay).html( data.data.ResultString )
                $('#DestroySelectedPrefab').show()
            })
        } else {
            $( e ).css('pointer-events', 'auto')
            let color = "255, 20, 20"
            flash( $("#SearchFindNearest"), color )
            updateServer( data )
        }
    })
}

function spawnPrefab( e, id, selectDisplay ) {
    $.ajax({
        type:'post',
        url:'/ajax',
        data: {'action': 'spawn_prefab', 'hash': id },
        dataType: 'json'
    })
    .done( (data) => {
        if ( data.result == 'OK' )
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
                $(selectDisplay).html( data.data.ResultString )
                $('#DestroySelectedPrefab').show()
            })
        } else {
            $( e ).css('pointer-events', 'auto')
            let color = "255, 20, 20"
            flash( $("#SearchSpawnItem"), color )
            updateServer( data )
        }
    })
}


function selectFind( elem, dest ) {
    $.ajax({
        type:'post',
        url:'/ajax',
        data: {'action': 'select_find'},
        dataType: 'json'
    })
    .done( (data) => {
        if ( data.result == 'OK' )
        {
            if ( data.data.Result !== undefined )
            {
                $('.SelectablePrefab').remove()
                let itemList = data.data.Result
                for( var i = 0; i < itemList.length; i++ ){
                    let item = itemList[i]
                    $(dest).append("<button class='SelectablePrefab list-group-item list-group-item-action' id='"+ item.Identifier +"' name='"+ item.Name +"'> "+ item.Identifier +" - "+ item.Name +"</button>")
                }
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

function flash( elem, color ){
    let opacity = 100;
    var interval = setInterval(()=>{
        opacity -= 5;
        if ( opacity <= 0) clearInterval( interval )
        $(elem).css({background: "rgba("+ color +", "+ opacity/100 +")"})
    }, 30)
    $(elem).css({opacity:0})
    $(elem).animate({opacity: 1}, 700)
}

var rotations = [ 'yaw', 'roll', 'pitch' ]
var standalones = [ 'look-at', 'snap-ground']

function controlClick( action, direction, elem ){
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
        if ( data.result == 'OK' )
        {
            flash( $( elem ), "20, 255, 20")
        } else {
            flash( $( elem ), "255, 20, 20")
        }
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
