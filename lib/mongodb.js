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
    function ensureId(o) {
        if (!o._id) {
            o._id = new Packages.org.bson.types.ObjectId();
        }
        return o;
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
            'dropIndexes',
            'getCount',
            'getName',
            'isCapped',
        ],
        __javaGetters: [
            'name',
        ],
        /**
         * Returns the number of documents in this collection
         *
         * @param {object} query query to match
         *
         * @returns {number} number of documents
         */
        count: function(query) {
            if (!query) {
                return this.__javaObj.count();
            } else {
                return this.__javaObj.count(object2Mongo(query));
            }
        },
        /**
         * Drops an index from this collection
         *
         * @param {object|string} obj keys or name of the index to drop
         */
        dropIndex: function(obj) {
            if (Object(obj) === obj) {
                obj = object2Mongo(obj);
            }
            this.__javaObj.dropIndex(obj);
        },
        /**
         * Creates an index on a set of fields, if one does not already exist.
         *
         * See [official documentation](http://docs.mongodb.org/manual/reference/method/db.collection.ensureIndex/) for available options.
         *
         * @param {object} keys an object with a key set of the fields desired for the index
         * @param {object} options options for the index (name, unique, etc)
         *
         * @returns {MongoCursor} a cursor to iterate over results
         */
        ensureIndex: function(keys, options) {
            var args = removeTrailingNulls([
                object2Mongo(keys),
                options ? fields2Mongo(options) : null
            ]);
            this.__java('ensureIndex', args);
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
        findOne: function(query, projection, orderBy) {
            var args = removeTrailingNulls([
                query ? queryOrID(query) : null,
                projection ? fields2Mongo(projection) : null,
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
        /**
         * Saves document(s) to the database. If doc doesn't have an _id,
         * one will be added you can get the _id that was added from doc
         * after the insert
         *
         * @param {object|array} obj Document or array of documents to save
         */
        insert: function(obj) {
            obj = Array.isArray(obj) ?
                    obj.map(function(doc) { return object2Mongo(ensureId(doc)); })
                    : object2Mongo(ensureId(obj));
            return this.__javaObj.insert(obj);
        },
        /**
         * Removes objects from the database collection.
         *
         * @param {object} query the object that documents to be removed must match
         */
        remove: function(query) {
            return this.__javaObj.remove(queryOrID(query));
        },
        /**
         * Saves an object to this collection (does insert or update based on
         * the object _id).
         *
         * @param {object} obj Document to save (will add _id field if needed)
         */
        save: function(obj) {
            return this.__javaObj.save(object2Mongo(ensureId(obj)));
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
        /**
         * Returns the element the cursor is at.
         *
         * @returns {MongoDocument} the current element
         */
        curr: function() {
            var doc = this.__javaObj.curr();
            return doc ? new mongo.MongoDocument(this.collection, doc) : null;
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
        /**
         * Limits the number of elements returned.
         *
         * @param {number} n the number of elements to return (should be positive)
         *
         * @returns {MongoCursor} a cursor to iterate over results
         */
        limit: function(n) {
            this.__javaObj = this.__javaObj.limit(n);
            return this;
        },
        /**
         * Returns the object the cursor is at and moves the cursor ahead by one.
         *
         * @returns {MongoDocument} the next element
         */
        next: function() {
            var doc = this.__javaObj.next();
            return doc ? new mongo.MongoDocument(this.collection, doc) : null;
        },
        /**
         * Discards a given number of elements at the beginning of the cursor.
         *
         * @param {number} n the number of elements to skip
         *
         * @returns {MongoCursor} a cursor pointing to the new first element of the results
         */
        skip: function(n) {
            this.__javaObj = this.__javaObj.skip(n);
            return this;
        },
        /**
         * Converts this cursor to an array.
         *
         * @param {max} max the maximum number of objects to return
         *
         * @returns {array} an array of MongoDocument
         */
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
