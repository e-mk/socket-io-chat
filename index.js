"use strict";

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.get('/', function(req, res) {
    res.send("BArev Sergo");
});

io.on('connection', function(client) {

    console.log('Client connected...');

    client.on('join', function(data) {
        console.log(data);
        client.broadcast.emit("answer", data)
    });

    client.on('event', function(data){});
    client.on('disconnect', function(){

        console.log("disconnected");

    });
});
server.listen(3000, function(){

    console.log('listening on *:3000');

});

