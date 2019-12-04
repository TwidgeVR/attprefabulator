var selectedPrefabId = null;
var selectedPlayerName = null;
var selectedConfigForm = null;
var currentPlayersList = null;
var currentLoadedPrefabList = null;

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
        if ( activeItem !== undefined )
            spawnPrefab( e.currentTarget, activeItem, $("#SpawnCount").val(), args, $("#ClosestPrefab b"))
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
                let selected = ( selectedPlayerName == player.username )
                $("#ConfigurePlayersSelect").append(
                    new Option( player.username, player.id, false, selected )
                )
                listGroup.append("<a class='list-group-item' name='"+ player.id +"'>"+ player.username +"</a>")
            }
            if ( playerIsSelected )
            {
                loadPlayerConfig( selectedPlayerName, "#ConfigurePlayersDialog" )
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
        loadPlayerConfig( selectedPlayerName, "#ConfigurePlayersDialog")

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
                loadPlayerConfig( selectedPlayerName, "#PlayerConfig")
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
        let value = newVal = parseInt(target.val())
        let step = parseInt( target.attr('step') ) || 1
        let min = parseInt( target.attr('min') ) || 0
        let max = parseInt( target.attr('max') ) || 10
        if ( operMinus )
        {
            newVal = value - step
            console.log( name + " minus = "+ newVal )
            if ( newVal < min )
                newVal = min                     
        } else if ( operPlus ) {
            newVal = value + step
            console.log( name + " plus = "+ newVal )
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

    $("#SelectFindDialog #SelectFindSearch").keyup( (e) => {
        let parent = "#SelectFindDialog"
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

    $("div#Builder #BuilderScanNearbyPrefabs").click( ( e ) => {
        let diameter = $("div#Builder #SavePrefabListScanDiameter").val()
        console.log( diameter )
        scanNearbyPrefabs( e.currentTarget, $("div#Builder #ScanNearbyPrefabsItems"), diameter )
    })
    
    $("div#Builder #SavePrefabListToFile").click( ( e ) => {
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
        })
    })

    $("div#Builder #SpawnBuilderTokenItem").click( ( e ) => {
        spawnPrefab( e.currentTarget, "KeyStandard", 1 )    
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
            function nfilter(x) { return Number.parseFloat(x).toFixed(2) }
            for( let i = 0; i < prefablist.length; i++ )
            {
                listGroup.append("<div class='PrefabListItem row w-100'><span class='col'>"+ prefablist[i].Name +"</span></div>")
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
        })
    })

    $("div#Builder #ScanNearbyPrefabsItems").on('click', 'a.trash_prefab', ( e ) => {
        $(e.currentTarget).parent().remove()
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
        $("#SelectedPrefabSelect option:selected").remove()
        let newSelected = $("#SelectedPrefabSelect option:first").val()
        $("#SelectedPrefabSelect").val( newSelected ).trigger('change')
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

function spawnPrefab( e, id, count, args, selectDisplay ) {
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
            updateServer( data )
        }
    })
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
                for( var i = 0; i < itemList.length; i++ ){
                    let item = itemList[i]
                    if ( item.Name.includes("VR Player") ) continue;
                    if ( item.Name.includes("Key Standard") ) continue;
                    
                    $(dest).append("<div class='ScannedPrefab row w-100' id='"+ item.Identifier +"' name='"+ item.Name +"'><span class='col mr-auto'>"+ item.Name +"</span><a class='col-1 ml-auto trash_prefab' id='"+ item.Identifier +"'><i class='fas fa-window-close'/></a></div>")
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

async function loadPlayerConfig( userId, parentElem )
{
    const statInputByName = {
        'health': 'Health Stat',
        'maxhealth': 'MaxHealth Stat',
        'speed': 'Speed Stat',
        'damage': 'Damage Stat',
        'poison': 'Poison Stat',
        'hunger': 'Hunger Stat',
        'damageprotection': 'Damage Protection Stat',
        'recentlydamagedstat': 'RecentlyDamageStat',
        'luminosity': 'Luminosity',
        'cripple': 'Cripple Health Stat',
        'crippleprotection': 'Cripple Damage Protection Stat',
        'xpboost': 'ExperienceBoost' 
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
                let config = conf.find(obj => { return obj.Name === statInputByName[ name ] })
                console.log(elem)
                console.log(config)
                $(elem).attr('min', config.Min)
                $(elem).attr('max', config.Max)
                $(elem).val( Number(config.Value).toFixed(3) )
                $(elem).attr('step', '1' )

                if ( name == 'health' )
                {
                    $(elem).attr('min', '0.1')
                    $(elem).attr('max', conf.find(x=>{return x.Name === statInputByName['maxhealth']}).Max )
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
