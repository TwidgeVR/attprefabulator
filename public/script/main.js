var selectedPrefabId = null;
var selectedPlayerName = null;
var selectedConfigForm = null;
var currentPlayersList = null;
var currentLoadedPrefabList = null;

$(document).ready(() => {

    function controlClickSetup( element, action, direction )
    {
        var cclickInterval = 100
        var cclickTimeout    
        $("#"+ element).on('mousedown', ( e ) => {
            cclickTimeout = setInterval( ()=>controlClick( action, direction, element ), cclickInterval )
            highlight( $("#"+element), "20, 255, 20" )
        }).on('mouseup mouseleave', ()=>{
            if ( !!cclickTimeout ) {
                flash( $("#"+element), "20, 255, 20" )
                clearTimeout( cclickTimeout )
                cclickTimeout = undefined
            }
        })
    }

    controlClickSetup( 'turnleft', 'yaw', 'ccw' )
    controlClickSetup( 'forward', 'move', 'forward' )
    controlClickSetup( 'turnright', 'yaw', 'cw' )

    controlClickSetup( 'left', 'move', 'left' )
    $("#look-at").click( ( e ) => controlClick( 'look-at', null, "look-at", true ))
    controlClickSetup( 'right', 'move', 'right' )

    controlClickSetup( 'up', 'move', 'up' )
    controlClickSetup( 'back', 'move', 'back' )
    controlClickSetup( 'down', 'move', 'down' )

    controlClickSetup( 'pitchup', 'pitch', 'ccw' )
    controlClickSetup( 'pitchdown', 'pitch', 'cw' )

    controlClickSetup( 'spinccw', 'roll', 'ccw' )
    $("#snap-ground").click( ( e ) => controlClick( 'snap-ground', null, "snap-ground", true ))
    controlClickSetup( 'spincw', 'roll', 'cw' )

    $("#ControlsNav").click( () => {
        $(".topnav").toggleClass("active", false)
        $(".Message").hide()
        $("#ControlsNavLi").toggleClass("active")
        $("#SelectedPrefabHistory").show()
        $("div#Controls").show()
    })

    $("#PrefabsNav").click( () => {
        $(".topnav").toggleClass("active", false)
        $(".Message").hide()
        $("#PrefabsNavLi").toggleClass("active")
        $("#SelectedPrefabHistory").show()
        $("div#Prefabs").show()
    })

    $("#BuilderNav").click( () => {
        $(".topnav").toggleClass("active", false)
        $(".Message").hide()
        $("#BuilderNavLi").toggleClass("active")
        $("#SelectedPrefabHistory").hide()
        $("div#Builder").show()
    })

    $("div#Prefabs #FindPrefabsNav").click( () => {
        $(".prefabsnav").toggleClass("active", false)
        $(".SubMessage").hide()
        $("#FindPrefabsNav").toggleClass("active")
        $("#FindPrefabs").show()
    })

    $("div#Prefabs #SpawnPrefabsNav").click( () => {
        $(".prefabsnav").toggleClass("active", false)
        $(".SubMessage").hide()
        $("#SpawnPrefabsNav").toggleClass("active")
        $("#SpawnPrefabs").show()
    })

    $("div#Builder #SavePrefabsNav").click( () => {
        $(".prefabsnav").toggleClass("active", false)
        $(".SubMessage").hide()
        $("#SavePrefabsNav").toggleClass("active")
        $("#SavePrefabsDialog").show()
    })

    $("div#Builder #LoadPrefabsNav").click( () => {
        $(".prefabsnav").toggleClass("active", false)
        $(".SubMessage").hide()
        $("#LoadPrefabsNav").toggleClass("active")
        $("#LoadPrefabsDialog").show()
    })

    $("#RotateAngle1").click( () => setAngle( 1, "RotateAngle1" ))
    $("#RotateAngle10").click( () => setAngle( 10, "RotateAngle10" ))
    $("#RotateAngle45").click( () => setAngle( 45, "RotateAngle45" ))
    $("#RotateAngle90").click( () => setAngle( 90, "RotateAngle90" ))    

    $("#Distance1cm").click( ( e ) => setDistance( 0.01, "Distance1cm" ))
    $("#Distance10cm").click( ( e ) => setDistance( 0.1, "Distance10cm" ))
    $("#Distance1m").click( ( e ) => setDistance( 1, "Distance1m" ))
    $("#Distance10m").click( ( e ) => setDistance( 10, "Distance10m" ))

    $(".FindablePrefab").click( (e) => {
        $(".FindablePrefab").toggleClass("active", false)
        $(e.target).toggleClass("active")
        $("#SpawnCount").val(1)
    })

    $("#DestroySelectedPrefab").click( ( e ) => deletePrefab( selectedPrefabId, $("#ClosestPrefab b")) )

    $("#SelectFind").click( ( e ) => {
        selectFind( e.currentTarget, $("#SelectFindItems"), $("#FindPrefabs #FindPrefabsScanDiameter").val() )
    })

    $("#SelectFindItems").on( 'click', '.SelectablePrefab', (e) => { 
        selectedPrefabId = e.target.id;
        selectPrefabById( e.currentTarget, e.target.id, e.target.name )
    })

    $("#SearchNearestItems").keyup( (e) => {
        let value = $(e.target).val().trim().toLowerCase()
        let prefabItemsGroup = $(".FindablePrefab")
        if ( value == '' )
        {
            prefabItemsGroup.show()
        } else {
            prefabItemsGroup.each( function() {
                let hasMatch = 
                ( 
                  $(this).attr('id').toLowerCase().indexOf( value ) > -1
                  || $(this).text().toLowerCase().indexOf( value ) > -1
                )
                if ( hasMatch )
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
        let args = $("#SearchSpawnArguments").val()
        let scale = parseFloat($("#SpawnScale").val())
        if ( activeItem !== undefined )
            spawnPrefab( e.currentTarget, activeItem, $("#SpawnCount").val(), args, scale, $("#ClosestPrefab b"))
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

    $("#SpawnScaleMinus").click(( e ) => {
        let scalecount = parseFloat($("#SpawnScale").val()) - 0.25
        console.log( "scale minus new value: "+ scalecount)
        if ( scalecount <= 0 ) scalecount = 0.01
        $("#SpawnScale").val( scalecount )
        flash( e.target, "20, 255, 20")
    })

    $("#SpawnScalePlus").click(( e ) => {
        let scalecount = parseFloat($("#SpawnScale").val()) + 0.25
        console.log( "scale plus new value: "+ scalecount)        
        if ( scalecount > 10.23 ) scalecount = 10.23
        $("#SpawnScale").val( scalecount )
        flash( e.target, "20, 255, 20")
    })

    $("#SpawnCountMinus").click(( e ) => {
        let spawnCount = $("#SpawnCount").val() - 1
        if ( spawnCount < 1) spawnCount = 1
        $("#SpawnCount").val( spawnCount )
        flash( e.target , "20, 255, 20")
    })
    $("#SpawnCountPlus").click(( e ) => {
        let spawnCount = parseInt($("#SpawnCount").val()) + 1
        $("#SpawnCount").val( spawnCount )
        flash( e.target, "20, 255, 20")
    })

    $("#CommandTerminalNav").click(( e ) =>{
        console.log("command_terminal")
        $(".topnav").toggleClass("active", false)
        $(e.currentTarget).toggleClass("active")
        $(".Message").hide()
        $("#SelectedPrefabHistory").hide()
        $("#CommandTerminal").show()
    })

    $("#ConfigurePlayersNav").click(( e ) =>{
        console.log( "get_player_list")
        let optSelected = $("#ConfigurePlayersSelect").find("option:selected")
        let playerIsSelected = ( optSelected.val() != "default" )
        selectedPlayerName = ( playerIsSelected ) ? optSelected.text() : null
        selectedPlayerId = ( playerIsSelected ) ? optSelected.val() : null
        loadPlayersOnline( ( playersList ) => {
            selectedConfigForm = "#ConfigurePlayers"
            currentPlayersList = playersList
            let listGroup = $(selectedConfigForm +" div.TeleportPlayers")

            $(selectedConfigForm + " #TeleportToPlayerButton").show()
            $(selectedConfigForm + " #TeleportToSelectedPlayer").hide()
            $(selectedConfigForm + " a#TeleportToDestination").html("Teleport "+ selectedPlayerName )
            $("#ConfigurePlayersSelect")
            .empty()
            .append( $("<option>", { value: "default" }).text("Choose a player..."))
 
            listGroup.empty()
            if ( currentPlayersList.length <= 0 )
            {
                listGroup.append("<a class='list-group-item' name='default'>No players found</a>")
            }
            for ( let i = 0; i < currentPlayersList.length; i++ )
            {
                let player = currentPlayersList[i]
                let selected = ( selectedPlayerId == player.id )
                $("#ConfigurePlayersSelect").append(
                    new Option( player.username, player.id, false, selected )
                )
                listGroup.append("<a class='list-group-item' name='"+ player.id +"'>"+ player.username +"</a>")
            }
            if ( playerIsSelected )
            {
                loadPlayerConfig( selectedPlayerId, "#ConfigurePlayersDialog" )
            }
            $(".topnav").toggleClass('active', false)
            $("#ConfigurePlayersNav").toggleClass("active")
            $(".Message").hide()
            $("#SelectedPrefabHistory").hide()
            $("#ConfigurePlayers").show()
        })
    })

    $("#ConfigurePlayersSelect").on('change', ( e ) => {
        let optSelected = $(e.target).find("option:selected")
        if ( optSelected.val() == "default" )
        {
            $("#ConfigurePlayersPlayer").html( "Select a player")
            $("#ConfigurePlayersServerName").hide()
            $("#ConfigurePlayersDialog").hide()
            return
        }
        selectedConfigForm = "#ConfigurePlayers"
        selectedPlayerName = optSelected.text()
        selectedPlayerId = optSelected.val()

        let parent = selectedConfigForm
        $(parent +" #ConfigurePlayersPlayer").html( selectedPlayerName )      
        loadPlayerConfig( selectedPlayerId, "#ConfigurePlayersDialog")

        let playerListGroup = selectedConfigForm + " div.TeleportPlayers"
        $(playerListGroup +" a.list-group-item").removeClass("active")
        $(playerListGroup +" a.list-group-item[name="+ selectedPlayerId +"]").addClass("active")
        $(selectedConfigForm + " a#TeleportToDestination").html("Teleport "+ selectedPlayerName )
        $(selectedConfigForm +" span#TeleportPlayersPlayer").html( selectedPlayerName )

        $("#ConfigurePlayersDialog").show()
    })

    $("#PlayerConfigNav").click( ( e ) => {
        selectedConfigForm = "#PlayerConfig"
        selectedPlayerName = $("input#PlayerConfigUsername").val()
        selectedPlayerId = $("input#PlayerConfigUserId").val()

        console.log( "get player config "+ selectedPlayerId +" : "+ selectedPlayerName )

        loadPlayersOnline( ( playersList ) => {
            console.log( playersList )
            currentPlayersList = playersList
            let listGroup = $(selectedConfigForm +" div.TeleportPlayers")
            listGroup.empty()
            if ( currentPlayersList.length <= 0 )
            {
                listGroup.append("<a class='list-group-item' name='default'>No players found</a>")
            }
            for ( let i = 0; i < currentPlayersList.length; i++ )
            {
                let player = currentPlayersList[i]
                listGroup.append("<a class='list-group-item' name='"+ player.id +"'>"+ player.username +"</a>")
            }

            if ( !!selectedPlayerName )
            {
                loadPlayerConfig( selectedPlayerId, "#PlayerConfig")
            }
        })

        $(selectedConfigForm +" #TradeItemsTag").html("Treat Yo' Self!")
        $(selectedConfigForm + " #TeleportToPlayerButton").hide()
        $(selectedConfigForm + " #TeleportToSelectedPlayer").show()

        $(".topnav").toggleClass("active", false)
        $("#PlayerConfigNav").toggleClass("active")
        $(".Message").hide()
        $("#SelectedPrefabHistory").hide()
        $("#PlayerConfig").show()  
    })

    $("a.PlayerNav").click(( e ) => {
        let name = e.currentTarget.id
        let parent = selectedConfigForm
        $(parent +" .PlayerNav").toggleClass("active", false)
        $(e.currentTarget).toggleClass("active")
        $(parent +" .PlayerConfigDialog").hide()
        $(parent +" #"+ name).show()
    })

    $("#ConfigureServerNav").click(( e ) =>{
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
            $("#ConfigureServerNav").toggleClass("active")
            $(".Message").hide()
            $("#SelectedPrefabHistory").hide()
            $("#ServerConfig").show()
        })
    })

    $("#ServerMessagesNav").click(( e ) => {
        console.log( "server messages" )
        selectedConfigForm = "#ServerMessages"
        loadPlayersOnline( ( playersList ) => {
            currentPlayersList = playersList
            let listGroup = $("#ServerMessages #PlayerMsgPlayers")
            listGroup.empty()
            if ( currentPlayersList.length <= 0 )
            {
                listGroup.append("<a class='list-group-item' name='default'>No players found</a>")
            }
            for ( let i = 0; i < currentPlayersList.length; i++ )
            {
                let player = currentPlayersList[i]
                listGroup.append("<a class='list-group-item' name='"+ player.id +"'>"+ player.username +"</a>")
            }
            $(".topnav").toggleClass("active", false)
            $("#ServerMessagesNav").toggleClass("active")
            $(".Message").hide()
            $("#SelectedPrefabHistory").hide()
            $("#ServerMessages").show()
        })
    })

    $("#ServerMessages #PlayersMsgDialog").on( 'click', "a.list-group-item", ( e ) =>{
        let parent = "#ServerMessages #PlayerMsgDialog"
        let targetName = $(e.target).attr('name')
        if ( targetName != 'default')
            $(e.target).toggleClass("active")
    })
        


    $("input.SetPlayerConfig").on('input', (e) =>{
        let parent = selectedConfigForm
        let name = e.currentTarget.name
        let value = $(e.currentTarget).val()
        console.log( "range "+ name +" = "+ value )
        $(parent +" a.SetPlayerConfig[name="+ name +"]").show()
        $(parent +" span[name="+ name +"-value]").html( value )
    })

    $("input.SetServerConfig").on('change', (e) => {
        let parent = "#ServerConfig"
        let name = e.currentTarget.name
        console.log( parent )
        $(parent +" a.SetServerConfig[name="+ name +"]").show()
    })

    $("a.SetPlayerConfig").click( (e) => {
        let parent = selectedConfigForm
        let playerId = selectedPlayerId
        let name = e.currentTarget.name;
        let value = $(parent +" input.SetPlayerConfig[name="+name+"]").val()
        console.log( "setstat "+ playerId +" "+ name +" "+ value )
        $.ajax({
            type: 'post',
            url:'/ajax',
            data: {'action': 'set_player_stat', 'player': playerId, 'name': name, 'value': value },
            dataType: 'json'
        }).done( (data) => {
            console.log( data )
            if ( data.result == 'OK')
            {
                flash( e.currentTarget, "20, 255, 20" )
                $(e.currentTarget).fadeOut()
            } else {
                flash( e.currentTarget, "255, 20, 20" )
            }
        })
    })

    $("a.TogglePlayerConfig").click( ( e ) => {
        let parent = selectedConfigForm
        let player = selectedPlayerName
        let playerId = selectedPlayerId
        let name = e.currentTarget.name
        let toggler = $(parent +" #toggle"+name)
        let value = false
        let dataSet = { 'action': 'set_player_stat', 'name': name, 'player': playerId }
        if ( toggler.hasClass('fa-toggle-off') ) {
            $(toggler).removeClass('fa-toggle-off').addClass("fa-toggle-on")
            value = true
        } else {
            $(toggler).removeClass("fa-toggle-on").addClass("fa-toggle-off")
        }
        if ( name == 'godmode' ) {
            dataSet.action = 'set_player_godmode'
        }
        if ( toggler.hasClass('numeric') )
        {
            value = ( value ) ? 1 : 0;
        }
        dataSet.value = value
        
        $.ajax({
            type: 'post', url: '/ajax', data: dataSet, dataType: 'json'
        })      
        .done( (data) => {
            console.log( data )
            if ( data.result == 'OK' )
            {
                flash( e.currentTarget, "20, 255, 20" )
            } else {
                if ( toggler.hasClass("fa-toggle-on") ){
                    $(toggler).removeClass("fa-toggle-on").addClass("fa-toggle-off")
                }
                flash( e.currentTarget, "255, 20, 20" )
            }
        })
    })

    $("a.ModPlayerConfig").click( ( e ) =>{
        let parent = selectedConfigForm
        let name = e.currentTarget.name
        let operMinus = $(e.currentTarget).hasClass("minus")
        let operPlus = $(e.currentTarget).hasClass("plus")
        let target = $(parent +" input.SetPlayerConfig[name="+ name +"]")
        let value = newVal = parseFloat(target.val())
        let step = parseFloat( target.attr('step') )// || 1
        let min = parseFloat( target.attr('min') ) || 0
        let max = parseFloat( target.attr('max') ) || 10
        if ( operMinus )
        {
            newVal = value - step
            console.log( name + " minus "+ step +" = "+ newVal )
            if ( newVal < min )
                newVal = min                     
        } else if ( operPlus ) {
            newVal = value + step
            console.log( name + " plus "+ step +" = "+ newVal )
            if ( newVal > max )
                newVal = max
        }
        target.val( newVal )
        $(parent +" a.SetPlayerConfig[name="+ name +"]").show()
    })

    $("a.SetServerConfig").click( ( e ) =>{
        let parent = "#ServerConfig"
        let name = e.currentTarget.name;
        console.log( name )
        let value = $(parent +" input.SetServerConfig[name="+ name +"]").val()
        console.log( value )
        $.ajax({
            type: 'post',
            url: '/ajax',
            data: {'action': 'set_server_config', 'name': name, 'value': value },
            dataType: 'json'
        })
        .done((data) =>{
            console.log( data )
            if ( data.result == 'OK' )
            {
                flash( e.currentTarget, "20, 255, 20")
                $(e.currentTarget).fadeOut()
            } else {
                flash( e.currentTarget, "255, 20, 20")
            }
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
                flash( e.currentTarget , "20, 255, 20" )
            else {
                if ( toggler.hasClass("fa-toggle-on") ) {
                    $(toggler).removeClass("fa-toggle-on").addClass("fa-toggle-off")
                }
                flash( e.currentTarget, "255, 20, 20" )
            }
        })
    })

    $("div.TeleportPlayers").on( 'click', "a.list-group-item", ( e ) =>{
        let parent = selectedConfigForm
        let targetName = $(e.target).attr('name')
        if ( targetName != 'default')
            $(e.target).toggleClass("active")

        let parentToActive = parent + " div#PlayerConfigTeleport a.list-group-item.active"
        if ( $(parentToActive).length > 1 )
            $(parent + " #PlayerConfigTeleport #TeleportToPlayer").addClass("disabled")
        else
            $(parent + " #PlayerConfigTeleport #TeleportToPlayer").removeClass("disabled")

        $(parentToActive).each((i, elem) => {
            console.log( $(elem).attr('name') )
        })
    })

    $("div.TradeItemsGroup").on( 'click', "a.list-group-item", ( e ) => {
        let parent = selectedConfigForm
        $(parent + " div.TradeItemsGroup a.list-group-item").toggleClass("active", false)
        $(e.target).toggleClass("active")
    })

    $("#PlayerConfigTeleport a#TeleportToDestination").click(( e ) =>{
        let parent = selectedConfigForm
        let optSelected = $(parent + " select#TeleportDestinations").find('option:selected')
        let players = selectedPlayerId        
        let destination = optSelected.val()

        dataSet = {
            'action':'teleport_players',
            'players': players,
            'destination': destination
        }
        $.ajax({
            type: 'post',
            url: 'ajax',
            data: dataSet,
            dataType: 'json'
        })
        .done( (data) => {
            if ( data.result == 'OK' )
                flash( e.currentTarget, "20, 255, 20")
            else 
                flash( e.currentTarget, "255, 20, 20")
        })
    })

    $("#PlayerConfigTeleport a#TeleportToPlayerButton").click(( e ) => {
        let players = $("input#PlayerConfigUserId").val()
        
        let destination = selectedPlayerId
        if ( !destination )
        {
            flash( e.currentTarget, "255, 20, 20")
            return
        }
        dataSet = {
            'action':'teleport_players',
            'players': players,
            'destination': destination
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
                flash( e.currentTarget, "20, 255, 20")
            } else {
                flash( e.currentTarget, "255, 20, 20")
            }
        })
    })


    $("#PlayerConfigTeleport a#TeleportToSelectedPlayer").click(( e ) => {
        let parent = selectedConfigForm
        let players = $("input#PlayerConfigUserId").val()
        
        let parentToActive = parent + " #PlayerConfigTeleport a.list-group-item.active"
        let destination = $(parentToActive).first().attr('name')
        if ( !destination )
        {
            flash( e.currentTarget, "255, 20, 20")
            return
        }
        dataSet = {
            'action':'teleport_players',
            'players': players,
            'destination': destination
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
                flash( e.currentTarget, "20, 255, 20")
            } else {
                flash( e.currentTarget, "255, 20, 20")
            }
        })
    })

    $("#PlayerConfigTeleport a#TeleportSelectedToMe").click(( e ) => {
        let parent = selectedConfigForm
        let destination = selectedPlayerId

        let parentToActive = parent + " #PlayerConfigTeleport a.list-group-item.active"
        let playersList = []
        $(parentToActive).each((i, elem) => {
            playersList.push( $(elem).attr('name') )
        })
        let players = playersList.join(',')
        if ( !players )
        {
            flash( e.currentTarget, "255, 20, 20" )
            return
        }
        dataSet = {
            'action': 'teleport_players',
            'players': players,
            'destination': destination
        }
        $.ajax({ type: 'post', url: '/ajax', data: dataSet, dataType: 'json' })
            .done( (data) => {
                if ( data.result == 'OK' )
                {
                    flash( e.currentTarget, "20, 255, 20")
                } else {
                    flash( e.currentTarget, "255, 20, 20")
                }
            })

    })

    $("#PlayerConfigTeleport a#TeleportSelectedToDest").click(( e ) => {
        let parent = selectedConfigForm
        let parentToActive = parent + " #PlayerConfigTeleport a.list-group-item.active"
        let playersList = []
        $(parentToActive).each((i, elem) => {
            playersList.push( $(elem).attr('name') )
        })        
        if ( !playersList.length )
        {
            flash( e.currentTarget, "255, 20, 20")
            return
        }
        let optSelected = $(parent + " select#TeleportDestinations").find('option:selected')
        let destination = optSelected.val()
        console.log( destination )
        if ( !destination )
        {
            flash( e.currentTarget, "255, 20, 20")
            return
        }
        for ( let i = 0; i < playersList.length; i++ )
        {
            dataSet = {
                'action':'teleport_players',
                'players': playersList[i],
                'destination': destination
            }
            $.ajax({ type: 'post', url: '/ajax', data: dataSet, dataType: 'json'})
                .done( (data) => {
                    if ( data.result == 'OK' )
                    {
                        flash( e.currentTarget, "20, 255, 20")
                    } else {
                        flash( e.currentTarget, "255, 20, 20")
                    }
                })
        }
    })

    $("#PlayerConfigTrade").on('click', 'list-group-item', (e) => {
        let parent = selectedConfigForm
        $(parent +" TradeItemsGroup").toggleClass("active", false)
        $(e.currentTarget).toggleClass("active")
        $(parent +" #TradeItemsCount").val(1)
    })

    $("#PlayerConfigTradeDialog #TradeItemsSearch").keyup( (e) => {
        let parent = selectedConfigForm
        let value = $(e.target).val().trim().toLowerCase()
        let tradeItemsGroup = $(parent + " div.TradeItemsGroup a.list-group-item")
        tradeItemsGroup.toggleClass("active", false)
        if ( value == '' )
        {
            tradeItemsGroup.show()
        } else {
            tradeItemsGroup.each((i, elem) => {
                let hasMatch = 
                ( 
                  $(elem).attr('id').toLowerCase().indexOf( value ) > -1
                  || $(elem).text().toLowerCase().indexOf( value ) > -1
                )
                if ( hasMatch )
                    $(elem).show()
                else
                    $(elem).hide()  
            })
        }
    })

    $("#PlayerConfigTradeDialog a#TradeItemsPostBtn").click(( e ) => {
        let parent = selectedConfigForm
        let player = selectedPlayerId
        let parentToActive = parent + " div.TradeItemsGroup a.list-group-item.active"
        let selectedItem = $(parentToActive).first().attr('id')
        let count = parseInt( $(parent +" #TradeItemsCount").val() )
        let args = $( parent +" #TradeItemsSpawnArguments").val()
        dataSet = {
            'action': 'post_prefab',
            'player': player,
            'hash': selectedItem,
            'count': count,
            'args': args
        }
        console.log( dataSet )
        $.ajax({ type:'post', url:'/ajax', data: dataSet, dataType: 'json'})
            .done( (data) => {
                if ( data.result == 'OK' )
                {
                    flash( e.currentTarget, "20, 255, 20")
                } else {
                    flash( e.currentTarget, "255, 20, 20")
                }
            })
    })

    $("#PlayerConfigTradeDialog a#TradeItemsSpawnBtn").click(( e ) => {
        let parent = selectedConfigForm
        let player = selectedPlayerId
        let parentToActive = parent + " div.TradeItemsGroup a.list-group-item.active"
        let selectedItem = $(parentToActive).first().attr('id')
        let count = parseInt( $(parent +" #TradeItemsCount").val() )
        let args = $( parent +" #TradeItemsSpawnArguments").val()
        dataSet = {
            'action': 'spawn_prefab',
            'player': player,
            'hash': selectedItem,
            'count': count,
            'args': args
        }
        console.log( dataSet )
        $.ajax({ type:'post', url:'/ajax', data: dataSet, dataType: 'json'})
            .done( (data) => {
                if ( data.result == 'OK' )
                {
                    flash( e.currentTarget, "20, 255, 20")
                } else {
                    flash( e.currentTarget, "255, 20, 20")
                }
            })
    })

    $("a.minusInt").click( (e) => {
        let parent = selectedConfigForm
        let target = "#"+ e.currentTarget.name
        let step = parseInt( $(parent +" "+ target +"_step").val() ) || 1
        let min = parseInt( $(parent +" "+ target +"_min").val() ) || 0
        let val = parseInt( $(parent +" "+ target).val() )
        let newVal = val - step
        if ( newVal < min )
            newVal = min

        $(parent +" "+ target).val( newVal )
    })

    $("a.plusInt").click( (e) => {
        let parent = selectedConfigForm
        let target = "#"+ e.currentTarget.name
        let step = parseInt( $(parent +" "+ target +"_step").val() ) || 1
        let max = parseInt( $(parent +" "+ target +"_max").val() ) || null
        let val = parseInt( $(parent +" "+ target).val() )
        let newVal = val + step
        if ( !!max && newVal > max )
            newVal = max

        $(parent +" "+ target).val( newVal )
    })

    $("#ServerMessages a#ServerMsgSendBtn").click(( e ) => {
        let parent = "#ServerMessages"
        let message = $(parent +" #ServerMsgMessage").val()
        let duration = parseInt( $(parent + " #ServerMsgDuration").html() )
        if ( message.trim() == '' )
        {
            flash( e.currentTarget, "255, 20, 20")
            return
        }
        dataSet = {
            'action': 'send_message',
            'message': message,
            'duration': duration,
            'players': "*"
        }
        console.log( dataSet )
        $.ajax({ type: 'post', url: '/ajax', data: dataSet, dataType: 'json' })
            .done( (data) => {
                console.log( data )
                if ( data.result == 'OK' )
                {
                    flash( e.currentTarget, "20, 255, 20" )
                } else {
                    flash( e.currentTarget, "255, 20, 20")
                }
            })
    })

    $("#ServerMessages a#PlayerMsgSendBtn").click(( e ) => {
        let parent = "#ServerMessages"
        let message = $(parent +" #PlayerMsgMessage").val()
        let duration = parseInt( $(parent + " #PlayerMsgDuration").html() )

        let parentToActive = parent + " #PlayerMsgPlayers a.list-group-item.active"      
        let playersList = []
        $(parentToActive).each((i, elem) => {
            playersList.push( $(elem).attr('name') )
        })
        let players = playersList.join(',')
        if ( !players || message.trim() == '' )
        {
            flash( e.currentTarget, "255, 20, 20") 
            return
        }
        dataSet = { 
            'action': 'send_message',
            'message': message,
            'duration': duration,
            'players': players
        }
        console.log( dataSet )
        $.ajax({ type: 'post', url: '/ajax', data: dataSet, dataType: 'json' })
            .done( (data) => {
                console.log( data )
                if ( data.result == 'OK' )
                {
                    flash( e.currentTarget, "20, 255, 20" )
                } else {
                    flash( e.currentTarget, "255, 20, 20")
                }
            })
    })

    $("a#PlayerAdminKill").click(( e ) => {
        let player = selectedPlayerId
        dataSet = {
            'action': 'player_kill',
            'player': player
        }
        $.ajax({ type: 'post', url: '/ajax', data: dataSet, dataType: 'json' })
            .done( (data) => {
                console.log( data )
                if ( data.result == 'OK' )
                {
                    flash( e.currentTarget, "20, 255, 20" )
                } else {
                    flash( e.currentTarget, "255, 20, 20")
                }
            })
    })

    $("a#PlayerAdminKick").click(( e ) => {
        let player = selectedPlayerId
        dataSet = {
            'action': 'player_kick',
            'player': player
        }
        $.ajax({ type: 'post', url: '/ajax', data: dataSet, dataType: 'json' })
            .done( (data) => {
                console.log( data )
                if ( data.result == 'OK' )
                {
                    flash( e.currentTarget, "20, 255, 20" )
                } else {
                    flash( e.currentTarget, "255, 20, 20")
                }
            })
    })

    $("#SelectedPrefabSelect").on('change', ( e ) => {
        let optSelected = $(e.target).find("option:selected")
        let prefabId = optSelected.val()
        if ( !!prefabId )
        {
            dataSet = {
                'action': 'select_prefab',
                'prefabId': prefabId
            }
            $.ajax({ type:'post', url:'/ajax', data: dataSet, dataType:'json'})
                .done( (data) => {
                    if ( data.result == 'OK' )
                    {
                        selectedPrefabId = prefabId
                        console.log( "select prefab from history "+ selectedPrefabId )

                        flash( e.target, "20, 255, 20" )
                    } else {
                        flash( e.target, "255, 20, 20" )
                    }
                })
        }
    })

    $("#FindPrefabs #SelectFindSearch").keyup( (e) => {
        let parent = "#FindPrefabs"
        let value = $(e.target).val().trim().toLowerCase()
        let itemsGroup = $(parent + " div#SelectFindItems button.list-group-item")
        itemsGroup.toggleClass("active", false)
        if ( value == '' )
        {
            itemsGroup.show()
        } else {
            itemsGroup.each((i, elem) => {
                let hasMatch = 
                ( 
                  $(elem).attr('id').toLowerCase().indexOf( value ) > -1
                  || $(elem).text().toLowerCase().indexOf( value ) > -1
                )
                if ( hasMatch )
                    $(elem).show()
                else
                    $(elem).hide()  
            })
        }
    })

    $("#ServerSelect #ServerSearch").keyup( (e) => {
        let parent = "#ServerSelect"
        let value = $(e.target).val().trim().toLowerCase()
        let itemsGroup = $(parent + " #SelectServerList .list-group-item")
        itemsGroup.toggleClass("active", false)
        if ( value == '' )
        {
            itemsGroup.show()
        } else {
            itemsGroup.each((i, elem) => {
                let hasMatch = 
                ( 
                  $(elem).attr('id').toLowerCase().indexOf( value ) > -1
                  || $(elem).text().toLowerCase().indexOf( value ) > -1
                )
                if ( hasMatch )
                    $(elem).show()
                else
                    $(elem).hide()  
            })
        }
    })

    $("a#SelectServerSort").click(( e ) => {
        let parent = "#ServerSelect"
        let itemtype = $(e.target).data('itemtype')
        let serversList = parent + " #SelectServerList"
        let serversListItems = $(serversList + " .list-group-item")
        let sortDirection = $(serversList).data('sortdirection')
        let sortPlayerIcon = $(parent + " #SortPlayerIcon")
        let sortServerIcon = $(parent + " #SortServerIcon")
        if ( sortDirection == "asc" ) {
            sortDirection = "desc"
            sortIcon = "fa-sort-up"
        } else {
            sortDirection = "asc"
            sortIcon = "fa-sort-down"
        }
        $(serversList).data('sortdirection',sortDirection )
        function sort_servers( a, b ) {
            switch( sortDirection ) {
                default:
                case "asc":
                    return ( $(b).attr('name').toLowerCase() < $(a).attr('name').toLowerCase() ) ? 1 : -1
                break;
                case "desc":
                    return ( $(b).attr('name').toLowerCase() >= $(a).attr('name').toLowerCase() ) ? 1 : -1
                break;
            }
        }
        function sort_players( a, b ) {
            if ( sortDirection == "asc" )
                return ( $(b).data('playercount') < $(a).data('playercount') ) ? 1 : -1
            else {
                return ( $(b).data('playercount') >= $(a).data('playercount') ) ? 1 : -1
            }
        }
        sortPlayerIcon.removeClass('fa-sort').removeClass('fa-sort-up').removeClass('fa-sort-down')
        sortServerIcon.removeClass('fa-sort').removeClass('fa-sort-up').removeClass('fa-sort-down')

        switch( itemtype ) {
            case "servers":
                console.log( "sort servers" )                
                serversListItems.sort( sort_servers ).appendTo( serversList )
                sortServerIcon.toggleClass('fa-sort-up', ( sortIcon == 'fa-sort-up' ))
                sortServerIcon.toggleClass('fa-sort-down', ( sortIcon == 'fa-sort-down' ))
                sortPlayerIcon.addClass('fa-sort')
            break
            case "players":
                console.log( "sort players" )
                serversListItems.sort( sort_players ).appendTo( serversList )
                sortPlayerIcon.toggleClass('fa-sort-up', ( sortIcon == 'fa-sort-up' ))
                sortPlayerIcon.toggleClass('fa-sort-down', ( sortIcon == 'fa-sort-down' ))
                sortServerIcon.addClass('fa-sort')
            break
        }

        
    })

    $("div#Builder #BuilderScanNearbyPrefabs").click( ( e ) => {
        let diameter = $("div#Builder #SavePrefabListScanDiameter").val()
        console.log( diameter )
        scanNearbyPrefabs( e.currentTarget, $("div#Builder #ScanNearbyPrefabsItems"), diameter )
    })
    
    $("div#Builder #SavePrefabListToFile").click( ( e ) => {
        $(e.target).toggleClass("disabled", true)
        let buttonLabel = $(e.target).html()
        addSpinner( e )
        let itemList = []
        let exactCoords = $("div#Builder #SavePrefabListExactPositions").is(":checked")
        $("div#Builder #ScanNearbyPrefabsItems .ScannedPrefab").each( (ind, item) => {
            console.log( ind )
            console.log( item )
            console.log( "send this list of items to the server to gather coords then return a JSON file download with the contents")
            itemList.push( { 'id': $(item).attr('id'), 'name': $(item).attr('name') } )
        })
        $.ajax({
            type:'post',
            url:'/save_prefabs',
            data: JSON.stringify( { 'exact': exactCoords, 'items' : itemList } ),
            contentType: "application/json",
            dataType: 'json'
        })
        .done( (data) => {
            if ( data.result == 'OK' )
            {
                flash( e.target, "20, 255, 20" )
                // Prompt to download the file
                window.location = 'download_prefab?filename='+ data.filename
            } else {
                flash( e.target, "255, 20, 20" )
            }
            delSpinner( e , buttonLabel )
            $(e.target).toggleClass("disabled", false)
        })
    })

    $("div#Builder #SpawnBuilderTokenItem").click( ( e ) => {
        //spawnPrefab( e.currentTarget, "KeyStandard", 1 )    
        spawnString( e.currentTarget, "builderkey" )
    })

    $("div#Builder #LoadPrefabListFromFile").click( ( e ) => {
        $("div#Builder #LoadPrefabListFromFileInput").click()
    })

    $("div#Builder #LoadPrefabListFromFileInput").change( ( e ) => {
        $("div#Builder #LoadPrefabListDetails").hide()
        $("div#Builder #LoadPrefabListFromFileForm").submit()
    })

    $("div#Builder #LoadPrefabListFromFileForm").on( 'submit', ( e ) => {
        e.preventDefault()
        let form_data = new FormData( $("#LoadPrefabListFromFileForm")[0] )
        $("div#Builder #LoadPrefabListExactCoords").hide()
        console.log( form_data )
        $.ajax({
            type:'POST',
            url:'/load_prefabs_input',
            data: form_data,
            contentType: false,
            processData: false
        })
        .done( (data) => {
            console.log( "ajax file upload success" )
            console.log( data )
            let header = data.data.header
            let prefablist = data.data.prefabs
            let listGroup = $("div#Builder #LoadPrefabListItems")
            listGroup.empty()
            function nfilter(x) { return Number.parseFloat(x).toFixed(3) }
            for( let i = 0; i < prefablist.length; i++ )
            {
                let pos = {
                    x : nfilter( prefablist[i].Position.x ),
                    y : nfilter( prefablist[i].Position.y ),
                    z : nfilter( prefablist[i].Position.z )
                }
                let rot = {
                    x : nfilter( prefablist[i].Rotation.x ),
                    y : nfilter( prefablist[i].Rotation.y ),
                    z : nfilter( prefablist[i].Rotation.z ),
                }
                listGroup.append(`<div class='PrefabListItem row w-100'>
                <span class='col'>${prefablist[i].Name}</span>
                <span class='col'>[${pos.x}, ${pos.y}, ${pos.z}]</span>
                <span class='col'>(${rot.x}, ${rot.y}, ${rot.z})</span>
                </div>`)
            }
            currentLoadedPrefabList = data.md5
            $("div#Builder #LoadPrefabListAuthor").html(header.player)
            $("div#Builder #LoadPrefabListFilename").html(data.filename)
            if ( header.exact ) $("div#Builder #LoadPrefabListExactCoords").show()
            $("div#Builder #LoadPrefabListDetails").show()
            console.log( currentLoadedPrefabList )
        })
    })



    $("div#Builder #LoadPrefabListSpawnItems").click( ( e ) => {
        $(e.target).toggleClass('disabled', true)
        let buttonLabel = $(e.target).html()
        addSpinner( e )
        console.log( currentLoadedPrefabList )
        let moffset_x = Number($("div#Builder #LoadPrefabsOffsetX").val()).toFixed(6)
        let moffset_y = Number($("div#Builder #LoadPrefabsOffsetY").val()).toFixed(6)
        let moffset_z = Number($("div#Builder #LoadPrefabsOffsetZ").val()).toFixed(6)
        console.log( moffset_x )
        console.log( moffset_y )
        console.log( moffset_z )
        dataSet = {
            'md5sum' : currentLoadedPrefabList,
            'moffset_x' : moffset_x,
            'moffset_y' : moffset_y,
            'moffset_z' : moffset_z
        }
        $.ajax({
            type: 'post',
            url: '/load_prefabs',
            data: dataSet,
            dataType: 'json'
        })
        .done( (data) => {
            if ( data.result == 'OK' )
            {
                flash( e.currentTarget, "20, 255, 20" )
            }
            delSpinner( e, buttonLabel )
            $(e.target).toggleClass('disabled', false)
        })
    })

    $("div#Builder #ScanNearbyPrefabsItems").on('click', 'a.trash_prefab', ( e ) => {
        $(e.currentTarget).parent().remove()
    })
})

function addSpinner( e )
{
    $(e.target).html('<i class="fa fa-spinner fa-spin" />')
}

function delSpinner( e, ihtml )
{
    $(e.target).html(ihtml)
}

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
        if ( typeof(selectDisplay) !== undefined )
        {
            $("#SelectedPrefabSelect option:selected").remove()
            let newSelected = $("#SelectedPrefabSelect option:first").val()
            $("#SelectedPrefabSelect").val( newSelected ).trigger('change')
        }
    })
}

function selectPrefabById( elem, id, name ) {
    console.log( "selecting prefab : "+ id +" "+ name )
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
            $("#SelectedPrefabSelect option[value="+ selectedPrefabId +"]").remove()
            $("#SelectedPrefabSelect").append(
                new Option( id +" - "+ name, id, false, true )
            )
            $('#DestroySelectedPrefab').show()
        } else {
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
                if ( !!data.data.Result )
                {
                    let [prefabId, dash, prefabName] = data.data.Result.Name.split(' ')
                    selectedPrefabId = parseInt( prefabId, 10 )
                }

                $("#SelectedPrefabSelect option[value="+ selectedPrefabId +"]").remove()               
                $("#SelectedPrefabSelect").append(
                    new Option( data.data.Result.Name, selectedPrefabId, false, true )
                )
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

function spawnString( e, prefabString ) {
    let player = $("input#PlayerConfigUserId").val()
    console.log("spawning string for player: "+ player)
    $.ajax({
        type:'post',
        url:'/ajax',
        data: { 'action': 'spawn_string', 'player': player, 'prefabString': prefabString },
        dataType: 'json'
    })
    .done( (data) => {
        if ( data.result == 'OK' )
        {
            console.log( data )
            console.log( data.data.Result )
            flash( e, "20, 255, 20" )
            if ( !!data.data.Result )
            {
                selectedPrefabId = data.data.Result[0].Identifier
                $("#SelectedPrefabSelect option[value="+ selectedPrefabId +"]").remove()
                let pname = selectedPrefabId +" - "+ data.data.Result[0].Name
                $("#SelectedPrefabSelect").append(
                    new Option( pname, selectedPrefabId, false, true )
                )
                $('#DestroySelectedPrefab').show()
            }
        } else {
            $( e ).css('pointer-events', 'auto')
            let color = "255, 20, 20"
            flash( e, color )
        }
    })
}

function spawnPrefab( e, id, count, args, scale, selectDisplay ) {
    let player = $("input#PlayerConfigUserId").val()
    $.ajax({
        type:'post',
        url:'/ajax',
        data: {'action': 'spawn_prefab', 'player': player, 'hash': id, 'count': count, 'args': args },
        dataType: 'json'
    })
    .done( (data) => {
        if ( data.result == 'OK' )
        {
            console.log( data )
            console.log( data.data.Result )
            console.log( scale )
            if ( !!data.data.Result && scale != 1 )
            {
                // Run a set of commands to replace the object with the scaled version
                console.log( "gathering string" )
                selectedPrefabId = data.data.Result[0].Identifier
                // Get the string version
                $.ajax({
                    type: 'post',
                    url: '/ajax',
                    data: {'action': 'select_tostring'}
                }).done( data => {
                    // Scale the string
                    if ( !!data.data.ResultString )
                    {
                        console.log( "spawn string with scale" )
                        var newString = rescaleString( data.data.ResultString, scale )
                    }
                    // Delete the original
                    $.ajax({
                        type: 'post',
                        url: '/ajax',
                        data: { 'action': 'destroy_prefab', 'selectedPrefabId': selectedPrefabId },
                        dataType: 'json',
                    }).done( data => {
                        console.log( data )
                        // Spawn the scaled version
                        spawnString( e, newString )
                    })
                })
            } else {
                flash( e, "20, 255, 20" )
                if ( !!data.data.Result )
                {
                    selectedPrefabId = data.data.Result[0].Identifier
                    $("#SelectedPrefabSelect option[value="+ selectedPrefabId +"]").remove()
                    let pname = selectedPrefabId +" - "+ data.data.Result[0].Name
                    $("#SelectedPrefabSelect").append(
                        new Option( pname, selectedPrefabId, false, true )
                    )
                    $('#DestroySelectedPrefab').show()
                }
            }
        } else {
            $( e ).css('pointer-events', 'auto')
            let color = "255, 20, 20"
            flash( e, color )
            updateServer( data )
        }
    })
}

function rescaleString( prefabString, scale ) {
    let parts = prefabString.split('|')
    let words = parts[0].split(',')
    var view = new DataView( new ArrayBuffer(4) )
    if ( scale > 10.23 ) scale = 10.23;
    if ( scale <= 0 ) scale = 0.01;
    view.setFloat32(0, scale)
    words[10] = view.getUint32(0)
    parts[0] = words.join(',')
    return parts.join('|')
}

function scanNearbyPrefabs( elem, dest, diameter ) {
    let dataSet = {'action': 'select_find'}
    if ( diameter !== undefined )
    {
        dataSet.diameter = diameter
    } else {
        dataSet.diameter = 10
    }
    $.ajax({
        type:'post',
        url:'/ajax',
        data: dataSet,
        dataType: 'json'
    })
    .done( (data) => {
        if ( data.result == 'OK' )
        {
            if ( data.data.Result !== undefined )
            {
                $('.ScannedPrefab').remove()
                let itemList = data.data.Result
                itemList.sort( function(a, b) { return ( a.Name.toUpperCase() > b.Name.toUpperCase() ) ? 1 : -1 } )
                console.log( "iterating data.data.Result ")
                console.log( itemList )
                let placed = 0;
                for( var i = 0; i < itemList.length; i++ ){
                    let item = itemList[i]
                    let matches = item.Name.match(/^([a-zA-Z0-9_\-\ ]+)\(Clone\)/)
                    console.log( matches )
                    let name = (!!matches && !!matches[1])? matches[1] : "Unknown"
                    let nName = name.replace(/[ \(\)-]/g, "_")
                    if ( ! builder_saveable_hashes.find( r => r.Name == nName ) ) continue;
                    if ( item.Name.includes("VR Player") ) continue;
                    if ( item.Name.includes("Key Standard") ) continue;
                    placed++;
                    let evenodd = ( placed % 2 == 0 ) ? 'even' : 'odd'
                    $(dest).append("<div class='ScannedPrefab row w-100 "+ evenodd+"' id='"+ item.Identifier +"' name='"+ item.Name +"'><span class='col mr-auto'>"+ item.Name +"</span><a class='col-1 ml-auto trash_prefab' id='"+ item.Identifier +"'><i class='fas fa-window-close'/></a></div>")
                }
            }
        }
        $("#SavePrefabListToFileButton").show()
        updateServer(data)
    })    
}


function selectFind( elem, dest, diameter ) {
    let dataSet = {'action': 'select_find'}
    if ( diameter !== undefined )
    {
        dataSet.diameter = diameter
    } else {
        dataSet.diameter = 10
    }
    $.ajax({
        type:'post',
        url:'/ajax',
        data: dataSet,
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

function setAngle( angle, element ){
    wsAddHandler( 'set_angle', (message) => {
        $("a.rotateangle").toggleClass("active", false )
        $('#'+message.data.element).toggleClass("active") 
    })

    wsSendJSON({
        'action': 'set_angle',
        'angle': angle,
        'element' : element
    })
}

function setDistance( magnitude, element ){
    wsAddHandler( 'set_distance', (message) => {
        $("a.distancemag").toggleClass("active", false )
        $('#'+message.data.element).toggleClass("active") 
    })

    wsSendJSON({
        'action': 'set_distance',
        'magnitude': magnitude,
        'element': element
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
function highlight( elem, color ){
    $(elem).css({background: "rgba("+color+")"})
}
function unhighlight( elem, color ){
    flash( elem, color )
}

var rotations = [ 'yaw', 'roll', 'pitch' ]
var standalones = [ 'look-at', 'snap-ground']

function controlClick( action, direction, elem, flash_on_click ){
    buttonHandler = ( message ) => {
        console.log( "handler: ", message )
        if ( message.result == 'OK' )
        {
            if ( flash_on_click ) {
                "flask OK: "+ message.data.element
                flash( $("#"+message.data.element ), "20, 255, 20")
            }
        } else {
            flash( $("#"+message.data.element ), "255, 20, 20")
        }
    }
    wsAddHandler( 'rotate', buttonHandler )
    wsAddHandler( 'move', buttonHandler )
    wsAddHandler( 'look-at', buttonHandler )
    wsAddHandler( 'snap-ground', buttonHandler )
    dataSet = {}
    console.log( "control click "+ selectedPrefabId +" "+ action +" "+ direction +" "+ elem )
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
    dataSet.element = elem
    wsSendJSON( dataSet )
}

function updateServer( data )
{
    console.log( data )
    if ( data.err !== undefined )
    {
        $("#ServerName").html( data.err )
    }
}

async function loadPlayerConfig( userId, parentElem )
{
    const statInputByName = {
        'health': 'Health Stat',
        'maxhealth': 'MaxHealth Stat',
        'speed': 'Speed Stat',
        'damage': 'Damage Stat',
        'poison': 'Poison Stat',
        'hunger': 'Hunger Stat',
        'fullness': 'Fullness Stat',
        'damageprotection': 'Damage Protection Stat',
        'recentlydamagedstat': 'Recently Damaged Stat',
        'cripple': 'Cripple Health Stat',
        'xpboost': 'ExperienceBoost',
        'nightmare': 'Nightmare'
    }

    $.ajax({
        type: 'post',
        url: '/ajax',
        data: { 'action': 'get_player_config', 'player' : userId },
        dataType: 'json'
    })
    .done( (data) => {
        if ( !!data.data.Result )
        {
            let conf = data.data.Result
            console.log( conf )

            $(parentElem +" input.SetPlayerConfig").each( (i, elem) => {
                let name = elem.name
                let config = conf.find(obj => { return obj.Name === name })
                console.log(elem)
                console.log(config)
                if ( config !== undefined )
                {
                    $(elem).attr('min', config.Min)
                    $(elem).attr('max', config.Max)
                    $(elem).val( Number(config.Value).toFixed(3) )
                    $(elem).attr('step', '1' )

                    switch( name )
                    {
                        case 'health':
                            $(elem).attr('step', '0.5')
                            $(elem).attr('min', '0.1')
                            $(elem).attr('max', conf.find( x=>{ return x.Name == "maxhealth" }).Max )
                        break

                        case 'maxhealth':
                        case 'speed':
                        case 'xpboost':
                            $(elem).attr('step', '0.5')
                        break

                        case 'fullness':
                            $(elem).attr('step', '1')
                            $(elem).attr('min', '0')
                            $(elem).attr('max', '5')
                        break

                        case 'hunger':
                        case 'cripplehealth':
                        case 'nightmare':
                            $(elem).attr('step', '0.1')
                        break
                    }
                } else {
                    console.log( "config for "+ name +" is undefined")
                }
            })
        }
        return (!!data.data.Result)
    })
}

function loadPlayersOnline( callBack )
{
    console.log( "loadPlayersOnline" )
    $.ajax({
        type: 'post',
        url: '/ajax',
        data: { 'action': 'get_player_list' },
        dataType: 'json'
    })
    .done( (data) => {
        if ( data.result == 'OK' && !!data.data.Result )
        {
            console.log( data )
            return callBack( data.data.Result );
        } else {
            console.log( "Error retrieving player list" )
            return null
        }
    })
}
