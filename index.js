function display(msg) {
    $('#chat').append('<p>' + msg + '</p>')
}

function send() {
    if ($('#console').val()[0] == '/') {
        socket.emit($('#console').val().split(' '))
    } else {
        room = $('select#room').find(":selected").text()
        socket.emit('msg', {
            room: room,
            msg: $('#console').val()
        })
    }
    $('#console').val('')
}

function forcePrompt(msg) {
    answer = prompt(msg)
    if (answer == null || answer.trim() == "") {
        forcePrompt(msg)
    }
    return answer
}

function listRooms(roomList) {
    $('#roomList').empty()
    $('select#room').empty()
    for (var i = 0; i < roomList.length; i++) {
        $('#roomList').append('<li id="' + roomList[i] + '" joined="false">' + roomList[i] + '</li>')
    }
}

function statusRooms(roomsJoined, roomList) {
    if (roomsJoined == null)
        return

    for (var i = 0; i < roomList.length; i++) {
        if (roomsJoined.indexOf(roomList[i]) != -1) {
            $('ul#roomList > li#' + roomList[i]).attr('joined', true)
            $('ul#roomList > li#' + roomList[i]).html('[-] ' + roomList[i])
            $('select#room').append('<option value="' + roomList[i] + '">' + roomList[i] + '</option>')
            $('ul#roomList > li#' + roomList[i]).bind('click', function () {
                socket.emit('leaveRoom', $(this)[0].id)
            })
        } else {
            $('ul#roomList > li#' + roomList[i]).attr('joined', false)
            $('ul#roomList > li#' + roomList[i]).html('[+] ' + roomList[i])
            $('ul#roomList > li#' + roomList[i]).bind('click', function () {
                socket.emit('joinRoom', $(this)[0].id)
            })
            for (var j = 0; j < $('select#room')[0].children.lenght; j++) {
                if ($('select#room')[0].children[j].firstChild.data == roomList[i])
                    $('select#room')[0].children[j].remove()
            }
        }
    }

}
/* JQUERY EVENTS */

$('#console').keydown(function (key) {
    if (key.keyCode == 13)
        send()
})

$('#submit').bind('click', function () {
    send()
})

$('#createRoom').bind('click', function () {
    roomName = forcePrompt('Please enter a room name.')
    if (roomName == null)
        return
    roomPassword = prompt('Please enter a room password (can be empty).')
    if (roomPassword == null)
        return

    socket.emit('createRoom', {
        name: roomName,
        password: roomPassword
    })
})

/* SOCKET.IO */

var socket = io()
socket.rooms = []
socket.roomList = []
    //INIT
socket.on('reqPseudo', function (err) {
    if (!err)
        pseudo = forcePrompt('Please entrer your pseudo: ')
    else
        pseudo = forcePrompt(err + ' Please choice another pseudo: ')
    socket.emit('reqPseudo', pseudo)
})
socket.on('connected', function (pseudo) {
    display('[STATUS] Connected as: ' + pseudo)
    socket.emit('getRoomList')
    socket.emit('getUserList')
})
socket.on('roomList', function (data) {
    if (data.roomsJoined != null)
        socket.rooms = Object.keys(data.roomsJoined)
    socket.roomList = data.roomList

    listRooms(socket.roomList)
    statusRooms(socket.rooms, socket.roomList)
})
socket.on('userList', function (userList) {
    $('#userList').empty()
    for (var i = 0; i < Object.keys(userList).length; i++) {
        $('#userList').append('<li idSocket="' + Object.keys(userList)[i] + '" id="' + Object.keys(userList)[i] + '">' + Object.keys(userList)[i] + '</li>')
    }
})

//Communication
socket.on('msg', function (data) {
    display('[' + data.room + '] ' + data.pseudo + ': ' + data.msg)
})

//Status
socket.on('newUser', function (data) {
    $('#userList').append('<li idSocket="' + data.id + '" id="' + data.pseudo + '">' + data.pseudo + '</li>')
})
socket.on('disconnected', function (id) {
    $('#userList > li#' + id).remove()
})
socket.on('reconnect', function () {
    location.reload()
})

//Rooms
socket.on('roomPassword', function (roomName) {
    socket.emit('roomPassword', {
        roomName: roomName,
        pass: forcePrompt('Please enter password for room ' + roomName)
    })
})


//Errors
socket.on('errCreateRoom', function (err) {
    debug('Error while creating room: ' + err)
})
socket.on('err', function (err) {
    console.log(err)
    alert('Error n°' + err + ': ' + errors[err])
})
socket.on('test', function (data) {
    console.log(data)
})
