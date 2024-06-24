require('dotenv').config()
const { MongoClient } = require("mongodb");
const connectionString = process.env.MONGO_URL;
const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let dbConnection;

module.exports = {
    connectToServer: function (callback) {
        client.connect(function (err, db) {
            if (err || !db) {
                dbConnection = null
               
                return callback(err, false);
            }

            dbConnection = db.db(process.env.DATABASE);
            

            return callback("", true);
        });
    },

    getDb: function () {
        return dbConnection;
    },
};