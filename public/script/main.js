$(document).ready(() => {
    var selectedPrefabId = null;
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
        $(".Message").hide()
        $("#ControlsNavLi").toggleClass("active")
        $("div#Controls").show()
    })

    $("#SelectNav").click( () => {
        $(".topnav").toggleClass("active", false)
        $(".Message").hide()
        $("#SelectNavLi").toggleClass("active")
        $("div#Select").show()
    })

    $("#SearchNav").click( () => {
        $(".topnav").toggleClass("active", false)
        $(".Message").hide()
        $("#SearchNavLi").toggleClass("active")
        $("div#Search").show()
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
        $("#SpawnCount").val(1)
    })

    $("#DestroySelectedPrefab").click( ( e ) => deletePrefab( selectedPrefabId, $("#ClosestPrefab b")) )

    $("#SelectFind").click( ( e ) => selectFind( e.currentTarget, $("#SelectFindItems") ) )

    $("#SelectFindItems").on( 'click', '.SelectablePrefab', (e) => { 
        selectedPrefabId = e.target.id;
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
            spawnPrefab( e.currentTarget, activeItem, $("#SpawnCount").val(), $("#ClosestPrefab b"))
        else
            flash( e.currentTarget, "255, 20, 20")
    })

    $(".ServerListItem").click( (e) => {
        let self = $(e.target);
        if ( $(self).hasClass('ServerListItemName') ) self = $(self).parent()
        if ( $(self).hasClass('ServerListItemOnlineCount') ) self = $(self).parent()
        $("#selectedServer").val( $(self).attr('id') )
        $('.ServerListItem').toggleClass('active', false )
        $(self).toggleClass('active')
    })

    $("#SpawnCountMinus").click(( e ) => {
        let spawnCount = $("#SpawnCount").val() - 1
        if ( spawnCount < 1) spawnCount = 1
        $("#SpawnCount").val( spawnCount )
        flash( e.target , "20 255 20")
    })
    $("#SpawnCountPlus").click(( e ) => {
        let spawnCount = parseInt($("#SpawnCount").val()) + 1
        $("#SpawnCount").val( spawnCount )
        flash( e.target, "20 255 20")
    })

    $("#ConfigureServer").click(( e ) =>{
        console.log( "get_server_config")
        $.ajax({
            type: 'post',
            url: '/ajax',
            data: { 'action':'get_server_config' },
            dataType: 'json'
        })
        .done((data) => {
            console.log( data )
            if ( !!data.data.Result )
            {
                let conf = data.data.Result

                $("input.SetServerConfig").each( ( i, elem ) => {
                    console.log( elem )
                    let name = elem.name
                    console.log( "set "+ name +" to "+ conf[name] )
                    $(elem).val( conf[name] )
                })

                $("a.ToggleServerConfig").each( ( i, elem ) => {
                    console.log( elem )                    
                    let name = elem.name
                    console.log( "set "+ name +" to "+ conf[name] )
                    if ( conf[name] )
                        $("#toggle"+ name)
                            .removeClass("fa-toggle-off")
                            .addClass("fa-toggle-on")
                })
            }

            $(".topnav").toggleClass("active", false)
            $("#ConfigureServer").toggleClass("active")
            $(".Message").hide()
            $("#ServerConfig").show()
        })
    })

    $("a.ToggleServerConfig").click( ( e ) => {
        console.log( e.currentTarget )
        let name = e.currentTarget.name
        let toggler = $("#toggle"+ name)
        console.log( toggler )
        console.log( "toggle "+ name )
        let value = false;
        if ( toggler.hasClass('fa-toggle-off') ){
            $(toggler).removeClass("fa-toggle-off").addClass("fa-toggle-on")
            value = true
        } else {
            $(toggler).removeClass("fa-toggle-on").addClass("fa-toggle-off")
        }
        $.ajax({
            type: 'post',
            url: '/ajax',
            data: {'action': 'set_server_config', 'name': name, 'value': value },
            dataType: 'json'
        })
        .done((data) => {
            console.log( data )
            if ( data.result == 'OK' )
                flash( $(e) , "20, 255, 20" )
            else 
                flash( $(e), "255, 20, 20" )
        })
    })

    $("a.SetServerConfig").click( ( e ) =>{
        let name = e.currentTarget.name;
        console.log( name )
        let value = $("input[name="+ name +"]").val()
        console.log( value )
        $.ajax({
            type: 'post',
            url: '/ajax',
            data: {'action': 'set_server_config', 'name': name, 'value': value },
            dataType: 'json'
        })
        .done((data) =>{
            console.log( data )
        })

    })
})

function deletePrefab( id, selectDisplay ) {
    dataSet = { 'selectedPrefabId': id }
    dataSet.action = 'destroy_prefab'
    $.ajax({
        type: 'post',
        url: '/ajax',
        data: dataSet,
        dataType: 'json'
    })
    .done( (data) => {
        selectedPrefabId = null;
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
            selectedPrefabId = id
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
                if ( !!data.data.ResultString )
                {
                    let prefabIds = data.data.ResultString.split(' ')
                    selectedPrefabId = parseInt( prefabIds[0], 10 )
                }
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

function spawnPrefab( e, id, count, selectDisplay ) {
    $.ajax({
        type:'post',
        url:'/ajax',
        data: {'action': 'spawn_prefab', 'hash': id, 'count': count },
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
                if ( !!data.data.ResultString )
                {
                    let prefabIds = data.data.ResultString.split(' ')
                    selectedPrefabId = parseInt( prefabIds[0], 10 )
                }
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
    if (!!selectedPrefabId)
        dataSet = { 'selectedPrefabId': selectedPrefabId }

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
