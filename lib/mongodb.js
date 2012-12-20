var jar = module.resolve('../jars/mongo-2.10.1.jar');
if (!addToClasspath(jar)) {
    throw new Error("Could not load java mongodb driver '" + jar + "'.");
}

module.exports = (function(mongo) {

    function javaExtend(klass, props) {
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
        __javaMethods: ['close', 'debugString', 'dropDatabase', 'getDatabaseNames', 'getDB',
                        'getMongoOptions', 'getVersion', 'isLocked', 'toString', 'unlock'],
        __javaGetters: ['version'],
    });

    // MongoDB
    mongo.MongoDB = function MongoDB(db) {
        this.__javaObj = db;
    };
    javaExtend(mongo.MongoDB, {
        __javaMethods: ['collectionExists', 'addUser', 'authenticate', 'dropDatabase', 'getName',
                        'getCollection', 'getCollectionNames', 'getLastError'],
        __javaGetters: ['name'],
        toString: function() {
            return "MongoDB: '" + this.name + "'";
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
        __javaMethods: ['drop', 'ensureIndex', 'find', 'findOne', 'getCount', 'getName',
                        'dropIndex', 'dropIndexes'],
        __javaGetters: ['name'],
        toString: function() {
            return "Collection: '" + this.name + "'";
        },
        count: function(obj) {
            obj = new Packages.com.mongodb.BasicDBObject(obj || {});
            return this.__javaObj.count(obj);
        },
        insert: function(obj) {
            // WIP
            obj = new Packages.com.mongodb.BasicDBObject(obj);
            return this.__javaObj.insert(obj);
        },
    });

    return mongo;

}({}));

