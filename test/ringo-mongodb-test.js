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

exports.testCollectionCount = function() {
    var col = db.getCollection('test_cursor');
    col.remove({});
    assert.equal(col.count(), 0);

    col.insert({ msg: 'Hi there' });
    assert.equal(col.count(), 1);

    col.drop();
    assert.equal(col.count(), 0);

    var n = 100;
    for (var i = 0; i < n; i++) {
        col.insert({ "x": i });
    }
    assert.equal(col.count(), n);
    assert.equal(col.count({ x : { $lt : 50 }}), 50);
    assert.equal(col.count({ x : { $gt : 50 }}), 49);
};

if (require.main == module) {
    require("test").run(exports);
}
