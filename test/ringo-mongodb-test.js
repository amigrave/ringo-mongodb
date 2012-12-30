var mongo = require("../");
var assert = require("assert");

var dbTestName = "testing_ringo_mongodb";
var db = mongo.connect("mongodb://localhost/" + dbTestName);

// Connection and basic tests
exports.testConnection = function() {
    var client = mongo.connect("mongodb://localhost");
    var client2 = new mongo.MongoClient("localhost");
    var client3 = new mongo.MongoClient("localhost", 27017);

    // test defaults
    assert.equal(client.toString(), client2.toString());
    assert.equal(client2.toString(), client3.toString());
    assert.equal(client3.toString(), '[MongoClient: localhost/127.0.0.1:27017]');

    // test getter
    assert.equal(client3.getVersion(), client3.version);

    // Ensure test database is dropped
    var db = client.getDB(dbTestName);
    db.dropDatabase();
    var databases = client.getDatabaseNames();
    assert.isTrue(Array.isArray(databases));
    assert.equal(databases.indexOf(dbTestName), -1);
};

// Create collection from narwhal-mongodb
exports.testCreateCollection = function() {
    db.getCollection("foo1").drop();
    db.getCollection("foo2").drop();
    db.getCollection("foo3").drop();
    db.getCollection("foo4").drop();

    var c = db.createCollection("foo1", { "capped": false });

    c = db.createCollection("foo2", { "capped": true, "size": 100 });
    for (var i = 0; i < 30; i++) {
        c.insert({ "x": i });
    }
    // TODO: check why capped size won't work
    // assert.isTrue(c.find().count() < 10);

    c = db.createCollection("foo3", {
            "capped": true,
            "size": 1000,
            "max": 2
        });

    for (var i = 0; i < 30; i++) {
        c.insert({ "x": i });
    }
    assert.equal(c.find().count(), 2);

    try {
        db.createCollection("foo4", { "capped": true, "size": -20 }); // Invalid size
    } catch(e) {
        return;
    }
    assert.equal(0, 1);
};

if (require.main == module) {
    require("test").run(exports);
}
