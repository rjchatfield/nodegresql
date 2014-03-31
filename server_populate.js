var pg = require('pg');
var conString = "postgres://localhost:5432/playful";

var client = new pg.Client(conString);
client.connect();


console.log('--JUNK');

//queries are queued and executed one after another once the connection becomes available
client.query("CREATE TABLE junk(name varchar(80), a_number int)");

var x = 1000;

while(x>0)
{
    client.query("INSERT INTO junk(name, a_number) values('Ted',12)");
    client.query("INSERT INTO junk(name, a_number) values($1, $2)", ['John', x]);
    x = x - 1;
}

var query = client.query("SELECT * FROM junk");
//fired after last row is emitted

query.on('row', function(row) { console.log(row); });
// query.on('end', function()    { client.end(); });




console.log('--BEATLE');

//queries can be executed either via text/parameter values passed as individual arguments
//or by passing an options object containing text, (optional) parameter values, and (optional) query name
client.query("CREATE TABLE beatles(name varchar(80), height int, birthday date)");

client.query({
    name: 'insert beatle',
    text: "INSERT INTO beatles(name, height, birthday) values($1, $2, $3)",
    values: ['George', 70, new Date(1946, 02, 14)]
});

//subsequent queries with the same name will be executed without re-parsing the query plan by postgres
client.query({
    name: 'insert beatle',
    values: ['Paul', 63, new Date(1945, 04, 03)]
});

var query2 = client.query("SELECT * FROM beatles WHERE name = $1", ['john']);
//can stream row results back 1 at a time
query2.on('row', function(row) {
    console.log(row);
    console.log("Beatle name: %s", row.name); //Beatle name: John
    console.log("Beatle birth year: %d", row.birthday.getYear()); //dates are returned as javascript dates
    console.log("Beatle height: %d' %d\"", Math.floor(row.height/12), row.height%12); //integers are returned as javascript ints
});

// var query = client.query("SELECT * FROM junk");
// var query2 = client.query("SELECT * FROM junk WHERE name = $1", ['John']);
// var query3 = client.query("SELECT * FROM beatles WHERE name = $1", ['Paul']);

// function run(callback) {
//     console.log("Inside run!");

//     var r = [];

//     var query = client.query("SELECT * FROM junk WHERE name = $1", ['John']);
//     console.log("Inside run!");

//     query.on('row', function(row) {
//         r.push(row);
//     });

//     query.on('end', function() {
//         client.end();
//         console.log("Inside end+!");
//         callback("Callback");
//     });
//     console.log("Inside end-!");
// }

// query2.on('row', function(row) {
//     console.log(row);
//     console.log("junk name: %s", row.name);
// });


// //fired after last row is emitted
// query2.on('end', function() {
//     client.end();
// });


query2.on('end', function()    { client.end(); });

