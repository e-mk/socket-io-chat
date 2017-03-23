"use strict";

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const jwt = require('jsonwebtoken');
const bodyParser  = require('body-parser');
const morgan      = require('morgan');
const db = require('./src/db.js');

const config = require('./config');

const port = process.env.PORT || 3000;
const mongoPath = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/chat_test';
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

const apiRoutes = express.Router();

apiRoutes.get('/', function(req, res) {
    res.send(`Hello! The API is at http://localhost:${port}/api`);
});

apiRoutes.get('/users', function(req, res) {

    db.get().collection('users').find().toArray((err, docs) => {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }

        return res.status(200).send(docs);
    });
});

apiRoutes.post('/authenticate', function(req, res) {

    const { body } = req;

    // find the user
    db.get().collection('users').findOne({
        name: body.name
    }, function(err, user) {

        if (err) throw err;

        if (!user) {
            return res.status(401).send({ error: 'Authentication failed. User not found.' });
        } else if (user) {

            // check if password matches
            if (user.password != body.password) {
                return res.status(422).send({ error: 'Authentication failed. Wrong password.' });
            } else {

                // if user is found and password is right
                // create a token
                const token = jwt.sign(user, app.get('superSecret'), {
                    expiresInMinutes: 1440 // expires in 24 hours
                });

                // return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }

        }

    });
});

apiRoutes.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    const token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});

apiRoutes.post('/user', function (req, res) {

    const { body } = req;

    const newUser = {
        name: body.name,
        password: body.password,
        admin: false
    };

    db.get().collection('users').insertOne(newUser,
        (err) => {
            if (err) {
                console.log('failed');
                return res.status(500).send({ error: 'user add failed!' });
            }
            console.log('successful');
            return res.status(200).send(newUser);
        }
    );
});

app.use('/api/v1', apiRoutes);

io.use(function(socket, next){
    if (socket.handshake.query && socket.handshake.query.token){
        jwt.verify(socket.handshake.query.token, 'SECRET_KEY', function(err, decoded) {
            if(err) return next(new Error('Authentication error'));
            socket.decoded = decoded;
            next();
        });
    }
    next(new Error('Authentication error'));
}).on('connection', function(client) {

    const address = client.handshake.address;
    console.log('New connection from ' + address);

    client.on('join', function(data) {
        console.log(data);
        client.broadcast.emit("answer", data)
    });

    client.on('disconnect', function(){

        console.log("disconnected");
    });
});

db.connect(mongoPath, (err) => {
    if (err) {
        return console.log(err)
    }

    server.listen(port, function(){

        console.log(`listening on *: ${port}`);

    });
});
