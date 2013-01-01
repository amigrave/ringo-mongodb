// This file is a slightly modified version of narwhal-mongodb test suite.
// https://github.com/sergi/narwhal-mongodb/tree/master/tests

var mongo = require("../");
var assert = require("assert");

var dbTestName = "testing_ringo_mongodb";
var db = mongo.connect("mongodb://localhost/" + dbTestName);

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
    assert.isTrue(c.isCapped());
    // TODO: check why capped size won't work
    // assert.isTrue(c.find().count() < 10);

    c = db.createCollection("foo3", {
            "capped": true,
            "size": 1000,
            "max": 2
        });

    var bulk = [];
    for (var i = 0; i < 30; i++) {
        bulk.push({ "x": i });
    }
    c.insert(bulk);
    assert.equal(c.find().count(), 2);

    try {
        db.createCollection("foo4", { "capped": true, "size": -20 }); // Invalid size
    } catch(e) {
        return;
    }
    assert.equal(0, 1);
};

exports.testCreateCollection2 = function() {
    var c = db.getCollection("test");
    c.drop();

    var obj = c.findOne();
    assert.equal(null, obj, "1");

    var inserted = { "x":1, "y":2 };
    c.insert(inserted);
    c.insert({"_id": 123, "x": 2, "z": 2});
    obj = c.findOne(123);
    assert.equal("123", obj.data["_id"], "2");
    assert.equal(2, obj.data["x"], "3");
    assert.equal(2, obj.data["z"], "4");

    obj = c.findOne(123, { "x": 1 });
    assert.equal("123", obj.data["_id"], "5");
    assert.equal(2, obj.data["x"], "6");
    assert.isFalse(obj.data.hasOwnProperty("z"), "7");

    obj = c.findOne({"x": 1});
    assert.equal(1, obj.data["x"], "8");
    assert.equal(2, obj.data["y"], "9");

    obj = c.findOne({}, {"x": 1, "y": 1});
    assert.isTrue(obj.data.hasOwnProperty("x"), "10");
    assert.equal(2, obj.data["y"], "11");
};

exports.testDropIndex = function() {
    var c = db.getCollection("dropindex1");
    c.drop();
    c.save({ "x": 1 });

    assert.equal(1, c.getIndexInfo().length, "11");

    c.ensureIndex({ "x": 1 });
    assert.equal(2, c.getIndexInfo().length, "12");

    c.dropIndexes();
    assert.equal(1, c.getIndexInfo().length, "13");

    c.ensureIndex({ "x": 1 });
    assert.equal(2 , c.getIndexInfo().length, "14");

    c.ensureIndex({ "y": 1 }, { name: 'y_idx' });
    assert.equal(3, c.getIndexInfo().length, "15");

    c.dropIndex({ "x": 1 });
    assert.equal(2, c.getIndexInfo().length, "16");

    c.dropIndex('y_idx');
    assert.equal(1, c.getIndexInfo().length, "17");
};

exports.testRemove = function() {
    var c = db.getCollection("test");
    c.drop();

    c.insert({ "_id": 123, "x": 100 });
    var obj = c.findOne();
    assert.isFalse(obj === null, "18");

    c.remove({"x": 100});
    obj = c.findOne();
    assert.isTrue(obj === null, "19");
};

exports.testSave = function() {

//     TODO: have to decide if I drop MongoDocument in favor to plain object.
//     In this case I will generate id's like narwhal-mongodb.

//     var c = db.getCollection("test");
//     c.drop();

//     var insertable = { "hello": "world" };
//     c.save(insertable);
//     var id = insertable._id.toString();
//     var doc = c.findOne();
//     var docId = doc._id.toString();
//     assert.isTrue(docId == id, "17");
//     assert.isTrue(Packages.com.mongodb.ObjectId.isValid(id));
};

if (require.main == module) {
    require("test").run(exports);
}
