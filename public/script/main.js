var selectedPrefabId = null;
var selectedPlayerName = null;
var selectedConfigForm = null;
var currentPlayersList = null;
var currentLoadedPrefabList = null;
var prefabGroups = {};
var nextPrefabGroupId = 1;
var ControlKeyInterval = 100

$(document).ready(() => {
    $("i").each( ( ind, img ) => {
        let title = $(img).attr('title')
        if ( title )
        {
            $(img).attr('alt', title )
        }
    })

    wsSendJSON({'action':'reset_prefab_groups'})

    function controlClickSetup( element, action, direction )
    {
        var cclickInterval = ControlKeyInterval
        var cclickTimeout
        let startEvents = ( e ) => {
            cclickTimeout = setInterval( ()=>controlClick( action, direction, element ), cclickInterval )
            highlight( $("#"+element), "20, 255, 20" )
        }
        let endEvents = ( e ) => {
            if ( !!cclickTimeout ) {
                flash( $("#"+element), "20, 255, 20" )
                clearTimeout( cclickTimeout )
                cclickTimeout = undefined
            }
        }

        $("#"+ element).on('touchstart', (e) => {
            startEvents(e)
            e.preventDefault()
        }).on('touchend touchcancel', (e) => {
            endEvents(e)
            e.preventDefault()
        })

        $("#"+ element).on('mousedown', ( e ) => {
            startEvents( e )
        }).on('mouseup mouseleave', ()=>{
            endEvents( e )
        })
    }

    controlClickSetup( 'turnleft', 'yaw', 'ccw' )
    controlClickSetup( 'forward', 'move', 'forward' )
    controlClickSetup( 'turnright', 'yaw', 'cw' )

    controlClickSetup( 'left', 'move', 'left' )
    $("#look-at").click( ( e ) => controlClick( 'look-at', null, "look-at" ) )
    controlClickSetup( 'right', 'move', 'right' )

    controlClickSetup( 'up', 'move', 'up' )
    controlClickSetup( 'back', 'move', 'back' )
    controlClickSetup( 'down', 'move', 'down' )

    controlClickSetup( 'pitchup', 'pitch', 'ccw' )
    controlClickSetup( 'pitchdown', 'pitch', 'cw' )

    controlClickSetup( 'spinccw', 'roll', 'ccw' )
    $("#snap-ground").click( ( e ) => controlClick( 'snap-ground', null, "snap-ground" ) )
    controlClickSetup( 'spincw', 'roll', 'cw' )

    var controlBinds = {}
    function setControlBinds( key, element, action, direction )
    {
        controlBinds[key] = { element: element, action: action, direction: direction }
    }
    var menuBinds = {}
    function setMenuBinds( key, element, callback )
    {
        menuBinds[key] = { element: element, callback: callback }
    }

    setMenuBinds( 'g', 'SelectedPrefabSelect', ( element ) => {
        $(`#${element} option:selected`).removeAttr('selected')
            .next('option').attr('selected', 'selected')
        $(`#${element}`).trigger('change')
    })

    setMenuBinds( 't', 'SelectedPrefabSelect', ( element ) => {
        console.log( "index:", $(`#${element} option:selected`).index())
        let firstSelected = ( $(`#${element} option:selected`).index() == 0 )
        if ( firstSelected )
        {
            $(`#${element} option:selected`).removeAttr('selected')
            $(`#${element} option`).last().attr('selected', 'selected')
        } else {
            $(`#${element} option:selected`).removeAttr('selected')
                .prev('option').attr('selected', 'selected')
        }
        $(`#${element}`).trigger('change')
    })

    setMenuBinds( '1', 'MagnitudeRotate', ( e ) => {
        let elemGroup = $(`a.rotateangle`)
        let activeElem = $(`a.rotateangle.active`)
        activeElem.removeClass('active')
        if( activeElem.next().length )
        {
            activeElem.next().trigger('click')
        } else {
            elemGroup.first().trigger('click')
        }
    })
    setMenuBinds( '2', 'MagnitudeDistance', ( e ) => {
        let elemGroup = $(`a.distancemag`)
        let activeElem = $(`a.distancemag.active`)
        activeElem.removeClass('active')
        if( activeElem.next().length )
        {
            activeElem.next().trigger('click')
        } else {
            elemGroup.first().trigger('click')
        }
    })



    setControlBinds( 'ArrowUp', 'forward', 'move', 'forward' )
    setControlBinds( 'ArrowDown', 'back', 'move', 'back' )
    setControlBinds( 'ArrowLeft', 'left', 'move', 'left' )
    setControlBinds( 'ArrowRight', 'right', 'move', 'right' )
    setControlBinds( 'PageUp', 'up', 'move', 'up' )
    setControlBinds( 'PageDown','down', 'move', 'down' )
    setControlBinds( 'shift_ArrowUp', 'pitchdown', 'pitch', 'cw' )
    setControlBinds( 'shift_ArrowDown', 'pitchup', 'pitch', 'ccw' )
    setControlBinds( 'shift_ArrowLeft', 'turnleft', 'yaw', 'ccw' )
    setControlBinds( 'shift_ArrowRight','turnright', 'yaw', 'cw' )
    setControlBinds( 'shift_PageUp', 'spinccw', 'roll', 'ccw' )
    setControlBinds( 'shift_PageDown','spincw', 'roll', 'cw' )
    
    // Aliases
    controlBinds['w'] = controlBinds['ArrowUp']
    controlBinds['s'] = controlBinds['ArrowDown']
    controlBinds['a'] = controlBinds['ArrowLeft']
    controlBinds['d'] = controlBinds['ArrowRight']
    controlBinds['q'] = controlBinds['shift_ArrowLeft']
    controlBinds['e'] = controlBinds['shift_ArrowRight']
    controlBinds['r'] = controlBinds['PageUp']
    controlBinds['f'] = controlBinds['PageDown']
    controlBinds['z'] = controlBinds['shift_ArrowUp']
    controlBinds['x'] = controlBinds['shift_ArrowDown']
    controlBinds['c'] = controlBinds['shift_PageUp']
    controlBinds['v'] = controlBinds['shift_PageDown']

    var controlKeydown = undefined
    var controlKeyTimeout = undefined
    $(document).on('keydown', (e) => {
        console.log( $(document.activeElement) )
        let keyPress = e.key
        if ( e.shiftKey ) keyPress = `shift_${keyPress}`
        console.log( "keyPress: ", keyPress )

        if ( $("#ControlsNavLi").hasClass('active') )
        {
            if ( !!menuBinds[ keyPress ] )
            {
                menuBinds[keyPress].callback( menuBinds[keyPress].element )
            }
            else if ( !controlKeydown || controlKeydown != keyPress )
            {
                if ( !!controlKeyTimeout )
                {
                    clearTimeout( controlKeyTimeout )
                    controlKeyTimeout = undefined
                }
                if ( !!controlBinds[ keyPress ] )
                {
                    b = controlBinds[ keyPress ]
                    highlight( $(`#${b.element}`), "20, 255, 20" )
                    controlKeydown = keyPress
                    controlKeyTimeout = setInterval( ()=>{ controlClick( b.action, b.direction, b.element )}, ControlKeyInterval )
                }
            }
        }

    }).on('keyup', (e) => {
        console.log( `keyup: `, e.key )
        let keyPress = e.key
        if ( e.shiftKey ) keyPress = `shift_${keyPress}`
        if( !!controlKeyTimeout )
        {
            clearTimeout( controlKeyTimeout )
            controlKeyTimeout = undefined
        }
        if ( !!controlBinds[ keyPress ])
        {
            flash( $(`#${controlBinds[ keyPress ].element}`), "20, 255, 20" )
        }
        controlKeydown = undefined
    })

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

    $("div#Prefabs #GroupPrefabsNav").click( () => {
        $(".prefabsnav").toggleClass("active", false)
        $(".SubMessage").hide()
        $("#GroupPrefabsNav").toggleClass("active")
        $("#GroupPrefabs").show()
        if ( Object.keys(prefabGroups).length == 0 )
        {
            updateGroupPrefabList( "GroupPrefabsItemList" )
        }
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

    $("#DestroySelectedPrefab").click( ( e ) => {
        let optSelected = $("#SelectedPrefabSelect option:selected").val()
        console.log( optSelected )
        if ( optSelected !== 'None' )
        {
            deletePrefab( optSelected )
        }
    })

    $("#SelectFind").click( ( e ) => {
        selectFind( e.currentTarget, $("#SelectFindItems"), $("#FindPrefabs #FindPrefabsScanDiameter").val() )
    })

    $("#SelectFindItems").on( 'click', '.SelectablePrefabAnchor', (e) => {
        selectedPrefabId = e.target.id;
        selectPrefabById( e.currentTarget, e.target.id, e.target.name )
    })

    $("#SelectablePrefabsAll").change( (e) => {
        console.log( "SelectablePrefabsAll changed")
        let checked = ( $(e.currentTarget).prop('checked') )
        $(".SelectablePrefabCheckbox").filter(":visible").each( (i, item) => {
            $(item).prop('checked', checked )
        })
    })

    $("#SelectFindToGroup").click( (e) => {
        let selectedItems = []
        $(".SelectablePrefabCheckbox:checked").each( (i, item) => {
            selectedItems.push({ Identifier: $(item).val(), Name: $(item).attr('name') })
        })
        let groupName = $("#SelectFindToGroupName").val()
        let group = { id: nextPrefabGroupId++, name: groupName, items: selectedItems }
        prefabGroups[ group.id ] = group
        updateGroupPrefabList( "GroupPrefabsItemList", selectedItems )
        updateGroupPrefabsSelect( "GroupPrefabsSelectGroup", group.id )
        selectPrefabGroup( group.id, true )
        $('#GroupPrefabsNewGroup').val('')
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
        wsSendJSON({'action':"subscribe"})
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

    $("#HandCameraNav").click( ( e ) => {
        $(".topnav").toggleClass("active", false)
        $("#HandCameraNav").toggleClass("active")
        $(".Message").hide()
        $("#HandCameraConfig").show()
    })

    wsAddHandler('hand_camera_toggle', (message) => {
        console.log( 'hand_camera_toggle', message )
        if ( !!message.message )
        {
            $("#HandCameraMessages").text( message.message )
        } else {
            $("#HandCameraMessages").text('')
        }

        if ( message.result == 'OK' )
        {
            flash( ".HandCameraToggle", "20, 255,20")
        } else {
            $("div#HandCameraOff").hide()
            $("div#HandCameraOn").show()
            flash( ".HandCameraToggle", "255, 20, 20")
        }
    })

    $("#HandCameraOn").click( (e) => {
        wsSendJSON({ action: 'hand_camera_toggle', state: true })
        $("div#HandCameraOn").hide()
        $("div#HandCameraOff").show()
    })
    $("#HandCameraOff").click( (e) => {
        wsSendJSON({ action: 'hand_camera_toggle', state: false })
        $("div#HandCameraOff").hide()
        $("div#HandCameraOn").show()
    })

    $("#HandCameraOrbitAngle").roundSlider({
        radius: 150,
        width: 15,
        min: 0, max: 360, step: 1,
        startAngle: 90,
        svgMode: true,
        borderWidth: 1, borderColor: "#c5c5c5",
        handleSize: "15, 65",
        showTooltip: false,
        start: (e) => {
            console.log( "start drag: ", e )
        },
        drag: (e) => {
            $("#HandCameraOrbitAngleValue").html( e.value )
            wsSendJSON({ action: "hand_camera_pose", attribute: "orbitAngle", value: e.value })
        }
    })

    $("#HandCameraHeight").slider({
        orientation: "vertical",
        min: 0,
        max: 6,
        value: 1.5,
        step: 0.125,
        slide: (e, ui) => {
            console.log( "cam height change: ", ui.value )
            $("#HandCameraHeightValue").html( ui.value )
            wsSendJSON({ action: "hand_camera_pose", attribute: "height", value: ui.value })
        }
    })

    $("#HandCameraDistance").slider({
        min: 0.5,
        max: 6,
        value: 3,
        step: 0.125,
        slide: ( e, ui ) => {
            console.log( "cam distance change: ", ui.value )
            $("#HandCameraDistanceValue").html( ui.value )
            wsSendJSON({ action: "hand_camera_pose", attribute: "radius", value: ui.value })
        }
    })

    $("#HandCameraOrbitLock").click( (e) =>{
        let toggle = $("#HandCameraOrbitLockToggle")
        let value = false
        if ( toggle.hasClass('fa-toggle-off'))
        {
            toggle.removeClass('fa-toggle-off').addClass('fa-toggle-on')
            value = true
        } else {
            toggle.removeClass('fa-toggle-on').addClass('fa-toggle-off')
            value = false
        }
        wsSendJSON({ action: "hand_camera_pose", attribute: "orbitLock", value: value })
    })

    $("#HandCameraRadiusLock").click( (e) =>{
        let toggle = $("#HandCameraRadiusLockToggle")
        let value = false
        if ( toggle.hasClass('fa-toggle-off'))
        {
            toggle.removeClass('fa-toggle-off').addClass('fa-toggle-on')
            value = true
        } else {
            toggle.removeClass('fa-toggle-on').addClass('fa-toggle-off')
            value = false
        }
        wsSendJSON({ action: "hand_camera_pose", attribute: "radiusLock", value: value })
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

    $("#PlayerConfigTeleport select#PlayerHomeSelect").on('change', (e) => {
        let parent = selectedConfigForm
        let optSelected = $(e.target).find("option:selected").val()
        console.log( optSelected )
        if ( optSelected == "Exact" )
        {
            $(parent + " #PlayerHomeExact").show()
        } else {
            $(parent + " #PlayerHomeExact").hide()
        }
    })

    $("#PlayerConfigTeleport a#PlayerSetHomeButton").click( (e) => {
        let parent = selectedConfigForm
        let optSelected = $(parent + " select#PlayerHomeSelect").find("option:selected")
        let position = {
            x: $(parent +" #PlayerHomeX").val(),
            y: $(parent +" #PlayerHomeY").val(),
            z: $(parent +" #PlayerHomeZ").val()
        }
        let player = selectedPlayerId
        let destination = optSelected.val()
        let data = {
            'position' : position,
            'player' : player,
            'destination' : destination
        }
        console.log( "player_set_home: ", data )
        wsSendJSON({ 'action': 'player_set_home', data: data })
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
            if ( `${prefabId}` == 'None' )
            {
                selectedPrefabId = undefined

            } else if ( `${prefabId}`.includes('group') )
            {
                selectedPrefabId = prefabId
                groupId = prefabId.split( '_' )[1]
                selectPrefabGroup( groupId )
            } else {
                console.log( "Select changed to: ", optSelected, prefabId )
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
                            optSelected.remove()
                            let newSelected = $("#SelectedPrefabSelect option:last").val()
                            $("#SelectedPrefabSelect").val( newSelected ).trigger('change')
                        }
                    })
            }
        }
    })

    $("#FindPrefabs #SelectFindSearch").keyup( (e) => {
        let parent = "#FindPrefabs"
        let value = $(e.target).val().trim().toLowerCase()
        let itemsGroup = $(parent + " div#SelectFindItems div.list-group-item")
        if ( value == '' )
        {
            itemsGroup.show()
        } else {
            itemsGroup.each((i, elem) => {
                let hasMatch = 
                ( 
                  $(elem).find('a').attr('id').toLowerCase().indexOf( value ) > -1
                  || $(elem).find('a').text().toLowerCase().indexOf( value ) > -1
                )
                if ( hasMatch )
                    $(elem).show()
                else
                    $(elem).hide()  
            })
            itemsGroup.find('input:checkbox').each( (e, item) => {
                if ( $(item).prop("checked") )
                {
                    $(item).parent().show()
                }
            })
        }
        $("#SelectablePrefabsAll").prop('checked', false )
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
        $("div#Builder #ScanNearbyPrefabsItems .ScannedPrefab").each( (ind, item) => {
            itemList.push( { 'id': $(item).attr('id'), 'name': $(item).attr('name'), 'hash': $(item).data('hash') } )
        })
        $.ajax({
            type:'post',
            url:'/save_prefabs',
            data: JSON.stringify( { 'items' : itemList } ),
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

    $("#SpawnBuilderExactPositions").on('change', ( e ) => {
        if ( $(e.currentTarget).is(":checked") )
        {
            $("div#LoadPrefabBuildersKey").hide()
        } else {
            $("div#LoadPrefabBuildersKey").show()
        }
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
                <div class='col-5' style='font-size:0.8em'>${prefablist[i].Name}</div>
                <div class='col' style='font-size:0.7em'>
                Pos [${pos.x}, ${pos.y}, ${pos.z}]<br>
                Rot (${rot.x}, ${rot.y}, ${rot.z})
                </div>
                </div>`)
            }
            currentLoadedPrefabList = data.md5
            currentLoadedPrefabListName = data.filename
            $("div#Builder #LoadPrefabListAuthor").html(header.player)
            $("div#Builder #LoadPrefabListFilename").html(data.filename)
            if ( !header.exact ) {
                $("#SpawnBuilderExactPositions").prop('checked', false)
                $("#LoadPrefabBuildersKey").show()
                $("div#Builder #LoadPrefabListExactCoords").show()
            }
            
            $("div#Builder #LoadPrefabListDetails").show()
            console.log( currentLoadedPrefabList )
        })
    })

    $("div#Builder #LoadPrefabListSpawnItems").click( ( e ) => {
        $(e.target).toggleClass('disabled', true)
        let buttonLabel = $(e.target).html()
        addSpinner( e )
        let exactCoords = $("div#Builder #SpawnBuilderExactPositions").is(":checked")
        console.log( currentLoadedPrefabList )
        let moffset_x = Number($("div#Builder #LoadPrefabsOffsetX").val()).toFixed(6)
        let moffset_y = Number($("div#Builder #LoadPrefabsOffsetY").val()).toFixed(6)
        let moffset_z = Number($("div#Builder #LoadPrefabsOffsetZ").val()).toFixed(6)
        console.log( moffset_x )
        console.log( moffset_y )
        console.log( moffset_z )
        dataSet = {
            'md5sum' : currentLoadedPrefabList,
            'useExactCoords' : exactCoords,
            'moffset_x' : moffset_x,
            'moffset_y' : moffset_y,
            'moffset_z' : moffset_z,
            'filename' : currentLoadedPrefabListName
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

    $("#ConnectToServer").click( (e) => {
        addSpinner( e )
    })

    $("#LoginButton").click( (e) => {
        addSpinner( e )
    })

    var ctInput = $("#CommandTerminalInput")
    var ctHistory = {
        currentKey : 0,
        history : [],
        put : ( val ) => {
            ctHistory.history.push( val )
            ctHistory.currentKey = ctHistory.history.length
        },
        getPrev : () => {
            ctHistory.currentKey--
            if ( ctHistory.currentKey < 0 ) 
                ctHistory.currentKey = 0
            if ( !!ctHistory.history[ctHistory.currentKey] )
            {
                return ctHistory.history[ctHistory.currentKey]
            } else {
                return undefined
            }
        },
        getNext : () => {
            ctHistory.currentKey++
            if ( !!ctHistory.history[ctHistory.currentKey])
            {
                return ctHistory.history[ctHistory.currentKey]
            } else {
                return undefined
            }
        }
    }

    // Console Interface
    $("#CommandTerminalSubmit").click( (e) => {
        let command = $("#CommandTerminalInput").val()
        if ( !!command ) 
        {
            ctHistory.put( command )
            ctInput.val("")
            // Send the command
            wsSendJSON({ 
                'action': 'send_command',
                'command': command
            })
        }
    })

    $("#CommandTerminalInput").on("keydown", ( e ) => {
        console.log( "CommandTerminalInput: keyDown event: ", e)
        console.log( ctHistory.currentKey, ctHistory.history )
        switch( e.key )
        {
            case "Enter":
                console.log("Enter was pressed within CommandTerminalInput")
                $("#CommandTerminalSubmit").click()
            break;

            case "Up":
            case "ArrowUp":
                console.log( "ArrowUp" )
                let prevVal = ctHistory.getPrev()
                if ( !!prevVal )
                    ctInput.val( prevVal )
            break;

            case "Down":
            case "ArrowDown":
                let nextVal = ctHistory.getNext()
                if ( !!nextVal )
                {
                    ctInput.val(nextVal)
                } else {
                    ctInput.val('')
                }
            break;
        }
    })

    $("#CTSubsDropdown .dropdown-item").on('click', ( e ) => {
        let subscriptionName = $(e.currentTarget).attr('name')
        console.log("Dropdown event: ", subscriptionName)
        if ( $(e.currentTarget).hasClass("active") )
        {
            $(e.currentTarget).removeClass('active')
            wsSendJSON({'action':'unsubscribe', 'subscription': subscriptionName })
        } else {
            $(e.currentTarget).addClass('active')
            wsSendJSON({'action':'subscribe', 'subscription': subscriptionName })
        }
    })

    $(`#GroupPrefabsItemList`).on('click', `.GroupPrefabsItemListItem`, (e) => {
        $(e.target).toggleClass('active')
    })

    $('#GroupPrefabsCreateGroupBtn').on('click', (e) => {
        let groupName = $('#GroupPrefabsNewGroup').val()
        let selectedItemList = []
        $('#GroupPrefabsItemList .active').each( (i, elem) => {
            selectedItemList.push( { Identifier: $(elem).prop('id'), Name: $(elem).text() } )
        })
        let group = { id: nextPrefabGroupId++, name: groupName, items: selectedItemList }
        prefabGroups[ group.id ] = group
        updateGroupPrefabList( "GroupPrefabsItemList", selectedItemList )
        updateGroupPrefabsSelect( "GroupPrefabsSelectGroup", group.id )
        selectPrefabGroup( group.id, true )
        $('#GroupPrefabsNewGroup').val('')
    })

    $('#GroupPrefabsSelectGroup').on('change', ( e ) => {
        let optSelected = $(e.target).find("option:selected").val()
        console.log( "select change, selected option is: ", optSelected )
        if ( optSelected == 'selectedPrefabs' )
        {
            updateGroupPrefabList( "GroupPrefabsItemList" )
        } else {
            let group = prefabGroups[ optSelected ]
            updateGroupPrefabList( "GroupPrefabsItemList", group.items )
        }
    })

    $("#CopySelectedPrefab").on('click', (e) => {
        // TODO: this has to support groups
        let optSelected = $("#SelectedPrefabSelect").find("option:selected").val()
        if ( optSelected !== 'None' )
        {
            let player = $("input#PlayerConfigUserId").val()
            console.log( "copy selected prefab: ", optSelected )
            wsSendJSON({ 'action': 'clone_prefab', 'player': player, 'hash': optSelected })
            spinnerReplace( "CopySelectedPrefab" )
        }
    })

    // Add some default websockets handlers
    var CommandTerminalLogParity = true
    var ctLog = $("#CommandTerminalLog")
    wsAddHandler( 'Subscription', ( message ) => {
        console.log( message )
        let parity = ( CommandTerminalLogParity ) ? "even" : "odd"
        CommandTerminalLogParity = !CommandTerminalLogParity
        let timestamp = (new Date(message.timeStamp)).toLocaleTimeString('en-US')
        let logMessage = `[${timestamp}] ${message.eventType} | `
        switch( message.eventType )
        {
            case "InfoLog":
                logMessage += message.data.message
            break
            case "PlayerJoined":
                logMessage += "Player joined: "+ message.data.user.username
            break
            case "PlayerLeft":
                logMessage += "Player left: "+ message.data.user.username
            break;
            case "PlayerStateChanged":
                let enterexit = ( message.data.isEnter ) ? "entered" : "left"
                logMessage += `${message.data.user.username} ${enterexit} state ${message.data.state}`
            break;
            default:
                if ( !!message.data )
                    logMessage += '<pre>'+ JSON.stringify( message.data, null, 4 ) +'</pre>'
            break;
        }
        // Check scroll position
        console.log( ctLog[0].scrollHeight, ctLog[0].scrollTop, ctLog[0].clientHeight )
        let scrolled = ctLog[0].scrollHeight - ctLog[0].scrollTop === ctLog[0].clientHeight
        console.log( "scrolled? ", scrolled )
        ctLog.append(
            `<div class='list-group-item ${parity}'><p>${logMessage}</p></div>`
        )
        if ( scrolled )
        {
            ctLog.stop().animate({
                scrollTop: ctLog[0].scrollHeight
            }, 800 )
        }
    })

    wsAddHandler( 'CommandResult', ( message ) => {
        console.log( message )
        let parity = ( CommandTerminalLogParity ) ? "even" : "odd"
        CommandTerminalLogParity = !CommandTerminalLogParity
        let timestamp = (new Date(message.timeStamp)).toLocaleTimeString('en-US')
        let resultClass = ''

        let logMessage = `[${timestamp}] ${message.type} | `
        if ( !!message.data.Exception )
        {
            resultClass = 'fail'
            logMessage += message.data.Exception.Message
        } else {
            resultClass = 'ok'
            let command = message.data.Command.FullName

            logMessage += `${command}: `
            switch( command )
            {
                case "help.":
                case "select.tostring":
                    logMessage += `<pre>${message.data.ResultString}</pre>`
                break;

                default:
                    if ( !!message.data.Result)
                    {
                        logMessage += "<pre>"+ JSON.stringify( message.data.Result, null, 4 ) +"</pre>"
                    } else {
                        logMessage += message.data.ResultString
                    }
                break;
            }
        }
        ctLog.append(
            `<div class='list-group-item ${parity} ${resultClass}'><p>${logMessage}</p></div>`
        )
        ctLog.stop().animate({
            scrollTop: ctLog[0].scrollHeight - ctLog[0].clientHeight
        }, 800 )
    })

    wsAddHandler('load_prefabs', ( message ) => {
        console.log( "load_prefabs: ", message )
        let groupName = 'loaded prefabs group'
        if ( !!message.data.filename )
        {
            groupName = message.data.filename.replace(/\.[^/.]+$/, '')
        }
        let selectedItemList = []
        //Occasionally the list will contain undefined members, filter them
        for( let i = 0; i < message.data.items.length; i++ )
        {
            if ( message.data.items[i] !== null )
            {
                selectedItemList[i] = message.data.items[i]
            }
        }
        let group = { id: nextPrefabGroupId++, name: groupName, items: selectedItemList }
        prefabGroups[ group.id ] = group
        updateGroupPrefabList( "GroupPrefabsItemList", selectedItemList )
        updateGroupPrefabsSelect( "GroupPrefabsSelectGroup", group.id )
        selectPrefabGroup( group.id, true )
    })

    wsAddHandler('clone_prefab', ( message ) => {
        // Add the item to teh selection history
        console.log( message )
        if ( message.result == 'OK' )
        {
            if ( !!message.group )
            {
                let clonedGroupId = message.data.hash.split('_')[1]
                let groupName = `Group ${clonedGroupId} Clone`
                let group = { id: nextPrefabGroupId++, name: groupName, items: message.group }
                prefabGroups[ group.id ] = group
                updateGroupPrefabList( "GroupPrefabsItemList", group.items )
                updateGroupPrefabsSelect( "GroupPrefabsSelectGroup", group.id )
                selectPrefabGroup( group.id, true )

            } else if( !!message.prefab ) {
                let hash = message.prefab.Identifier
                let name = message.prefab.Name
                selectPrefabById( "SelectedPrefabSelect", hash, name )
            }
        }
        spinnerRevert( "CopySelectedPrefab" )
    })

    wsAddHandler('select_prefab_group', ( message ) => {
        console.log( message )
        let color = ( message.result == 'OK' ) ? "20, 255, 20" : "255, 20, 20"
        flash( $("#SelectedPrefabSelect"), color )
    })

    wsAddHandler('player_set_home', ( message ) => {
        let parent = selectedConfigForm
        console.log( message )
        let color = ( message.result == 'OK' ) ? "20, 255, 20" : "255, 20, 20"
        flash( $(parent +" #PlayerSetHomeButton"), color )
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

let sprActive = false
let sprCurrentHtml = ''
function spinnerReplace( elem )
{
    if ( !sprActive )
    {
        sprCurrentHtml = $("#"+elem).html()
        $("#"+elem).html( '<i class="fa fa-spinner fa-spin" />')
        $("#"+elem).addClass('disabled')
        sprActive = true
    }
}

function spinnerRevert( elem )
{
    $("#"+elem).html( sprCurrentHtml )
    $("#"+elem).removeClass('disabled')
    sprActive = false
}

function deletePrefab( id ) {
    console.log( "delete prefab: ", id )
    wsAddHandler('delete_prefab_group', ( message ) => {
        if ( message.result == 'OK' )
        {
            $("#SelectedPrefabSelect option:selected").remove()
            let newSelected = $("#SelectedPrefabSelect option:last").val()
            $("#SelectedPrefabSelect").val( newSelected ).trigger('change')
        }
    })
    if ( `${id}`.includes('group') )
    {
        let groupId = `${id}`.split('_')[1]
        wsSendJSON( { action: 'delete_prefab_group', id: groupId, group: prefabGroups[groupId] } )
    } else {
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
            let newSelected = $("#SelectedPrefabSelect option:last").val()
            $("#SelectedPrefabSelect").val( newSelected ).trigger('change')
        })
    }
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

function selectPrefabGroup( groupId, isNew )
{
    selectedPrefabId = `group_${groupId}`
    let group = prefabGroups[ groupId ]
    wsSendJSON({ action: 'select_prefab_group', id : groupId, group : group })
    if ( isNew )
    {
        $(`#SelectedPrefabSelect option[value="group_${groupId}"]`).remove()
        $(`#SelectedPrefabSelect`).append(
            new Option(`Group ${group.id} - ${group.name} [${group.items.length} items]`, `group_${group.id}`, true, true )
        );
        $('#DestroySelectedPrefab').show()
    }
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
    wsAddHandler( 'select_find_save', ( data ) => {
        console.log( 'select_find_save: ', data )
        console.log( 'select_find_save saveitems: ', data.data.scanitems )
        if ( !!data.result && data.result == 'OK' )
        {
            $('.ScannedPrefab').remove()
            let itemList = data.data.scanitems
            console.log( "itemList: ", itemList )
            itemList.sort( function(a, b) {
                let aname = a.Name.replace(/^[0-9]+\ -\ /, '')
                let bname = b.Name.replace(/^[0-9]+\ -\ /, '')
                return ( aname.toUpperCase() > bname.toUpperCase() ) ? 1 : -1
            })
            let placed = 0;
            for ( let i = 0; i < itemList.length; i++ )
            {
                let item = itemList[i]
                //let matches = item.Name.match(/([a-zA-Z0-9_\-\ ]+)\(Clone\)/)
                //console.log( matches )
                //let name = (!!matches && !!matches[1])? matches[1] : "Unknown"
                let name = item.Name.replace(/\(Clone\)/, "")
                let saveName = name.replace(/^[0-9]+\ -\ /, '')
                placed++
                let evenodd = ( placed % 2 == 0 ) ? 'even' : 'odd'
                $(dest).append("<div class='ScannedPrefab row w-100 "+ evenodd+"' id='"+ item.Identifier +"' name='"+ saveName +"' data-hash='"+ item.PrefabHash +"'><span class='col mr-auto'>"+ name +"</span><a class='col-1 ml-auto trash_prefab' id='"+ item.Identifier +"'><i class='fas fa-window-close'/></a></div>")
            }
            $("#SavePrefabListToFileButton").show()
        }
    })

    wsSendJSON({ action: 'select_find_save', diameter: diameter })
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
                    let checkbox = `<input class='col-1 SelectablePrefabCheckbox checkbox-lg' type='checkbox' name='${item.Name}' value='${item.Identifier}' />`
                    let anchor = `<a class='col SelectablePrefabAnchor' id='${item.Identifier}' name='${item.Name}'>${item.Identifier} - ${item.Name}</a>`
                    let boundbox = `<div class='row SelectablePrefab list-group-item'>${checkbox}${anchor}</div>`
                    $(dest).append( boundbox )
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
var buttonHandler = ( message ) => {
    console.log( "handler: ", message )
    if ( message.result != 'OK' )
    {
        flash( $("#"+message.data.element ), "255, 20, 20")
    }
}
wsAddHandler( 'rotate', buttonHandler )
wsAddHandler( 'move', buttonHandler )
wsAddHandler( 'look-at', buttonHandler )
wsAddHandler( 'snap-ground', buttonHandler )

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

function updateGroupPrefabList( listElem, itemList )
{
    if ( itemList !== undefined )
    {
        console.log( itemList )
        $(`#${listElem}`).empty()
        let evenodd = false
        itemList.forEach( (item, i) => {
            let itemColor = ( evenodd ) ? 'even' : 'odd'
            evenodd = !evenodd
            $(`#${listElem}`).append(`<a class='${listElem}Item list-group-item ${itemColor}' id='${item.Identifier}' name='${item.Identifier}'>${item.Name}</a>` )
        })
    } else {
        // Pull the list from the Selected history
        let evenodd = false
        $(`#${listElem}`).empty()
        $("#SelectedPrefabSelect option").each( (key, val) => {
            let itemColor = ( evenodd ) ? 'even' : 'odd'
            evenodd = !evenodd
            let itemId = $(val).prop('value')
            let itemText = $(val).text()
            if ( !`${itemId}`.includes("group") )
            {
                $(`#${listElem}`).append(`<a class='${listElem}Item list-group-item ${itemColor}' id='${itemId}' name='${itemId}'>${itemText}</a>` )
            }
        })
    }
}

function updateGroupPrefabsSelect( selectElem, selectedItem )
{
    $(`#${selectElem}`).empty()
    $(`#${selectElem}`).append( new Option( 'Selection History', 'selectedPrefabs', false, true ) )
    let selected = false
    Object.keys(prefabGroups).forEach( ( key ) => {
        let group = prefabGroups[key]
        console.log( `is ${selectedItem} == ${group.id} ?` )
        selected = ( !!selectedItem && selectedItem == group.id )
        $(`#${selectElem}`).append(
            new Option( `Group ${group.id} - ${group.name} [${group.items.length} items]`, group.id, selected, selected )
        )
    })
}