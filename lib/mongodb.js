/**
* ringo-mongodb
* =============
*
* `ringo-mongodb` is a CommonJS-compliant wrapper around the [official MongoDB Java driver](https://github.com/mongodb/mongo-java-driver).
*
* @module ringo-mongodb
* @author Fabien Meghazi
**/

module.exports = (function(mongo) {

    require('fs').listTree(module.resolve('../jars')).forEach(function(path) {
        if (path.match(/\.jar$/) && !addToClasspath(module.resolve('../jars/' + path))) {
            throw new Error("Could not load jar '" + path + "'.");
        }
    });

    mongo.BSON = com.mongodb.rhino.BSON;
    mongo.JSON = com.threecrickets.rhino.JSON;

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
        return mongo.BSON.to(o);
    }
    function mongo2Object(o) {
        return mongo.BSON.from(o);
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
     * Returns a {{#crossLink "MongoClient"}}{{/crossLink}} instance connected to the provided URI connection.
     *
     * If a database is specified in the URI, a {{#crossLink "MongoDatabase"}}{{/crossLink}} is returned instead.
     *
     * The format of the URI is:
     *
     *      mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
     *
     * For a detailed specification of the URI format, please check the
     * [java driver's MongoClientURI class](http://api.mongodb.org/java/current/com/mongodb/MongoClientURI.html)
     *
     * @method connect()
     * @static
     * @for connect()
     * @param {String} uri URI to use for the connection
     * @return {Object} returns `MongoClient` if no database was specified in the URI
     *                   otherwise returns the specified `MongoDatabase`
     * @example
     *      var client = mongo.connect('mongodb://localhost:27017');
     *
     *      var db = mongo.connect('mongodb://localhost/myDatabase');
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
     *   For a detailed specification of the URI format, please check the
     *   [java driver's MongoClientURI class](http://api.mongodb.org/java/current/com/mongodb/MongoClientURI.html)
     *
     * - If the first argument is not an URI, it is then used as the host and
     *   the second argument if present shall be the port.
     *
     * @class MongoClient
     * @constructor
     * @param {String} [host=localhost] Hostname or URI
     * @param {Number} [port] Hostname or URI
     * @example
     *      var client = mongo.MongoClient('localhost', 27017);
     *      var db = client.getDB('myDatabase');
     */
    mongo.MongoClient = function MongoClient() {
        function getClient(args) {
            // TODO: support replica set
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
            /**
             * Closes the underlying connector, which in turn closes all open connections.
             * Once called, this MongoClient instance can no longer be used.
             * @method close
             */
            'close',
            /**
             * Drops the database if it exists
             * @method dropDatabase
             */
            'dropDatabase',
            /**
             * Gets a list of all database names present on the server.
             * @method getDatabaseNames
             */
            'getDatabaseNames',
            /**
             * Get a MongoDatabase instance
             * @method getDB
             * @param {String} dbname the database name
             */
            'getDB',
            /**
             * @method isLocked
             * @return {Boolean} true if the database is locked (read-only), false otherwise.
             */
            'isLocked',
            /**
             * Unlocks the database, allowing the write operations to go through.
             * @method unlock
             */
            'unlock',
        ],
        __javaGetters: [
            /**
             * Java driver version
             * @property version
             * @type String
             */
            'version',
        ],
        toString: function() {
            return "[MongoClient: " + this.__javaObj.address.toString() + "]";
        },
    });

    /**
     * MongoDatabase API.
     *
     * @class MongoDatabase
     * @constructor
     * @param {Object} Database
     */
    mongo.MongoDatabase = function MongoDatabase(db) {
        this.__javaObj = db;
    };
    javaExtend(mongo.MongoDatabase, {
        __javaMethods: [
            /**
             * Checks to see if a collection exists
             * @method collectionExists
             * @param {String} collectionName The collection to test for existence
             * @return {Boolean} false if no collection by that name exists, true if a match to an existing collection was found
             */
            'collectionExists',
            /**
             * Drops this database
             * @method dropDatabase
             */
            'dropDatabase',
            /**
             * Gets a collection with a given name. If the collection does not exist, a new collection is created.
             * @method getCollection
             * @param {String} name the name of the collection to return
             * @return {MongoCollection} the collection
             */
            'getCollection',
            /**
             * Returns a set containing the names of all collections in this database
             * @method getCollectionNames
             * @return {Array} the names of collections in this database
             */
            'getCollectionNames',
        ],
        __javaGetters: [
            /**
             * Database name
             * @property name
             * @type String
             */
            'name',
        ],
        /**
         * Creates a collection with a given name and options.
         * @method createCollection
         * @param {String} name the name of the collection to return
         * @param {Object} [options] options ([See official documentation](http://docs.mongodb.org/manual/reference/method/db.createCollection/))
         */
        createCollection: function(name, options) {
            options = options ? object2Mongo(options) : null;
            var col = this.__javaObj.createCollection(name, options);
            return new mongo.MongoCollection(col);
        },
        toString: function() {
            return "[MongoDatabase: " + this.name + "]";
        },
    });

    /**
     * MongoCollection
     *
     * @class MongoCollection
     * @constructor
     * @param {Object} Collection
     */
    mongo.MongoCollection = function MongoCollection(col) {
        this.__javaObj = col;
    };
    javaExtend(mongo.MongoCollection, {
        __javaMethods: [
            /**
             * Drops (deletes) this collection. Use with care.
             * @method drop
             */
            'drop',
            /**
             * Drops all indices from this collection.
             * @method dropIndexes
             */
            'dropIndexes',
            /**
             * @method isCapped
             * @return {Boolean} Returns whether or not this is a capped collection
             */
            'isCapped',
        ],
        __javaGetters: [
            /**
             * Database name
             * @property name
             * @type String
             */
            'name',
        ],
        /**
         * Returns the number of documents in this collection
         * @method count
         * @param {Object} [query] query to match
         * @return {Number} number of documents
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
         * @method dropIndex
         * @param {Object|String} obj keys or name of the index to drop
         */
        dropIndex: function(obj) {
            if (Object(obj) === obj) {
                obj = object2Mongo(obj);
            }
            this.__javaObj.dropIndex(obj);
        },
        /**
         * Creates an index on a set of fields, if one does not already exist.
         * See [official documentation](http://docs.mongodb.org/manual/reference/method/db.collection.ensureIndex/) for available options.
         * @method ensureIndex
         * @param {Object} keys an object with a key set of the fields desired for the index
         * @param {object} [options] options for the index (name, unique, etc)
         * @return {MongoCursor} a cursor to iterate over results
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
         * @method find
         * @param {Object} [query] object for which to search
         * @param {Object|Array} [projection] Fields to return
         * @return {MongoCursor} a cursor to iterate over results
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
         * @method findOne
         * @param {Object} [query] The query object or a valid ID object
         * @param {Object|Array} [projection] Fields to return
         * @param {Object|Array} [orderBy] fields to order by
         * @return {MongoDocument} the object found, or `null` if no such object exists
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
         * @method getIndexInfo
         * @return {Object} list of index documents
         */
        getIndexInfo: function() {
            var idx = this.__javaObj.getIndexInfo();
            return mongo2Object(idx);
        },
        /**
         * Saves document(s) to the database. If doc doesn't have an _id,
         * one will be added you can get the _id that was added from doc
         * after the insert
         * @method insert
         * @param {Object|Array} obj Document or array of documents to save
         */
        insert: function(obj) {
            obj = Array.isArray(obj) ?
                    obj.map(function(doc) { return object2Mongo(doc); })
                    : object2Mongo(obj);
            return this.__javaObj.insert(obj);
        },
        /**
         * Removes objects from the database collection.
         * @method remove
         * @param {Object} query the object that documents to be removed must match
         */
        remove: function(query) {
            return this.__javaObj.remove(queryOrID(query));
        },
        /**
         * Saves an object to this collection (does insert or update based on
         * the object _id).
         *
         * @method save
         * @param {Object} obj Document to save (will add _id field if needed)
         */
        save: function(obj) {
            // TODO: returns writeresult
            return this.__javaObj.save(object2Mongo(ensureId(obj)));
        },
        toString: function() {
            return "[MongoCollection: " + this.name + "]";
        },
        /**
         * Performs an update operation.
         * @method update
         * @param {Object} query search query for old object to update
         * @param {Object} obj object with which to update query
         * @example
         *      var col = mongo.connect().getDB('myDatabase').getCollection('myCollection');
         *      col.update( { item: "book", qty: { $gt: 5 } }, { $set: { x: 6 }, $inc: { y: 5} } );
         */
        update: function(query, obj) {
            // TODO: returns writeresult
            return this.__javaObj.update(object2Mongo(query), object2Mongo(obj));
        },
    });

    /**
     * MongoCursor
     *
     * @class MongoCursor
     * @constructor
     * @param {MongoCollection} collection The collection to work with
     * @param {Object} cur Cursor
     */
    mongo.MongoCursor = function MongoCursor(collection, cur) {
        this.collection = collection;
        this.__javaObj = cur;
    };
    javaExtend(mongo.MongoCursor, {
        __javaMethods: [
            /**
             * Kills the current cursor on the server.
             * @method close
             */
            'close',
            /**
             * Counts the number of objects matching the query This does not take limit/skip into consideration
             * @method count
             * @return {Number} the number of objects
             */
            'count',
            /**
             * Checks if there is another object available
             * @method hasNext
             * @return {Boolean} returns true if another object is available, false otherwise
             */
            'hasNext',
            'itcount',
            /**
             * Counts the number of objects matching the query this does take limit/skip into consideration
             * @method size
             * @return {Number} the number of objects
             */
            'size',
        ],
        /**
         * Specify the number of documents to return in each batch of the response
         * from the MongoDB instance.
         * @method batchSize
         * @chainable
         * @param {Number} n the number of elements to return in a batch
         * @return {MongoCursor} a cursor to iterate over results
         */
        batchSize: function(n) {
            this.__javaObj = this.__javaObj.batchSize(n);
            return this;
        },
        /**
         * Returns the element the cursor is at.
         * @method curr
         * @return {MongoDocument} the current element
         */
        curr: function() {
            var doc = this.__javaObj.curr();
            return doc ? new mongo.MongoDocument(this.collection, doc) : null;
        },
        /**
         * Provides information on the query plan. The query plan is the plan
         * the server uses to find the matches for a query. This information
         * may be useful when optimizing a query
         *
         * See [official documentation](http://docs.mongodb.org/manual/reference/explain/) for more information
         * @method explain
         * @return {Object} A document that describes the process used to return the query results
         */
        explain: function() {
            var doc = this.__javaObj.explain();
            return mongo2Object(doc);
        },
        /**
         * Iterate trough cursor with a function.
         * @method forEach
         * @param {Function} fn the function to execute for each result item
         * @return {Object} A document that describes the process used to return the query results
         */
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
         * @method limit
         * @chainable
         * @param {Number} n the number of elements to return (should be positive)
         * @return {MongoCursor} a cursor to iterate over results
         */
        limit: function(n) {
            this.__javaObj = this.__javaObj.limit(n);
            return this;
        },
        /**
         * Returns the object the cursor is at and moves the cursor ahead by one.
         * @method next
         * @return {MongoDocument} the next element
         */
        next: function() {
            var doc = this.__javaObj.next();
            return doc ? new mongo.MongoDocument(this.collection, doc) : null;
        },
        /**
         * Discards a given number of elements at the beginning of the cursor.
         * @method skip
         * @chainable
         * @param {Number} n the number of elements to skip
         * @return {MongoCursor} a cursor pointing to the new first element of the results
         */
        skip: function(n) {
            this.__javaObj = this.__javaObj.skip(n);
            return this;
        },
        /**
         * Toggle cursor to the `snapshot` mode. This ensures that the query
         * will not return a document multiple times, even if intervening write
         * operations result in a move of the document due to the growth in
         * document size. Currently, snapshot mode may not be used with sorting
         * or explicit hints.
         * @method snapshot
         * @chainable
         * @return {MongoCursor} same DBCursor for chaining operations
         */
        snapshot: function(n) {
            this.__javaObj = this.__javaObj.snapshot();
            return this;
        },
        /**
         * Converts this cursor to an array.
         *
         * There are 2 modes for the cursors, iterator and array.
         * If you use next() or hasNext(), then you can't call toArray
         * @method toArray
         * @param {Number} max the maximum number of objects to return
         * @return {Array} an array of MongoDocument
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

    /**
     * MongoDocument
     *
     * @class MongoDocument
     * @constructor
     * @param {MongoCollection} collection The collection to work with
     * @param {Object} doc DBObject document
     */
    mongo.MongoDocument = function MongoDocument(collection, doc) {
        this.collection = collection;
        this.__javaObj = doc;
        this.data = mongo2Object(doc);
        this.id = this.containsField('_id') ? this.data._id.toString() : null;
    };
    javaExtend(mongo.MongoDocument, {
        /**
         * Document object map
         * @property data
         * @type {Object}
         * @example
         *      var col = mongo.connect().getDB('myDatabase').getCollection('myCollection');
         *      var doc = col.findOne( { firstname: "John" } } );
         *      doc.data.firstname === "John" // true
         */
        __javaMethods: [
            'containsField',
            'containsValue',
            'size',
        ],
        /**
         * Serialize this document to JSON
         * @method toJSON
         * @return {String} JSON representation of the document
         */
        toJSON: function() {
            return mongo.JSON.to(this.data);
        },
        toString: function() {
            return "[MongoDocument: " + this.id + "]";
        },
    });

    return mongo;

}({}));
