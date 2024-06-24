require('dotenv').config()
const mongoose = require('mongoose');
const connectionString = process.env.MONGO_URL;
const database = process.env.DATABASE;

class Database {
    connection = null;
    mongoose = null;

    constructor() {
        this.mongoose = mongoose
        this.connection = this.mongoose.connection;
        
        try {
            this.connection
                .on('open', console.info.bind(console, 'Database connection: open'))
                .on('close', console.info.bind(console, 'Database connection: close'))
                .on('disconnected', console.info.bind(console, 'Database connection: disconnecting'))
                .on('disconnected', console.info.bind(console, 'Database connection: disconnected'))
                .on('reconnected', console.info.bind(console, 'Database connection: reconnected'))
                .on('fullsetup', console.info.bind(console, 'Database connection: fullsetup'))
                .on('all', console.info.bind(console, 'Database connection: all'))
                .on('error', console.error.bind(console, 'MongoDB connection: error:'));
        } catch (error) {
            console.error(error);
        }
    }

    connect(callback) {
        try {
            this.mongoose.connect(`${connectionString}`, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            })
                .then(
                    () => {
                        console.log("Database connected!")
                        callback(null, true);
                    },
                    err => {
                        callback(err, false);
                    }
                );
        } catch (error) {
            console.error(error);
            callback(error, true);
        }
    }

    async close() {
        try {
            await this.connection.close();
        } catch (error) {
            console.error(error);
        }
    }
}

module.exports = new Database();