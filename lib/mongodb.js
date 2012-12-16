var jar = module.resolve('../jars/mongo-2.10.1.jar');
if (!addToClasspath(jar)) {
    throw "Could not load java mongodb driver '" + jar + "'.";
}

module.exports = (function(mongo) {

    mongo.MongoClient = function(host, port) {
        // TODO: support replica set
        this._mongoclient = new Packages.com.mongodb.MongoClient(host || 'localhost', port || 27017);
    };

    return mongo;

}({}));
