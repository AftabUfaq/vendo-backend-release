module.exports = {
    getAggregateData: (model, query = []) => {
        return new Promise((resolve, reject) => {
            model.aggregate(query, (err, docs) => {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: docs, error: null })
                }
            });
        })
    },
    getData: (model, find = {}, projection = {}) => {
        return new Promise((resolve, reject) => {
            model.find(find, (err, docs) => {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: docs, error: null })
                }
            }).select(projection);
        })
    },
    getPopulatedData: (model, find = {}, profile = "", select = {}, projection = {}) => {
        return new Promise((resolve, reject) => {
            model.find(find).populate({ path: profile, select: select }).select(projection).exec(function (err, docs) {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: docs, error: null })
                }
            })
        })
    },

    getPopulatedDataWithLimit: (model, find = {}, profile = "", select = "", projection = {}, limit = 50) => {
        return new Promise((resolve, reject) => {
            model.find(find).populate({ path: profile, select: select }).select(projection).limit(limit).exec(function (err, docs) {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: docs, error: null })
                }
            })
        })
    },

    getPopulatedDataWithLimitSort: (model, find = {}, profile = "", select = "", projection = {}, limit = 50) => {
        return new Promise((resolve, reject) => {
            model.find(find).sort({
                "_id": -1
            }).populate({ path: profile, select: select }).select(projection).limit(limit).exec(function (err, docs) {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: docs, error: null })
                }
            })
        })
    },

    getDataWithLimit: (model, find = {}, projection = {}, limit = 10) => {
        return new Promise((resolve, reject) => {
            model.find(find, (err, docs) => {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: docs, error: null })
                }
            }).select(projection).limit(limit);
        })
    },

    getDataWithLimitSort: (model, find = {}, projection = {}, limit = 10) => {
        return new Promise((resolve, reject) => {
            model.find(find).select(projection).sort({
                "_id": -1
            }).limit(limit).exec((err, docs) => {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: docs, error: null })
                }
            });
        })
    },

    insertOneData: (model, data = {}) => {
		console.log('asche');
        return new Promise((resolve, reject) => {

            var modelAdd = new model(data);

            // save model to database
            modelAdd.save((err, result) => {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: result, error: null })
                }
            });
        })
    },

    insertManyData: (model, data = []) => {
        return new Promise((resolve, reject) => {
            model.insertMany(data, (err, result) => {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: result, error: null })
                }
            });
        })
    },

    updateOneData: (model, match = {}, data = {}, projection = {}) => {
        return new Promise((resolve, reject) => {

            model.updateOne(match, data, { new: true }, (err, result) => {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: result, error: null })
                }
            }).select(projection);
        })
    },

    updateOneDataPush: (model, match = {}, data = {}, pushdata = {}) => {
        return new Promise((resolve, reject) => {

            model.updateOne(match, { "$set": { ...data }, "$push": { ...pushdata } }, { new: true }, (err, result) => {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: result, error: null })
                }
            });
        })
    },

    updateOneDataPushUnique: (model, match = {}, data = {}, pushdata = {}) => {
        return new Promise((resolve, reject) => {

            model.updateOne(match, { "$set": { ...data }, "$addToSet": { ...pushdata } }, { new: true }, (err, result) => {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: result, error: null })
                }
            });
        })
    },

    updateOneDataPushUniqueWithoutSet: (model, match = {}, data = {}, pushdata = {}) => {
        return new Promise((resolve, reject) => {

            model.updateOne(match, { ...data , "$addToSet": { ...pushdata } }, { new: true }, (err, result) => {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: result, error: null })
                }
            });
        })
    },

    deleteOne: (model, match = {}) => {
        return new Promise((resolve, reject) => {

            model.deleteOne(match, (err, result) => {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: result, error: null })
                }
            });
        })
    },

    removeOneDataObject: (model, match = {}, pulldata = {}) => {
        return new Promise((resolve, reject) => {

            model.updateOne(match, { "$pull": { ...pulldata } }, { safe: true, multi: false }, (err, result) => {
                if (err) {
                    console.log(err)
                    reject({ data: [], error: err })
                } else {
                    resolve({ data: result, error: null })
                }
            });
        })
    },

};