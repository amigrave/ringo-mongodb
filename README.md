MongoDB driver for Ringo.js
===========================

**ringo-mongodb** is a CommonJS-compliant wrapper around the [official MongoDB Java driver](https://github.com/mongodb/mongo-java-driver).

[Mongodb's Extended JSON format](http://www.mongodb.org/display/DOCS/Mongo+Extended+JSON) support is provided by [mongodb-rhino](http://code.google.com/p/mongodb-rhino/)
which is also included in this project.

Installation
------------

    ringo-admin install amigrave/ringo-mongodb

*_WARNING_*: This is a work in progress. This module will be available on [ringo packages](http://packages.ringojs.org) as soon as the api is stable.

Examples
--------

```javascript
var mongo = require('ringo-mongodb');
var client = new mongo.MongoClient('localhost', 27017);
var db = client.getDB('test_database');
db.getCollectionNames().forEach(function(dbname) {
    console.log(dbname);
});
```

```javascript
// You can easily connect to a given database using a connect URI
var db = require('ringo-mongodb').connect('mongodb://localhost/test_database');
var col = db.getCollection('myCollection');

col.drop();

var doc = {
   greet : "Hello"
   name : "World",
};

col.insert(doc);
var myDoc = col.findOne();
console.log(myDoc.data);
```

License
-------

- This software is licensed under [the MIT license](http://opensource.org/licenses/MIT)
- The [MongoDB Java driver](https://github.com/mongodb/mongo-java-driver) is licensed under [the Apache License](http://opensource.org/licenses/Apache-2.0)
- The [mongodb-rhino package](http://www.mongodb.org/display/DOCS/Mongo+Extended+JSON) is licensed under [the Apache License](http://opensource.org/licenses/Apache-2.0)

Note
----

A slightly modified version of the [Sergi](https://github.com/sergi)'s [narwhal-mongodb](https://github.com/sergi/narwhal-mongodb)'s [test suite](https://github.com/sergi/narwhal-mongodb/tree/master/tests) has been included in this project.

