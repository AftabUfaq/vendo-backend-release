var express = require("express");
var router = express.Router();
var ObjectId = require("mongodb").ObjectId;
var crypto = require("crypto");
var jwt = require("jsonwebtoken");
var fs = require("fs");
var path = require("path");

const ProviderModel = require("../lists/providers");
const PrefeedModel = require("../lists/prfeed");
const Setting = require("../lists/setting");
const OtpModel = require("../lists/otp");
const db = require("../database/mongooseCrud");
const ProviderLikeRoot = require("../lists/root_provider_like");
const ProviderAvailibility = require('../lists/providerAvailability')
const ProviderWishlistRoot = require("../lists/root_provider_wishlist");
const { sendMail } = require("../system/mail");

const multer = require("multer");

var size = 36 * 1024 * 1024;
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
    fileSize: size,
  },
}).any();

const generateOrQuery = (req) => {
  let or = [];
  Object.keys(req.query || {}).forEach((e) => {
    or.push({
      [e]: req.query[e],
    });
  });

  if (or.length > 0) {
    let query = {
      $or: or,
    };
    return query;
  } else {
    return req.query || {};
  }
};

const validation = (req, res, next) => {
  // let token = req.headers["x-request-token"] || null;
  // console.log("token", token);
  // try {
  //   if (token === null) {
  //     res.send(
  //       JSON.stringify({
  //         result: [],
  //         msg: "You are not logged in",
  //         status: false,
  //       })
  //     );
  //     return false;
  //   }
  //   var decoded = jwt.verify(token, "67TYGHRE99UISFD890U43JHRWERTYDGH");
   // console.log(decoded);
    next();
  // } catch (err) {
  //   console.log(err.message);
  //   res.send(
  //     JSON.stringify({
  //       result: [],
  //       msg: err.message || "something went wrong",
  //       status: false,
  //     })
  //   );
  // }
};

const uploadImage = async (base64image, fieldname) => {
  try {
    // to declare some path to store your converted image
    // var matches = base64image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
    response = {};
    // console.log("LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL",matches);
    // if (matches.length !== 3) {
    // 	return ['Invalid input string', null]
    // }

    // response.type = matches[1];
    const base64 = fs.readFileSync("path-to-image.jpg", base64image);
    response.type = "image/png";
    response.data = Buffer.from(base64, "base64");
    let decodedImg = response;
    let imageBuffer = decodedImg.data;
    let type = decodedImg.type;

    let extension = type.split("/")[1];
    let fileName = `${+new Date()}-${fieldname}.` + extension;
    // fs.writeFileSync(path.join(__dirname, "../files/") + fileName, imageBuffer, 'utf8');
    fs.writeFileSync(process.env.FILE_PATH, imageBuffer, "utf8");
    return [null, fileName];
  } catch (e) {
    console.error(e);
    return [e, null];
  }
};

router.post("/add_user/", validation, (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  upload(req, res, async (err) => {
    // console.log(req.files)
    // console.log(req.files.length)
    try {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.log("Multer Known Error :", err);
        resBody.msg = err.message;
        resBody.status = false;
        res.send(JSON.stringify(resBody));
      } else if (err) {
        // An unknown error occurred when uploading.
        console.log("Multer Unknown Error :", err);
        resBody.msg = err.message;
        resBody.status = false;
        res.send(JSON.stringify(resBody));
      }

      let extraBody = {};

      if ((req.files || []).length > 0) {
        req.files.forEach((i) => {
          let id = new ObjectId(i.filename.split("_")[0]);
          extraBody[i.fieldname] = {
            ...i,
            _id: id,
            url: "/files/" + i.filename,
          };
          delete extraBody[i.fieldname].fieldname;
        });
      }

      // console.log(extraBody);

      //const password = req.body.password;

      // ENCRYPTED PASSWORD
      //const pass = crypto.createHash('sha256').update(password).digest('base64');
      //req.body.password = pass

      let { data, error } = await db.insertOneData(ProviderModel, {
        ...req.body,
        update_time: new Date().toISOString(),
        ...extraBody,
      });

      let notificationsMeta= await db.getData(NotificationsTrack, {notificationType: "provider"})


            if(notificationsMeta.data.length == 0){
                const message = {
                    notification: {
                      title: "Vendo",
                      body: "Neuer Anbieter bei VENDO!",
                    },
                    topic: "new_provider",
                  };
                  try {
                    await new NotificationsTrack({ notificationType: "product", lastNotification:   Math.floor(new Date().getTime()/1000)}).save();
                    const response = await admin.messaging().send(message);
                    console.log(`Notification sent successfully: ${response}`);
                  } catch (error) {
                    console.log(`Error sending notification: ${error}`);
                  }
            }else{

                const lastNotification = new Date(notificationsMeta.data[0].lastNotification).getTime()/1000;
                const now = new Date();
                const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).getTime()/1000;
                const fourHoursInMilliseconds = 4 * 60 * 60 * 1000;
                
                console.log("lastNotification", lastNotification, "now", now, "fourHoursAgo", fourHoursAgo, lastNotification < fourHoursAgo);

                if((now.getTime()/1000 - lastNotification) <= fourHoursInMilliseconds){
                      // Send the push notification

                      const message = {
                        notification: {
                          title: "Vendo",
                          body: "Neuer Anbieter bei VENDO!",
                        },
                        topic: "new_provider",
                      };
                    
                      try {
                        const response = await admin.messaging().send(message);
                        console.log(`Notification sent successfully: ${response}`);
                        await db.updateOneData(NotificationsTrack, {notificationType: "product"}, {lastNotification:  Math.floor(new Date().getTime()/1000)});
                      } catch (error) {
                        console.log(`Error sending notification: ${error}`);
                      }
                 }
                 else{
                    console.log("Notification was sent less than 4 hours ago.");
                 }
            }

      if (error === null) {
        resBody.status = true;
        resBody.result = [data];
      } else {
        resBody.msg = error.message;
      }
    } catch (e) {
      console.log("Error", e);
      if (e.error.code == 11000 && e.error.keyPattern.email == 1) {
        resBody.msg =
          "This email is already associated with another provider. Please try with some different email.";
      } else {
        resBody.msg = "Something went wrong";
      }
    }

    res.send(JSON.stringify(resBody));
  });
});

router.post("/login", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  const email = req.body.email;
  const password = req.body.password;

  try {
    // ENCRYPTED PASSWORD
    const pass = crypto.createHash("sha256").update(password).digest("base64");

    let { data, error } = await db.getData(
      ProviderModel,
      { email: email, password: pass, deactivate: false },
      {
        _id: 0,
        id: "$_id",
        email: 1,
        providerName: 1,
        postcode: 1,
        address: 1,
        region: 1,
        postcode: 1,
        branch: 1,
        telephone: 1,
        mobile: 1,
        domain: 1,
        logoname: "$logo.url",
        deactivate: 1,
        emailVerified: 1,
        availability: 1,
        paypalMode: 1,
        cashMode: 1,
        flyer: "$flyer.url",
        category: 1,
      }
    );

    console.log(error);

    if (error === null) {
      if (data.length > 1) {
        resBody.msg = "Duplicate users exists with that email address";
      } else if (data.length === 1) {
        const token = jwt.sign(
          {
            data: data[0],
          },
          "67TYGHRE99UISFD890U43JHRWERTYDGH",
          { expiresIn: "180d" }
        );

        resBody.status = true;
        resBody.result = {
          user: data[0],
          token: token,
        };
      } else {
        resBody.msg = "No user found";
      }
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    console.log(e);
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.post("/resetPassword", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    const email = req.body.email;
    const password = req.body.oldPassword;
    const newpassword = req.body.newPassword;
    const pass = crypto.createHash("sha256").update(password).digest("base64");
    const newpass = crypto
      .createHash("sha256")
      .update(newpassword)
      .digest("base64");

    let response = await db.getData(
      ProviderModel,
      { email: email, password: pass },
      {
        _id: 0,
        id: "$_id",
        email: 1,
        userName: 1,
        name: 1,
        street: 1,
        number: 1,
        postcode: 1,
        place: 1,
        region: 1,
        mobile: 1,
        email: 1,
        deliveryNote: 1,
        picture: 1,
        deactivate: 1,
        emailVerified: 1,
      }
    );

    if (response.error === null) {
      if (response.data.length > 1) {
        resBody.msg = "Duplicate users exists with that email address";
      } else if (response.data.length === 1) {
        var id = new ObjectId(JSON.parse(JSON.stringify(response.data[0])).id);
        // console.log(JSON.parse(JSON.stringify(response.data[0])).id)

        let { data, error } = await db.updateOneData(
          ProviderModel,
          { _id: id },
          { password: newpass },
          {
            _id: 0,
            id: "$_id",
          }
        );

        console.log(data, error);

        if (error === null) {
          resBody.status = true;
          resBody.result = data;
        } else {
          resBody.msg = error.message;
        }
      } else {
        resBody.msg = "No user found";
      }
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    console.log(e);
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.post("/sendOtp/", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };
  console.log(req.body);

  try {
    let email = req.body.email;

    let { data, error } = await db.getData(
      ProviderModel,
      { email: email },
      {
        _id: 1,
        id: "$_id",
        email: 1,
      }
    );

    var id = new ObjectId(JSON.parse(JSON.stringify(data[0])).id);

    if (error === null) {
      resBody.status = true;
    } else {
      resBody.msg = error.message;
      res.send(JSON.stringify(resBody));
    }

    if (data.length < 1) {
      resBody.msg = "No user found";
      res.send(JSON.stringify(resBody));
    }

    console.log(data[0]);

    const otp = crypto.randomInt(1111, 9999);
    console.log(otp);

    let mailDetails = {
      from: "vendomrtn@gmail.com",
      to: email,
      subject: "OTP for new password generation!",
      text: `Your OTP is ${otp}`,
    };

    sendMail(mailDetails)
      .then(async (d) => {
        let response = await db.insertOneData(
          OtpModel,
          {
            email: email,
            otp: otp,
            timestamp: new Date().getTime(),
            uid: id,
          },
          {
            _id: 1,
            id: "$_id",
            email: 1,
          }
        );

        if (response.error === null) {
          resBody.status = true;
          resBody.result = ["Otp has been sent"];
        } else {
          resBody.msg = error.message;
        }

        console.log(d);
        res.send(JSON.stringify(resBody));
      })
      .catch((err) => {
        console.log(err);
        resBody.msg = "Trouble sending email.";
        res.send(JSON.stringify(resBody));
      });
  } catch (e) {
    console.log(e);
    resBody.msg = "Something went wrong";
    res.send(JSON.stringify(resBody));
  }
});

router.post("/resetOtpPassword", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    const email = req.body.email;
    const newpassword = req.body.newPassword;
    const newpass = crypto
      .createHash("sha256")
      .update(newpassword)
      .digest("base64");
    const otp = Number(req.body.otp);

    let { data, error } = await db.getData(
      OtpModel,
      { email: email, otp: otp },
      {
        _id: 1,
        id: "$_id",
        uid: 1,
        email: 1,
      }
    );

    var id = new ObjectId(data[0].uid);

    if (error === null) {
      resBody.status = true;
    } else {
      resBody.msg = error.message;
      res.send(JSON.stringify(resBody));
    }

    if (data.length < 1) {
      resBody.msg = "No record found";
      res.send(JSON.stringify(resBody));
    }

    console.log(data);

    if (data.length > 1) {
      resBody.msg = "Duplicate users exists with that email address";
    } else if (data.length === 1) {
      let response = await db.updateOneData(
        ProviderModel,
        { _id: id },
        { password: newpass },
        {
          _id: 1,
          id: "$_id",
          uid: 1,
          email: 1,
        }
      );

      console.log(response);

      if (response.error === null) {
        resBody.status = true;
        resBody.result = [response.data];
      } else {
        resBody.msg = error.message;
      }
    } else {
      resBody.msg = "Wrong OTP or email";
    }
  } catch (e) {
    console.log(e);
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.post("/updateUser", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  upload(req, res, async (err) => {
    //    console.log(req.body,"kkkkkkkkkkkkkkkkkkk")
    // console.log(req.files)
    // console.log(req.files.length)
    try {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.log("Multer Known Error :", err);
        resBody.msg = err.message;
        resBody.status = false;
        res.send(JSON.stringify(resBody));
      } else if (err) {
        // An unknown error occurred when uploading.
        console.log("Multer Unknown Error :", err);
        resBody.msg = err.message;
        resBody.status = false;
        res.send(JSON.stringify(resBody));
      }

      let extraBody = {};
      var tempPRFeedData = [];

      if ((req.files || []).length > 0) {
        req.files.forEach((i) => {
          let id = new ObjectId(i.filename.split("_")[0]);
          extraBody[i.fieldname] = {
            ...i,
            _id: id,
            url: "/files/" + i.filename,
          };
          delete extraBody[i.fieldname].fieldname;
        });
      }

      let body = req.body;
      //    console.log(req.body,"LLLLLLLLLLLLLLLL")
      if (
        Object.keys(req.body).includes("company_presentation_subject_line") ||
        Object.keys(req.body).includes("company_presentation_input_text") ||
        Object.keys(extraBody).includes("company_presentation_picture_1") ||
        Object.keys(extraBody).includes("company_presentation_picture_2") ||
        Object.keys(req.body).includes(
          "company_presentation_feed_show_status"
        ) ||
        Object.keys(req.body).includes("companyWelcomeStartDay") ||
        Object.keys(req.body).includes("companyWelcomeEndDay")
      ) {
        body.company_presentation_update_time = new Date().toISOString();
      }

      if (
        Object.keys(req.body).includes("job_advertisement_subject_line") ||
        Object.keys(req.body).includes("job_advertisement_input_text") ||
        Object.keys(extraBody).includes("job_advertisement_picture_1") ||
        Object.keys(extraBody).includes("job_advertisement_picture_2") ||
        Object.keys(req.body).includes("job_advertisement_feed_show_status") ||
        Object.keys(req.body).includes("jobAdvertisementWelcomeStartDay") ||
        Object.keys(req.body).includes("jobAdvertisementWelcomeEndDay")
      ) {
        body.job_advertisement_update_time = new Date().toISOString();
      }

      if (
        Object.keys(req.body).includes("flyer_subject_line") ||
        Object.keys(req.body).includes("flyer_input_text") ||
        Object.keys(extraBody).includes("flyer_picture_1") ||
        Object.keys(extraBody).includes("flyer_picture_2") ||
        Object.keys(req.body).includes("flyer_feed_show_status") ||
        Object.keys(req.body).includes("flyerWelcomeStartDay") ||
        Object.keys(req.body).includes("flyerWelcomeEndDay")
      ) {
        body.flyer_update_time = new Date().toISOString();
      }

      if (
        Object.keys(req.body).includes("advertisement_subject_line") ||
        Object.keys(req.body).includes("advertisement_input_text") ||
        Object.keys(extraBody).includes("advertisement_picture_1") ||
        Object.keys(extraBody).includes("advertisement_picture_2") ||
        Object.keys(req.body).includes("advertisement_feed_show_status") ||
        Object.keys(req.body).includes("advertisementWelcomeStartDay") ||
        Object.keys(req.body).includes("advertisementWelcomeEndDay")
      ) {
        body.advertisement_update_time = new Date().toISOString();
      }

      if (
        Object.keys(req.body).includes("menu_subject_line") ||
        Object.keys(req.body).includes("menu_input_text") ||
        Object.keys(extraBody).includes("menu_picture_1") ||
        Object.keys(extraBody).includes("menu_picture_2") ||
        Object.keys(req.body).includes("menu_feed_show_status") ||
        Object.keys(req.body).includes("menuWelcomeStartDay") ||
        Object.keys(req.body).includes("menuWelcomeEndDay")
      ) {
        body.menu_update_time = new Date().toISOString();
      }
      if (
        Object.keys(req.body).includes("info_subject_line") ||
        Object.keys(req.body).includes("info_input_text") ||
        Object.keys(extraBody).includes("info_picture_1") ||
        Object.keys(extraBody).includes("info_picture_2") ||
        Object.keys(req.body).includes("info_feed_show_status") ||
        Object.keys(req.body).includes("infoWelcomeStartDay") ||
        Object.keys(req.body).includes("infoWelcomeEndDay")
      ) {
        body.info_update_time = new Date().toISOString();
      }
      if (
        Object.keys(req.body).includes("event_subject_line") ||
        Object.keys(req.body).includes("event_input_text") ||
        Object.keys(extraBody).includes("event_picture_1") ||
        Object.keys(extraBody).includes("event_picture_2") ||
        Object.keys(req.body).includes("event_feed_show_status") ||
        Object.keys(req.body).includes("eventWelcomeStartDay") ||
        Object.keys(req.body).includes("eventWelcomeEndDay")
      ) {
        body.event_update_time = new Date().toISOString();
      }
      if (
        Object.keys(req.body).includes("advertising_video_subject_line") ||
        Object.keys(req.body).includes("advertising_video_input_text") ||
        Object.keys(extraBody).includes("advertising_video_picture_1") ||
        Object.keys(extraBody).includes("advertising_video_picture_2") ||
        Object.keys(req.body).includes("advertising_video_feed_show_status") ||
        Object.keys(req.body).includes("advertisingVideoWelcomeStartDay") ||
        Object.keys(req.body).includes("advertisingVideoWelcomeEndDay")
      ) {
        body.advertising_video_update_time = new Date().toISOString();
      }

      let id = body.id;

      delete body.id;

      if (body.password) delete body.password;

      var newid = new ObjectId(id);
      let { data, error } = await db.updateOneData(
        ProviderModel,
        { _id: newid },
        { ...body, ...extraBody },
        {
          _id: 0,
          id: "$_id",
        }
      );

      console.log(data, error);

      if (error === null) {
        resBody.status = true;
        resBody.result = data;
      } else {
        resBody.msg = error.message;
      }
    } catch (e) {
      console.log(e);
      resBody.msg = "Something went wrong";
    }

    res.send(JSON.stringify(resBody));
  });
});

router.post("/addPRFeedData", validation, async (req, res) => {
  let resBody = {
    result: [],
    data: {},
    msg: "PRFeed added successfully!",
    status: false,
  };
  upload(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.log("Multer Known Error :", err);
        resBody.msg = err.message;
        resBody.status = false;
        res.send(JSON.stringify(resBody));
      } else if (err) {
        // An unknown error occurred when uploading.
        console.log("Multer Unknown Error :", err);
        resBody.msg = err.message;
        resBody.status = false;
        res.send(JSON.stringify(resBody));
      }

      let extraBody = {};

      if ((req.files || []).length > 0) {
        req.files.forEach((i) => {
          let id = new ObjectId(i.filename.split("_")[0]);
          extraBody[i.fieldname] = {
            ...i,
            _id: id,
            url: "/files/" + i.filename,
          };
          delete extraBody[i.fieldname].fieldname;
        });
      }

      let { data, error } = await db.updateOneData(
        ProviderModel,
        { _id: req.body.providerId },
        {
          $push: {
            PRFeedData: {
              ...req.body,
              update_time: new Date().toISOString(),
              ...extraBody,
            },
          },
        }
      );
      let getData = await ProviderModel.findOne({ _id: req.body.providerId });

      let notificationsMeta= await db.getData(NotificationsTrack, {notificationType: "post"})


            if(notificationsMeta.data.length == 0){
                const message = {
                    notification: {
                      title: "Vendo",
                      body: "Neuigkeiten bei VENDO!",
                    },
                    topic: "new_post",
                  };
                  try {
                    await new NotificationsTrack({ notificationType: "product", lastNotification:  Math.floor(new Date().getTime()/1000)}).save();
                    const response = await admin.messaging().send(message);
                    console.log(`Notification sent successfully: ${response}`);
                  } catch (error) {
                    console.log(`Error sending notification: ${error}`);
                  }
            }else{

                const lastNotification = new Date(notificationsMeta.data[0].lastNotification).getTime()/1000;
                const now = new Date();
                const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).getTime()/1000;
                const fourHoursInMilliseconds = 4 * 60 * 60 * 1000;
                
                console.log("lastNotification", lastNotification, "now", now, "fourHoursAgo", fourHoursAgo, lastNotification < fourHoursAgo);

                if((now.getTime()/1000 - lastNotification) <= fourHoursInMilliseconds){
                      // Send the push notification

                    const message = {
                        notification: {
                        title: "Vendo",
                        body: "Neuigkeiten bei VENDO!",
                    },
                        topic: "new_post",
                    };
    
                    try {
                        const response = await admin.messaging().send(message);
                        console.log(`Notification sent successfully: ${response}`);

                        await db.updateOneData(NotificationsTrack, {notificationType: "product"}, {lastNotification:  Math.floor(new Date().getTime()/1000)});
                    } catch (error) {
                        console.log(`Error sending notification: ${error}`);
                    }
                 }
                 else{
                    console.log("Notification was sent less than 4 hours ago.");
                 }
            }

      if (error === null) {
        resBody.status = true;
        resBody.result = [data];
        resBody.data = getData;
      } else {
        resBody.msg = error.message;
      }
    } catch (e) {
      // console.log("Error", e)
      if (e.error.code == 11000 && e.error.keyPattern.email == 1) {
        resBody.msg =
          "This email is already associated with another provider. Please try with some different email.";
      } else {
        resBody.msg = "Something went wrong";
      }
    }

    res.send(JSON.stringify(resBody));
  });
});
router.post("/editPRFeedData", validation, async (req, res) => {
  let resBody = {
    result: [],
    data: {},
    msg: "PRFeed updated successfully!",
    status: false,
  };
  upload(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.log("Multer Known Error :", err);
        resBody.msg = err.message;
        resBody.status = false;
        res.send(JSON.stringify(resBody));
      } else if (err) {
        // An unknown error occurred when uploading.
        console.log("Multer Unknown Error :", err);
        resBody.msg = err.message;
        resBody.status = false;
        res.send(JSON.stringify(resBody));
      }

      let extraBody = {};

      if ((req.files || []).length > 0) {
        req.files.forEach((i) => {
          let id = new ObjectId(i.filename.split("_")[0]);
          extraBody[i.fieldname] = {
            ...i,
            _id: id,
            url: "/files/" + i.filename,
          };
          delete extraBody[i.fieldname].fieldname;
        });
      }

      // let { data, error } = await db.updateOneData(ProviderModel,{_id:req.body.providerId,"PRFeedData._id":req.body.PRFeedId}, {PRFeedData:{ ...req.body, ...extraBody }})
      let updateData = await ProviderModel.updateOne(
        { _id: req.body.providerId, "PRFeedData._id": req.body.PRFeedId },
        {
          $set: {
            "PRFeedData.$.subject_line": req.body.subject_line,
            "PRFeedData.$.input_text": req.body.input_text,
            "PRFeedData.$.feed_show_status": req.body.feed_show_status,
            "PRFeedData.$.picture_1": extraBody.picture_1,
            "PRFeedData.$.picture_2": extraBody.picture_2,
            "PRFeedData.$.post_start_date": req.body.post_start_date,
            "PRFeedData.$.post_end_date": req.body.post_end_date,
            "PRFeedData.$.update_time": new Date().toISOString(),
          },
        }
      );
      let getData = await ProviderModel.findOne({ _id: req.body.providerId });

      // if (error === null) {
      resBody.status = true;
      resBody.result = [updateData];
      resBody.data = getData;
      // } else {
      //     resBody.msg = error.message
      // }
    } catch (e) {
      // console.log("Error", e)
      if (e.error.code == 11000 && e.error.keyPattern.email == 1) {
        resBody.msg =
          "This email is already associated with another provider. Please try with some different email.";
      } else {
        resBody.msg = "Something went wrong";
      }
    }

    res.send(JSON.stringify(resBody));
  });
});
router.post("/deletePRFeedData", validation, async (req, res) => {
  let resBody = {
    result: [],
    data: {},
    msg: "PRFeed deleted successfully!",
    status: false,
  };
  upload(req, res, async (err) => {
    try {
      let { data, error } = await db.updateOneData(
        ProviderModel,
        { _id: req.body.providerId },
        { $pull: { PRFeedData: { _id: req.body.PRFeedId } } }
      );
      let getData = await ProviderModel.findOne({ _id: req.body.providerId });

      if (error === null) {
        resBody.status = true;
        resBody.result = [data];
        resBody.data = getData;
      } else {
        resBody.msg = error.message;
      }
    } catch (e) {
      // console.log("Error", e)
      if (e.error.code == 11000 && e.error.keyPattern.email == 1) {
        resBody.msg =
          "This email is already associated with another provider. Please try with some different email.";
      } else {
        resBody.msg = "Something went wrong";
      }
    }

    res.send(JSON.stringify(resBody));
  });
});

router.post("/deleteOneUser", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    var id = new ObjectId(req.params.id);

    let { data, error } = await db.deleteOne(ProviderModel, { _id: id });

    console.log(data, error);

    if (error === null) {
      resBody.status = true;
      resBody.result = data;
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    console.log(e);
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

//static pdf base url
router.get("/getOneUser/:id", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    var id = new ObjectId(req.params.id);

    let { data, error } = await db.getData(
      ProviderModel,
      { _id: id, deactivate: false },
      {
        _id: 0,
        id: "$_id",
        email: 1,
        providerName: 1,
        postcode: 1,
        address: 1,
        region: 1,
        postcode: 1,
        branch: 1,
        telephone: 1,
        mobile: 1,
        domain: 1,
        logo: "$logo.url",
        deactivate: 1,
        emailVerified: 1,
        availability: 1,
        paypalMode: 1,
        cashMode: 1,
        flyer: "$flyer.url",
        category: 1,
        companyPresentation: "$companyPresentation.url",
        companyPresentationStartDay: 1,
        companyPresentationEndDay: 1,
        advertisement: "$advertisement.url",
        advertisementStartDay: 1,
        advertisementEndDay: 1,
        flyerStartDay: 1,
        flyerEndDay: 1,
        jobAdvertisement: "$jobAdvertisement.url",
        jobAdvertisementStartDay: 1,
        jobAdvertisementEndDay: 1,
        menu: "$menu.url",
        menuStartDay: 1,
        menuEndDay: 1,
        info: "$info.url",
        infoStartDay: 1,
        infoEndDay: 1,
        event: "$event.url",
        eventStartDay: 1,
        eventEndDay: 1,
        advertisingVideo: "$advertisingVideo.url",
        advertisingVideoStartDay: 1,
        advertisingVideoEndDay: 1,
        deliveryCost: 1,
        minOrderCost: 1,
        openTime: 1,
        closeTime: 1,
        orderStartDay: 1,
        orderEndDay: 1,
        paypalClientSecret: 1,
        paypalClientId: 1,
        deliveryCircle: 1,
        deliveryApproxTime: 1,
        iswelcome: 1,
        community: 1,
        description: 1,
        Imprint: 1,
        companyPresentationpdf: "$companyPresentationpdf.url",
        jobAdvertisementpdf: "$jobAdvertisementpdf.url",
        flyerpdf: "$flyerpdf.url",
        advertisementpdf: "$advertisementpdf.url",
        menupdf: "$menupdf.url",
        infopdf: "$infopdf.url",
        eventpdf: "$eventpdf.url",
      }
    );

    console.log(data, error);
    var data1 = [];
    var json1 = "";
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();

    // prints date in YYYY-MM-DD format
    let cdate = new Date(year + "-" + month + "-" + date);
    var v1,
      v2,
      v3,
      v4,
      v5,
      v6,
      v7,
      v8,
      v9 = "";
    //static pdf base url
    if (error === null) {
      for (var i = 0; i < data.length; i++) {
        if (data[i].companyPresentation) {
          let firstDate = new Date(data[i].companyPresentationStartDay),
            secondDate = new Date(data[i].companyPresentationEndDay),
            timeDifference = cdate.getTime() - firstDate.getTime(),
            timeDifference1 = cdate.getTime() - secondDate.getTime();
          //data1[j]=timeDifference1;
          //j++;
          if (timeDifference >= 0 && timeDifference1 <= 0) {
            var org_name = data[i].companyPresentation;
            var pieces = org_name.split(".");
            var f_arr = pieces[pieces.length - 1];
            //console.log('f_arr',f_arr);
            if (
              f_arr == "mp4" ||
              f_arr == "avi" ||
              f_arr == "wmv" ||
              f_arr == "flv" ||
              f_arr == "mkv" ||
              f_arr == "webm" ||
              f_arr == "mpeg"
            ) {
              var type = 2;
            } else if (f_arr == "pdf") {
              var type = 3;
            } else {
              var type = 1;
            }
            v1 = {
              companyPresentationStartDay: data[i].companyPresentationStartDay,
              companyPresentationEndDay: data[i].companyPresentationEndDay,
              url: data[i].companyPresentation,
              title: "Firmenpräsentation",
              type: type,
              pdf_type: data[i].companyPresentationpdf ? true : false,
              pdfuri: data[i].companyPresentationpdf
                ? "https://www.mein-vendoapp.de:3001" +
                data[i].companyPresentationpdf
                : "",
            };
          }
        }
        if (data[i].advertisement) {
          let firstDate = new Date(data[i].advertisementStartDay),
            secondDate = new Date(data[i].advertisementEndDay),
            timeDifference = cdate.getTime() - firstDate.getTime(),
            timeDifference1 = cdate.getTime() - secondDate.getTime();
          //data1[j]=timeDifference1;
          //j++;
          if (timeDifference >= 0 && timeDifference1 <= 0) {
            var org_name = data[i].advertisement;
            var pieces = org_name.split(".");
            var f_arr = pieces[pieces.length - 1];
            //console.log('f_arr',f_arr);
            if (
              f_arr == "mp4" ||
              f_arr == "avi" ||
              f_arr == "wmv" ||
              f_arr == "flv" ||
              f_arr == "mkv" ||
              f_arr == "webm" ||
              f_arr == "mpeg"
            ) {
              var type = 2;
            } else if (f_arr == "pdf") {
              var type = 3;
            } else {
              var type = 1;
            }
            v2 = {
              advertisementStartDay: data[i].advertisementStartDay,
              advertisementEndDay: data[i].advertisementEndDay,
              url: data[i].advertisement,
              title: "Anzeige",
              type: type,
              pdf_type: data[i].advertisementpdf ? true : false,
              pdfuri: data[i].advertisementpdf
                ? "https://www.mein-vendoapp.de:3001" + data[i].advertisementpdf
                : "",
            };
          }
        }
        if (data[i].flyer) {
          let firstDate = new Date(data[i].flyerStartDay),
            secondDate = new Date(data[i].flyerEndDay),
            timeDifference = cdate.getTime() - firstDate.getTime(),
            timeDifference1 = cdate.getTime() - secondDate.getTime();
          //data1[j]=timeDifference1;
          //j++;
          if (timeDifference >= 0 && timeDifference1 <= 0) {
            var org_name = data[i].flyer;
            var pieces = org_name.split(".");
            var f_arr = pieces[pieces.length - 1];
            //console.log('f_arr',f_arr);
            if (
              f_arr == "mp4" ||
              f_arr == "avi" ||
              f_arr == "wmv" ||
              f_arr == "flv" ||
              f_arr == "mkv" ||
              f_arr == "webm" ||
              f_arr == "mpeg"
            ) {
              var type = 2;
            } else if (f_arr == "pdf") {
              var type = 3;
            } else {
              var type = 1;
            }
            v3 = {
              flyerStartDay: data[i].flyerStartDay,
              flyerEndDay: data[i].flyerEndDay,
              url: data[i].flyer,
              title: "Flyer",
              type: type,
              pdf_type: data[i].flyerpdf ? true : false,
              pdfuri: data[i].flyerpdf
                ? "https://www.mein-vendoapp.de:3001" + data[i].flyerpdf
                : "",
            };
          }
        }
        if (data[i].jobAdvertisement) {
          let firstDate = new Date(data[i].jobAdvertisementStartDay),
            secondDate = new Date(data[i].jobAdvertisementEndDay),
            timeDifference = cdate.getTime() - firstDate.getTime(),
            timeDifference1 = cdate.getTime() - secondDate.getTime();
          //data1[j]=timeDifference1;
          //j++;
          if (timeDifference >= 0 && timeDifference1 <= 0) {
            var org_name = data[i].jobAdvertisement;
            var pieces = org_name.split(".");
            var f_arr = pieces[pieces.length - 1];
            //console.log('f_arr',f_arr);
            if (
              f_arr == "mp4" ||
              f_arr == "avi" ||
              f_arr == "wmv" ||
              f_arr == "flv" ||
              f_arr == "mkv" ||
              f_arr == "webm" ||
              f_arr == "mpeg"
            ) {
              var type = 2;
            } else if (f_arr == "pdf") {
              var type = 3;
            } else {
              var type = 1;
            }
            v4 = {
              jobAdvertisementStartDay: data[i].jobAdvertisementStartDay,
              jobAdvertisementEndDay: data[i].jobAdvertisementEndDay,
              url: data[i].jobAdvertisement,
              title: "Stellenangebot",
              type: type,
              pdf_type: data[i].jobAdvertisementpdf ? true : false,
              pdfuri: data[i].jobAdvertisementpdf
                ? "https://www.mein-vendoapp.de:3001" +
                data[i].jobAdvertisementpdf
                : "",
            };
          }
        }
        if (data[i].menu) {
          let firstDate = new Date(data[i].menuStartDay),
            secondDate = new Date(data[i].menuEndDay),
            timeDifference = cdate.getTime() - firstDate.getTime(),
            timeDifference1 = cdate.getTime() - secondDate.getTime();
          //data1[j]=timeDifference1;
          //j++;
          if (timeDifference >= 0 && timeDifference1 <= 0) {
            var org_name = data[i].menu;
            var pieces = org_name.split(".");
            var f_arr = pieces[pieces.length - 1];
            //console.log('f_arr',f_arr);
            if (
              f_arr == "mp4" ||
              f_arr == "avi" ||
              f_arr == "wmv" ||
              f_arr == "flv" ||
              f_arr == "mkv" ||
              f_arr == "webm" ||
              f_arr == "mpeg"
            ) {
              var type = 2;
            } else if (f_arr == "pdf") {
              var type = 3;
            } else {
              var type = 1;
            }
            v5 = {
              menuStartDay: data[i].menuStartDay,
              menuEndDay: data[i].menuEndDay,
              url: data[i].menu,
              title: "Speisekarte",
              type: type,
              pdf_type: data[i].menupdf ? true : false,
              pdfuri: data[i].menupdf
                ? "https://www.mein-vendoapp.de:3001" + data[i].menupdf
                : "",
            };
          }
        }
        if (data[i].info) {
          let firstDate = new Date(data[i].infoStartDay),
            secondDate = new Date(data[i].infoEndDay),
            timeDifference = cdate.getTime() - firstDate.getTime(),
            timeDifference1 = cdate.getTime() - secondDate.getTime();
          //data1[j]=timeDifference1;
          //j++;
          if (timeDifference >= 0 && timeDifference1 <= 0) {
            var org_name = data[i].info;
            var pieces = org_name.split(".");
            var f_arr = pieces[pieces.length - 1];
            //console.log('f_arr',f_arr);
            if (
              f_arr == "mp4" ||
              f_arr == "avi" ||
              f_arr == "wmv" ||
              f_arr == "flv" ||
              f_arr == "mkv" ||
              f_arr == "webm" ||
              f_arr == "mpeg"
            ) {
              var type = 2;
            } else if (f_arr == "pdf") {
              var type = 3;
            } else {
              var type = 1;
            }
            v6 = {
              infoStartDay: data[i].infoStartDay,
              infoEndDay: data[i].infoEndDay,
              url: data[i].info,
              title: "Info",
              type: type,
              pdf_type: data[i].infopdf ? true : false,
              pdfuri: data[i].infopdf
                ? "https://www.mein-vendoapp.de:3001" + data[i].infopdf
                : "",
            };
          }
        }
        if (data[i].event) {
          let firstDate = new Date(data[i].eventStartDay),
            secondDate = new Date(data[i].eventEndDay),
            timeDifference = cdate.getTime() - firstDate.getTime(),
            timeDifference1 = cdate.getTime() - secondDate.getTime();
          //data1[j]=timeDifference1;
          //j++;
          if (timeDifference >= 0 && timeDifference1 <= 0) {
            var org_name = data[i].event;
            var pieces = org_name.split(".");
            var f_arr = pieces[pieces.length - 1];
            //console.log('f_arr',f_arr);
            if (
              f_arr == "mp4" ||
              f_arr == "avi" ||
              f_arr == "wmv" ||
              f_arr == "flv" ||
              f_arr == "mkv" ||
              f_arr == "webm" ||
              f_arr == "mpeg"
            ) {
              var type = 2;
            } else if (f_arr == "pdf") {
              var type = 3;
            } else {
              var type = 1;
            }
            v7 = {
              eventStartDay: data[i].eventStartDay,
              eventEndDay: data[i].eventEndDay,
              url: data[i].event,
              title: "Event",
              type: type,
              pdf_type: data[i].eventpdf ? true : false,
              pdfuri: data[i].eventpdf
                ? "https://www.mein-vendoapp.de:3001" + data[i].eventpdf
                : "",
            };
          }
        }
        if (data[i].advertisingVideo) {
          let firstDate = new Date(data[i].advertisingVideoStartDay),
            secondDate = new Date(data[i].advertisingVideoEndDay),
            timeDifference = cdate.getTime() - firstDate.getTime(),
            timeDifference1 = cdate.getTime() - secondDate.getTime();
          //data1[j]=timeDifference1;
          //j++;
          if (timeDifference >= 0 && timeDifference1 <= 0) {
            var org_name = data[i].advertisingVideo;
            var pieces = org_name.split(".");
            var f_arr = pieces[pieces.length - 1];
            //console.log('f_arr',f_arr);
            if (
              f_arr == "mp4" ||
              f_arr == "avi" ||
              f_arr == "wmv" ||
              f_arr == "flv" ||
              f_arr == "mkv" ||
              f_arr == "webm" ||
              f_arr == "mpeg"
            ) {
              var type = 2;
            } else if (f_arr == "pdf") {
              var type = 3;
            } else {
              var type = 1;
            }
            v8 = {
              advertisingVideoStartDay: data[i].advertisingVideoStartDay,
              advertisingVideoEndDay: data[i].advertisingVideoEndDay,
              url: data[i].advertisingVideo,
              title: "Werbevideo",
              type: type,
              pdf_type: data[i].advertisingvideopdf ? true : false,
              pdfuri: data[i].advertisingvideopdf
                ? "https://www.mein-vendoapp.de:3001" +
                data[i].advertisingvideopdf
                : "",
            };
          }
        }

        data1[i] = {
          providerName: data[i].providerName,
          address: data[i].address,
          number: data[i].number,
          postcode: data[i].postcode,
          place: data[i].place,
          region: data[i].region,
          branch: data[i].branch,
          telephone: data[i].telephone,
          mobile: data[i].mobile,
          email: data[i].email,
          emailVerified: data[i].emailVerified,
          domain: data[i].domain,
          openTime: data[i].openTime,
          closeTime: data[i].closeTime,
          orderStartDay: data[i].orderStartDay,
          orderEndDay: data[i].orderEndDay,
          paypalMode: data[i].paypalMode,
          cashMode: data[i].cashMode,
          paypalClientId: data[i].paypalClientId,
          paypalClientSecret: data[i].paypalClientSecret,
          deliveryCost: data[i].deliveryCost,
          minOrderCost: data[i].minOrderCost,
          deliveryCircle: data[i].deliveryCircle,
          deliveryApproxTime: data[i].deliveryApproxTime,
          description: data[i].description,
          Imprint: data[i].Imprint,
          logo: data[i].logo,
          availability: data[i].availability,
          deactivate: data[i].deactivate,
          iswelcome: data[i].iswelcome,
          community: data[i].community,
          files: {
            companyPresentation: v1,
            advertisement: v2,
            flyer: v3,
            jobAdvertisement: v4,
            menu: v5,
            info: v6,
            event: v7,
            advertisingVideo: v8,
          },
        };
      }

      resBody.status = true;
      resBody.result = data1;
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    console.log(e);
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});
router.get("/getOneUserweb/:id", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    var id = new ObjectId(req.params.id);

    let { data, error } = await db.getData(
      ProviderModel,
      { _id: id },
      {
        _id: 0,
        id: "$_id",
        email: 1,
        providerName: 1,
        postcode: 1,
        address: 1,
        region: 1,
        postcode: 1,
        branch: 1,
        number: 1,
        telephone: 1,
        mobile: 1,
        domain: 1,
        logo: "$logo.url",
        deactivate: 1,
        emailVerified: 1,
        availability: 1,
        paypalMode: 1,
        cashMode: 1,
        flyer: "$flyer.url",
        category: 1,
        companyPresentation: "$companyPresentation.url",
        companyPresentationStartDay: 1,
        companyPresentationEndDay: 1,
        advertisement: "$advertisement.url",
        advertisementStartDay: 1,
        advertisementEndDay: 1,
        flyerStartDay: 1,
        flyerEndDay: 1,
        jobAdvertisement: "$jobAdvertisement.url",
        jobAdvertisementStartDay: 1,
        jobAdvertisementEndDay: 1,
        menu: "$menu.url",
        menuStartDay: 1,
        menuEndDay: 1,
        info: "$info.url",
        infoStartDay: 1,
        infoEndDay: 1,
        event: "$event.url",
        eventStartDay: 1,
        eventEndDay: 1,
        advertisingVideo: "$advertisingVideo.url",
        advertisingVideoStartDay: 1,
        advertisingVideoEndDay: 1,
        deliveryCost: 1,
        minOrderCost: 1,
        openTime: 1,
        closeTime: 1,
        orderStartDay: 1,
        orderEndDay: 1,
        paypalClientSecret: 1,
        paypalClientId: 1,
        deliveryCircle: 1,
        deliveryApproxTime: 1,
        iswelcome: 1,
        community: 1,
        description: 1,
        Imprint: 1,
        subject_line: 1,
        input_text: 1,
        post_start_date: 1,
        post_end_date: 1,
        picture_1: "$picture_1.url",
        picture_2: "$picture_2.url",
        feed_show_status: 1,
        company_presentation_subject_line: 1,
        company_presentation_input_text: 1,
        company_presentation_picture_1: "$company_presentation_picture_1.url",
        company_presentation_picture_2: "$company_presentation_picture_2.url",
        company_presentation_feed_show_status: 1,
        job_advertisement_subject_line: 1,
        job_advertisement_input_text: 1,
        job_advertisement_picture_1: "$job_advertisement_picture_1.url",
        job_advertisement_picture_2: "$job_advertisement_picture_2.url",
        job_advertisement_feed_show_status: 1,
        flyer_subject_line: 1,
        flyer_input_text: 1,
        flyer_picture_1: "$flyer_picture_1.url",
        flyer_picture_2: "$flyer_picture_2.url",
        flyer_feed_show_status: 1,
        advertisement_subject_line: 1,
        advertisement_input_text: 1,
        advertisement_picture_1: "$advertisement_picture_1.url",
        advertisement_picture_2: "$advertisement_picture_2.url",
        advertisement_feed_show_status: 1,
        menu_subject_line: 1,
        menu_input_text: 1,
        menu_picture_1: "$menu_picture_1.url",
        menu_picture_2: "$menu_picture_2.url",
        menu_feed_show_status: 1,
        info_subject_line: 1,
        info_input_text: 1,
        info_picture_1: "$info_picture_1.url",
        info_picture_2: "$info_picture_2.url",
        info_feed_show_status: 1,
        event_subject_line: 1,
        event_input_text: 1,
        event_picture_1: "$event_picture_1.url",
        event_picture_2: "$event_picture_2.url",
        event_feed_show_status: 1,
        advertising_video_subject_line: 1,
        advertising_video_input_text: 1,
        advertising_video_picture_1: "$advertising_video_event_picture_1.url",
        advertising_video_picture_2: "$advertising_video_event_picture_2.url",
        advertising_video_feed_show_status: 1,
        PRFeedData: 1,
        companyWelcomeStartDay: 1,
        companyWelcomeEndDay: 1,
        jobAdvertisementWelcomeStartDay: 1,
        jobAdvertisementWelcomeEndDay: 1,
        flyerWelcomeStartDay: 1,
        flyerWelcomeEndDay: 1,
        advertisementWelcomeStartDay: 1,
        advertisementWelcomeEndDay: 1,
        menuWelcomeStartDay: 1,
        menuWelcomeEndDay: 1,
        infoWelcomeStartDay: 1,
        infoWelcomeEndDay: 1,
        eventWelcomeStartDay: 1,
        eventWelcomeEndDay: 1,
        advertisingVideoWelcomeStartDay: 1,
        advertisingVideoWelcomeEndDay: 1,
        feed_like_count: 1,
        feed_wishlist_count: 1,
        company_presentation_like_count: 1,
        company_presentation_wishlist_count: 1,
        job_advertisement_like_count: 1,
        job_advertisement_wishlist_count: 1,
        flyer_like_count: 1,
        flyer_wishlist_count: 1,
        advertisement_like_count: 1,
        advertisement_wishlist_count: 1,
        menu_like_count: 1,
        menu_wishlist_count: 1,
        info_like_count: 1,
        info_wishlist_count: 1,
        event_like_count: 1,
        event_wishlist_count: 1,
        advertising_video_like_count: 1,
        advertising_video_wishlist_count: 1,
        companyPresentationpdf: "$companyPresentationpdf.url",
        jobAdvertisementpdf: "$jobAdvertisementpdf.url",
        flyerpdf: "$flyerpdf.url",
        advertisementpdf: "$advertisementpdf.url",
        menupdf: "$menupdf.url",
        infopdf: "$infopdf.url",
        eventpdf: "$eventpdf.url",
        Abholung: 1,
        Lieferung: 1,
      }
    );

    console.log(data, error);

    if (error === null) {
      resBody.status = true;
      resBody.result = data;
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    console.log(e);
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});
router.get("/getFlyer/:id", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    var id = new ObjectId(req.params.id);

    let { data, error } = await db.getData(
      ProviderModel,
      { _id: id },
      {
        _id: 0,
        id: "$_id",
        flyer: "$flyer.url",
      }
    );

    console.log(data, error);

    if (error === null) {
      resBody.status = true;
      resBody.result = data;
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    console.log(e);
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.get("/getAllUsers/", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    const query = req.query || {};

    let { data, error } = await db.getData(ProviderModel, query, {
      _id: 0,
      id: "$_id",
      logo: "$logo.url",
      email: 1,
      providerName: 1,
      postcode: 1,
      address: 1,
      region: 1,
      postcode: 1,
      branch: 1,
      telephone: 1,
      mobile: 1,
      domain: 1,
      deactivate: 1,
      emailVerified: 1,
      availability: 1,
      paypalMode: 1,
      cashMode: 1,
      flyer: "$flyer.url",
      category: 1,
      companyPresentation: "$companyPresentation.url",
      companyPresentationStartDay: 1,
      companyPresentationEndDay: 1,
      advertisement: "$advertisement.url",
      advertisementStartDay: 1,
      advertisementEndDay: 1,
      flyerStartDay: 1,
      flyerEndDay: 1,
      jobAdvertisement: "$jobAdvertisement.url",
      jobAdvertisementStartDay: 1,
      jobAdvertisementEndDay: 1,
      menu: "$menu.url",
      menuStartDay: 1,
      menuEndDay: 1,
      info: "$info.url",
      infoStartDay: 1,
      infoEndDay: 1,
      event: "$event.url",
      eventStartDay: 1,
      eventEndDay: 1,
      advertisingVideo: "$advertisingVideo.url",
      advertisingVideoStartDay: 1,
      advertisingVideoEndDay: 1,
      deliveryCost: 1,
      minOrderCost: 1,
      openTime: 1,
      closeTime: 1,
      orderStartDay: 1,
      orderEndDay: 1,
      paypalClientSecret: 1,
      paypalClientId: 1,
      deliveryApproxTime: 1,
      iswelcome: 1,
      community: 1,
      description: 1,
      Imprint: 1,
    });

    if (error === null) {
      resBody.status = true;
      resBody.result = data;
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    // console.log(e)
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.get("/getAllUsersWithFilter/", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    let query = req.query || {};
    let s_query = {}
    if (query.providerName !== undefined) {
      s_query.providerName = { $regex: query.providerName, $options: "i" };
    }

    if (query.region !== undefined) {
      s_query.region = { $regex: query.region, $options: "i" };
    }
    if (query.Community !== undefined) {
      s_query.community = { $regex: query.Community, $options: "i" };
    }
    if (query.deliveryCircle !== undefined) {
      s_query.deliveryCircle = { $regex: query.deliveryCircle, $options: "i" };
    }
    s_query.deactivate = false;
    if (query.filter !== undefined) {
      if (query.filter === "voucher") {
        s_query = {
          ...s_query,
          _vouchers: { $exists: true, $ne: null },
        };
      } else {
        s_query = {
          ...s_query,
          [s_query.filter]: { $exists: true, $ne: null },
          [s_query.filter + "StartDay"]: { $exists: true, $ne: null },
          [s_query.filter + "EndDay"]: { $exists: true, $ne: null },
        };
      }
    }
    let { data, error } = await db.getData(ProviderModel, s_query, {
      _id: 0,
      id: "$_id",
      logo: "$logo.url",
      email: 1,
      providerName: 1,
      postcode: 1,
      address: 1,
      region: 1,
      postcode: 1,
      branch: 1,
      telephone: 1,
      mobile: 1,
      domain: 1,
      deactivate: 1,
      emailVerified: 1,
      availability: 1,
      paypalMode: 1,
      cashMode: 1,
      flyer: "$flyer.url",
      category: 1,
      companyPresentation: "$companyPresentation.url",
      companyPresentationStartDay: 1,
      companyPresentationEndDay: 1,
      advertisement: "$advertisement.url",
      advertisementStartDay: 1,
      advertisementEndDay: 1,
      flyerStartDay: 1,
      flyerEndDay: 1,
      jobAdvertisement: "$jobAdvertisement.url",
      jobAdvertisementStartDay: 1,
      jobAdvertisementEndDay: 1,
      menu: "$menu.url",
      menuStartDay: 1,
      menuEndDay: 1,
      info: "$info.url",
      infoStartDay: 1,
      infoEndDay: 1,
      event: "$event.url",
      eventStartDay: 1,
      eventEndDay: 1,
      advertisingVideo: "$advertisingVideo.url",
      advertisingVideoStartDay: 1,
      advertisingVideoEndDay: 1,
      deliveryCost: 1,
      minOrderCost: 1,
      openTime: 1,
      closeTime: 1,
      orderStartDay: 1,
      orderEndDay: 1,
      paypalClientSecret: 1,
      paypalClientId: 1,
      deliveryApproxTime: 1,
      iswelcome: 1,
      community: 1,
      description: 1,
      Imprint: 1,
    });

    if (error === null) {
      resBody.status = true;
      resBody.result = data;
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    // console.log(e)
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.get("/getAllUsersWithLimit/", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    // let { data, error } = await db.getDataWithLimitSort(ProviderModel, {}, {

    let { data, error } = await db.getData(
      ProviderModel,
      { iswelcome: true, deactivate: false },
      {
        _id: 0,
        id: "$_id",
        email: 1,
        providerName: 1,
        postcode: 1,
        address: 1,
        region: 1,
        postcode: 1,
        branch: 1,
        telephone: 1,
        mobile: 1,
        domain: 1,
        logo: "$logo.url",
        deactivate: 1,
        emailVerified: 1,
        availability: 1,
        paypalMode: 1,
        cashMode: 1,
        flyer: "$flyer.url",
        category: 1,
        companyPresentation: "$companyPresentation.url",
        companyPresentationStartDay: 1,
        companyPresentationEndDay: 1,
        advertisement: "$advertisement.url",
        advertisementStartDay: 1,
        advertisementEndDay: 1,
        flyerStartDay: 1,
        flyerEndDay: 1,
        jobAdvertisement: "$jobAdvertisement.url",
        jobAdvertisementStartDay: 1,
        jobAdvertisementEndDay: 1,
        menu: "$menu.url",
        menuStartDay: 1,
        menuEndDay: 1,
        info: "$info.url",
        infoStartDay: 1,
        infoEndDay: 1,
        event: "$event.url",
        eventStartDay: 1,
        eventEndDay: 1,
        advertisingVideo: "$advertisingVideo.url",
        advertisingVideoStartDay: 1,
        advertisingVideoEndDay: 1,
        deliveryCost: 1,
        minOrderCost: 1,
        openTime: 1,
        closeTime: 1,
        orderStartDay: 1,
        orderEndDay: 1,
        paypalClientSecret: 1,
        paypalClientId: 1,
        deliveryApproxTime: 1,
        iswelcome: 1,
        community: 1,
        description: 1,
        Imprint: 1,
      },
      4
    );

    console.log("data", data);
    if (error === null) {
      resBody.status = true;
      resBody.result = data.reverse();
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    console.log(e);
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});
router.post(
  "/getAllUsersWithLikeCountandWishlistCount/",
  validation,
  async (req, res) => {
    let resBody = {
      result: [],
      msg: "",
      status: false,
    };
    var like_data = await ProviderLikeRoot.findOne({
      provider_id: req.body.provider_id,
      user_id: req.body.user_id,
    });
    var Wishlist_data = await ProviderWishlistRoot.findOne({
      provider_id: req.body.provider_id,
      user_id: req.body.user_id,
    });
    var provider_doc = await ProviderModel.findOne({
      _id: req?.body?.provider_id,
    });

    if (provider_doc) {
      resBody.status = true;
      resBody.result = {
        ...provider_doc.toObject(),
        myLike: like_data ? true : false,
        myWish: Wishlist_data ? true : false,
      };
    } else {
      resBody.status = false;
      resBody.msg = "No data found";
    }
    res.send(JSON.stringify(resBody));
  }
);
router.post("/getMyWishList/", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: true,
  };
  var hostname = req.headers.host;
  //    var like_data = await ProviderLikeRoot.find({"user_id":req.body.user_id});
  var Wishlist_data = await ProviderWishlistRoot.find({
    user_id: req.body.user_id,
  });
  for (let index = 0; index < Wishlist_data.length; index++) {
    // console.log(Wishlist_data[index].,"LLLLLLLLLLLLLLLLLLLLLLLLLL")
    var provider_doc = await ProviderModel.findOne({
      _id: Wishlist_data[index].provider_id,
    });
    resBody.result.push({
      ...provider_doc.toObject(),
      logo: "https://" + hostname + provider_doc?.logo?.url,
    });
  }

  if (provider_doc) {
    resBody.status = true;
    resBody.result = resBody.result;
  } else {
    resBody.status = true;
    resBody.msg = "No data found";
  }
  res.send(JSON.stringify(resBody));
});

router.get("/getTermsCondition/", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };
  var setting_doc = await Setting.findOne({
    title: "terms and condition",
  }).exec();
  if (setting_doc) {
    resBody.status = true;
    resBody.result = setting_doc.description;
  } else {
    resBody.status = false;
    resBody.msg = "No data found";
  }
  res.send(JSON.stringify(resBody));
});

router.get("/getPrivacyPolicy/", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };
  var setting_doc = await Setting.findOne({ title: "privacy policy" }).exec();
  if (setting_doc) {
    resBody.status = true;
    resBody.result = setting_doc.description;
  } else {
    resBody.status = false;
    resBody.msg = "No data found";
  }
  res.send(JSON.stringify(resBody));
});

router.post("/update_time_post", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };
  var setting_doc = await ProviderModel.update;
  if (setting_doc) {
    resBody.status = true;
    resBody.result = setting_doc.description;
  } else {
    resBody.status = false;
    resBody.msg = "No data found";
  }
  res.send(JSON.stringify(resBody));
});

router.post("/create-availibility", async ()=>{
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try{
    let {day, from, to, providerId}= req.body;
    console.log("hey")
    
    let createAvailibility= new ProviderAvailibility({day, form, to, providerId});
    if(createAvailibility){
      resBody.result.push(createAvailibility);
      resBody.status= true;
      resBody.msg= "Availibility added for the provider."
  
      return res.json(JSON.stringify(resBody))
    }
    else{
      resBody.status= true;
      resBody.msg= "Availibility added for the provider."

      return res.json(JSON.stringify(resBody))
    }
  }catch(err){
    res.json({message: err})
  }
})

router.put("/update-availability", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  const availabilities = req.body; // Expecting an array of objects

  try {
    // Loop through each availability object in the request body
    for (const { providerId, day, from, to } of availabilities) {
      // Validate each entry
      if (!providerId || !day || !from || !to) {
        resBody.msg = "All fields (providerId, day, from, to) are required for each availability object.";
        return res.status(400).json(resBody);
      }

      // Find the availability entry
      let availability = await ProviderAvailibility.findOne({
        providerId: ObjectId(providerId),
        day,
      });

      if (availability) {
        // Update the existing availability entry
        availability.from = from;
        availability.to = to;
        await availability.save();
      } else {
        // Create a new availability entry if not found
        availability = new ProviderAvailibility({
          providerId: ObjectId(providerId),
          day,
          from,
          to,
        });
        await availability.save();
      }

      // Add the updated or newly created availability to the result
      resBody.result.push(availability);
    }

    if (resBody.result.length > 0) {
      resBody.status = true;
      resBody.msg = "Availability updated successfully.";
    } else {
      resBody.msg = "No availabilities were updated.";
    }

    return res.json(resBody);
  } catch (err) {
    resBody.msg = "An error occurred while updating availability.";
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
