var express = require("express");
var router = express.Router();
var ObjectId = require("mongodb").ObjectId;

const CategoryModel = require("../lists/categories");
const ProviderModel = require("../lists/providers");
const CustomerModel = require("../lists/customers");
const TransactionModel = require("../lists/transactions");
const CategorynModel = require("../lists/category");
const NotificationModel = require("../lists/notification");
const ProductModel = require("../lists/products");
const ProviderLike = require("../lists/provider_like");
const ProviderWishlist = require("../lists/provider_wishlist");
const ProviderDetailsSeen = require("../lists/providerDetailsSeen");
const ProviderLikeRoot = require("../lists/root_provider_like");
const ProviderWishlistRoot = require("../lists/root_provider_wishlist");
const db = require("../database/mongooseCrud");
var jwt = require("jsonwebtoken");
var admin = require("firebase-admin");
var serviceAccount = require("./vendo-5a7dd-firebase-adminsdk-fdopp-dd6fdf5895.json");

const { sendMail } = require("../system/mail");

// const arrayFields = require('../lists/arrayFields')
// const { Curl } = require('node-libcurl');

const initfirebase = () => {
  const app = !admin.apps.length
    ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    : admin.app();
};

initfirebase();


const validation = (req, res, next) => {
  // let token = req.headers["x-request-token"] || null;
  // console.log(token);
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
  //   console.log(decoded);
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

router.get("/categories", async (req, res, next) => {
  let resBody = {
    result: [],
    msg: "",
    status: true,
  };

  try {
    let { data, error } = await db.getData(
      CategoryModel,
      {},
      {
        _id: 0,
        id: "$_id",
        categoryName: 1,
      }
    );

    if (error === null) {
      resBody.status = true;
      resBody.result = data.length > 0 ? data[0].categoryName : [];
      resBody.id =
        data.length > 0 ? JSON.parse(JSON.stringify(data[0])).id : "";
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    // console.log(e)
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.get("/getallcategory", async (req, res, next) => {
  let resBody = {
    result: [],
    msg: "",
    status: true,
  };

  try {
    // let { data1, error1 } = await db.insertOneData(CategorynModel, {
    //   Name:'Food',
    //   type:'1'
    // })

    let query = req.query || {};
    let { data, error } = await db.getData(
      CategorynModel,
      {},
      {
        _id: 0,
        id: "$_id",
        Name: 1,
        type: 1,
      }
    );

    if (error === null) {
      resBody.status = true;
      resBody.result = data.length > 0 ? data : [];
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    // console.log(e)
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.get("/getonecategory/:id", async (req, res, next) => {
  let resBody = {
    result: [],
    msg: "",
    status: true,
  };
  //let { data, error } = await db.deleteOne(CategorynModel, {})
  try {
    // let { data1, error1 } = await db.insertOneData(CategorynModel, {
    //   Name:'Food',
    //   type:'1'
    // })

    var id = new ObjectId(req.params.id);
    let { data, error } = await db.getData(
      CategorynModel,
      { _id: id },
      {
        _id: 0,
        id: "$_id",
        Name: 1,
        type: 1,
      }
    );

    if (error === null) {
      resBody.status = true;
      resBody.result = data.length > 0 ? data : [];
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    // console.log(e)
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

// update category 
router.post("/updatecategory", async(req, res)=>{
  let resBody = {
    result: [],
    msg: "",
    status: true,
  };

  try{
    console.log("DAtA:", req.body)
    let id = new ObjectId(req.body.id);

    let fielsToUpdate= {};
    if(req.body.Name){
      fielsToUpdate.Name= req.body.Name
    }
    

    let { data, error } = await db.updateOneData(CategorynModel, {_id: id}, {...fielsToUpdate})


    if (error === null) {
      resBody.status = true;
      resBody.msg= "Category updated successfully."
      resBody.result = data.length > 0 ? data : [];
    } else {
      resBody.msg = error.message;
    }
  }catch(err){
    console.log("err:", err)
    resBody.msg = "Something went wrong";
  }
  res.send(JSON.stringify(resBody));

})

router.get("/getcategory", async (req, res, next) => {
  let resBody = {
    result: [],
    msg: "",
    status: true,
  };

  try {
    // let { data1, error1 } = await db.insertOneData(CategorynModel, {
    //   Name:'Food',
    //   type:'1'
    // })

    let query = req.query || {};
    let { data, error } = await db.getData(
      CategorynModel,
      { type: query.type },
      {
        _id: 0,
        id: "$_id",
        Name: 1,
        type: 1,
      }
    );

    if (error === null) {
      resBody.status = true;
      resBody.result = data.length > 0 ? data : [];
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    // console.log(e)
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.post("/add_new_categories/", async (req, res) => {
  let resBody = {
    result: [req.body.Name],
    msg: "",
    status: false,
  };

  try {
    //let body = JSON.stringify(req.body)
    // let pushBody = (() => {
    //   let keys = Object.keys(body);
    //   let separates = {}
    //   keys.forEach(e => {
    //     arrayFields.categories.forEach(i => {
    //       if (e === i) {
    //         separates = {
    //           ...separates, [i]: body[i]
    //         }
    //         delete body[i]
    //       }
    //     })
    //   });
    //   return separates;
    // })()

    // console.log("Body", body)
    // console.log("Push Body", pushBody)

    let getData = await db.getData(
      CategorynModel,
      { Name: req.body.Name },
      {
        _id: 0,
        id: "$_id",
        Name: 1,
        type: 1,
      }
    );

    if (getData.error === null) {
      if (getData.data.length > 0) {
        resBody.msg = "Already Exist";
      } else {
        let { data, error } = await db.insertOneData(CategorynModel, {
          Name: req.body.Name,
          type: req.body.type,
        });

        if (error === null) {
          resBody.status = true;
          resBody.result = [data];
        } else {
          resBody.msg = error.message;
        }
      }
    } else {
      let { data, error } = await db.insertOneData(CategorynModel, {
        Name: req.body.Name,
        type: req.body.type,
      });

      if (error === null) {
        resBody.status = true;
        resBody.result = [data];
      } else {
        resBody.msg = error.message;
      }
    }
  } catch (e) {
    console.log("Error", e);
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.post("/add_categories/", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    let body = JSON.parse(JSON.stringify(req.body));
    let pushBody = (() => {
      let keys = Object.keys(body);
      let separates = {};
      keys.forEach((e) => {
        arrayFields.categories.forEach((i) => {
          if (e === i) {
            separates = {
              ...separates,
              [i]: body[i],
            };
            delete body[i];
          }
        });
      });
      return separates;
    })();

    console.log("Body", body);
    console.log("Push Body", pushBody);

    let getData = await db.getData(
      CategoryModel,
      {},
      {
        _id: 0,
        id: "$_id",
        categoryName: 1,
      }
    );

    if (getData.error === null) {
      if (getData.data.length > 0) {
        let id = new ObjectId(JSON.parse(JSON.stringify(getData.data[0])));

        console.log(id);

        let { data, error } = await db.updateOneDataPushUnique(
          CategoryModel,
          { _id: id },
          body,
          pushBody
        );

        if (error === null) {
          resBody.status = true;
          resBody.result = [data];
        } else {
          resBody.msg = error.message;
        }
      } else {
        let { data, error } = await db.insertOneData(CategoryModel, {
          ...req.body,
        });

        if (error === null) {
          resBody.status = true;
          resBody.result = [data];
        } else {
          resBody.msg = error.message;
        }
      }
    } else {
      let { data, error } = await db.insertOneData(CategoryModel, {
        ...req.body,
      });

      if (error === null) {
        resBody.status = true;
        resBody.result = [data];
      } else {
        resBody.msg = error.message;
      }
    }
  } catch (e) {
    console.log("Error", e);
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.post("/placeOrder/", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    let cid = null;
    let pid = null;
    // let providerEmail = ""
    let products = [];
    let productIds = [];
    let ht1 = `<tr><td colspan="3" style="padding: 10px 15px 0px 15px;"><table style="width: 100%; background: #4f9567;"><tr><td style="background: #1f5632; font-size: 16px; color: #fff; font-weight: bold; padding: 5px 10px; width: 150px;">Menge</td><td style="background: #1f5632; font-size: 16px; color: #fff; font-weight: bold; padding: 5px 30px; text-align: left;">Produkt</td><td style="background: #1f5632; font-size: 16px; color: #fff; font-weight: bold; padding: 5px 10px; text-align: right;">Preis</td></tr>`;
    if (
      req.body.products != undefined &&
      (req.body.products || []).length > 0
    ) {
      req.body.products.forEach(async (i) => {
        // let product1 =  db.getData(ProductModel, {id: i.productId }, {_id: 0, id: "$_id", name: 1})
        let product1 = await ProductModel.findById(i.productId, {
          _id: 0,
          id: "$_id",
          name: 1,
          inStock: 1,
        });
        console.log(product1, "instock");
        // if (Number(product1.inStock) < Number(i.quantity)) {
        //   resBody.msg = "Ausverkauft";
        //   return res.send(JSON.stringify(resBody));
        // }
        // let inStock = Number(product1.inStock) - Number(i.quantity);
        // await ProductModel.findByIdAndUpdate(i.productId, { inStock: inStock });
        // db.updateOneData(ProductModel,{id: i.productId },{inStock:product1})
        //   let { data, error } = db.getPopulatedData(ProductModel, { _id: i.productId }, "_provider", { _id: 0, id: "$_id", logo: "$logo.url", email: 1, providerName: 1, postcode: 1, address: 1, region: 1, postcode: 1, branch: 1, telephone: 1, mobile: 1, domain: 1, deactivate: 1, emailVerified: 1, availability: 1, paypalMode: 1, cashMode: 1, flyer: "$flyer.url", category: 1, companyPresentation: "$companyPresentation.url", companyPresentationStartDay: 1, companyPresentationEndDay: 1, advertisement: "$advertisement.url", advertisementStartDay: 1, advertisementEndDay: 1, flyerStartDay: 1, flyerEndDay: 1, jobAdvertisement: "$jobAdvertisement.url", jobAdvertisementStartDay: 1, jobAdvertisementEndDay: 1, menu: "$menu.url", menuStartDay: 1, menuEndDay: 1, info: "$info.url", infoStartDay: 1, infoEndDay: 1, event: "$event.url", eventStartDay: 1, eventEndDay: 1, advertisingVideo: "$advertisingVideo.url", advertisingVideoStartDay: 1, advertisingVideoEndDay: 1 }, {
        //     _id: 0, id: "$_id", name: 1, deactivate: 1, maxQuantity: 1, category: 1, size: 1, ingredients: 1, status: 1, shortDescription: 1, longDescription: 1, productImage: "$productImage.url", price: 1
        // })

        ht1 =
          ht1 +
          `<tr><td style="font-size: 15px; padding: 10px 10px; color: #fff;">${
            i.quantity
          }x</td><td style="font-size: 15px; padding: 10px 30px; color: #fff; text-align: left;">${
            i.productName
          }</td><td style="font-size: 15px; padding: 10px 10px; color: #fff; text-align: right;">${(
            Number(i.price.replace(",", ".")) * Number(i.quantity)
          )
            .toFixed(2)
            .toString()
            .replace(".", ",")} €</td></tr>`;

        products.push({
          _product: new ObjectId(i.productId),
          _quantity: i.quantity,
          _price: i.price,
        });
        productIds.push(new ObjectId(i.productId));
      });
      ht1 = ht1 + `</table></td></tr>`;
    } else {
      resBody.msg = "No product selected";
      return res.send(JSON.stringify(resBody));
    }

    // console.log(products)

    if (req.body.cid != undefined) {
      cid = new ObjectId(req.body.cid);
    } else {
      resBody.msg = "Please send Customer ID";
      return res.send(JSON.stringify(resBody));
      
    }

    if (req.body.pid != undefined) {
      pid = new ObjectId(req.body.pid);
    } else {
      resBody.msg = "Please send Provider ID";
      return res.send(JSON.stringify(resBody));
    }

    var customer_details = await CustomerModel.findOne({
      _id: req.body.cid,
    }).exec();

    // if (req.body.providerEmail != undefined) {
    //   providerEmail = req.body.providerEmail
    // } else {
    //   resBody.msg = "Please send Provider email"
    //   res.send(JSON.stringify(resBody))
    //   return false
    // }
    let provider = await db.getData(
      ProviderModel,
      { _id: pid },
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
      }
    );
    if (provider.data[0].availability === false) {
      resBody.msg = "Der Anbieter ist derzeit geschlossen.";
      return res.send(JSON.stringify(resBody));
    }

    const today = new Date();
    var fromatted_date = today.toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    var t_hours = today.getHours();
    var t_minutes = today.getMinutes();
    var strTime = t_hours + ":" + t_minutes;

    // compare them

    if (true) {
      let { data, error } = await db.insertOneData(TransactionModel, {
        _products: products,
        _productIds: productIds,
        _customer: cid,
        _provider: pid,
        timestamp: new Date().getTime(),
        pickupdateandtime: req.body.pickupdateandtime,
        totalPrice: req.body.totalPrice || "00.00",
        deliveryCost: req.body.deliveryCost || "00.00",
        paymentMode: req.body.paymentMode || "unknown",
        paypalTranasctionId: req.body.paypalTranasctionId || "",
        notes: req.body.notes || "",
        phone:req.body.phone || "",
        address: req.body.address || "",
        deliveryMode: req.body.deliveryMode || null,
      });

      console.log(data, error);

      if (error === null) {
        let cleanCart = await db.updateOneDataPush(
          CustomerModel,
          { _id: cid },
          {
            _cart: [],
          },
          {}
        );

         let provider = await db.getData(ProviderModel, { _id: pid }, {})

        let transactionID = (JSON.parse(JSON.stringify(data)) || {})._id;
        console.log("Order transaction id -", transactionID);

        if (req.body.paymentMode == "cash") {
          var p_mode = "Barzahlung";
        } else {
          var p_mode = req.body.paymentMode;
        }


        let ht= `
<head>
    <meta charset="utf-8" />
  </head>
  <body>
      <table
      style="
        background-color: #fff;
        padding: 0px;
        margin: 50px auto 50px auto;
        max-width: 600px;
        width: 100%;
        box-shadow: 0 0 10px #85749e;
        "
    >
    <tbody>
        <tr>
          <td
            style="
              font-size: 20px;
              padding: 15px;
              color: #245635;
              font-weight: bold;
              padding-bottom: 5px;
            "
          >
            Bestelldatum:
          </td>
          <td
            style="
              font-size: 20px;
              padding: 15px;
              color: #245635;
              font-weight: bold;
              padding-bottom: 5px;
            "
          >
            Bestellzeit:
          </td>
          <td
            style="
              font-size: 20px;
              padding: 15px;
              color: #245635;
              font-weight: bold;
              padding-bottom: 5px;
            "
          >
            Bestell ID:
          </td>
        </tr>
        <tr>
          <td
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 0px;
            "
          >
            ${fromatted_date}
          </td>
          <td
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 0px;
            "
          >
            ${strTime}
          </td>
          <td
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 0px;
            "
          >
            ${transactionID}
          </td>
        </tr>
        <tr>
          <td
            style="
              font-size: 20px;
              padding: 15px;
              color: #245635;
              font-weight: bold;
              padding-bottom: 5px;
            "
          >
          Bezahlart:
          </td>
          <td
            style="
              font-size: 20px;
              padding: 15px;
              color: #245635;
              font-weight: bold;
              padding-bottom: 5px;
            "
          >
          Auftragsart:
          </td>
          <td
            style="
              font-size: 20px;
              padding: 15px;
              color: #245635;
              font-weight: bold;
              padding-bottom: 5px;
            "
          >
          Abholzeit:
          </td>
        </tr>
        <tr>
          <td
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 0px;
            "
          >
            ${p_mode ? p_mode : "N/A"}
          </td>
          <td
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 0px;
            "
          >
          ${provider.data[0].Lieferung ? "Lieferung" : provider.data[0].Abholung ? "Abholung" : "N/A"}
        </td>
        <td
        style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 0px;
              "
          >
          ${req.body.pickupdateandtime ? req.body.pickupdateandtime : "N/A"}
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 20px;
              padding: 15px;
              color: #245635;
              font-weight: bold;
            "
          >
            Kundendaten:
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 6px;
            "
          >
            Name: ${ customer_details.name }
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 6px;
            "
          >
            ${ req.body.deliveryMode === "Abholung" ? "Telefonnummer:" :
            "Adresse:" } ${ req.body.deliveryMode === "Abholung" ? req.body.phone : req.body.address }
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 6px;
            "
          >
            Liefermodus: ${ req.body.deliveryMode }
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 23px;
              padding: 15px;
              color: #245635;
              font-weight: bold;
            "
          >
            Bestellinformation:
          </td>
        </tr>
        
        <tr>
            <td colspan="3" style="padding: 0px 15px 0px 15px">
                <table style="width: 100%; background: #1f5632">
                ${ht1}
              <tr>
                <td
                  style="
                    font-size: 15px;
                    padding: 5px 10px;
                    color: #fff;
                    width: 150px;
                  "
                >
                  &nbsp;
                </td>
                <td
                  style="
                    font-size: 15px;
                    padding: 5px 30px;
                    color: #fff;
                    text-align: left;
                  "
                >
                  Zwischensumme
                </td>
                <td
                  style="
                    font-size: 15px;
                    padding: 5px 10px;
                    color: #fff;
                    text-align: right;
                  "
                >
                  ${( Number(req.body.totalPrice.replace(",", ".")) -
                  Number(req.body.deliveryCost.replace(",", ".")) ) .toString()
                  .replace( ".", "," )} €
                </td>
              </tr>
              <tr>
                <td
                  style="
                    font-size: 15px;
                    padding: 5px 10px;
                    color: #fff;
                    width: 150px;
                  "
                >
                  &nbsp;
                </td>
                <td
                  style="
                    font-size: 15px;
                    padding: 5px 30px;
                    color: #fff;
                    text-align: left;
                  "
                >
                  Lieferkosten
                </td>
                <td
                  style="
                    font-size: 15px;
                    padding: 5px 10px;
                    color: #fff;
                    text-align: right;
                  "
                >
                  ${req.body.deliveryCost.replace( ".", "," )} €
                </td>
              </tr>
              <tr>
                <td style="font-size: 15px; padding: 5px 10px; color: #fff">
                  &nbsp;
                </td>
                <td
                  style="
                    font-size: 15px;
                    padding: 5px 30px;
                    color: #fff;
                    text-align: left;
                  "
                >
                  <strong>Gesamt</strong> inkl. MwSt.
                </td>
                <td
                  style="
                    font-size: 15px;
                    padding: 5px 10px;
                    color: #fff;
                    text-align: right;
                  "
                >
                  <strong>${req.body.totalPrice.replace( ".", "," )} €</strong>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 22px;
              padding: 15px;
              color: #245635;
              font-weight: bold;
              padding-bottom: 5px;
            "
          >
            Bemerkung vom Kunden:
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 3px;
            "
          >
            ${ req.body.notes }
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #245635;
              font-weight: bold;
              padding-bottom: 3px;
            "
          >
            Bestellung akzeptieren, bitte diesen Link anklicken, der Kunde wird
            darüber informiert:
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 10px;
            "
          >
            <a
              href="https://www.mein-vendoapp.de:3001/sendnotification?type=1&pid=` +
  pid +
  `&cid=` +
  cid +
  `&pname=` +
  provider.data[0].providerName +
  `"
              >Bestellung bestätigen</a
            >
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #245635;
              font-weight: bold;
              padding-bottom: 3px;
            "
          >
            Bestellung ablehnen, bitte diesen Link anklicken, der Kunde wird
            darüber informiert:
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 5px;
            "
          >
            <a
              href="https://www.mein-vendoapp.de:3001/sendnotification?type=2&pid=` +
  pid +
  `&cid=` +
  cid +
  `&pname=` +
  provider.data[0].providerName +
  `"
              >Bestellung ablehnen</a
            >
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 10px;
            "
          >
            Wichtige Information: Sollten Sie die Bestellung ablehnen und der
            Kunde hat über die Bezahlart Paypal schon bezahlt, sind Sie
            verpflichtet sich mit dem Kunden umgehend in Verbindung zusetzen und
            ihm/ihr das Geld zurückzuerstatten
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #245635;
              font-weight: bold;
              padding-bottom: 3px;
            "
          >
            Die Bestellung ist nun unterwegs, der Kunde wird darüber informiert:
          </td>
        </tr>
        <tr>
          <td
            colspan="3"
            style="
              font-size: 18px;
              padding: 0 15px;
              color: #424242;
              padding-bottom: 10px;
            "
          >
            <a
              href="https://www.mein-vendoapp.de:3001/sendnotification?type=3&pid=` +
  pid +
  `&cid=` +
  cid +
  `&pname=` +
  provider.data[0].providerName +
  `"
              >Auslieferung bestätigen</a
            >
          </td>
        </tr>
      </tbody>
      <tfoot style="background-color: #fff">
        <tr>
          <td colspan="3">
            <p
              style="
                font-size: 20px;
                color: #000;
                text-align: center;
                margin-bottom: 20px;
                margin-top: 20px;
                padding-bottom: 20px;
              "
            >
              -Das ist keine Rechnung-
            </p>
          </td>
        </tr>
      </tfoot>
    </table>
  </body>
</html>
        `;
        console.log("body html",ht )
        
        let mailDetails = {
          // from: "support@sicorpindia.com",
          from: "support@mein-vendo.de",
          to: provider.data[0].email,
         // to: "haiderzamanyzi@gmail.com",

          //to : 'shreya@brainiuminfotech.com',

          //subject: `A new order has been placed | ${transactionID}`,
          subject: `A new order has been placed`,
          html: ht,
        };

        sendMail(mailDetails)
          .then(async (d) => {
            console.log("Mail sent", mailDetails.to);
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        resBody.msg = "Unable to place order";
      }
    } else {
      //resBody.msg = "Cannot cater now as order is closed. Shall cater on next day"
      resBody.msg =
        "Du bestellst außerhalb der Öffnungszeiten. Dies ist nicht möglich, die Bestellung wurde nicht ausgeführt";
    }
    resBody.status = true;
    resBody.result = "Order Placed";
  } catch (e) {
    console.log("Error", e);
    resBody.msg = "Something went wrong";
  }
  return res.send(JSON.stringify(resBody));
});

router.get("/getAllTransactions/", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    let { data, error } = await db.getPopulatedData(
      TransactionModel,
      {},
      "_products._product _products._quantity _products._price",
      {
        _id: 0,
        id: "$_id",
        name: 1,
        deactivate: 1,
        maxQuantity: 1,
        category: 1,
        size: 1,
        ingredients: 1,
        status: 1,
        shortDescription: 1,
        longDescription: 1,
        productImage: "$productImage.url",
        price: 1,
      },
      {
        _id: 0,
        id: "$_id",
        _customer: 1,
        _provider: 1,
        totalPrice: 1,
        deliveryCost: 1,
        paymentMode: 1,
        paypalTranasctionId: 1,
        timestamp: 1,
      }
    );

    if (error === null && data.length > 0) {
      resBody.status = true;
      resBody.result = data;
    } else {
      resBody.msg = "No order found";
    }
  } catch (e) {
    console.log("Error", e);
    resBody.msg = "Something went wrong";
  }
  res.send(JSON.stringify(resBody));
});

router.get("/getOrderDetailsByProvider/", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    let pid = new ObjectId(req.query.pid);
    let { data, error } = await db.getPopulatedData(
      TransactionModel,
      { _provider: pid },
      "_products._product _products._quantity _products._price",
      {
        _id: 0,
        id: "$_id",
        name: 1,
        deactivate: 1,
        maxQuantity: 1,
        category: 1,
        size: 1,
        ingredients: 1,
        status: 1,
        shortDescription: 1,
        longDescription: 1,
        productImage: "$productImage.url",
        price: 1,
      },
      {
        _id: 0,
        id: "$_id",
        _customer: 1,
        _provider: 1,
        totalPrice: 1,
        deliveryCost: 1,
        paymentMode: 1,
        paypalTranasctionId: 1,
        timestamp: 1,
      }
    );

    if (error === null && data.length > 0) {
      resBody.status = true;
      resBody.result = data;
    } else {
      resBody.msg = "No order found";
    }
  } catch (e) {
    console.log("Error", e);
    resBody.msg = "Something went wrong";
  }
  res.send(JSON.stringify(resBody));
});

router.get("/getOrderDetailsByCustomer/", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    let cid = new ObjectId(req.query.cid);
    let { data, error } = await db.getPopulatedData(
      TransactionModel,
      { _customer: cid },
      "_products._product _products._quantity _products._price",
      {
        _id: 0,
        id: "$_id",
        name: 1,
        deactivate: 1,
        maxQuantity: 1,
        category: 1,
        size: 1,
        ingredients: 1,
        status: 1,
        shortDescription: 1,
        longDescription: 1,
        productImage: "$productImage.url",
        price: 1,
      },
      {
        _id: 0,
        id: "$_id",
        _customer: 1,
        _provider: 1,
        totalPrice: 1,
        deliveryCost: 1,
        paymentMode: 1,
        paypalTranasctionId: 1,
        timestamp: 1,
      }
    );

    if (error === null && data.length > 0) {
      resBody.status = true;
      resBody.result = data;
    } else {
      resBody.msg = "No order found";
    }
  } catch (e) {
    console.log("Error", e);
    resBody.msg = "Something went wrong";
  }
  res.send(JSON.stringify(resBody));
});

router.post("/addToCart/", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    console.log(req.body);
    let cid = new ObjectId(req.body.cid);
    let pid = new ObjectId(req.body.pid);
    let cartClear = req.body.cartClear;
    if (cartClear == true) {
      let cleanCart = await db.updateOneDataPush(
        CustomerModel,
        { _id: cid },
        {
          _cart: [],
        },
        {}
      );

      let products = [];

      if (req.body.products != undefined) {
        req.body.products.forEach((i) => {
          products.push({
            _product: new ObjectId(i.productId),
            _quantity: i.quantity,
            _pid: pid,
          });
        });
      }

      console.log(products);
      // return false

      let { data, error } = await db.updateOneDataPush(
        CustomerModel,
        { _id: cid },
        {},
        {
          _cart: products,
        }
      );

      console.log(data, error);

      if (error === null) {
        resBody.status = true;
        resBody.result = data;
      } else {
        resBody.msg = "Unable to add products to basket";
      }
    } else {
      let products = [];

      if (req.body.products != undefined) {
        req.body.products.forEach((i) => {
          products.push({
            _product: new ObjectId(i.productId),
            _quantity: i.quantity,
            _pid: pid,
          });
        });
      }

      console.log(products);
      // return false

      let { data, error } = await db.updateOneDataPush(
        CustomerModel,
        { _id: cid },
        {},
        {
          _cart: products,
        }
      );

      console.log(data, error);

      if (error === null) {
        resBody.status = true;
        resBody.result = data;
      } else {
        resBody.msg = "Unable to add products to basket";
      }
    }
  } catch (e) {
    console.log("Error", e);
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.post("/updateCartItem/", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    console.log(req.body);
    let cid = new ObjectId(req.body.cid);
    let itemId = new ObjectId(req.body.itemId);

    let { data, error } = await db.updateOneDataPush(
      CustomerModel,
      { _id: cid, "_cart._id": itemId },
      {
        "_cart.$._quantity": req.body.quantity,
      },
      {}
    );

    console.log(data, error);

    if (error === null) {
      resBody.status = true;
      resBody.result = data;
    } else {
      resBody.msg = "Unable to update quantity to basket";
    }
  } catch (e) {
    console.log("Error", e);
    resBody.msg = "Something went wrong";
  }
  res.send(JSON.stringify(resBody));
});

router.post("/removeItemFromCart/", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    console.log(req.body);
    let cid = new ObjectId(req.body.cid);
    let itemId = new ObjectId(req.body.itemId);
    // if(req.body.itemId!==undefined){
    //     let { data, error } = await db.removeOneDataObject(CustomerModel, { _id: cid, "_cart._id": itemId }, {
    //       _cart: {
    //         _id: itemId
    //       }
    //     }, {})
    //   }
    //   else{
    let { data, error } = await db.removeOneDataObject(
      CustomerModel,
      { _id: cid },
      {
        _cart: {
          _id: itemId,
        },
      },
      {}
    );
    //}

    console.log(data, error);

    if (error === null) {
      resBody.status = true;
      resBody.result = data;
    } else {
      resBody.msg = "Unable to update quantity to basket";
    }
  } catch (e) {
    console.log("Error", e);
    resBody.msg = "Something went wrong";
  }
  res.send(JSON.stringify(resBody));
});

router.get("/getCart/", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    let cid = new ObjectId(req.query.cid);

    let { data, error } = await db.getPopulatedData(
      CustomerModel,
      { _id: cid },
      "_cart._product _cart._id _cart._quantity _cart._pid",
      {
        _id: 0,
        id: "$_id",
        name: 1,
        deactivate: 1,
        maxQuantity: 1,
        category: 1,
        size: 1,
        ingredients: 1,
        status: 1,
        shortDescription: 1,
        longDescription: 1,
        productImage: "$productImage.url",
        price: 1,
      },
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
        picture: "$picture.url",
        deactivate: 1,
        emailVerified: 1,
      }
    );

    console.log(data, error);
    var data1 = [];
    if (error === null) {
      for (var i = 0; i < data[0]._cart.length; i++) {
        let provider = await db.getData(
          ProviderModel,
          { _id: data[0]._cart[0]._pid },
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
            Abholung: 1,
            Lieferung: 1,
          }
        );

        // data1[0]=data[0]
        data1[0] = { data: data[0], provider: provider.data[0] };
      }
      // data.data1
      resBody.result = data1;
      resBody.status = true;
    } else {
      resBody.msg = "Empty busket";
    }
  } catch (e) {
    console.log("Error", e);
    resBody.msg = "Something went wrong";
  }
  res.send(JSON.stringify(resBody));
});

router.get("/sendnotification/", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };

  try {
    // resBody.result = req.query
    let cid = req.query.cid;
    let pid = req.query.pid;
    let type = req.query.type;
    let pname = req.query.pname;
    console.log(`${cid} ${pid}`);
    let date_ob = new Date();
    var message = "";
    var subject = "";

    if (type == 1) {
      //message='Ihre Bestellung wurde von '+pname+' bestätigt'
      message =
        "Sie haben die Bestellung bestätigt. Ihr Kunde wurde entsprechend per Push Nachricht informiert";
      subject = "Ihre Bestellung wurde von " + pname + " " + " bestätigt";
    } else if (type == 2) {
      //message='Ihre Bestellung wurde storniert'
      message =
        "Sie haben die Bestellung storniert. Ihr Kunde wurde entsprechend per Push Nachricht informiert";
      //subject='Order Rejected by '+pname
      subject = "Ihre Bestellung wurde von " + pname + " " + " storniert";
    } else if (type == 3) {
      //message='Your order is out for delivery'
      //message='Ihre Bestellung bei' +pname+ 'ist auf dem Weg'
      message =
        "Die Bestellung wird nun ausgeliefert. Ihr Kunde wurde entsprechend per Push Nachricht informiert";
      //subject='Devivery Out by '+pname
      subject = "Ihre Bestellung bei " + pname + " " + " ist auf dem Weg";
    } else if (type == 4) {
      message = "Gutschein erfolgreich eingelöst";
      subject = "Gutschein eingelöst";
    }

    let { data, error } = await db.getData(
      CustomerModel,
      { _id: cid },
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
        picture: "$picture.url",
        deactivate: 1,
        emailVerified: 1,
        token: 1,
      }
    );

    //if (error4 === null) {
    var token4 = data[0].token;
    console.log("token4", token4);

    //'fT_COXxHSZOyL1afdLJLPv:APA91bG62b5vogI04-cBxlTKJ31xa5GCo-3yhP3oEq-U0FJ_6fJVWdUBrJO7hZN8E6LRDq7D_e-wK4jWER9uwHo97fCKNOkbH9OBqrTyTPBUXoXCeZs3Qw2We4AbAFIsggTRkWhLqMop'//data4[0].token//'eG_SrncBSHSG0bd6OAOjjJ:APA91bG5piwCfBETIfc7oC2fiINd-OfneznE8wF8UGW0swi_73TEsZLLJgddyh_6gUPpnP2RG_c3qsemhkSzCqRuGKYJ9ltaHT5_Q8L6gSY2oatVer8esprFLBJA_gzwioZ3D7PUNjPa';
    //resBody.result=token4
    // }
    // else{
    //   var token4=''
    // }

    // admin.initializeApp({

    // });
    if (token4 != null && token4 != "") {
      const messaging = admin.messaging();
      var payload = {
        token: token4,
        notification: {
          title: subject,
          // body: message
          body: "",
        },
      };

      messaging.send(payload).then((result) => {
        console.log(result);
      });
    }

    let { data1, error1 } = await db.insertOneData(NotificationModel, {
      cid: cid,
      pid: pid,
      message: message,
      create_date: date_ob,
      type: type,
      subject: subject,
      pname: pname,
    });

    if (error === null) {
      //resBody.status = true
      //resBody.msg = 'Notification Send'
      res.render("order_page", { title: message, subject: subject });
      return false;
    } else {
      //resBody.msg = error.message
      res.render("order_page", { title: "Error", subject: error.message });
      return false;
    }
  } catch (e) {
    console.log("Error", e);
    //resBody.msg = "Something went wrong"
    res.render("order_page", {
      title: "Error",
      subject: "Something went wrong",
    });
    return false;
  }

  res.send(JSON.stringify(resBody));
});
router.get("/getnotification", async (req, res, next) => {
  let resBody = {
    result: [],
    msg: "",
    status: true,
  };

  try {
    // let { data1, error1 } = await db.insertOneData(CategorynModel, {
    //   Name:'Food',
    //   type:'1'
    // })

    let query = req.query || {};
    let { data, error } = await db.getData(
      NotificationModel,
      { pid: query.pid },
      {
        _id: 0,
        id: "$_id",
        cid: 1,
        type: 1,
        pid: 1,
        create_date: 1,
        message: 1,
        subject: 1,
        pname: 1,
      }
    );

    if (error === null) {
      resBody.status = true;
      resBody.result = data.length > 0 ? data : [];
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    // console.log(e)
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.get("/getnotificationbycid", async (req, res, next) => {
  let resBody = {
    result: [],
    msg: "",
    status: true,
  };

  try {
    // let { data1, error1 } = await db.insertOneData(CategorynModel, {
    //   Name:'Food',
    //   type:'1'
    // })

    let query = req.query || {};
    let { data, error } = await db.getData(
      NotificationModel,
      { cid: query.cid },
      {
        _id: 0,
        id: "$_id",
        cid: 1,
        type: 1,
        pid: 1,
        create_date: 1,
        message: 1,
        subject: 1,
      }
    );

    if (error === null) {
      resBody.status = true;
      resBody.result = data.length > 0 ? data.reverse() : [];
    } else {
      resBody.msg = error.message;
    }
  } catch (e) {
    // console.log(e)
    resBody.msg = "Something went wrong";
  }

  res.send(JSON.stringify(resBody));
});

router.get("/privacyPolicy", async (req, res, next) => {
  res.render("privacy_policy", {
    title: "Express",
    subject: "This is example",
  });
});

router.get("/prfeed/:user_id", async (req, res, next) => {
  if (!req.params) {
    res.send({ success: false, message: "User id mandatory" });
    //return false;
  }
  var user_id = req.params.user_id;
  if (!user_id) {
    res.send({ success: false, message: "User id mandatory" });
    //return false;
  }
  // var provider_details = await ProviderModel.find({ "feed_show_status":true }).exec();
  var provider_details = await ProviderModel.find({}).exec();
  if (provider_details.length > 0) {
    var hostname = req.headers.host;
    var results = [];

    for (var i = 0; i < provider_details.length; i++) {
      for (
        let index = 0;
        index < provider_details[i].PRFeedData.length;
        index++
      ) {
        if (
          provider_details[i].PRFeedData[index].subject_line &&
          provider_details[i].PRFeedData[index].input_text
        ) {
          if (
            provider_details[i].PRFeedData[index].feed_show_status === false
          ) {
            continue;
          }
          let provider_details_seen1 = await ProviderDetailsSeen.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "feed",
            PRFeedId: provider_details[i].PRFeedData[index]._id,
          }).exec();

          let like = await ProviderLike.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id,
            type: "feed",
            PRFeedId: provider_details[i].PRFeedData[index]._id,
          }).exec();
          let Wished = await ProviderWishlist.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "feed",
            PRFeedId: provider_details[i].PRFeedData[index]._id,
          }).exec();
          let like_status;
          let wished_status;
          if (like) {
            like_status = true;
          } else {
            like_status = false;
          }
          if (Wished) {
            wished_status = true;
          } else {
            wished_status = false;
          }

          if (
            new Date().toISOString() >=
              provider_details[i].PRFeedData[index].post_start_date &&
            new Date().toISOString() <=
              provider_details[i].PRFeedData[index].post_end_date
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].PRFeedData[index].subject_line,
              input_text: provider_details[i].PRFeedData[index].input_text,
              post_start_date:
                provider_details[i].PRFeedData[index].post_start_date,
              post_end_date:
                provider_details[i].PRFeedData[index].post_end_date,
              picture_1: provider_details[i].PRFeedData[index].picture_1.url
                ? "https://" +
                  hostname +
                  provider_details[i].PRFeedData[index].picture_1.url
                : "",
              picture_2: provider_details[i].PRFeedData[index].picture_2.url
                ? "https://" +
                  hostname +
                  provider_details[i].PRFeedData[index].picture_2.url
                : "",
              feed_show_status:
                provider_details[i].PRFeedData[index].feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo.url,
              like_count: provider_details[i].PRFeedData[index].like_count,
              wishlist_count:
                provider_details[i].PRFeedData[index].wishlist_count,
              like_status:
                provider_details[i].PRFeedData[index]._id.toString() ===
                  like?.PRFeedId || false,
              seen_status: provider_details_seen1?.type === "feed" || false,
              type: "feed",
              PrFeedId: provider_details[i].PRFeedData[index]._id,
              wished_status:
                provider_details[i].PRFeedData[index]._id.toString() ===
                  Wished?.PRFeedId || false,
              update_time: provider_details[i].PRFeedData[index].update_time,
              region: provider_details[i].region,
            });
          }

          // if(provider_details[i].PRFeedData[index].post_end_date>=new Date()){

          // }
        }
      }

      if (
        provider_details[i].company_presentation_subject_line &&
        provider_details[i].company_presentation_input_text
      ) {
        if (
          provider_details[i].company_presentation_feed_show_status === true
        ) {
          let provider_details_seen2 = await ProviderDetailsSeen.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id,
            type: "company_presentation",
          }).exec();

          let like = await ProviderLike.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "company_presentation",
          }).exec();
          let Wished = await ProviderWishlist.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "company_presentation",
          }).exec();
          let like_status;
          let wished_status;
          if (like) {
            like_status = true;
          } else {
            like_status = false;
          }
          if (Wished) {
            wished_status = true;
          } else {
            wished_status = false;
          }
          if (
            new Date().toISOString() >=
              provider_details[i].companyWelcomeStartDay &&
            new Date().toISOString() <= provider_details[i].companyWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line:
                provider_details[i].company_presentation_subject_line,
              input_text: provider_details[i].company_presentation_input_text,
              post_start_date: provider_details[i].companyWelcomeStartDay,
              post_end_date: provider_details[i].companyWelcomeEndDay,
              picture_1: provider_details[i].company_presentation_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].company_presentation_picture_1?.url
                : "",
              picture_2: provider_details[i].company_presentation_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].company_presentation_picture_2?.url
                : "",
              feed_show_status:
                provider_details[i].company_presentation_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].company_presentation_like_count,
              wishlist_count:
                provider_details[i].company_presentation_wishlist_count,
              like_status: like_status,
              seen_status:
                provider_details_seen2?.type === "company_presentation",
              type: "company_presentation",
              wished_status: wished_status,
              update_time: provider_details[i].company_presentation_update_time,
              region: provider_details[i].region,
            });
          }
        }
      }

      if (
        provider_details[i].job_advertisement_subject_line &&
        provider_details[i].job_advertisement_input_text
      ) {
        if (provider_details[i].job_advertisement_feed_show_status === true) {
          let provider_details_seen3 = await ProviderDetailsSeen.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id,
            type: "job_advertisement",
          }).exec();

          let like = await ProviderLike.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "job_advertisement",
          }).exec();
          let Wished = await ProviderWishlist.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "job_advertisement",
          }).exec();
          let like_status;
          let wished_status;
          if (like) {
            like_status = true;
          } else {
            like_status = false;
          }
          if (Wished) {
            wished_status = true;
          } else {
            wished_status = false;
          }
          if (
            new Date().toISOString() >=
              provider_details[i].jobAdvertisementWelcomeStartDay &&
            new Date().toISOString() <=
              provider_details[i].jobAdvertisementWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].job_advertisement_subject_line,
              input_text: provider_details[i].job_advertisement_input_text,
              post_start_date:
                provider_details[i].jobAdvertisementWelcomeStartDay,
              post_end_date: provider_details[i].jobAdvertisementWelcomeEndDay,
              picture_1: provider_details[i].job_advertisement_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].job_advertisement_picture_1?.url
                : "",
              picture_2: provider_details[i].job_advertisement_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].job_advertisement_picture_2?.url
                : "",
              feed_show_status:
                provider_details[i].job_advertisement_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].job_advertisement_like_count,
              wishlist_count:
                provider_details[i].job_advertisement_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen3?.type === "job_advertisement",
              type: "job_advertisement",
              wished_status: wished_status,
              update_time: provider_details[i].job_advertisement_update_time,
              region: provider_details[i].region,
            });
          }
        }
      }

      if (
        provider_details[i].flyer_subject_line &&
        provider_details[i].flyer_input_text
      ) {
        if (provider_details[i].flyer_feed_show_status === true) {
          let provider_details_seen4 = await ProviderDetailsSeen.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id,
            type: "flyer",
          }).exec();

          let like = await ProviderLike.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "flyer",
          }).exec();
          let Wished = await ProviderWishlist.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "flyer",
          }).exec();
          let like_status;
          let wished_status;
          if (like) {
            like_status = true;
          } else {
            like_status = false;
          }
          if (Wished) {
            wished_status = true;
          } else {
            wished_status = false;
          }
          if (
            new Date().toISOString() >=
              provider_details[i].flyerWelcomeStartDay &&
            new Date().toISOString() <= provider_details[i].flyerWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].flyer_subject_line,
              input_text: provider_details[i].flyer_input_text,
              post_start_date: provider_details[i].flyerWelcomeStartDay,
              post_end_date: provider_details[i].flyerWelcomeEndDay,
              picture_1: provider_details[i].flyer_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].flyer_picture_1?.url
                : "",
              picture_2: provider_details[i].flyer_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].flyer_picture_2?.url
                : "",
              feed_show_status: provider_details[i].flyer_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].flyer_like_count,
              wishlist_count: provider_details[i].flyer_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen4?.type === "flyer",
              type: "flyer",
              wished_status: wished_status,
              update_time: provider_details[i].flyer_update_time,
              region: provider_details[i].region,
            });
          }
        }
      }

      if (
        provider_details[i].advertisement_subject_line &&
        provider_details[i].advertisement_input_text
      ) {
        if (provider_details[i].advertisement_feed_show_status === true) {
          let provider_details_seen5 = await ProviderDetailsSeen.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id,
            type: "advertisement",
          }).exec();

          let like = await ProviderLike.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "advertisement",
          }).exec();
          let Wished = await ProviderWishlist.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "advertisement",
          }).exec();
          let like_status;
          let wished_status;
          if (like) {
            like_status = true;
          } else {
            like_status = false;
          }
          if (Wished) {
            wished_status = true;
          } else {
            wished_status = false;
          }
          if (
            new Date().toISOString() >=
              provider_details[i].advertisementWelcomeStartDay &&
            new Date().toISOString() <=
              provider_details[i].advertisementWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].advertisement_subject_line,
              input_text: provider_details[i].advertisement_input_text,
              post_start_date: provider_details[i].advertisementWelcomeStartDay,
              post_end_date: provider_details[i].advertisementWelcomeEndDay,
              picture_1:
                hostname + provider_details[i].advertisement_picture_1?.url
                  ? "https://" +
                    hostname +
                    provider_details[i].advertisement_picture_1?.url
                  : "",
              picture_2: provider_details[i].advertisement_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].advertisement_picture_2?.url
                : "",
              feed_show_status:
                provider_details[i].advertisement_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].advertisement_like_count,
              wishlist_count: provider_details[i].advertisement_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen5?.type === "advertisement",
              type: "advertisement",
              wished_status: wished_status,
              update_time: provider_details[i].advertisement_update_time,
              region: provider_details[i].region,
            });
          }
        }
      }

      if (
        provider_details[i].menu_subject_line &&
        provider_details[i].menu_input_text
      ) {
        if (provider_details[i].menu_feed_show_status === true) {
          let provider_details_seen6 = await ProviderDetailsSeen.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id,
            type: "menu",
          }).exec();

          let like = await ProviderLike.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "menu",
          }).exec();
          let Wished = await ProviderWishlist.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "menu",
          }).exec();
          let like_status;
          let wished_status;
          if (like) {
            like_status = true;
          } else {
            like_status = false;
          }
          if (Wished) {
            wished_status = true;
          } else {
            wished_status = false;
          }
          if (
            new Date().toISOString() >=
              provider_details[i].menuWelcomeStartDay &&
            new Date().toISOString() <= provider_details[i].menuWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].menu_subject_line,
              input_text: provider_details[i].menu_input_text,
              post_start_date: provider_details[i].menuWelcomeStartDay,
              post_end_date: provider_details[i].menuWelcomeEndDay,
              picture_1: provider_details[i].menu_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].menu_picture_1?.url
                : "",
              picture_2: provider_details[i].menu_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].menu_picture_2?.url
                : "",
              feed_show_status: provider_details[i].menu_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].menu_like_count,
              wishlist_count: provider_details[i].menu_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen6?.type === "menu",
              type: "menu",
              wished_status: wished_status,
              update_time: provider_details[i].menu_update_time,
              region: provider_details[i].region,
            });
          }
        }
      }

      if (
        provider_details[i].info_subject_line &&
        provider_details[i].info_input_text
      ) {
        if (provider_details[i].info_feed_show_status === true) {
          let provider_details_seen6 = await ProviderDetailsSeen.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id,
            type: "info",
          }).exec();

          let like = await ProviderLike.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "info",
          }).exec();
          let Wished = await ProviderWishlist.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "info",
          }).exec();
          let like_status;
          let wished_status;
          if (like) {
            like_status = true;
          } else {
            like_status = false;
          }
          if (Wished) {
            wished_status = true;
          } else {
            wished_status = false;
          }

          if (
            new Date().toISOString() >=
              provider_details[i].infoWelcomeStartDay &&
            new Date().toISOString() <= provider_details[i].infoWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].info_subject_line,
              input_text: provider_details[i].info_input_text,
              post_start_date: provider_details[i].infoWelcomeStartDay,
              post_end_date: provider_details[i].infoWelcomeEndDay,
              picture_1: provider_details[i].info_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].info_picture_1?.url
                : "",
              picture_2: provider_details[i].info_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].info_picture_2?.url
                : "",
              feed_show_status: provider_details[i].info_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].info_like_count,
              wishlist_count: provider_details[i].info_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen6?.type === "info",
              type: "info",
              wished_status: wished_status,
              update_time: provider_details[i].info_update_time,
              region: provider_details[i].region,
            });
          }
        }
      }

      if (
        provider_details[i].event_subject_line &&
        provider_details[i].event_input_text
      ) {
        if (provider_details[i].event_feed_show_status === true) {
          let provider_details_seen7 = await ProviderDetailsSeen.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id,
            type: "event",
          }).exec();

          let like = await ProviderLike.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "event",
          }).exec();
          let Wished = await ProviderWishlist.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "event",
          }).exec();
          let like_status;
          let wished_status;
          if (like) {
            like_status = true;
          } else {
            like_status = false;
          }
          if (Wished) {
            wished_status = true;
          } else {
            wished_status = false;
          }

          if (
            new Date().toISOString() >=
              provider_details[i].eventWelcomeStartDay &&
            new Date().toISOString() <= provider_details[i].eventWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].event_subject_line,
              input_text: provider_details[i].event_input_text,
              post_start_date: provider_details[i].eventWelcomeStartDay,
              post_end_date: provider_details[i].eventWelcomeEndDay,
              picture_1: provider_details[i].event_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].event_picture_1?.url
                : "",
              picture_2: provider_details[i].event_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].event_picture_2?.url
                : "",
              feed_show_status: provider_details[i].event_subject_line,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].event_like_count,
              wishlist_count: provider_details[i].event_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen7?.type === "event",
              type: "event",
              wished_status: wished_status,
              update_time: provider_details[i].event_update_time,
              region: provider_details[i].region,
            });
          }
        }
      }

      if (
        provider_details[i].advertising_video_subject_line &&
        provider_details[i].advertising_video_input_text
      ) {
        if (provider_details[i].advertising_video_feed_show_status === true) {
          let provider_details_seen8 = await ProviderDetailsSeen.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id,
            type: "advertising_video",
          }).exec();

          let like = await ProviderLike.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "advertising_video",
          }).exec();
          let Wished = await ProviderWishlist.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "advertising_video",
          }).exec();
          let like_status;
          let wished_status;
          if (like) {
            like_status = true;
          } else {
            like_status = false;
          }
          if (Wished) {
            wished_status = true;
          } else {
            wished_status = false;
          }
          if (
            new Date().toISOString() >=
              provider_details[i].advertisingVideoWelcomeStartDay &&
            new Date().toISOString() <=
              provider_details[i].advertisingVideoWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].advertising_video_subject_line,
              input_text: provider_details[i].advertising_video_input_text,
              post_start_date:
                provider_details[i].advertisingVideoWelcomeStartDay,
              post_end_date: provider_details[i].advertisingVideoWelcomeEndDay,
              picture_1: provider_details[i].advertising_video_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].advertising_video_picture_1?.url
                : "",
              picture_2: provider_details[i].advertising_video_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].advertising_video_picture_2?.url
                : "",
              feed_show_status:
                provider_details[i].advertising_video_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].advertising_video_like_count,
              wishlist_count:
                provider_details[i].advertising_video_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen8?.type === "advertising_video",
              type: "advertising_video",
              wished_status: wished_status,
              update_time: provider_details[i].advertising_video_update_time,
              region: provider_details[i].region,
            });
          }
        }
      }

      //  var total_data = results.concat(results);
      //  var total_data = results_2.concat(results_3);
      //  var total_data = results_4.concat(results_4);
      //  var total_data = results_5.concat(results_5);
      //  var total_data = results_6.concat(results_6);
      //  var total_data = results_7.concat(results_7);
      //  var total_data = results_8.concat(results_8);
      //  var total_data = results_9.concat(results_9);
      // var total_data = [...results,...results_2, ...results_3, ...results_4, ...results_5, ...results_6, ...results_7, ...results_8, ...results_9]
    }
    res.send({
      success: true,
      message: "PR list",
      data: results.sort(function (a, b) {
        return a.update_time > b.update_time
          ? -1
          : a.update_time > b.update_time
          ? 1
          : 0;
      }),
    });
  } else {
    res.send({ success: false, message: "No data found" });
  }
});
router.post("/feedLike", async (req, res, next) => {
  var user_id = req.body.user_id;
  var provider_id = req.body.provider_id;
  var type = req.body.type;
  var PRFeedId = req.body.PRFeedId;
  // console.log(req.body,"??????????");
  var provider_details = await ProviderModel.findOne({
    _id: provider_id,
  }).exec();
  // console.log();
  // var provider_like_details = await ProviderLike.findOne({ "user_id": user_id, "provider_id": provider_id }).exec();

  if (PRFeedId) {
    var provider_like_details = await ProviderLike.findOne({
      user_id: user_id,
      provider_id: provider_id,
      type: type,
      PRFeedId: PRFeedId,
    }).exec();
  } else {
    var provider_like_details = await ProviderLike.findOne({
      user_id: user_id,
      provider_id: provider_id,
      type: type,
    }).exec();
  }

  // if (provider_like_details) {
  //   var new_like_count = parseInt(provider_details.like_count) - 1;
  //   await ProviderModel.updateOne({ "_id": provider_id }, {
  //     "like_count": new_like_count
  //   }).exec();

  //   await ProviderLike.deleteOne({ "user_id": user_id, "provider_id": provider_id }).exec();

  //   res.send({ success: true, message: "Unliked" });
  // } else {
  //   var new_like_count = parseInt(provider_details.like_count) + 1;
  //   await ProviderModel.updateOne({ "_id": provider_id }, {
  //     "like_count": new_like_count
  //   }).exec();

  //   const provider_like_data = new ProviderLike({
  //     user_id: user_id,
  //     provider_id: provider_id,
  //     type: type,
  //     PRFeedId: PRFeedId
  //   });
  //   provider_like_data.save();

  //   res.send({ success: true, message: "Liked" });
  // }
  switch (type) {
    case "feed":
      if (provider_like_details) {
        let new_wishlist_count_temp = provider_details.PRFeedData.find(
          (ele) => ele._id.toString() === PRFeedId
        );
        let new_wishlist_count = new_wishlist_count_temp.like_count - 1;
        await ProviderModel.updateOne(
          { _id: provider_id, "PRFeedData._id": PRFeedId },
          {
            "PRFeedData.$.like_count": new_wishlist_count,
          }
        ).exec();

        await ProviderLike.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        }).exec();

        res.send({ success: true, message: "Unliked" });
      } else {
        let new_wishlist_count_temp = provider_details.PRFeedData.find(
          (ele) => ele._id.toString() === PRFeedId
        );
        let new_wishlist_count = new_wishlist_count_temp.like_count + 1;
        await ProviderModel.updateOne(
          { _id: provider_id, "PRFeedData._id": PRFeedId },
          {
            "PRFeedData.$.like_count": new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderLike({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Liked" });
      }
      break;
    case "company_presentation":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.company_presentation_like_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            company_presentation_like_count: new_wishlist_count,
          }
        ).exec();

        await ProviderLike.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Unliked" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.company_presentation_like_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            company_presentation_like_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderLike({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Liked" });
      }
      break;
    case "job_advertisement":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.job_advertisement_like_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            job_advertisement_like_count: new_wishlist_count,
          }
        ).exec();

        await ProviderLike.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Unliked" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.job_advertisement_like_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            job_advertisement_like_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderLike({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Liked" });
      }
      break;
    case "flyer":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.flyer_like_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            flyer_like_count: new_wishlist_count,
          }
        ).exec();

        await ProviderLike.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Unliked" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.flyer_like_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            flyer_like_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderLike({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Liked" });
      }
      break;
    case "advertisement":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.advertisement_like_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            advertisement_like_count: new_wishlist_count,
          }
        ).exec();

        await ProviderLike.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Unliked" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.advertisement_like_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            advertisement_like_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderLike({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Liked" });
      }
      break;
    case "menu":
      if (provider_like_details) {
        let new_wishlist_count = parseInt(provider_details.menu_like_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            menu_like_count: new_wishlist_count,
          }
        ).exec();

        await ProviderLike.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Unliked" });
      } else {
        let new_wishlist_count = parseInt(provider_details.menu_like_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            menu_like_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderLike({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Liked" });
      }
      break;
    case "info":
      if (provider_like_details) {
        let new_wishlist_count = parseInt(provider_details.info_like_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            info_like_count: new_wishlist_count,
          }
        ).exec();

        await ProviderLike.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Unliked" });
      } else {
        let new_wishlist_count = parseInt(provider_details.info_like_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            info_like_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderLike({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Liked" });
      }
      break;
    case "event":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.event_like_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            event_like_count: new_wishlist_count,
          }
        ).exec();

        await ProviderLike.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Unliked" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.event_like_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            event_like_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderLike({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Liked" });
      }
      break;
    case "advertising_video":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.advertising_video_like_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            advertising_video_like_count: new_wishlist_count,
          }
        ).exec();

        await ProviderLike.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Unliked" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.advertising_video_like_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            advertising_video_like_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderLike({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Liked" });
      }
      break;

    default:
      break;
  }
});

router.get(
  "/prfeedDetails/:provider_id/:user_id/:type",
  async (req, res, next) => {
    var provider_id = req.params.provider_id;
    var type = req.params.type;
    var PrFeedId = req.query.PrFeedId;
    var provider_data = {};
    if (!provider_id) {
      res.send({ success: false, message: "provider id mandatory" });
    }
    if (!type) {
      res.send({ success: false, message: "type mandatory" });
    }
    var user_id = req.params.user_id;
    var provider_details = await ProviderModel.findOne({
      _id: provider_id,
    }).exec();
    if (provider_details) {
      if (PrFeedId) {
        var like = await ProviderLike.findOne({
          user_id: user_id,
          provider_id: provider_details._id.toString(),
          type: type,
          PRFeedId: PrFeedId,
        }).exec();
      } else {
        var like = await ProviderLike.findOne({
          user_id: user_id,
          provider_id: provider_details._id.toString(),
          type: type,
        }).exec();
      }
      // if (like) {
      //   var like_status = true;
      // } else {
      //   var like_status = false;
      // }

      // var Wished = await ProviderWishlist.findOne({ "user_id": user_id, "provider_id": provider_details._id.toString() }).exec();

      if (PrFeedId) {
        var Wished = await ProviderWishlist.findOne({
          user_id: user_id,
          provider_id: provider_details._id.toString(),
          type: type,
          PRFeedId: PrFeedId,
        }).exec();
      } else {
        var Wished = await ProviderWishlist.findOne({
          user_id: user_id,
          provider_id: provider_details._id.toString(),
          type: type,
        }).exec();
      }

      // if (Wished) {
      //   var wished_status = true;
      // } else {
      //   var wished_status = false;
      // }

      //provider details seen

      if (PrFeedId) {
        var provider_details_seen = await ProviderDetailsSeen.findOne({
          user_id: user_id.toString(),
          provider_id: provider_id.toString(),
          type: type,
          PRFeedId: PrFeedId,
        }).exec();
      } else {
        var provider_details_seen = await ProviderDetailsSeen.findOne({
          user_id: user_id.toString(),
          provider_id: provider_id.toString(),
          type: type,
        }).exec();
      }

      if (!provider_details_seen) {
        const provider_seen_data = new ProviderDetailsSeen({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PrFeedId,
        });
        provider_seen_data.save();
      }

      var hostname = req.headers.host;

      if (type === "feed") {
        let obj = provider_details.PRFeedData.find(
          (o) => o._id.toString() === PrFeedId
        );
        provider_data = {
          provider: provider_details._id,
          subject_line: obj.subject_line,
          input_text: obj.input_text,
          post_start_date: obj.post_start_date,
          post_end_date: obj.post_end_date,
          pictures: [
            obj.picture_1?.url
              ? "https://" + hostname + obj.picture_1?.url
              : "",
            obj.picture_2?.url
              ? "https://" + hostname + obj.picture_2?.url
              : "",
          ],
          // picture_1: 'https://' + hostname + provider_details.picture_1?.url,
          // picture_2: 'https://' + hostname + provider_details.picture_2?.url,
          picture_1: obj.picture_1?.url
            ? "https://" + hostname + obj.picture_1?.url
            : "",
          picture_2: obj.picture_2?.url
            ? "https://" + hostname + obj.picture_2?.url
            : "",
          feed_show_status: obj.feed_show_status,
          providerName: provider_details.providerName,
          logo: "https://" + hostname + provider_details.logo.url,
          like_count: obj.like_count,
          like_status: like ? true : false,
          wished_status: Wished ? true : false,
          region: provider_details.region,
        };
      }
      if (type === "company_presentation") {
        provider_data = {
          provider: provider_details._id,
          subject_line: provider_details.company_presentation_subject_line,
          input_text: provider_details.company_presentation_input_text,
          post_start_date: provider_details.companyWelcomeStartDay,
          post_end_date: provider_details.companyWelcomeEndDay,
          pictures: [
            provider_details.company_presentation_picture_1?.url
              ? "https://" +
                hostname +
                provider_details.company_presentation_picture_1?.url
              : "",
            "https://" +
            hostname +
            provider_details.company_presentation_picture_2?.url
              ? provider_details.company_presentation_picture_2?.url
              : "",
          ],
          picture_1: provider_details.company_presentation_picture_1?.url
            ? "https://" +
              hostname +
              provider_details.company_presentation_picture_1?.url
            : "",
          picture_2: provider_details.company_presentation_picture_2?.url
            ? "https://" +
              hostname +
              provider_details.company_presentation_picture_2?.url
            : "",
          feed_show_status:
            provider_details.company_presentation_feed_show_status,
          providerName: provider_details.providerName,
          logo: "https://" + hostname + provider_details.logo.url,
          like_count: provider_details.company_presentation_like_count,
          like_status: like ? true : false,
          wished_status: Wished ? true : false,
          region: provider_details.region,
        };
      }
      if (type === "job_advertisement") {
        provider_data = {
          provider: provider_details._id,
          subject_line: provider_details.job_advertisement_subject_line,
          input_text: provider_details.job_advertisement_input_text,
          post_start_date: provider_details.jobAdvertisementWelcomeStartDay,
          post_end_date: provider_details.jobAdvertisementWelcomeEndDay,
          pictures: [
            provider_details.job_advertisement_picture_1?.url
              ? "https://" +
                hostname +
                provider_details.job_advertisement_picture_1?.url
              : "",
            provider_details.job_advertisement_picture_2?.url
              ? "https://" +
                hostname +
                provider_details.job_advertisement_picture_2?.url
              : "",
          ],
          picture_1: provider_details.job_advertisement_picture_1?.url
            ? "https://" +
              hostname +
              provider_details.job_advertisement_picture_1?.url
            : "",
          picture_2: provider_details.job_advertisement_picture_2?.url
            ? "https://" +
              hostname +
              provider_details.job_advertisement_picture_2?.url
            : "",
          feed_show_status: provider_details.job_advertisement_feed_show_status,
          providerName: provider_details.providerName,
          logo: "https://" + hostname + provider_details.logo.url,
          like_count: provider_details.job_advertisement_like_count,
          like_status: like ? true : false,
          wished_status: Wished ? true : false,
          region: provider_details.region,
        };
      }
      if (type === "flyer") {
        provider_data = {
          provider: provider_details._id,
          subject_line: provider_details.flyer_subject_line,
          input_text: provider_details.flyer_input_text,
          post_start_date: provider_details.flyerWelcomeStartDay,
          post_end_date: provider_details.flyerWelcomeEndDay,
          pictures: [
            provider_details.flyer_picture_1?.url
              ? "https://" + hostname + provider_details.flyer_picture_1?.url
              : "",
            provider_details.flyer_picture_2?.url
              ? "https://" + hostname + provider_details.flyer_picture_2?.url
              : "",
          ],
          picture_1: provider_details.flyer_picture_1?.url
            ? "https://" + hostname + provider_details.flyer_picture_1?.url
            : "",
          picture_2: provider_details.flyer_picture_2?.url
            ? "https://" + hostname + provider_details.flyer_picture_2?.url
            : "",
          feed_show_status: provider_details.flyer_feed_show_status,
          providerName: provider_details.providerName,
          logo: "https://" + hostname + provider_details.logo.url,
          like_count: provider_details.flyer_like_count,
          like_status: like ? true : false,
          wished_status: Wished ? true : false,
          region: provider_details.region,
        };
      }
      if (type === "advertisement") {
        provider_data = {
          provider: provider_details._id,
          subject_line: provider_details.advertisement_subject_line,
          input_text: provider_details.advertisement_input_text,
          post_start_date: provider_details.advertisementWelcomeStartDay,
          post_end_date: provider_details.advertisementWelcomeEndDay,
          pictures: [
            provider_details.advertisement_picture_1?.url
              ? "https://" +
                hostname +
                provider_details.advertisement_picture_1?.url
              : "",
            provider_details.advertisement_picture_2?.url
              ? "https://" +
                hostname +
                provider_details.advertisement_picture_2?.url
              : "",
          ],
          picture_1: provider_details.advertisement_picture_1?.url
            ? "https://" +
              hostname +
              provider_details.advertisement_picture_1?.url
            : "",
          picture_2: provider_details.advertisement_picture_2?.url
            ? "https://" +
              hostname +
              provider_details.advertisement_picture_2?.url
            : "",
          feed_show_status: provider_details.advertisement_feed_show_status,
          providerName: provider_details.providerName,
          logo: "https://" + hostname + provider_details.logo.url,
          like_count: provider_details.advertisement_like_count,
          like_status: like ? true : false,
          wished_status: Wished ? true : false,
          region: provider_details.region,
        };
      }
      if (type === "menu") {
        provider_data = {
          provider: provider_details._id,
          subject_line: provider_details.menu_subject_line,
          input_text: provider_details.menu_input_text,
          post_start_date: provider_details.menuWelcomeStartDay,
          post_end_date: provider_details.menuWelcomeEndDay,
          pictures: [
            provider_details.menu_picture_1?.url
              ? "https://" + hostname + provider_details.menu_picture_1?.url
              : "",
            provider_details.menu_picture_2?.url
              ? "https://" + hostname + provider_details.menu_picture_2?.url
              : "",
          ],
          picture_1: provider_details.menu_picture_1?.url
            ? "https://" + hostname + provider_details.menu_picture_1?.url
            : "",
          picture_2: provider_details.menu_picture_2?.url
            ? "https://" + hostname + provider_details.menu_picture_2?.url
            : "",
          feed_show_status: provider_details.menu_feed_show_status,
          providerName: provider_details.providerName,
          logo: "https://" + hostname + provider_details.logo.url,
          like_count: provider_details.menu_like_count,
          like_status: like ? true : false,
          wished_status: Wished ? true : false,
          region: provider_details.region,
        };
      }
      if (type === "info") {
        provider_data = {
          provider: provider_details._id,
          subject_line: provider_details.info_subject_line,
          input_text: provider_details.info_input_text,
          post_start_date: provider_details.infoWelcomeStartDay,
          post_end_date: provider_details.infoWelcomeEndDay,
          pictures: [
            provider_details.info_picture_1?.url
              ? "https://" + hostname + provider_details.info_picture_1?.url
              : "",
            provider_details.info_picture_2?.url
              ? "https://" + hostname + provider_details.info_picture_2?.url
              : "",
          ],
          picture_1: provider_details.info_picture_1?.url
            ? "https://" + hostname + provider_details.info_picture_1?.url
            : "",
          picture_2: provider_details.info_picture_2?.url
            ? "https://" + hostname + provider_details.info_picture_2?.url
            : "",
          feed_show_status: provider_details.info_feed_show_status,
          providerName: provider_details.providerName,
          logo: "https://" + hostname + provider_details.logo.url,
          like_count: provider_details.info_like_count,
          like_status: like ? true : false,
          wished_status: Wished ? true : false,
          region: provider_details.region,
        };
      }
      if (type === "event") {
        provider_data = {
          provider: provider_details._id,
          subject_line: provider_details.event_subject_line,
          input_text: provider_details.event_input_text,
          post_start_date: provider_details.eventWelcomeStartDay,
          post_end_date: provider_details.eventWelcomeEndDay,
          pictures: [
            provider_details.event_picture_1?.url
              ? "https://" + hostname + provider_details.event_picture_1?.url
              : "",
            provider_details.event_picture_2?.url
              ? "https://" + hostname + provider_details.event_picture_2?.url
              : "",
          ],
          picture_1: provider_details.event_picture_1?.url
            ? "https://" + hostname + provider_details.event_picture_1?.url
            : "",
          picture_2: provider_details.event_picture_2?.url
            ? "https://" + hostname + provider_details.event_picture_2?.url
            : "",
          feed_show_status: provider_details.event_feed_show_status,
          providerName: provider_details.providerName,
          logo: "https://" + hostname + provider_details.logo.url,
          like_count: provider_details.event_like_count,
          like_status: like ? true : false,
          wished_status: Wished ? true : false,
          region: provider_details.region,
        };
      }
      if (type === "advertising_video") {
        provider_data = {
          provider: provider_details._id,
          subject_line: provider_details.advertising_video_subject_line,
          input_text: provider_details.advertising_video_input_text,
          post_start_date: provider_details.advertisingVideoWelcomeStartDay,
          post_end_date: provider_details.advertisingVideoWelcomeEndDay,
          pictures: [
            provider_details.advertising_video_picture_1?.url
              ? "https://" +
                hostname +
                provider_details.advertising_video_picture_1?.url
              : "",
            provider_details.advertising_video_picture_2?.url
              ? "https://" +
                hostname +
                provider_details.advertising_video_picture_2?.url
              : "",
          ],
          picture_1: provider_details.advertising_video_picture_1?.url
            ? "https://" +
              hostname +
              provider_details.advertising_video_picture_1?.url
            : "",
          picture_2: provider_details.advertising_video_picture_2?.url
            ? "https://" +
              hostname +
              provider_details.advertising_video_picture_2?.url
            : "",
          feed_show_status: provider_details.advertising_video_feed_show_status,
          providerName: provider_details.providerName,
          logo: "https://" + hostname + provider_details.logo.url,
          like_count: provider_details.advertising_video_like_count,
          like_status: like ? true : false,
          wished_status: Wished ? true : false,
          region: provider_details.region,
        };
      }
      res.send({ success: true, message: "PR details", data: provider_data });
    } else {
      res.send({ success: false, message: "No data found" });
    }
  }
);

router.post("/feedWishlist", async (req, res, next) => {
  var user_id = req.body.user_id;
  var provider_id = req.body.provider_id;
  var type = req.body.type;
  var PRFeedId = req.body.PRFeedId;

  var provider_details = await ProviderModel.findOne({
    _id: provider_id,
  }).exec();
  if (PRFeedId) {
    var provider_like_details = await ProviderWishlist.findOne({
      user_id: user_id,
      provider_id: provider_id,
      type: type,
      PRFeedId: PRFeedId,
    }).exec();
  } else {
    var provider_like_details = await ProviderWishlist.findOne({
      user_id: user_id,
      provider_id: provider_id,
      type: type,
    }).exec();
  }

  switch (type) {
    case "feed":
      if (provider_like_details) {
        let new_wishlist_count_temp = provider_details.PRFeedData.find(
          (ele) => ele._id.toString() === PRFeedId
        );
        let new_wishlist_count = new_wishlist_count_temp.wishlist_count - 1;
        await ProviderModel.updateOne(
          { _id: provider_id, "PRFeedData._id": PRFeedId },
          {
            "PRFeedData.$.wishlist_count": new_wishlist_count,
          }
        ).exec();

        await ProviderWishlist.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        }).exec();

        res.send({ success: true, message: "Not wished" });
      } else {
        let new_wishlist_count_temp = provider_details.PRFeedData.find(
          (ele) => ele._id.toString() === PRFeedId
        );
        let new_wishlist_count = new_wishlist_count_temp.wishlist_count + 1;
        await ProviderModel.updateOne(
          { _id: provider_id, "PRFeedData._id": PRFeedId },
          {
            "PRFeedData.$.wishlist_count": new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderWishlist({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Wished" });
      }
      break;
    case "company_presentation":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.company_presentation_wishlist_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            company_presentation_wishlist_count: new_wishlist_count,
          }
        ).exec();

        await ProviderWishlist.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Not wished" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.company_presentation_wishlist_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            company_presentation_wishlist_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderWishlist({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Wished" });
      }
      break;
    case "job_advertisement":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.job_advertisement_wishlist_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            job_advertisement_wishlist_count: new_wishlist_count,
          }
        ).exec();

        await ProviderWishlist.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Not wished" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.job_advertisement_wishlist_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            job_advertisement_wishlist_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderWishlist({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Wished" });
      }
      break;
    case "flyer":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.flyer_wishlist_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            flyer_wishlist_count: new_wishlist_count,
          }
        ).exec();

        await ProviderWishlist.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Not wished" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.flyer_wishlist_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            flyer_wishlist_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderWishlist({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Wished" });
      }
      break;
    case "advertisement":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.advertisement_wishlist_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            advertisement_wishlist_count: new_wishlist_count,
          }
        ).exec();

        await ProviderWishlist.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Not wished" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.advertisement_wishlist_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            advertisement_wishlist_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderWishlist({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Wished" });
      }
      break;
    case "menu":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.menu_wishlist_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            menu_wishlist_count: new_wishlist_count,
          }
        ).exec();

        await ProviderWishlist.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Not wished" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.menu_wishlist_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            menu_wishlist_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderWishlist({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Wished" });
      }
      break;
    case "info":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.info_wishlist_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            info_wishlist_count: new_wishlist_count,
          }
        ).exec();

        await ProviderWishlist.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Not wished" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.info_wishlist_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            info_wishlist_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderWishlist({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Wished" });
      }
      break;
    case "event":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.event_wishlist_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            event_wishlist_count: new_wishlist_count,
          }
        ).exec();

        await ProviderWishlist.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Not wished" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.event_wishlist_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            event_wishlist_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderWishlist({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Wished" });
      }
      break;
    case "advertising_video":
      if (provider_like_details) {
        let new_wishlist_count =
          parseInt(provider_details.advertising_video_wishlist_count) - 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            advertising_video_wishlist_count: new_wishlist_count,
          }
        ).exec();

        await ProviderWishlist.deleteOne({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
        }).exec();

        res.send({ success: true, message: "Not wished" });
      } else {
        let new_wishlist_count =
          parseInt(provider_details.advertising_video_wishlist_count) + 1;
        await ProviderModel.updateOne(
          { _id: provider_id },
          {
            advertising_video_wishlist_count: new_wishlist_count,
          }
        ).exec();
        const provider_wishlist_data = new ProviderWishlist({
          user_id: user_id,
          provider_id: provider_id,
          type: type,
          PRFeedId: PRFeedId,
        });
        provider_wishlist_data.save();

        res.send({ success: true, message: "Wished" });
      }
      break;

    default:
      break;
  }
});

router.get("/get-my-wish-list-data/:user_id", async (req, res, next) => {
  if (!req.params) {
    res.send({ success: false, message: "User id mandatory" });
    //return false;
  }
  var user_id = req.params.user_id;
  if (!user_id) {
    res.send({ success: false, message: "User id mandatory" });
    //return false;
  }
  // var provider_details = await ProviderModel.find({ "feed_show_status":true }).exec();
  var provider_details = await ProviderModel.find({}).exec();
  if (provider_details.length > 0) {
    var hostname = req.headers.host;
    var results = [];
    // var results_2 = [];
    // var results_3 = [];
    // var results_4 = [];
    // var results_5 = [];
    // var results_6 = [];
    // var results_7 = [];
    // var results_8 = [];
    // var results_9 = [];
    // var total_data = [];
    for (var i = 0; i < provider_details.length; i++) {
      for (
        let index = 0;
        index < provider_details[i].PRFeedData.length;
        index++
      ) {
        if (
          provider_details[i].PRFeedData[index].subject_line &&
          provider_details[i].PRFeedData[index].input_text
        ) {
          if (
            provider_details[i].PRFeedData[index].feed_show_status === false
          ) {
            continue;
          }
          let provider_details_seen1 = await ProviderDetailsSeen.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id,
            type: "feed",
            PRFeedId: provider_details[i].PRFeedData[index]._id,
          }).exec();

          let like = await ProviderLike.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id,
            type: "feed",
            PRFeedId: provider_details[i].PRFeedData[index]._id,
          }).exec();
          let Wished = await ProviderWishlist.findOne({
            user_id: user_id,
            provider_id: provider_details[i]._id.toString(),
            type: "feed",
            PRFeedId: provider_details[i].PRFeedData[index]._id,
          }).exec();
          // console.log(Wished,"LLLLLLLL")
          let like_status;
          let wished_status;
          if (like) {
            like_status = true;
          } else {
            like_status = false;
          }
          if (Wished) {
            // console.log("Hello.........................")
            wished_status = true;
          } else {
            continue;
            // wished_status = false;
          }

          if (
            provider_details[i].PRFeedData[index]._id.toString() ===
            Wished?.PRFeedId
          ) {
            if (
              new Date().toISOString() >=
                provider_details[i].PRFeedData[index].post_start_date &&
              new Date().toISOString() <=
                provider_details[i].PRFeedData[index].post_end_date
            ) {
              results.push({
                provider: provider_details[i]._id,
                subject_line:
                  provider_details[i].PRFeedData[index].subject_line,
                input_text: provider_details[i].PRFeedData[index].input_text,
                post_start_date:
                  provider_details[i].PRFeedData[index].post_start_date,
                post_end_date:
                  provider_details[i].PRFeedData[index].post_end_date,
                picture_1: provider_details[i].PRFeedData[index].picture_1.url
                  ? "https://" +
                    hostname +
                    provider_details[i].PRFeedData[index].picture_1.url
                  : "",
                picture_2: provider_details[i].PRFeedData[index].picture_2.url
                  ? "https://" +
                    hostname +
                    provider_details[i].PRFeedData[index].picture_2.url
                  : "",
                feed_show_status:
                  provider_details[i].PRFeedData[index].feed_show_status,
                providerName: provider_details[i].providerName,
                logo: "https://" + hostname + provider_details[i].logo.url,
                like_count: provider_details[i].PRFeedData[index].like_count,
                wishlist_count:
                  provider_details[i].PRFeedData[index].wishlist_count,
                like_status:
                  provider_details[i].PRFeedData[index]._id.toString() ===
                    like?.PRFeedId || false,
                seen_status: provider_details_seen1?.type === "feed" || false,
                type: "feed",
                PrFeedId: provider_details[i].PRFeedData[index]._id,
                wished_status:
                  provider_details[i].PRFeedData[index]._id.toString() ===
                    Wished?.PRFeedId || false,
                region: provider_details[i].region,
              });
            }
          }
        }
      }

      if (
        provider_details[i].company_presentation_subject_line &&
        provider_details[i].company_presentation_input_text
      ) {
        if (
          provider_details[i].company_presentation_feed_show_status === false
        ) {
          continue;
        }
        let provider_details_seen2 = await ProviderDetailsSeen.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "company_presentation",
        }).exec();

        let like = await ProviderLike.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "company_presentation",
        }).exec();
        let Wished = await ProviderWishlist.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id.toString(),
          type: "company_presentation",
        }).exec();
        let like_status;
        let wished_status;
        if (like) {
          like_status = true;
        } else {
          // continue;
          like_status = false;
        }
        if (Wished) {
          wished_status = true;
          if (
            new Date().toISOString() >=
              provider_details[i].companyWelcomeStartDay &&
            new Date().toISOString() <= provider_details[i].companyWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line:
                provider_details[i].company_presentation_subject_line,
              input_text: provider_details[i].company_presentation_input_text,
              post_start_date: provider_details[i].companyWelcomeStartDay,
              post_end_date: provider_details[i].companyWelcomeEndDay,
              picture_1: provider_details[i].company_presentation_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].company_presentation_picture_1?.url
                : "",
              picture_2: provider_details[i].company_presentation_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].company_presentation_picture_2?.url
                : "",
              feed_show_status:
                provider_details[i].company_presentation_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].company_presentation_like_count,
              wishlist_count:
                provider_details[i].company_presentation_wishlist_count,
              like_status: like_status,
              seen_status:
                provider_details_seen2?.type === "company_presentation",
              type: "company_presentation",
              wished_status: wished_status,
              region: provider_details[i].region,
            });
          }
        } else {
          // continue;
          wished_status = false;
        }
      }

      if (
        provider_details[i].job_advertisement_subject_line &&
        provider_details[i].job_advertisement_input_text
      ) {
        if (provider_details[i].job_advertisement_feed_show_status === false) {
          continue;
        }
        let provider_details_seen3 = await ProviderDetailsSeen.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "job_advertisement",
        }).exec();

        let like = await ProviderLike.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "job_advertisement",
        }).exec();
        let Wished = await ProviderWishlist.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id.toString(),
          type: "job_advertisement",
        }).exec();
        let like_status;
        let wished_status;
        if (like) {
          like_status = true;
        } else {
          like_status = false;
        }
        if (Wished) {
          wished_status = true;
          if (
            new Date().toISOString() >=
              provider_details[i].jobAdvertisementWelcomeStartDay &&
            new Date().toISOString() <=
              provider_details[i].jobAdvertisementWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].job_advertisement_subject_line,
              input_text: provider_details[i].job_advertisement_input_text,
              post_start_date:
                provider_details[i].jobAdvertisementWelcomeStartDay,
              post_end_date: provider_details[i].jobAdvertisementWelcomeEndDay,
              picture_1: provider_details[i].job_advertisement_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].job_advertisement_picture_1?.url
                : "",
              picture_2: provider_details[i].job_advertisement_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].job_advertisement_picture_2?.url
                : "",
              feed_show_status:
                provider_details[i].job_advertisement_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].job_advertisement_like_count,
              wishlist_count:
                provider_details[i].job_advertisement_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen3?.type === "job_advertisement",
              type: "job_advertisement",
              wished_status: wished_status,
              region: provider_details[i].region,
            });
          }
        } else {
          // continue;
          wished_status = false;
        }
      }

      if (
        provider_details[i].flyer_subject_line &&
        provider_details[i].flyer_input_text
      ) {
        if (provider_details[i].flyer_feed_show_status === false) {
          continue;
        }
        let provider_details_seen4 = await ProviderDetailsSeen.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "flyer",
        }).exec();

        let like = await ProviderLike.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "flyer",
        }).exec();
        let Wished = await ProviderWishlist.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id.toString(),
          type: "flyer",
        }).exec();
        let like_status;
        let wished_status;
        if (like) {
          like_status = true;
        } else {
          like_status = false;
        }
        if (Wished) {
          wished_status = true;
          if (
            new Date().toISOString() >=
              provider_details[i].flyerWelcomeStartDay &&
            new Date().toISOString() <= provider_details[i].flyerWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].flyer_subject_line,
              input_text: provider_details[i].flyer_input_text,
              post_start_date: provider_details[i].flyerWelcomeStartDay,
              post_end_date: provider_details[i].flyerWelcomeEndDay,
              picture_1: provider_details[i].flyer_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].flyer_picture_1?.url
                : "",
              picture_2: provider_details[i].flyer_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].flyer_picture_2?.url
                : "",
              feed_show_status: provider_details[i].flyer_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].flyer_like_count,
              wishlist_count: provider_details[i].flyer_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen4?.type === "flyer",
              type: "flyer",
              wished_status: wished_status,
              region: provider_details[i].region,
            });
          }
        } else {
          // continue;
          wished_status = false;
        }
      }

      if (
        provider_details[i].advertisement_subject_line &&
        provider_details[i].advertisement_input_text
      ) {
        if (provider_details[i].advertisement_feed_show_status === false) {
          continue;
        }
        let provider_details_seen5 = await ProviderDetailsSeen.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "advertisement",
        }).exec();

        let like = await ProviderLike.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "advertisement",
        }).exec();
        let Wished = await ProviderWishlist.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id.toString(),
          type: "advertisement",
        }).exec();
        let like_status;
        let wished_status;
        if (like) {
          like_status = true;
        } else {
          like_status = false;
        }
        if (Wished) {
          wished_status = true;
          if (
            new Date().toISOString() >=
              provider_details[i].advertisementWelcomeStartDay &&
            new Date().toISOString() <=
              provider_details[i].advertisementWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].advertisement_subject_line,
              input_text: provider_details[i].advertisement_input_text,
              post_start_date: provider_details[i].advertisementWelcomeStartDay,
              post_end_date: provider_details[i].advertisementWelcomeEndDay,
              picture_1: provider_details[i].advertisement_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].advertisement_picture_1?.url
                : "",
              picture_2: provider_details[i].advertisement_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].advertisement_picture_2?.url
                : "",
              feed_show_status:
                provider_details[i].advertisement_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].advertisement_like_count,
              wishlist_count: provider_details[i].advertisement_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen5?.type === "advertisement",
              type: "advertisement",
              wished_status: wished_status,
              region: provider_details[i].region,
            });
          }
        } else {
          // continue;
          wished_status = false;
        }
      }

      if (
        provider_details[i].menu_subject_line &&
        provider_details[i].menu_input_text
      ) {
        if (provider_details[i].menu_feed_show_status === false) {
          continue;
        }
        let provider_details_seen6 = await ProviderDetailsSeen.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "menu",
        }).exec();

        let like = await ProviderLike.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "menu",
        }).exec();
        let Wished = await ProviderWishlist.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id.toString(),
          type: "menu",
        }).exec();

        let like_status;
        let wished_status;
        if (like) {
          like_status = true;
        } else {
          like_status = false;
        }
        if (Wished) {
          wished_status = true;
          if (
            new Date().toISOString() >=
              provider_details[i].menuWelcomeStartDay &&
            new Date().toISOString() <= provider_details[i].menuWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].menu_subject_line,
              input_text: provider_details[i].menu_input_text,
              post_start_date: provider_details[i].menuWelcomeStartDay,
              post_end_date: provider_details[i].menuWelcomeEndDay,
              picture_1: provider_details[i].menu_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].menu_picture_1?.url
                : "",
              picture_2: provider_details[i].menu_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].menu_picture_2?.url
                : "",
              feed_show_status: provider_details[i].menu_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].menu_like_count,
              wishlist_count: provider_details[i].menu_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen6?.type === "menu",
              type: "menu",
              wished_status: wished_status,
              region: provider_details[i].region,
            });
          }
        } else {
          // continue;
          wished_status = false;
        }
      }

      if (
        provider_details[i].info_subject_line &&
        provider_details[i].info_input_text
      ) {
        if (provider_details[i].info_feed_show_status === false) {
          continue;
        }
        let provider_details_seen6 = await ProviderDetailsSeen.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "info",
        }).exec();

        let like = await ProviderLike.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "info",
        }).exec();
        let Wished = await ProviderWishlist.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id.toString(),
          type: "info",
        }).exec();
        let like_status;
        let wished_status;
        if (like) {
          like_status = true;
        } else {
          like_status = false;
        }
        if (Wished) {
          wished_status = true;
          if (
            new Date().toISOString() >=
              provider_details[i].infoWelcomeStartDay &&
            new Date().toISOString() <= provider_details[i].infoWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].info_subject_line,
              input_text: provider_details[i].info_input_text,
              post_start_date: provider_details[i].infoWelcomeStartDay,
              post_end_date: provider_details[i].infoWelcomeEndDay,
              picture_1: provider_details[i].info_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].info_picture_1?.url
                : "",
              picture_2: provider_details[i].info_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].info_picture_2?.url
                : "",
              feed_show_status: provider_details[i].info_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].info_like_count,
              wishlist_count: provider_details[i].info_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen6?.type === "info",
              type: "info",
              wished_status: wished_status,
              region: provider_details[i].region,
            });
          }
        } else {
          // continue;
          wished_status = false;
        }
      }

      if (
        provider_details[i].event_subject_line &&
        provider_details[i].event_input_text
      ) {
        if (provider_details[i].event_feed_show_status === false) {
          continue;
        }
        let provider_details_seen7 = await ProviderDetailsSeen.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "event",
        }).exec();

        let like = await ProviderLike.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "event",
        }).exec();
        let Wished = await ProviderWishlist.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id.toString(),
          type: "event",
        }).exec();
        let like_status;
        let wished_status;
        if (like) {
          like_status = true;
        } else {
          like_status = false;
        }
        if (Wished) {
          wished_status = true;
          if (
            new Date().toISOString() >=
              provider_details[i].eventWelcomeStartDay &&
            new Date().toISOString() <= provider_details[i].eventWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].event_subject_line,
              input_text: provider_details[i].event_input_text,
              post_start_date: provider_details[i].eventWelcomeStartDay,
              post_end_date: provider_details[i].eventWelcomeEndDay,
              picture_1: provider_details[i].event_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].event_picture_1?.url
                : "",
              picture_2: provider_details[i].event_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].event_picture_2?.url
                : "",
              feed_show_status: provider_details[i].event_subject_line,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].event_like_count,
              wishlist_count: provider_details[i].event_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen7?.type === "event",
              type: "event",
              wished_status: wished_status,
              region: provider_details[i].region,
            });
          }
        } else {
          // continue;
          wished_status = false;
        }
      }

      if (
        provider_details[i].advertising_video_subject_line &&
        provider_details[i].advertising_video_input_text
      ) {
        if (provider_details[i].advertising_video_feed_show_status === false) {
          continue;
        }
        let provider_details_seen8 = await ProviderDetailsSeen.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "advertising_video",
        }).exec();

        let like = await ProviderLike.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id,
          type: "advertising_video",
        }).exec();
        let Wished = await ProviderWishlist.findOne({
          user_id: user_id,
          provider_id: provider_details[i]._id.toString(),
          type: "advertising_video",
        }).exec();
        let like_status;
        let wished_status;
        if (like) {
          like_status = true;
        } else {
          like_status = false;
        }
        if (Wished) {
          wished_status = true;
          if (
            new Date().toISOString() >=
              provider_details[i].advertisingVideoWelcomeStartDay &&
            new Date().toISOString() <=
              provider_details[i].advertisingVideoWelcomeEndDay
          ) {
            results.push({
              provider: provider_details[i]._id,
              subject_line: provider_details[i].advertising_video_subject_line,
              input_text: provider_details[i].advertising_video_input_text,
              post_start_date:
                provider_details[i].advertisingVideoWelcomeStartDay,
              post_end_date: provider_details[i].advertisingVideoWelcomeEndDay,
              picture_1: provider_details[i].advertising_video_picture_1?.url
                ? "https://" +
                  hostname +
                  provider_details[i].advertising_video_picture_1?.url
                : "",
              picture_2: provider_details[i].advertising_video_picture_2?.url
                ? "https://" +
                  hostname +
                  provider_details[i].advertising_video_picture_2?.url
                : "",
              feed_show_status:
                provider_details[i].advertising_video_feed_show_status,
              providerName: provider_details[i].providerName,
              logo: "https://" + hostname + provider_details[i].logo?.url,
              like_count: provider_details[i].advertising_video_like_count,
              wishlist_count:
                provider_details[i].advertising_video_wishlist_count,
              like_status: like_status,
              seen_status: provider_details_seen8?.type === "advertising_video",
              type: "advertising_video",
              wished_status: wished_status,
              region: provider_details[i].region,
            });
          }
        } else {
          // continue;
          wished_status = false;
        }
      }

      //  var total_data = results.concat(results);
      //  var total_data = results_2.concat(results_3);
      //  var total_data = results_4.concat(results_4);
      //  var total_data = results_5.concat(results_5);
      //  var total_data = results_6.concat(results_6);
      //  var total_data = results_7.concat(results_7);
      //  var total_data = results_8.concat(results_8);
      //  var total_data = results_9.concat(results_9);
      // var total_data = [...results, ...results_3, ...results_4, ...results_5, ...results_6, ...results_7, ...results_8, ...results_9]
    }
    res.send({ success: true, message: "PR list", data: results });
  } else {
    res.send({ success: true, message: "No data found" });
  }
});

router.post("/providerLike", async (req, res, next) => {
  var user_id = req.body.user_id;
  var provider_id = req.body.provider_id;

  var provider_details = await ProviderModel.findOne({
    _id: provider_id,
  }).exec();

  var provider_like_details = await ProviderLikeRoot.findOne({
    user_id: user_id,
    provider_id: provider_id,
  }).exec();
  if (provider_like_details) {
    var new_like_count = parseInt(provider_details.like_count) - 1;
    await ProviderModel.updateOne(
      { _id: provider_id },
      {
        like_count: new_like_count,
        // $pull:{"like_ids":user_id}
      }
    ).exec();

    await ProviderLikeRoot.deleteOne({
      user_id: user_id,
      provider_id: provider_id,
    }).exec();

    res.send({ success: true, message: "Unliked" });
  } else {
    var new_like_count = parseInt(provider_details.like_count) + 1;
    await ProviderModel.updateOne(
      { _id: provider_id },
      {
        like_count: new_like_count,
        // $push:{"like_ids":user_id},
      }
    ).exec();

    const provider_like_data = new ProviderLikeRoot({
      user_id: user_id,
      provider_id: provider_id,
    });
    provider_like_data.save();

    res.send({ success: true, message: "Liked" });
  }
});
router.post("/providerWishlist", async (req, res, next) => {
  var user_id = req.body.user_id;
  var provider_id = req.body.provider_id;

  var provider_details = await ProviderModel.findOne({
    _id: provider_id,
  }).exec();

  var provider_like_details = await ProviderWishlistRoot.findOne({
    user_id: user_id,
    provider_id: provider_id,
  }).exec();
  if (provider_like_details) {
    var new_wishlist_count = parseInt(provider_details.wishlist_count) - 1;
    await ProviderModel.updateOne(
      { _id: provider_id },
      {
        wishlist_count: new_wishlist_count,
        // $pull:{"wishlist_ids":user_id}
      }
    ).exec();

    await ProviderWishlistRoot.deleteOne({
      user_id: user_id,
      provider_id: provider_id,
    }).exec();

    res.send({ success: true, message: "Not wished" });
  } else {
    var new_wishlist_count = parseInt(provider_details.wishlist_count) + 1;
    await ProviderModel.updateOne(
      { _id: provider_id },
      {
        wishlist_count: new_wishlist_count,
        // $push:{"wishlist_ids":user_id}
      }
    ).exec();

    const provider_like_data = new ProviderWishlistRoot({
      user_id: user_id,
      provider_id: provider_id,
    });
    provider_like_data.save();

    res.send({ success: true, message: "Wished" });
  }
});

router.get("/reset-like-wishlist", async (req, res, next) => {
  let a = await ProviderModel.updateMany(
    {},
    {
      company_presentation_like_count: 0,
      company_presentation_wishlist_count: 0,
      job_advertisement_like_count: 0,
      job_advertisement_wishlist_count: 0,
      flyer_like_count: 0,
      flyer_wishlist_count: 0,
      advertisement_like_count: 0,
      advertisement_wishlist_count: 0,
      menu_like_count: 0,
      menu_wishlist_count: 0,
      info_like_count: 0,
      info_wishlist_count: 0,
      event_like_count: 0,
      event_wishlist_count: 0,
      advertising_video_like_count: 0,
      advertising_video_wishlist_count: 0,
      // "PRFeedData.$.like_count":0,
      // "PRFeedData.$.wishlist_count":0,
    }
  );
  console.log(a, "::::::::::::::::::::::::::");
});


router.get("/clean", async(req, res)=>{
  try{
    
    let products=  await db.getPopulatedData(ProductModel, {}, [{path: "_provider", select: "region"}])

    let nullIdsOfProducts= []
    let productsWithNullProvider= products.data.filter((i)=> i._provider==null);

    if(productsWithNullProvider.length > 0){
      productsWithNullProvider.forEach( async(p)=>{
        try{
          await db.deleteOne(ProductModel, {_id: p._id})
        }catch(err){
          return res.json({msg:err})
        }
      })
    }

    return res.json({msg: "Deleted unnecessary data."})
  }catch(err){
    console.error("Error: ", err)
    return res.json({msg: err})
  }
})

module.exports = router;
