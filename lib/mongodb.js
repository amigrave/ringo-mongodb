/**
 * @fileOverview This is the single main file of the `ringo-mongodb` module
 * providing the following classes:
 *
 * - MongoClient
 * - MongoDatabase
 * - MongoCollection
 * - MongoCursor
 * - MongoDocument
 *
 */

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
        klass.prototype.__java = function(fn, args, casting) {
            var value = this.__javaObj[fn].apply(this.__javaObj, args || []);
            if (!casting) {
                return value;
            } else if (value instanceof java.util.ArrayList
                    || value instanceof java.util.LinkedHashSet) {
                return value.toArray().slice();
            } else if (value instanceof com.mongodb.DBApiLayer) {
                return new mongo.MongoDatabase(value);
            } else if (value instanceof com.mongodb.DBCollection) {
                return new mongo.MongoCollection(value);
            } else {
                return value;
            }
        };
        for (var p in props) {
            if (props.hasOwnProperty(p) && p.substr(0, 2) !== '__') {
                klass.prototype[p] = props[p];
            }
        }
        if (props.__javaMethods) {
            props.__javaMethods.forEach(function(p) {
                klass.prototype[p] = function() {
                    return this.__java(p, arguments, true);
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

    function object2Mongo(o) {
        return BSON.to(o);
    }
    function mongo2Object(o) {
        return BSON.from(o);
    }
    function queryOrID(query) {
        if (typeof query === 'object') {
            return object2Mongo(query);
        } else {
            return object2Mongo({ _id: query });
        }
    }
    function fields2Mongo(fields) {
        var fieldsObj = fields;
        if (Array.isArray(fields)) {
            fieldsObj = {};
            fields.forEach(function(f) {
                fieldsObj[f] = 1;
            });
        }
        return object2Mongo(fieldsObj);
    }
    function removeTrailingNulls(a) {
        var trailing = true;
        while (trailing) {
            if (a.slice(-1)[0] === null) {
                a.splice(-1);
            } else {
                trailing = false;
            }
        }
        return a;
    }

    /**
     * Returns a MongoClient instance connected to the provided URI connection.
     *
     * If a database is specified in the URI, a instance of Database is returned
     * instead.
     *
     * The format of the URI is:
     *
     *      mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
     *
     * For a detailed specification of the URI format, please check the [java
     * driver's MongoClientURI class](http://api.mongodb.org/java/current/com/mongodb/MongoClientURI.html)
     *
     * @param {string} uri URI to use for the connection
     * @returns {MongoClient} if not database was specified in the URI
     * @returns {MongoDatabase} if a database was specified in the URI
     */
    mongo.connect = function(uri) {
        uri = uri || 'mongodb://localhost';
        var _uri = new Packages.com.mongodb.MongoClientURI(uri);
        var client = new mongo.MongoClient(uri);
        return _uri.database ? client.getDB(_uri.database) : client;
    };

    /**
     * The MongoClient class is a MongoDB client with internal connection
     * pooling. For most applications, you only need one MongoClient instance.
     *
     * - When invoked without arguments, the default host and port values are
     *   used. The default host is `localhost` and default port is `27017`.
     *
     * - If the first argument starts with `mongodb://`, then it is considered as
     *   an URI to be used for the connection. Here's the URI format :
     *
     *      mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
     *
     *   For a detailed specification of the URI format, please check the [java
     *   driver's MongoClientURI class](http://api.mongodb.org/java/current/com/mongodb/MongoClientURI.html)
     *
     * - If the first argument is not an URI, it is then used as the host and
     *   the second argument if present shall be the port.
     *
     */
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
        this.__javaObj = getClient(arguments);
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
            return "[MongoClient: " + this.__javaObj.address.toString() + "]";
        },
    });

    // MongoDatabase
    mongo.MongoDatabase = function MongoDatabase(db) {
        this.__javaObj = db;
    };
    javaExtend(mongo.MongoDatabase, {
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
        createCollection: function(name, options) {
            options = options ? new Packages.com.mongodb.BasicDBObject(options) : null;
            var col = this.__javaObj.createCollection(name, options);
            return new mongo.MongoCollection(col);
        },
        toString: function() {
            return "[MongoDatabase: " + this.name + "]";
        },
    });

    // MongoCollection
    mongo.MongoCollection = function MongoCollection(col) {
        this.__javaObj = col;
    };
    javaExtend(mongo.MongoCollection, {
        __javaMethods: [
            'drop',
            'ensureIndex',
            'getCount',
            'getName',
            'dropIndex',
            'dropIndexes',
            'isCapped',
        ],
        __javaGetters: [
            'name',
        ],
        count: function(query) {
            if (!query) {
                return this.__javaObj.count();
            } else {
                return this.__javaObj.count(object2Mongo(query));
            }
        },
        /**
         * Queries for an object in this collection.
         *
         * @param {object} query object for which to search
         * @param {object|array} projection Fields to return
         *
         * @returns {MongoCursor} a cursor to iterate over results
         */
        find: function(query, projection) {
            var args = removeTrailingNulls([
                query ? object2Mongo(query) : null,
                projection ? fields2Mongo(projection) : null,
            ]);
            var cur = this.__java('find', args);
            return new mongo.MongoCursor(this, cur);
        },
        /**
         * Returns a single object from this collection.
         *
         * @param {object} query The query object or a valid ID object
         * @param {object|array} projection Fields to return
         * @param {object|array} orderBy fields to order by
         *
         * @returns {MongoDocument} the object found, or `null` if no such object exists
         */
        findOne: function(query, fields, orderBy) {
            var args = removeTrailingNulls([
                query ? queryOrID(query) : null,
                fields ? fields2Mongo(fields) : null,
                orderBy ? fields2Mongo(orderBy) : null
            ]);
            var doc = this.__java('findOne', args);
            return doc ? new mongo.MongoDocument(this, doc) : null;
        },
        /**
         * Return a list of the indexes for this collection.
         * Each object in the list is the "info document" from MongoDB
         *
         * @returns {Object} list of index documents
         */
        getIndexInfo: function() {
            var idx = this.__javaObj.getIndexInfo();
            return mongo2Object(idx);
        },
        insert: function(obj) {
            obj = Array.isArray(obj) ?
                    obj.map(function(doc) { return object2Mongo(doc); })
                    : object2Mongo(obj);
            return this.__javaObj.insert(obj);
        },
        remove: function(query) {
            return this.__javaObj.remove(object2Mongo(query));
        },
        save: function(obj) {
            return this.__javaObj.save(object2Mongo(obj));
        },
        toString: function() {
            return "[MongoCollection: " + this.name + "]";
        },
        update: function(query, obj) {
            return this.__javaObj.update(object2Mongo(query), object2Mongo(obj));
        },
    });

    // MongoCursor
    mongo.MongoCursor = function MongoCursor(collection, cur) {
        this.collection = collection;
        this.__javaObj = cur;
    };
    javaExtend(mongo.MongoCursor, {
        __javaMethods: [
            'close',
            'count',
            'hasNext',
            'size',
        ],
        curr: function() {
            return new mongo.MongoDocument(this.collection, this.__javaObj.curr());
        },
        forEach: function(fn) {
            while (this.hasNext()) {
                var ret = fn(this.next());
                if (ret === false) {
                    break;
                }
            }
        },
        getKeysWanted: function() {
            return Object.keys(mongo2Object(this.__javaObj.getKeysWanted()));
        },
        limit: function(n) {
            this.__javaObj.limit(n);
            return this;
        },
        skip: function(n) {
            this.__javaObj.skip(n);
            return this;
        },
        toArray: function(max) {
            var self = this;
            var records = max ? this.__javaObj.toArray(max) : this.__javaObj.toArray();
            return records.toArray().slice().map(function(r) {
                return new mongo.MongoDocument(self.collection, r);
            });
        },
        toString: function() {
            return "[Mongo" + this.__javaObj.toString() + "]";
        },
    });

    // MongoDocument
    mongo.MongoDocument = function MongoDocument(collection, doc) {
        this.collection = collection;
        this.__javaObj = doc;
        this.data = mongo2Object(doc);
        this.id = this.containsField('_id') ? this.data._id.toString() : null;
    };
    javaExtend(mongo.MongoDocument, {
        __javaMethods: [
            'containsField',
            'containsValue',
            'size',
        ],
        toJSON: function() {
            return JSON.to(this.data);
        },
        toString: function() {
            return "[MongoDocument: " + this.id + "]";
        },
    });

    return mongo;

}({}));
