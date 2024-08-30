var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

const StaticModel = require('../lists/staticcontents')
const db = require('../database/mongooseCrud')

const validation = (req, res, next) => {
    // let token = req.headers["x-request-token"] || null
    // console.log(token)
    // try {
    //     if(token === null){
    //         res.send(JSON.stringify({
    //             result: [],
    //             msg: "You are not logged in",
    //             status: false
    //         }))
    //         return false
    //     }
    //     var decoded = jwt.verify(token, '67TYGHRE99UISFD890U43JHRWERTYDGH');
    //     console.log(decoded)
        next()
    // } catch (err) {
    //     console.log(err.message)
    //     res.send(JSON.stringify({
    //         result: [],
    //         msg: err.message || "something went wrong",
    //         status: false
    //     }))
    // }
}

router.post('/saveContent', validation, async (req, res) => {

    let resBody = {
        result: [],
        msg: "",
        status: false
    }
    try {
        const contents = await db.getData(StaticModel, {}, {
            _id: 0, id: "$_id", howItWorks: 1, contact: 1, termAndConditions: 1, imprint: 1, explanation: 1
        });

         console.log('contents',contents)
        let sid = new ObjectId(JSON.parse(JSON.stringify(contents.data[0])).id)
        console.log("Body : ", req.body)

        if (contents.data.length > 0) {
            const updateContents = await db.updateOneData(StaticModel, {
                _id: sid
            }, req.body, {});

            console.log(updateContents);

            resBody.status = true
            resBody.result = updateContents.data
        } else {
            const addcontents = await db.insertOneData(StaticModel, req.body);

            resBody.status = true
            resBody.result = addcontents.data
        }
    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
})

router.get('/getContents/', validation, async (req, res) => {

    let resBody = {
        result: [],
        msg: "",
        status: false
    }
    try {
        const contents = await db.getData(StaticModel, {}, {
            _id: 0, id: "$_id", howItWorks: 1, contact: 1, termAndConditions: 1, imprint: 1, explanation: 1
        });

        if (contents.error === null) {
            resBody.status = true
            resBody.result = contents.data
        } else {
            resBody.msg = "No content found"
        }
    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))
});


module.exports = router;