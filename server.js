//-- SOCKET.IO FILE SERVER
// https://gist.github.com/rpflorence/701407
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
        client.connect(function(err) {
            if(err) {
                return console.error('POSTGRESQL: could not connect to postgres', err);
            }
        });
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
        var q = client.query(query, function(err) {
            if(err) {
                return console.error('POSTGRESQL: could not complete query', err);
            }
        });

        q.on('row', function(row) { r.push(row); });
        q.on('end', function()    {
            callback(r);
            disconnectClient();
        });
    }

    function emitResponse(page_title, table_title, queryResults) {
        if (queryResults !== undefined) {
            socket.emit('response', {
                "page_title": page_title,
                "table_title": table_title,
                "queryResults": queryResults
            });
        }
    }

    socket.on('cmd', function(data) {
        console.log("cmd: " + data);
        switch (data) {
            case 0:
                emitResponse("Welcome to AccountgresSQL", "Select a function from the side bar", {});
                break;
            case 1:
                run("SELECT * FROM junk", function(res){
                    emitResponse("Command 1", "SELECT * FROM junk", res);
                });
                break;
            case 2:
                run("SELECT * FROM beatles", function(res){
                    emitResponse("Command 2", "SELECT * FROM beatles", res)
                });
                break;
        }
    });

    socket.on('manual_query', function(data) {
        console.log("manual_query: " + data);
        run(data, function(res){
            emitResponse("Custom Query", data, res);
        });
    });

    socket.on('disconnect', disconnectClient);
});
