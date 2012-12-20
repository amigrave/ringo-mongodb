var mongo = require("../");
var assert = require("assert");

var db = mongo.connect("mongodb://localhost/testing_ringo_mongodb");

// Connection and basic tests
exports.testConnection = function() {
    var client = mongo.connect("mongodb://localhost");
    var client2 = new mongo.MongoClient("localhost");
    var client3 = new mongo.MongoClient("localhost", 27017);

    // test defaults
    assert.equal(client.toString(), client2.toString());
    assert.equal(client2.toString(), client3.toString());
    assert.equal(client3.toString(), 'Mongo: localhost/127.0.0.1:27017');

    // test getter
    assert.equal(client3.getVersion(), client3.version);
};

if (require.main == module) {
    require("test").run(exports);
}
