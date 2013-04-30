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

    // test version getter
    assert.matches(client3.version, /^\d+\.\d+\.\d+$/);

    // Ensure test database is dropped
    var db = client.getDB(dbTestName);
    db.dropDatabase();
    var databases = client.getDatabaseNames();
    assert.isTrue(Array.isArray(databases));
    assert.equal(databases.indexOf(dbTestName), -1);
};

exports.testCollectionCount = function() {
    var col = db.getCollection('test_collection');
    col.insert({ msg: 'Hi there' });
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
    assert.equal(col.count({ x : { $lt : 50 }}), n / 2);
    assert.equal(col.count({ x : { $gt : 50 }}), n / 2 - 1);
};

exports.testCursor = function() {
    var col = db.getCollection('test_cursor');

    var n = 100;
    for (var i = 0; i < n; i++) {
        col.insert({ x: i, y: i % 2 });
    }
    var all = col.find();
    assert.equal(all.count(), n);
    assert.equal(all.toArray().length, n);

    var odd = col.find({ y: 1 });
    assert.equal(odd.count(), n / 2);

    odd.limit(n / 4);
    assert.equal(odd.toArray().length, n / 4);

    var even = col.find({ y: 0 });
    assert.equal(even.count(), n / 2);
    even.skip(n / 2);
    assert.isFalse(even.hasNext());

    var quarter = col.find({ x: { $lt: n / 4 } }).skip(n / 10);
    assert.equal(quarter.count(), n / 4);
    assert.isNull(quarter.curr());

    var doc = quarter.next();
    assert.equal(doc.data.x, n / 10);
    assert.equal(doc.data._id.toString(), quarter.curr().data._id.toString());
};

exports.testDocument = function() {
    var col = db.getCollection('test_document');
    var dict = { a: 1, b: 2 };
    col.save(dict);
    var doc = col.findOne(dict._id);
    var json = doc.toJSON();
    assert.ok(json.match(/^{.*}$/));
    assert.ok(json.match(/"_id":".+"/));
    assert.ok(json.match(/"a":1/));
    assert.ok(json.match(/"b":2/));
};

if (require.main == module) {
    require("test").run(exports);
}
