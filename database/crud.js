const dbo = require('../database/mongo');

dbo.connectToServer((rej, res) => {
    // console.log(rej, res)
})

module.exports = {
    dbo: function () {
        return dbo;
    },
    getData: (collection, find = {}, projection = {}) => {
        return new Promise((resolve, reject) => {
            const dbConnect = dbo.getDb();
            if (dbConnect === null) {
                reject({ data: null, erorr: { message: "DB connection  error" } })
            } else {
                dbConnect
                    .collection(collection)
                    .find(find, { projection: projection })
                    .limit(50)
                    .toArray(function (err, result) {
                        if (err) {
                            console.log(err)
                            reject({ data: null, error: err })
                        } else {
                            resolve({ data: result, error: null })
                        }
                    });
            }
        })
    },
    insertOneData: (collection, data = {}) => {
        return new Promise((resolve, reject) => {
            const dbConnect = dbo.getDb();
            if (dbConnect === null) {
                reject({ data: null, erorr: { message: "DB connection  error" } })
            } else {
                dbConnect
                    .collection(collection)
                    .insertOne(data, function (err, result) {
                        if (err) {
                            console.log(err)
                            reject({ data: null, error: err })
                        } else {
                            resolve({ data: result, error: null })
                        }
                    });
            }
        })
    },
    updateOneData: (collection, match = {}, data = {}) => {
        return new Promise((resolve, reject) => {
            const dbConnect = dbo.getDb();
            if (dbConnect === null) {
                reject({ data: null, erorr: { message: "DB connection  error" } })
            } else {
                var newvalues = { $set: {  } };
                dbConnect
                    .collection(collection)
                    .updateOne(data, function (err, result) {
                        if (err) {
                            console.log(err)
                            reject({ data: null, error: err })
                        } else {
                            resolve({ data: result, error: null })
                        }
                    });
            }
        })
    }

};