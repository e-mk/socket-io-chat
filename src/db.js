"use strict";

const MongoClient = require('mongodb').MongoClient;

class Database {

    constructor() {

        this.connected = false;
    }

    connect(url, done) {

        if (this.connected) {
            return done();
        }

        MongoClient.connect(url, (err, database) => {
            if (err) {
                return console.log(err)
            }
            this.db = database;
            this.connected = true;
            done();
        });
    }

    get() {
        return this.db;
    }
}

module.exports = new Database();