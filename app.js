var express = require('express')
var app = express()
var http = require('http')
var server = http.createServer(app)
var io = require('socket.io')(server)
var config = JSON.parse(require('fs').readFileSync('config.json'))

function createRoomDebug(name, pass) {
    rooms[rooms.length] = [name, pass]
    roomNames = []
    for (var i = 0; i < rooms.length; i++) {
        roomNames[i] = rooms[i][0]
    }
    io.sockets.broadcast('roomList', {
        roomList: roomNames,
        roomsJoined: null
    })
}

function joinRoom(roomName, socket) {
    socket.join(roomName, function () {
        roomNames = []
        for (var i = 0; i < rooms.length; i++) {
            roomNames[i] = rooms[i][0]
        }
        socket.emit('roomList', {
            roomList: roomNames,
            roomsJoined: socket.rooms
        })
        socket.broadcast.emit('roomList', {
            roomList: roomNames,
            roomsJoined: null
        })
    })
}

if (config.debug) {
    var debugLive = require("debug-live");
    debugLive(function (exprToEval) {
        return eval(exprToEval)
    }, 1337)
}

function debug(msg) {
    if (config.debug)
        console.log(msg)
}

app.use(express.static(__dirname + '/'))
app.get('/', function (req, res, next) {
    res.sendFile('index.html')
})

var users = {}
var rooms = [
['Public', '']
]

io.sockets.on('connection', function (socket) {
    //Connection
    socket.emit('reqPseudo')
    socket.on('reqPseudo', function (pseudo) {
        if(socket.pseudo != null){
            return
        }else if (pseudo == null) {
            socket.emit('err', 1000)
        } else if (!users.hasOwnProperty(pseudo)) {
            users[pseudo] = [pseudo, socket.id]
            socket.pseudo = pseudo

            socket.emit('connected', pseudo)
            socket.broadcast.emit('newUser', {
                pseudo: pseudo,
                id: socket.id
            })

            debug('[+] ' + pseudo)
            joinRoom(rooms[0][0], socket)
        } else {
            socket.emit('err', 1001)
        }
    })

    //First infos
    socket.on('getRoomList', function () {
        roomNames = []
        for (var i = 0; i < rooms.length; i++) {
            roomNames[i] = rooms[i][0]
        }
        socket.emit('roomList', {
            roomList: roomNames,
            roomsJoined: socket.rooms
        })
    })
    socket.on('getUserList', function () {
        socket.emit('userList', users)
    })

    //Communication
    socket.on('msg', function (msg) {
        console.log('[' + msg.room + '][' + socket.pseudo + '] ' + msg.msg)
        io.sockets.in(msg.room).emit('msg', {
            pseudo: socket.pseudo,
            msg: msg.msg,
            room: msg.room
        })
    })

    //Rooms
    socket.on('createRoom', function (data) {
        for(i = 0; i < rooms.length; i++){
            if(rooms[i][0] == data.name){
                socket.emit('err', 2000)
                return
            }
        }
        rooms[rooms.length] = [data.name, data.password]
        joinRoom(data.name, socket)
    })
    socket.on('joinRoom', function (roomName) {
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i][0] == roomName && rooms[i][1] == '') {
                joinRoom(roomName, socket)
                return
            } else if (rooms[i][0] == roomName && rooms[i][1] != '') {
                socket.emit('roomPassword', roomName)
                return
            }
        }
        if (i >= rooms.length) {
            socket.emit('err', 2002)
        }
    })
    socket.on('roomPassword', function (data) {
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i][0] == data.roomName && rooms[i][1] == data.pass) {
                joinRoom(data.roomName, socket)
                return
            } else if (rooms[i][0] == data.roomName && rooms[i][1] != data.pass) {
                socket.emit('err', 2002)
                return
            }
        }
        socket.emit('err', 2001)
        socket.emit('roomPassword', data.roomName)

    })
    socket.on('leaveRoom', function (roomName) {
        socket.leave(roomName, function () {
            io.sockets.emit('roomList', {
                roomList: roomNames,
                roomsJoined: socket.rooms
            })
        })

    })

    //Logout
    socket.on('disconnect', function () {
        delete users[socket.pseudo]
        socket.broadcast.emit('disconnected', socket.pseudo)
        debug('[-] ' + socket.pseudo)
    })
})

server.listen(config.port)
