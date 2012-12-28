module.exports = (function(mongo) {

    require('fs').list(module.resolve('../jars')).forEach(function(file) {
        if (file.match(/\.jar$/) && !addToClasspath(module.resolve('../jars/' + file))) {
            throw new Error("Could not load jar '" + file + "'.");
        }
    });

    var BSON = mongo.BSON = com.mongodb.rhino.BSON;
    var JSON = mongo.JSON = com.mongodb.rhino.JSON;

    function javaExtend(klass, props) {
        klass.prototype.toString = function() {
            return "[" + this.__javaObj.toString() + "]";
        };
        for (var p in props) {
            if (props.hasOwnProperty(p) && p.substr(0, 2) !== '__') {
                klass.prototype[p] = props[p];
            }
        }
        if (props.__javaMethods) {
            props.__javaMethods.forEach(function(p) {
                klass.prototype[p] = function() {
                    var r;
                    if (arguments.length) {
                        return javaCustomCasting(this.__javaObj[p](Array.prototype.slice.call(arguments)));
                    } else {
                        return javaCustomCasting(this.__javaObj[p]());
                    }
                };
            });
        }
        if (props.__javaGetters) {
            props.__javaGetters.forEach(function(p) {
                klass.prototype.__defineGetter__(p, function() {
                    return this.__javaObj[p];
                });
            });
        }
        if (props.__javaSetters) {
            props.__javaSetters.forEach(function(p) {
                klass.prototype.__defineSetter__(p, function(val) {
                    this.__javaObj[p] = val;
                });
            });
        }
    }

    function javaCustomCasting(value) {
        if (value instanceof java.util.ArrayList
                || value instanceof java.util.LinkedHashSet) {
            return value.toArray().slice();
        } else if (value instanceof com.mongodb.DBApiLayer) {
            return new mongo.MongoDB(value);
        } else if (value instanceof com.mongodb.DBCollection) {
            return new mongo.Collection(value);
        } else {
            return value;
        }
    }

    mongo.connect = function(uri) {
        var _uri = new Packages.com.mongodb.MongoClientURI(uri);
        var client = new mongo.MongoClient(uri);
        return _uri.database ? client.getDB(_uri.database) : client;
    };

    // MongoClient
    mongo.MongoClient = function MongoClient() {
        // TODO: support replica set
        function getClient(args) {
            var klass = Packages.com.mongodb.MongoClient;
            if (args.length) {
                if (args[0].match(/^mongodb:\/\//)) {
                    var uri = Packages.com.mongodb.MongoClientURI(args[0]);
                    return new klass(uri);
                } else if (args.length === 1) {
                    return new klass(args[0]);
                } else if (args.length === 2) {
                    return new klass(args[0], args[1]);
                }
            }
            return new klass();
        }
        try {
            this.__javaObj = getClient(arguments);
        } catch(e) {
            throw new Error("Could not connect to database '" + arguments[0] + "'");
        }
    };
    javaExtend(mongo.MongoClient, {
        __javaMethods: [
            'close',
            'debugString',
            'dropDatabase',
            'getDatabaseNames',
            'getDB',
            'getMongoOptions',
            'getVersion',
            'isLocked',
            'unlock',
        ],
        __javaGetters: [
            'version',
        ],
        toString: function() {
            return "[mongo.MongoClient: " + this.__javaObj.address.toString() + "]";
        },
    });

    // MongoDB
    mongo.MongoDB = function MongoDB(db) {
        this.__javaObj = db;
    };
    javaExtend(mongo.MongoDB, {
        __javaMethods: [
            'collectionExists',
            'addUser',
            'authenticate',
            'dropDatabase',
            'getName',
            'getCollection',
            'getCollectionNames',
            'getLastError',
        ],
        __javaGetters: [
            'name',
        ],
        toString: function() {
            return "[mongo.MongoDB: " + this.name + "]";
        },
        createCollection: function(name, obj) {
            obj = obj ? new Packages.com.mongodb.BasicDBObject(obj) : null;
            return javaCustomCasting(this.__javaObj.createCollection(name, obj));
        },
    });

    // Collection
    mongo.Collection = function Collection(col) {
        this.__javaObj = col;
    };
    javaExtend(mongo.Collection, {
        __javaMethods: [
            'drop',
            'ensureIndex',
            'getCount',
            'getName',
            'dropIndex',
            'dropIndexes',
        ],
        __javaGetters: [
            'name',
        ],
        toString: function() {
            return "[mongo.Collection: " + this.name + "]";
        },
        count: function(query) {
            if (!query) {
                return this.__javaObj.count();
            } else {
                return this.__javaObj.count(BSON.to(query));
            }
        },
        find: function(query) {
            var doc;
            if (!query) {
                doc = this.__javaObj.findOne();
            } else {
                doc = this.__javaObj.findOne(BSON.to(query));
            }
            return BSON.from(doc);
        },
        findOne: function(query) {
            var doc;
            if (!query) {
                doc = this.__javaObj.findOne();
            } else {
                doc = this.__javaObj.findOne(BSON.to(query));
            }
            return new mongo.Document(this, doc);
        },
        insert: function(obj) {
            return this.__javaObj.insert(BSON.to(obj));
        },
        update: function(query, obj, options) {
            return this.__javaObj.update(BSON.to(query), BSON.to(obj), options);
        },
    });

    // Document
    mongo.Document = function Document(collection, doc) {
        // TODO: make it instanciable ( with custom ObjectId ) ??
        //       I don't like active record, ... so maybe not.
        this.collection = collection;
        this.__javaObj = doc;
        this.data = BSON.from(doc);
        this.id = this.containsField('_id') ? this.data._id.toString() : null;
    };
    javaExtend(mongo.Document, {
        __javaMethods: [
            'containsField',
            'containsValue',
            'size',
        ],
        toString: function() {
            return "[mongo.Document: " + this.id + "]";
        },
        toJSON: function() {
            return JSON.to(this.data);
        },
    });

    return mongo;

}({}));
