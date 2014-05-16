//-- SOCKET.IO FILE SERVER
var app = require("http").createServer(handler),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 8080;

app.listen(parseInt(port, 10));

function handler (request, response) {

  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);

  path.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  });
}

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown\n");


//-- POSTGRESQL CONNECTION
var pg = require('pg'),
    io = require('socket.io').listen(app);
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
