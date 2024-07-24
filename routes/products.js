var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId
var jwt = require('jsonwebtoken');
var fs = require('fs');
var { parse } = require('csv-parse');




const ProductModel = require('../lists/products')
const ProviderModel = require('../lists/providers')
const db = require('../database/mongooseCrud')

const multer = require('multer');

var size = 2 * 1024 * 1024;

const serviceAccount = require("./vendo-5a7dd-firebase-adminsdk-fdopp-dd6fdf5895.json");
const admin = require('firebase-admin');
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.FILE_PATH); // make sure this directory already exists!    
    },
    filename: (req, file, cb) => {
        // const newFilename = `${uuidv4()}-${file.originalname}`;
        const id = new ObjectId();
        // cb(null, newFilename);
        cb(null, id.toString() + "_" + file.originalname.replace(/ /g, "_"));
    },
});



var upload = multer({
    storage,
    limits: {
        fileSize: size
    }
}).any();

const generateOrQuery = (req) => {
    let or = []
    Object.keys(req.query || {}).forEach(e => {
        or.push({
            [e]: req.query[e]
        })
    });

    if (or.length > 0) {
        let query = {
            "$or": or
        }
        return query
    } else {
        return req.query || {}
    }
}

const validation = (req, res, next) => {
    let token = req.headers["x-request-token"] || null
    console.log(token)
    try {
        if (token === null) {
            res.send(JSON.stringify({
                result: [],
                msg: "You are not logged in",
                status: false
            }))
            return false
        }
        var decoded = jwt.verify(token, '67TYGHRE99UISFD890U43JHRWERTYDGH');
        next()
    } catch (err) {
        console.log(err.message)
        res.send(JSON.stringify({
            result: [],
            msg: err.message || "something went wrong",
            status: false
        }))
    }
}

const csvData = (file, pid = "") => {
    
    return new Promise((res, rej) => {
        const parser = parse({ delimiter: ',' }, function (err, d) {
            if (err) {
                rej({ data: [], error: err })
            } else {
                const headers = d[0]
                const data = []
                for (let i = 1; i < d.length; i++) {
                    let e = {}
                    let element = d[i]
                    headers.forEach((item, index) => {
                        if (item === "_provider") {
                            // e = {
                            //     ...e,
                            //     [item]: new ObjectId(element[index])
                            // }
                        } else if (item === "maxQuantity") {
                            e = {
                                ...e,
                                [item]: Number(element[index])
                            }
                        } else {
                            e = {
                                ...e,
                                _provider: new ObjectId(pid),
                                [item]: element[index]
                            }
                        }
                    })
                    data.push(e)
                }
                res({ data: data, error: null })
            }

        });
        fs.createReadStream(file).pipe(parser)
    })
}

router.post('/add_product/', validation, (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    upload(req, res, async (err) => {

        if (req.body.pid === undefined) {
            resBody.msg = "Please send provider ID of pid field"
            res.send(JSON.stringify(resBody))
            return false
        }

        req.body._provider = new ObjectId(req.body.pid)

        // console.log(req.files)
        // console.log(req.files.length)
        try {

            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                console.log("Multer Known Error :", err)
                resBody.msg = err.message
                resBody.status = false
                res.send(JSON.stringify(resBody))
            } else if (err) {
                // An unknown error occurred when uploading.
                console.log("Multer Unknown Error :", err)
                resBody.msg = err.message
                resBody.status = false
                res.send(JSON.stringify(resBody))
            }

            let extraBody = {}

            if ((req.files || []).length > 0) {
                req.files.forEach(i => {
                    let id = new ObjectId(i.filename.split("_")[0]);
                    extraBody[i.fieldname] = { ...i, _id: id, url: "/files/" + i.filename }
                    delete extraBody[i.fieldname].fieldname
                })
            }
        
                req.body.inStock = req.body.maxQuantity;
            
            
            let { data, error } = await db.insertOneData(ProductModel, { ...req.body, ...extraBody })

            let response = await db.updateOneDataPush(ProviderModel, { _id: req.body._provider }, {}, { _products: data })

            const message = {
                notification: {
                  title: "Vendo",
                  body: "Neues bei den Produkten in den Shops!",
                },
                topic: "new_product",
              };
            
              try {
                const response = await admin.messaging().send(message);
                console.log(`Notification sent successfully: ${response}`);
              } catch (error) {
                console.log(`Error sending notification: ${error}`);
              }

            if (error === null) {
                resBody.status = true
                resBody.result = [data]
            } else {
                resBody.msg = error.message
            }
        } catch (e) {
            console.log("Error", e)
            resBody.msg = "Something went wrong"
        }

        res.send(JSON.stringify(resBody))
    })
});

router.post('/add_products_csv/', validation, (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    upload(req, res, async (err) => {

        try {

            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                console.log("Multer Known Error :", err)
                resBody.msg = err.message
                resBody.status = false
                res.send(JSON.stringify(resBody))
            } else if (err) {
                // An unknown error occurred when uploading.
                console.log("Multer Unknown Error :", err)
                resBody.msg = err.message
                resBody.status = false
                res.send(JSON.stringify(resBody))
            }

            let path = ""
            if ((req.files || []).length > 0) {
                path = req.files[0].path
            }

            req.body._provider = new ObjectId(req.body.pid)

            let provider = await db.getData(ProviderModel, { _id: req.body._provider }, {})

            if(provider.data.length <= 0) {
                console.log(provider.error)
                resBody.msg = "Please send correct Provider ID"

                res.send(JSON.stringify(resBody))
                return false
            }

            let csv = await csvData(path, req.body.pid || "")
            
            if (csv.error !== null) {
                console.log(csv.error)
                resBody.msg = "Unable to read csv file"

                res.send(JSON.stringify(resBody))
                return false
            }

            console.log(csv.data)

            let { data, error } = await db.insertManyData(ProductModel, csv.data)
            let response = await db.updateOneDataPush(ProviderModel, { _id: req.body._provider }, {}, { _products: data })

            if (error === null) {
                console.log(data)
                resBody.status = true
                resBody.result = data
            } else {
                resBody.msg = error.message
            }
        } catch (e) {
            console.log("Error", e)
            resBody.msg = "Something went wrong"
        }

        res.send(JSON.stringify(resBody))
    })
});

router.post('/updateProduct', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    upload(req, res, async (err) => {

        // console.log(req.files)
        // console.log(req.files.length)
        try {
         
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                console.log("Multer Known Error :", err)
                resBody.msg = err.message
                resBody.status = false
                res.send(JSON.stringify(resBody))
            } else if (err) {
                // An unknown error occurred when uploading.
                console.log("Multer Unknown Error :", err)
                resBody.msg = err.message
                resBody.status = false
                res.send(JSON.stringify(resBody))
            }

            let extraBody = {}

            if ((req.files || []).length > 0) {
                req.files.forEach(i => {
                    let id = new ObjectId(i.filename.split("_")[0]);
                    extraBody[i.fieldname] = { ...i, _id: id, url: "/files/" + i.filename }
                    delete extraBody[i.fieldname].fieldname
                })
            }

            let body = req.body
            body.inStock = req.body.maxQuantity;
            let id = body.id
            var newid = new ObjectId(id);

            console.log(body)

            delete body.id

            if (body.password)
                delete body.password

              
            let { data, error } = await db.updateOneData(ProductModel, { _id: newid }, { ...body, ...extraBody }, {
                _id: 0, id: "$_id"
            })

            console.log(data, error)

            if (error === null) {
                resBody.status = true
                resBody.result = data
            } else {
                resBody.msg = error.message
            }

        } catch (e) {
            console.log(e)
            resBody.msg = "Something went wrong"
        }

        res.send(JSON.stringify(resBody))
    })
});

router.post('/deleteOneProduct', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        var id = new ObjectId(req.params.id);

        let { data, error } = await db.deleteOne(ProductModel, { _id: id })

        console.log(data, error)

        if (error === null) {
            resBody.status = true
            resBody.result = data
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.get('/getOneProduct/:id', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        var id = new ObjectId(req.params.id);

        let { data, error } = await db.getPopulatedData(ProductModel, { _id: id }, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", name: 1, deactivate: 1, maxQuantity: 1, category: 1, size: 1, ingredients: 1, status: 1, shortDescription: 1, longDescription: 1, productImage: "$productImage.url", price: 1
        })

        console.log(data, error)

        if (error === null) {
            resBody.status = true
            resBody.result = data
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.get('/getAllProduct/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        const query = req.query || {};

        let { data, error } = await db.getPopulatedData(ProductModel, query, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", name: 1, deactivate: 1, maxQuantity: 1,inStock: 1, category: 1, size: 1, ingredients: 1, status: 1, shortDescription: 1, longDescription: 1, productImage: "$productImage.url", price: 1
        })

        if (error === null) {
            resBody.status = true
            resBody.result = data
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        // console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.get('/getAllProductWithPopulate/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        const query = req.query || {};

        let { data, error } = await db.getPopulatedData(ProductModel, { ...query, deactivate: false }, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", name: 1, deactivate: 1, maxQuantity: 1, category: 1, size: 1, ingredients: 1, status: 1, shortDescription: 1, longDescription: 1, productImage: "$productImage.url", price: 1
        })

        if (error === null) {
            resBody.status = true
            resBody.result = data
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        // console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.get('/getProductsByProviderAdmin/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        const query = {
            _provider: new ObjectId((req.query || {}).pid)
        };

        let { data, error } = await db.getPopulatedData(ProductModel, query, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", name: 1, deactivate: 1, maxQuantity: 1, category: 1, size: 1, ingredients: 1, status: 1, shortDescription: 1, longDescription: 1, productImage: "$productImage.url", price: 1
        })

        if (error === null) {
            resBody.status = true
            resBody.result = data
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        // console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.get('/getProductsByProvider/', async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
      let cat=req.query.catName
        const query = {
            _provider: new ObjectId((req.query || {}).pid),
            deactivate: false,
            
        };
       
      if(cat){
        
            query.category=cat
      }


        let { data, error } = await db.getPopulatedData(ProductModel, query, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", name: 1, deactivate: 1, maxQuantity: 1,inStock:1,category: 1, size: 1, ingredients: 1, status: 1, shortDescription: 1, longDescription: 1, productImage: "$productImage.url", price: 1
        })

        if (error === null) {
            resBody.status = true
            resBody.result = data
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        // console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.get('/getAllProductWithFilter/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        const query = req.query || {};

        let { data, error } = await db.getPopulatedData(ProductModel, { ...query, deactivate: false }, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", name: 1, deactivate: 1, maxQuantity: 1, category: 1, size: 1, ingredients: 1, status: 1, shortDescription: 1, longDescription: 1, productImage: "$productImage.url", price: 1
        })

        if (error === null) {
            resBody.status = true
            resBody.result = data
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        // console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.get('/getProductsWithLimit/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        const query = generateOrQuery(req);

        let { data, error } = await db.getPopulatedDataWithLimit(ProductModel, { ...query, deactivate: false }, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", name: 1, deactivate: 1, maxQuantity: 1, category: 1, size: 1, ingredients: 1, status: 1, shortDescription: 1, longDescription: 1, productImage: "$productImage.url", price: 1
        }, 4)

        if (error === null) {
            resBody.status = true
            resBody.result = data
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        // console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

module.exports = router;