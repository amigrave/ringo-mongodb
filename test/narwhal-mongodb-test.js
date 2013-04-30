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
     var c = db.getCollection("test");
     c.drop();

     var insertable = { "hello": "world" };
     c.save(insertable);
     var id = insertable._id.toString();
     var doc = c.findOne();
     var docId = doc.id;
     assert.isTrue(docId == id, "17");
     assert.isTrue(Packages.org.bson.types.ObjectId.isValid(id));
};

exports.testCount = function() {
    var c = db.getCollection("test");
    c.drop();
    assert.equal(0, c.find().count());
    c.insert({"x": "foo"});
    assert.equal(1, c.find().count());
};

exports.testSnapshot = function() {
    var c = db.getCollection("snapshot1");
    c.drop();
    for ( var i=0; i<100; i++ ) {
        c.save({ "x": i });
    }
    assert.equal( 100 , c.find().count() );
    assert.equal( 100 , c.find().toArray().length );
    assert.equal( 100 , c.find().snapshot().count() );
    assert.equal( 100 , c.find().snapshot().toArray().length );
    assert.equal( 100 , c.find().snapshot().limit(50).count() );
    assert.equal( 50 , c.find().snapshot().limit(50).toArray().length );
};

exports.testBig = function() {
    var _count = function(i) {
        var c = 0;
        while (i.hasNext()){
            i.next();
            c++;
        }
        return c;
    };

    var c = db.getCollection("big1");
    c.drop();

    var bigString = "";
    for ( var i=0; i<16000; i++ )
        bigString += "x";

    var numToInsert = Math.ceil(( 15 * 1024 * 1024 ) / bigString.length);

    for (var i = 0; i < numToInsert; i++) {
        c.save({ "x": i, "s": bigString });
    }

    assert.isTrue( 800 < numToInsert, "1");
    assert.equal( c.find().count(), numToInsert, "2");
    assert.equal( c.find().toArray().length, numToInsert, "3");
    assert.equal( c.find().limit(800).count(), numToInsert, "4");
    assert.equal( 800 , c.find().limit(800).toArray().length, "5");

    var x = c.find().batchSize(800).toArray().length;
    assert.equal( x, numToInsert, "6");

    var a = c.find();
    assert.equal( numToInsert , a.itcount(), "7" );

    var b = c.find().batchSize( 10 );
    assert.equal( numToInsert , b.itcount(), "8" );

    assert.equal( numToInsert , c.find().batchSize(2).toArray().slice().length, "11" );
    assert.equal( numToInsert , c.find().batchSize(1).toArray().slice().length, "12" );
};

exports.testExplain = function() {
    var c = db.getCollection( "explain1" );
    c.drop();

    for ( var i=0; i<100; i++ )
        c.save({"x": i });

    var q = {"x" : {"$gt": 50 }};

    assert.equal( 49, c.find(q).count(), "1" );
    assert.equal( 49, c.find(q).toArray().length, "2" );
    assert.equal( 49, c.find(q).itcount(), "3" );
    assert.equal( 20, c.find(q).limit(20).itcount(), "4" );

    c.ensureIndex({"x": 1 });

    assert.equal( 49, c.find(q).count(), "5" );
    assert.equal( 49, c.find(q).toArray().length, "6" );
    assert.equal( 49, c.find(q).itcount(), "7" );
    assert.equal( 20, c.find(q).limit(20).itcount(), "8" );
    assert.equal( 49, c.find(q).explain().n, "9" );

    // these 2 are 'reersed' b/ e want the user case to make sense
    assert.equal( 20, c.find(q).limit(20).explain().n, "10" );
    assert.equal( 49, c.find(q).batchSize(20).explain().n, "11 " );
};


if (require.main == module) {
    require("test").run(exports);
}
