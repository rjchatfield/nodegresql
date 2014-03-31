//-- SOCKET.IO FILE SERVER
var app = require('http').createServer(handler),
    io  = require('socket.io').listen(app),
    fs  = require('fs');

app.listen(8080);

function handler (req, res) {
    fs.readFile(__dirname + '/index.html', function (err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }

        res.writeHead(200);
        res.end(data);
    });
}

//-- POSTGRESQL CONNECTION
var pg = require('pg');
var DATABASE_NAME = "playful",
    DATABASE_PATH = "localhost:5432/";

io.sockets.on('connection', function (socket) {

    var dbUsername = "";
    var client = null;// = new pg.Client(conString);

    function connectClient() {
        if (client) disconnectClient();
        console.log("Connecting as " + dbUsername + "...");
        if (dbUsername != "") dbUsername += "@";      // admin@
        conString = "postgres://" + dbUsername + DATABASE_PATH + DATABASE_NAME;
        client = new pg.Client(conString);
        client.connect();
    }

    function disconnectClient() {
        if (client) {
            console.log("disconnecting...");
            client.end();
            client = null;
        }
    }

    function run(query, callback) {
        var r = [];

        connectClient();
        var q = client.query(query);

        q.on('row', function(row) { r.push(row); });
        q.on('end', function()    {
            callback(r);
            disconnectClient();
        });
    }

    function emitResponse(res) {
        if (res !== undefined) socket.emit('response', res);
    }

    socket.on('cmd', function(data) {
        console.log("cmd: " + data);
        switch (data) {
            case 1:     run("SELECT * FROM junk",    emitResponse);  break;
            case 2:     run("SELECT * FROM beatles", emitResponse);  break;
        }
    });

    socket.on('manual_query', function(data) {
        console.log("manual_query: " + data);
        run(data, emitResponse);
    });

    socket.on('disconnect', disconnectClient);
});
