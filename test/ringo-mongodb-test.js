var mongo = require("../");
var assert = require("assert");

// Connection and basic tests
exports.testConnection = function() {
    var dbtest = mongo.connect("mongodb://localhost/test");
    var client = mongo.connect("mongodb://localhost/");
    var dbtest2 = client.getDB('test');
    var client2 = new mongo.MongoClient("localhost");
    var client3 = new mongo.MongoClient("localhost", 27017);

    // test java method
    assert.equal(client3.toString(), 'Mongo: localhost/127.0.0.1:27017');

    // test getter
    assert.equal(client3.getVersion(), client3.version);
};

if (require.main == module) {
    require("test").run(exports);
}
