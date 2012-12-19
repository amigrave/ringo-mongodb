var jar = module.resolve('../jars/mongo-2.10.1.jar');
if (!addToClasspath(jar)) {
    throw new Error("Could not load java mongodb driver '" + jar + "'.");
}

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
                    r = this.__javaObj[p](Array.prototype.slice.call(arguments));
                } else {
                    r = this.__javaObj[p]();
                }
                if (r instanceof java.util.ArrayList) {
                    return r.toArray().slice();
                } else {
                    return r;
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

module.exports = (function(mongo) {

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
        __javaMethods: ['close', 'debugString', 'dropDatabase', 'getDatabaseNames',
                        'getMongoOptions', 'getVersion', 'isLocked', 'toString', 'unlock'],
        __javaGetters: ['version'],
        getDB: function(db) {
            return new mongo.MongoDB(this.__javaObj.getDB(db));
        },
    });

    // MongoDB
    mongo.MongoDB = function MongoDB(db) {
        this.__javaObj = db;
    };

    javaExtend(mongo.MongoDB, {
        __javaMethods: ['collectionExists'],
    });

    return mongo;

}({}));

