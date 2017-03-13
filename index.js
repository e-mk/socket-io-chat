"use strict";

const server = require('http').createServer();
const io = require('socket.io')(server);

io.on('connection', function(client) {

    var address = client.handshake.address;
    console.log('New connection from ' + address);

    client.on('join', function(data) {
        console.log(data);
        client.broadcast.emit("answer", data)
    });

    client.on('disconnect', function(){

        console.log("disconnected");
    });
});

server.listen(3000, function(){

    console.log('listening on *:3000');

});

