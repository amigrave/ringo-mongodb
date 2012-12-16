var jar = module.resolve('../jars/mongo-2.10.1.jar');
if (!addToClasspath(jar)) {
    throw new Error("Could not load java mongodb driver '" + jar + "'.");
}

module.exports = (function(mongo) {

    mongo.connect = function(uri) {
        var _uri = new Packages.com.mongodb.MongoClientURI(uri);
        var client = new mongo.MongoClient(uri);
        return _uri.database ? client.getDB(_uri.database) : client;
    };

    mongo.MongoClient = function() {
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
            this._mongoclient = getClient(arguments);
        } catch(e) {
            throw new Error("Could not connect to database '" + arguments[0] + "'");
        }
    };
    mongo.MongoClient.prototype.getDB = function(db) {
        return new mongo.MongoDB(this._mongoclient.getDB(db));
    };

    mongo.MongoDB = function(db) {
        this._db = db;
    };

    return mongo;

}({}));
