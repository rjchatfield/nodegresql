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


io.sockets.on('connection', function (socket) {

    var conString = "postgres://smiley@localhost:5432/playful";
    var client = new pg.Client(conString);
    client.connect();

    // function connect(user) {
    //     conString = "postgres://" + user + "@localhost:5432/playful";
    //     client = new pg.Client(conString);
    // }

    function run(query, callback) {
        var r = [];

        var q = client.query(query);

        q.on('row', function(row) { r.push(row); });
        q.on('end', function()    { callback(r); });
    }

    function resFunc(res) {
        socket.emit('response', { cmd1: res });
    }

    function disconnectClient() {
        console.log("disconnecting...");
        client.end();
        client = null;
    }

    socket.on('cmd', function (data) {
        console.log("cmd: " + data.cmd);
        if (data.cmd == "cmd1") {
            run("SELECT * FROM junk", resFunc);
        }
        else if (data.cmd == "cmd2") {
            run("SELECT * FROM beatles", resFunc);
        }
        else if (data.cmd == "client_end") {
            disconnectClient();
        }
    });

    socket.on('disconnect', disconnectClient);
});
