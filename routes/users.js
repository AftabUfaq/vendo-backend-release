var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
const path = require('path');

const CustomerModel = require('../lists/customers')
const OtpModel = require('../lists/otp')
const db = require('../database/mongooseCrud')

const { sendMail } = require('../system/mail');

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

const uploadFile = multer({ 
    storage: storage,
    limits: { fileSize: size }
});

const validation = (req, res, next) => {
    let token = req.headers["x-request-token"] || null
    try {
        if(token === null){
            res.status(5000).send(JSON.stringify({
                result: [],
                msg: "You are not logged in",
                status: false
            }))
            return false
        }
        next()
    } catch (err) {
       
        res.send(JSON.stringify({
            result: [],
            msg: err.message || "something went wrong",
            status: false
        }))
    }
}

router.post('/add_user/', async (req, res) => {
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

            let extraBody = {}

            if ((req.files || []).length > 0) {
                req.files.forEach(i => {
                    let id = new ObjectId(i.filename.split("_")[0]);
                    extraBody[i.fieldname] = { ...i, _id: id, url: "/files/" + i.filename }
                    delete extraBody[i.fieldname].fieldname
                })
            }
            // ENCRYPTED PASSWORD
            const password = req.body.password;
            const pass = crypto.createHash('sha256').update(password).digest('base64');
            req.body.password = pass

            let { data, error } = await db.insertOneData(CustomerModel, {...req.body, ...extraBody})

            if (error === null) {
                resBody.status = true
                resBody.result = [data]
            } else {
                resBody.msg = error.message
            }


            let mailDetails = {
                from: 'vendomrtn@gmail.com',
                to: req.body.email,
                subject: 'Deine Registrierung bei Vendo',
                html: `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                
                </head>
                <body>
                <p>Lieber Vendo- Nutzer,</p></br>

                <p>vielen Dank für deine Registrierung.</p></br>
                
                <p>Mit Erhalt dieser E-Mail bestätigen wir deine Registrierung bei Vendo und wünschen Dir viel Spaß.
                Mit der Registrierung hast du unserer Datenschutzerklärung sowie unseren AGB zugestimmt. Diese sind jederzeit in der App einsehbar.</p></br>
                <p>Wir wünschen viel Freude mit Vendo.</p></br>
                <p>Dein Vendo Team</p>
                </body>
                </html>`
            };

            sendMail(mailDetails)
            .then(async (d) => {
                
            })
            .catch(err => {
                console.log(err)
                resBody.msg = "Trouble sending email."
                res.send(JSON.stringify(resBody))
            })

        } catch (e) {
        	if(e.error.code == 11000 && e.error.keyPattern.email == 1)
			{
				resBody.msg = "This email is already associated with another account. Please try with some different email."
			}
			else
			{
				resBody.msg = "Something went wrong"
			}
        }

        res.send(JSON.stringify(resBody))
    })
});

router.post('/login', async (req, res) => {
    console.log('login works');
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    const email = req.body.email;
    const password = req.body.password;
    const deviceToken = req.body.deviceToken;

    try {
        // ENCRYPTED PASSWORD
        const pass = crypto.createHash('sha256').update(password).digest('base64');

        let { data, error } = await db.getData(CustomerModel, { email: email, password: pass, deactivate: false }, {
            _id: 0, id: "$_id", email: 1, userName: 1, name: 1, street: 1, number: 1, postcode: 1, place: 1, region: 1, mobile: 1, email: 1, deliveryNote: 1, picture: "$picture.url", deactivate: 1, emailVerified: 1
        })

        console.log(error)

        if (error === null) {

            let { data6, error6 } = await db.updateOneDataPush(CustomerModel, { email: email}, {
                token:deviceToken
              }, {})
          

            if (data.length > 1) {
                resBody.msg = "Duplicate users exists with that email address"
            } else if (data.length === 1) {
                const token = jwt.sign({
                    data: data[0]
                }, '67TYGHRE99UISFD890U43JHRWERTYDGH', { expiresIn: '180d' });

                resBody.status = true
                resBody.result = {
                    user: data[0],
                    token: token
                }

            } else {
                resBody.msg = "invalid credentials"
            }
        } else {
            resBody.msg = error.message
        }
    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))

});

router.post('/resetPassword', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        const email = req.body.email;
        const password = req.body.oldPassword;
        const newpassword = req.body.newPassword;
        const pass = crypto.createHash('sha256').update(password).digest('base64');
        const newpass = crypto.createHash('sha256').update(newpassword).digest('base64');

        let response = await db.getData(CustomerModel, { email: email, password: pass }, {
            _id: 0, id: "$_id", email: 1, userName: 1, name: 1, street: 1, number: 1, postcode: 1, place: 1, region: 1, mobile: 1, email: 1, deliveryNote: 1, picture: "$picture.url", deactivate: 1, emailVerified: 1
        })

        if (response.error === null) {
            if (response.data.length > 1) {
                resBody.msg = "Duplicate users exists with that email address"
            } else if (response.data.length === 1) {
                var id = new ObjectId(JSON.parse(JSON.stringify(response.data[0])).id);
                // console.log(JSON.parse(JSON.stringify(response.data[0])).id)

                let { data, error } = await db.updateOneData(CustomerModel, { _id: id }, { password: newpass }, {
                    _id: 0, id: "$_id"
                })

                console.log(data, error)

                if (error === null) {
                    resBody.status = true
                    resBody.result = data
                } else {
                    resBody.msg = error.message
                }

            } else {
                resBody.msg = "No user found"
            }
        } else {
            resBody.msg = error.message
        }
    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))

});

router.post('/sendOtp/', async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }
    console.log(req.body)

    try {

        let email = req.body.email;

        let { data, error } = await db.getData(CustomerModel, { email: email }, {
            _id: 1, id: "$_id", email: 1
        })

        var id = new ObjectId(JSON.parse(JSON.stringify(data[0])).id);

        if (error === null) {
            resBody.status = true
        } else {
            resBody.msg = error.message
            res.send(JSON.stringify(resBody))
        }

        if (data.length < 1) {
            resBody.msg = "No user found"
            res.send(JSON.stringify(resBody))
        }

        console.log(data[0]);

        const otp = crypto.randomInt(1111, 9999)
        console.log(otp)

        let mailDetails = {
            from: 'vendomrtn@gmail.com',
            to: email,
            // subject: 'OTP for new password generation!',
            // text: `Your OTP is ${otp}`
            subject: 'Dein Vendo Passwort zurücksetzen',
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            
            </head>
            <body>
            <p>Lieber Vendo Nutzer,</p></br>

        <p>hier ist der einmalig zu nutzende Code um dein Passwort zurück zu setzen:<p></br>

       ${otp}</br> 

       <p>Wir wünschen viel Freude mit Vendo.</p></br>
       <p>Dein Vendo Team</p>
            </body>
            </html>`
        };

        sendMail(mailDetails)
            .then(async (d) => {

                let response = await db.insertOneData(OtpModel, {
                    email: email,
                    otp: otp,
                    timestamp: (new Date()).getTime(),
                    uid: id
                }, {
                    _id: 1, id: "$_id", email: 1
                })

                if (response.error === null) {
                    resBody.status = true
                    resBody.result = ["Otp has been sent"]
                } else {
                    resBody.msg = error.message
                }

                console.log(d)
                res.send(JSON.stringify(resBody))
            })
            .catch(err => {
                console.log(err)
                resBody.msg = "Trouble sending email."
                res.send(JSON.stringify(resBody))
            })

    } catch (e) {
        console.log(e)
        resBody.msg = "user not exist"
        res.send(JSON.stringify(resBody))
    }

});

router.post('/resetOtpPassword', async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        const email = req.body.email;
        const newpassword = req.body.newPassword;
        const newpass = crypto.createHash('sha256').update(newpassword).digest('base64');
        const otp = Number(req.body.otp);

        let { data, error } = await db.getData(OtpModel, { email: email, otp: otp }, {
            _id: 1, id: "$_id", uid: 1, email: 1
        })

        var id = new ObjectId(data[0].uid);

        if (error === null) {
            resBody.status = true
        } else {
            resBody.msg = error.message
            res.send(JSON.stringify(resBody))
        }

        if (data.length < 1) {
            resBody.msg = "No record found"
            res.send(JSON.stringify(resBody))
        }

        console.log(data);

        if (data.length > 1) {
            resBody.msg = "Duplicate users exists with that email address"
        } else if (data.length === 1) {
            let response = await db.updateOneData(CustomerModel, { _id: id }, { password: newpass }, {
                _id: 1, id: "$_id", uid: 1, email: 1
            })

            console.log(response);

            if (response.error === null) {
                resBody.status = true
                resBody.result = [response.data]
            } else {
                resBody.msg = error.message
            }

        } else {
            resBody.msg = "Wrong OTP or email"
        }
    } catch (e) {
        console.log(e)
        resBody.msg = "Something went wrong"
    }

    res.send(JSON.stringify(resBody))

});

router.post('/updateUser', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    upload(req, res, async (err) => {
		console.log(req.body);
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

            delete body.id

            if (body.password)
                delete body.password

            var newid = new ObjectId(id);

            let { data, error } = await db.updateOneData(CustomerModel, { _id: newid }, {...body, ...extraBody}, {
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

router.post('/deleteOneUser', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        var id = new ObjectId(req.body.id);

        let { data, error } = await db.deleteOne(CustomerModel, { _id: req.body.id })

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

router.get('/getOneUser/:id', validation, async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {
        var id = new ObjectId(req.params.id);

        let { data, error } = await db.getData(CustomerModel, { _id: id }, {
            _id: 0, id: "$_id", email: 1, userName: 1, name: 1, street: 1, number: 1, postcode: 1, place: 1, region: 1, mobile: 1, email: 1, deliveryNote: 1, picture: "$picture.url", deactivate: 1, emailVerified: 1
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

router.get('/getAllUsers/', async (req, res) => {
    let resBody = {
        result: [],
        msg: "",
        status: false
    }

    try {

        let { data, error } = await db.getData(CustomerModel, {}, {
            _id: 0, id: "$_id", email: 1, userName: 1, name: 1, street: 1, number: 1, postcode: 1, place: 1, region: 1, mobile: 1, email: 1, deliveryNote: 1, picture: "$picture.url", deactivate: 1, emailVerified: 1,token:1
        })

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

router.post('/uploadProfile', uploadFile.single('image'), (req, res) => {
    try {
        // Construct the image URL
        const hostname = req.headers.host;
        const imageUrl = `https://${hostname}${path.join('/storage', req.file.filename)}`;

        // Send response with the image URL
        res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            url: imageUrl
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Upload failed", error });
    }
});

module.exports = router;