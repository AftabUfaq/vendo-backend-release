var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId
var jwt = require('jsonwebtoken');

const VoucherModel = require('../lists/vouchers')
const VoucherTransactionModel = require('../lists/voucherTransaction')
const ProviderModel = require('../lists/providers')
const CustomerModel = require('../lists/customers')
const db = require('../database/mongooseCrud')

const multer = require('multer');

var size = 2 * 1024 * 1024;
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
        console.log(decoded)
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

router.post('/add_voucher/', validation, (req, res) => {
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

            let { data, error } = await db.insertOneData(VoucherModel, { ...req.body, ...extraBody })

            let response = await db.updateOneDataPush(ProviderModel, { _id: req.body._provider }, {}, { _vouchers: data })

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

router.post('/updateVoucher', validation, async (req, res) => {
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
            let id = body.id

            console.log(body)

            delete body.id

            if (body.password)
                delete body.password

            var newid = new ObjectId(id);

            let { data, error } = await db.updateOneData(VoucherModel, { _id: newid }, { ...body, ...extraBody }, {
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

router.post('/deleteOneVoucher', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        var id = new ObjectId(req.params.id);

        let { data, error } = await db.deleteOne(VoucherModel, { _id: id })

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
router.get('/getOneVoucher1/:id', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        var id = new ObjectId(req.params.id);

        let { data, error } = await db.getPopulatedData(VoucherModel, { _id: id }, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _customer: 1, iswelcome: 1
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
router.get('/getOneVoucher/:id', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        var id = new ObjectId(req.params.id);

        let { data, error } = await db.getPopulatedData(VoucherModel, { _id: id }, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _customer: 1, iswelcome: 1
        })

        console.log(data, error)
        var data1 = [];
        var j = 0;
        let date_ob = new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();


        // prints date in YYYY-MM-DD format
        let cdate = new Date(year + "-" + month + "-" + date);
        if (error === null) {
            for (var i = 0; i < data.length; i++) {

                let firstDate = new Date(data[i].startDate),
                    secondDate = new Date(data[i].endDate),
                    timeDifference = cdate.getTime() - firstDate.getTime(), timeDifference1 = cdate.getTime() - secondDate.getTime();;
                //data1[j]=timeDifference1;
                //j++;
                if (timeDifference >= 0 && timeDifference1 <= 0) {
                    data1[j] = data[i];
                    j++;
                }

            }
            resBody.status = true
            resBody.result = data1
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.get('/getAllVoucher/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        const query = req.query || {};

        let { data, error } = await db.getPopulatedData(VoucherModel, query, "_provider _customer", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _history: 1, iswelcome: 1
        })
        var data1 = [];
        if (error === null) {
            //             for(var i=0;i<data.length;i++){

            //                 let firstDate = new Date(data[i].startDate),
            //                     secondDate = new Date(data[i].endDate),
            // timeDifference = Math.abs(secondDate.getTime() - firstDate.getTime());
            //                 if(timeDifference>=0){
            //                     data1[i]=data[i];
            //                      }

            //                     }
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

router.get('/getAllVoucherWithPopulate/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        const query = req.query || {};

        let { data, error } = await db.getPopulatedData(VoucherModel, query, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _history: 1, iswelcome: 1
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

router.get('/getAllVoucherWithFilter/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        const query = req.query || {};

        let { data, error } = await db.getPopulatedData(VoucherModel, query, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _history: 1, iswelcome: 1
        })
        var data1 = [];
        var j = 0;
        let date_ob = new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();


        // prints date in YYYY-MM-DD format
        let cdate = new Date(year + "-" + month + "-" + date);
        if (error === null) {
            for (var i = 0; i < data.length; i++) {

                let firstDate = new Date(data[i].startDate),
                    secondDate = new Date(data[i].endDate),
                    timeDifference = cdate.getTime() - firstDate.getTime(), timeDifference1 = cdate.getTime() - secondDate.getTime();;
                //data1[j]=timeDifference1;
                //j++;
                if (timeDifference >= 0 && timeDifference1 <= 0) {
                    data1[j] = data[i];
                    j++;
                }

            }
            resBody.status = true
            resBody.result = data1
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        // console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.get('/getAllVoucherByProviderAdmin/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        const query = {
            _provider: new ObjectId((req.query || {}).pid)
        };

        let { data, error } = await db.getPopulatedData(VoucherModel, query, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _customer: 1, iswelcome: 1
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

router.get('/getAllVoucherByProvider/', async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        const query = {
            _provider: new ObjectId((req.query || {}).pid),
            deactivate: false
        };

        let { data, error } = await db.getPopulatedData(VoucherModel, query, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _customer: 1, iswelcome: 1
        })
        var data1 = [];
        var j = 0;
        let date_ob = new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();


        // prints date in YYYY-MM-DD format
        let cdate = new Date(year + "-" + month + "-" + date);
        if (error === null) {
            for (var i = 0; i < data.length; i++) {

                let firstDate = new Date(data[i].startDate),
                    secondDate = new Date(data[i].endDate),
                    timeDifference = cdate.getTime() - firstDate.getTime(), timeDifference1 = cdate.getTime() - secondDate.getTime();;
                //data1[j]=timeDifference1;
                //j++;
                if (timeDifference >= 0 && timeDifference1 <= 0) {
                    data1[j] = data[i];
                    j++;
                }

            }
            resBody.status = true
            resBody.result = data1
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        // console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.get('/getAllVoucherByCustomerProvider/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        const query = {
            _provider: new ObjectId((req.query || {}).pid),
            deactivate: false
        };

        let { data, error } = await db.getPopulatedData(VoucherModel, query, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1, iswelcome: 1 }, {
            _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _customer: 1
        })

        let voucherTransaction = await db.getPopulatedData(VoucherTransactionModel, {
            _provider: new ObjectId((req.query || {}).pid),
            _customer: new ObjectId((req.query || {}).cid)
        }, "_voucher", {
            _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _providerId: "$_provider"
        }, {
            _id: 0, id: "$_id", _voucherId: "$_voucher", _customer: 1, timestamp: 1, quantity: 1, status: 1, redeemed: 1, redeemedTimestamp: 1, _providerId: "$_provider"
        })
        var data1 = [];
        var j = 0;
        let date_ob = new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();


        // prints date in YYYY-MM-DD format
        let cdate = new Date(year + "-" + month + "-" + date);
        if (error === null) {
            for (var i = 0; i < data.length; i++) {

                let firstDate = new Date(data[i].startDate),
                    secondDate = new Date(data[i].endDate),
                    timeDifference = cdate.getTime() - firstDate.getTime(), timeDifference1 = cdate.getTime() - secondDate.getTime();;
                //data1[j]=timeDifference1;
                //j++;
                if (timeDifference >= 0 && timeDifference1 <= 0) {
                    data1[j] = data[i];
                    j++;
                }

            }
            resBody.status = true
            resBody.result = data1
            resBody.extraResult = voucherTransaction.data
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.get('/getVouchersWithLimit/', async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        const query = generateOrQuery(req);

        // let { data, error } = await db.getData(VoucherModel, { ...query, deactivate: false }, "_provider _customer", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1}, {
        //     _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _history: 1,iswelcome:1 
        // }, 4)
        let { data, error } = await db.getPopulatedData(VoucherModel, query, "_provider _customer", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
            _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _history: 1, iswelcome: 1, deactivate: 1
        })


        var data1 = [];
        var j = 0;
        let date_ob = new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();


        // prints date in YYYY-MM-DD format
        let cdate = new Date(year + "-" + month + "-" + date);
        if (error === null) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].iswelcome == true && data[i].deactivate == false) {
                    let firstDate = new Date(data[i].startDate),
                        secondDate = new Date(data[i].endDate),
                        timeDifference = cdate.getTime() - firstDate.getTime(), timeDifference1 = cdate.getTime() - secondDate.getTime();;
                    //data1[j]=timeDifference1;
                    //j++;
                    if (timeDifference >= 0 && timeDifference1 <= 0) {
                        data1[j] = data[i];
                        j++;
                    }
                }

            }
            resBody.status = true
            resBody.result = data1
        } else {
            resBody.msg = error.message
        }

    } catch (e) {
        // console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.post('/collectVoucher_old/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        let query = {
            $expr: { $gte: [{ $subtract: ["$quantity", "$voucherTaken"] }, req.body.voucherQuantity] }, _id: new ObjectId(req.body.vid), deactivate: false
        }

        const getVoucher = await db.getData(VoucherModel, query, { _id: 1 })

        if (getVoucher.error !== null || getVoucher.data.length <= 0) {
            resBody.msg = "Please select less quantity"

            res.send(JSON.stringify(resBody))

            return false
        }

        const response1 = await db.insertOneData(VoucherTransactionModel, {
            _voucher: new ObjectId(req.body.vid),
            timestamp: (new Date()).getTime(),
            _customer: new ObjectId(req.body.cid),
            quantity: req.body.voucherQuantity,
            status: "voucher"
        })

        if (response1.error === null) {

            let update = {
                "$inc": { voucherTaken: req.body.voucherQuantity }
            }

            let pushBody = {
                // _history: {
                //     timestamp: (new Date()).getTime(),
                //     cid: req.body.cid,
                //     quantity: req.body.voucherQuantity
                // },
                _voucherTransaction: response1.data,
                _customer: new ObjectId(req.body.cid)
            }

            let { data, error } = await db.updateOneDataPushUniqueWithoutSet(VoucherModel, query, update, pushBody)
            console.log(data)

            const customerResponse = await db.updateOneDataPushUnique(CustomerModel, { _id: new ObjectId(req.body.cid) }, { voucherTaken: true }, {
                _voucher: new ObjectId(req.body.vid),
                _voucherTransaction: response1.data
            })

            if (error === null) {
                resBody.status = true
                resBody.result = data
            } else {
                resBody.msg = (error || {}).message || "unknown error"
            }
        } else {
            resBody.msg = "data not updated"
        }

    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))

});

router.post('/collectVoucher/', validation,async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        
        let customerId = req.body.cid;
        let providerId = req.body.pid; 
        let voucherId = req.body.vid;

        if(!customerId || !providerId || !voucherId){
            
            resBody.msg= "Please make sure to provide customer id, provider id and voucher id.";

            res.send(JSON.stringify(resBody))

            return false
        }
        
        
        
        let query = {
            _id: new ObjectId(req.body.vid), quantity: { $gte: 1 }, deactivate: false
        }
        
        const getVoucher = await db.getData(VoucherModel, query, { _id: 1, isUnique: 1 })
        
        if(getVoucher.data.length < 1){
            resBody.msg = "Voucher not found, pleas double check your request.."
                
            res.send(JSON.stringify(resBody))

            return false
        }

        // check to see if the voucher is unique and is already taken by the user
        if(getVoucher.data[0].isUnique){
            


            // check for voucherTransaction
            const transactionOfTheVoucher= await db.getData(VoucherTransactionModel, {
                _voucher: new ObjectId(req.body.vid),
                _customer: new ObjectId(req.body.cid)
            }) 



            if(transactionOfTheVoucher.data.length > 0){
                

                resBody.msg = "Der Gutschein ist nicht mehr verfügbar.."
                
                res.send(JSON.stringify(resBody))

                return false
            }
        }


        if (getVoucher.error !== null || getVoucher.data.length <= 0) {
            resBody.msg = "Voucher is not available at the moment"

            res.send(JSON.stringify(resBody))

            return false
        }

        const response1 = await db.insertOneData(VoucherTransactionModel, {
            _voucher: new ObjectId(req.body.vid),
            _provider: new ObjectId(req.body.pid),
            timestamp: (new Date()).getTime(),
            _customer: new ObjectId(req.body.cid),
            quantity: 1,
            status: "voucher"
        })

        if (response1.error === null) {

            let update = {
                "$inc": { voucherTaken: 1, quantity: -1 }
            }

            let pushBody = {
                // _history: {
                //     timestamp: (new Date()).getTime(),
                //     cid: req.body.cid,
                //     quantity: req.body.voucherQuantity
                // },
                _voucherTransaction: response1.data,
                _customer: new ObjectId(req.body.cid)
            }

            let { data, error } = await db.updateOneDataPushUniqueWithoutSet(VoucherModel, query, update, pushBody)
            console.log(data)

            const customerResponse = await db.updateOneDataPushUnique(CustomerModel, { _id: new ObjectId(req.body.cid) }, { voucherTaken: true }, {
                _voucher: new ObjectId(req.body.vid),
                _voucherTransaction: response1.data
            })

            if (error === null) {
                resBody.status = true
                resBody.result = data
            } else {
                resBody.msg = (error || {}).message || "unknown error"
            }
        } else {
            resBody.msg = "data not updated"
        }

    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))

});

router.post('/redeemVoucher_old/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        console.log(req.body)

        const query1 = [{
            "$match": {
                _voucher: new ObjectId(req.body.vid), _customer: new ObjectId(req.body.cid), status: "voucher"
            }
        }, {
            "$group": {
                _id: null, totalQuantity: { $sum: "$quantity" }
            }
        }]

        const query2 = [{
            "$match": {
                _voucher: new ObjectId(req.body.vid), _customer: new ObjectId(req.body.cid), status: "redeemed"
            }
        }, {
            "$group": {
                _id: null, totalRedeemed: { $sum: "$quantity" }
            }
        }]

        let result1 = await db.getAggregateData(VoucherTransactionModel, query1)
        console.log(result1)
        let result2 = await db.getAggregateData(VoucherTransactionModel, query2)
        console.log(result2)

        if (result1.error === null && result2.error === null) {
            if (result1.data.length > 0) {
                let diff = result1.data[0].totalQuantity
                if (result2.data.length > 0) {
                    diff = diff - result2.data[0].totalRedeemed
                }

                if (diff > 0 && diff >= req.body.quantity) {

                    const response1 = await db.insertOneData(VoucherTransactionModel, {
                        _voucher: new ObjectId(req.body.vid),
                        timestamp: (new Date()).getTime(),
                        _customer: new ObjectId(req.body.cid),
                        quantity: req.body.quantity,
                        status: "redeemed"
                    })

                    const voucherResponse = await db.updateOneDataPushUnique(VoucherModel, {
                        _id: new ObjectId(req.body.vid)
                    }, {}, {
                        _voucherTransaction: response1.data,
                        _redeemedBy: new ObjectId(req.body.cid)
                    })

                    const customerResponse = await db.updateOneDataPushUnique(CustomerModel, {
                        _id: new ObjectId(req.body.cid)
                    }, {}, {
                        _voucherTransaction: response1.data
                    })

                    if (response1.error === null) {
                        resBody.status = true
                        resBody.result = "Voucher redeemed"
                    } else {
                        resBody.msg = "You can't redeem voucher. Something went wrong"
                    }

                } else {
                    resBody.msg = "You can't redeem voucher"
                }
            } else {
                resBody.msg = "You can't redeem voucher. Please take voucher first"
            }


        } else {
            resBody.msg = "Something went wrong"
        }

    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.post('/redeemVoucher/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        console.log(req.body)

        var voucher_doc = await VoucherModel.findOne({ "_id": req.body.vid }).exec();
        if (voucher_doc) {
            if (voucher_doc.deactivate == true) {
                resBody.status = false;
                resBody.result = "Gutschein deaktiviert";
                res.send(JSON.stringify(resBody));
                return false;
            }
            var current_date = new Date().getTime();
            var voucher_end_date = new Date(voucher_doc.endDate).getTime();
            if (current_date > voucher_end_date) {
                resBody.status = false;
                resBody.result = "Gutscheindatum ist abgelaufen";
                res.send(JSON.stringify(resBody));
                return false;
            }
        }

        const match = {
            _id: new ObjectId(req.body.vtid),
            _voucher: new ObjectId(req.body.vid),
            redeemed: false
        }

        let result1 = await db.updateOneData(VoucherTransactionModel, match, {
            redeemedTimestamp: (new Date()).getTime(),
            redeemed: true,
            status: "redeemed"
        }, {})
        console.log(result1)

        if (result1.error === null && (result1.data || {}).modifiedCount === 1) {
            const voucherResponse = await db.updateOneDataPushUnique(VoucherModel, {
                _id: new ObjectId(req.body.vid)
            }, {}, {
                _redeemedBy: new ObjectId(req.body.cid)
            })

            resBody.status = true
            resBody.result = "Voucher redeemed"

        } else if (result1.error === null && (result1.data || {}).modifiedCount === 0) {
            resBody.status = true
            resBody.result = "Voucher already redeemed"
        } else {
            resBody.msg = "Something went wrong"
        }

    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});

router.get('/getCustomerVouchers/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false,
    };

    try {
        const query = { _customer: new ObjectId(req.query.cid) };

        let { data, error } = await db.getPopulatedData(VoucherTransactionModel, query, "_voucher", {
            _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _providerId: "$_provider"
        }, {
            _id: 0, id: "$_id", _voucherId: "$_voucher", _customer: 1, timestamp: 1, quantity: 1, status: 1, redeemed: 1, redeemedTimestamp: 1, _providerId: "$_provider"
        })

        if (error === null) {
            let my_data = []
            data.forEach((item, index) => {
                let item2 = {...item._doc}
                let my_item =  item2._voucher
                let activeImage = my_item.activeImage.url
                let inactiveImage = my_item.inactiveImage.url
                let redemptionBarcode = my_item.redemptionBarcode.url
                let _voucher = {
                    activeImage,
                    inactiveImage,
                    redemptionBarcode,
                    _id:my_item._id,
                    id:my_item.id,
                    title:my_item.title,
                    quantity:my_item.quantity,
                    voucherTaken:my_item.voucherTaken,
                    voucherRedeemed:my_item.voucherRedeemed,
                    _provider:my_item._provider,
                    startDate:my_item.startDate,
                    endDate:my_item.endDate,
                    shortDescription:my_item.shortDescription,
                    longDescription:my_item.longDescription,
                    _customer:my_item._customer,
                    _redeemedBy:my_item._redeemedBy,
                    _voucherTransaction:my_item._voucherTransaction,
                    deactivate:my_item.deactivate,
                    iswelcome:my_item.iswelcome,
                    __v:my_item.__v,
                }
                delete item2._voucher
                my_data.push({...item2,_voucher})
            })
            resBody.status = true;
            resBody.result = my_data;
        } else {
            resBody.msg = error.message;
        }
    } catch (e) {
        console.log(e);
        resBody.msg = JSON.stringify(e);
    }

    res.send(JSON.stringify(resBody));
});

router.get('/getCustomerVouchersab/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        const query = {
            _customer: new ObjectId((req.query || {}).cid)
        };

        let { data, error } = await db.getPopulatedData(VoucherTransactionModel, query, "_voucher", {
            _id: 0, id: "$_id", title: 1, deactivate: 1, quantity: 1, startDate: 1, endDate: 1, shortDescription: 1, longDescription: 1, activeImage: "$activeImage.url", inactiveImage: "$inactiveImage.url", redemptionBarcode: "$redemptionBarcode.url", voucherTaken: 1, _redeemedBy: 1, _providerId: "$_provider"
        }, {
            _id: 0, id: "$_id", _voucherId: "$_voucher", _customer: 1, timestamp: 1, quantity: 1, status: 1, redeemed: 1, redeemedTimestamp: 1, _providerId: "$_provider"
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
router.get('/getAllVoucherTransactions/', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        const { data, error } = await db.getPopulatedData(VoucherTransactionModel, {
            redeemed: true
        }, "_voucher", {
            _id: 0, id: "$_id",
            title: 1,
            quantity: 1,
            startDate: 1,
            endDate: 1,
            category: 1,
            activeImage: 1,
            redemptionBarcode: 1,
            deactivate: 1,
            iswelcome: 1,
        }, {
            _id: 0, id: "$_id",
            quantity: 1,
            _provider: 1,
            _voucher: 1,
            _customer: 1,
            timestamp: 1,
            redeemedTimestamp: 1,
            redeemed: 1,
            status: 1,
        });

        if (error === null && data.length > 0) {
            resBody.status = true
            resBody.result = data
        } else {
            resBody.msg = "No redeemed voucher transaction found"
        }
    } catch (e) {
        console.log("Error", e)
        resBody.msg = "Something went wrong"
    }
    res.send(JSON.stringify(resBody))
});

module.exports = router;