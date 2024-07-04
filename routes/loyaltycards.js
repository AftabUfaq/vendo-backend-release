const express = require("express");
const ObjectId = require("mongodb").ObjectId;
const db = require("../database/mongooseCrud");
const moment = require("moment");
let router = express.Router();

const Customer = require("../lists/customers");
const Provider = require("../lists/providers");
const LoyaltyCard = require("../lists/loyaltycards");
const Qrcode = require("../lists/qrCodes");
const qrLogs = require("../lists/qrLogs");
const cardLogs = require("../lists/cardLogs");

const validation = (req, res, next) => {
  next();
};

// admin side actions
router.post("/createCard", validation, async (req, res) => {
  const { vendorId, maxPoints, status, qrCodes, validUntil, details } =
    req.body;
  try {
    const providerById = await db.getData(Provider, {
      _id: ObjectId(vendorId),
    });

    if (providerById.length === 0) {
      return res.json({ status: false, msg: "Provider not found." });
    }

    let createCardFields = {
      vendorId: ObjectId(vendorId),
      maxPoints: maxPoints || undefined,
      status: status || undefined,
      validUntil: validUntil || undefined,
      details: details || undefined,
    };

    const result = await db.insertOneData(LoyaltyCard, createCardFields);

    // insert the qrCode ids to the loyalty card's qrCodes array
    if (qrCodes && qrCodes.length > 0) {
      for (let i = 0; i < qrCodes.length; i++) {
        let qrCodeInsertion = await db.insertOneData(Qrcode, {
          status: qrCodes[i].status,
          LoyaltyCard: result.data._id,
          points: qrCodes[i].points,
          expiryDate: qrCodes[i].expiryDate,
        });
        // push the new QR code id to the loyalty card's qrCodes array
        result.data.qrCodes.push(qrCodeInsertion.data._id);
      }
      await result.data.save(); // save the loyalty card after pushing qrCodes
    }

    providerById.data[0].loyaltyCards.push(result.data._id);
    await providerById.data[0].save(); // save the provider after pushing loyalty card

    let dataForResponse = await db.getPopulatedData(
      LoyaltyCard,
      { _id: result.data._id },
      [
        { path: "vendorId", select: {} },
        { path: "qrCodes", select: {} },
      ]
    );

    console.log(dataForResponse);
    res.json({
      status: "success",
      msg: "Loyalty card created successfully",
      data: dataForResponse.data[0],
    });
  } catch (error) {
    console.log(error);
    res.json({ status: false, msg: "Something went wrong: " + error });
  }
});

router.put("/updateCardById", validation, async (req, res) => {
  const { _id, maxPoints, status,details, qrCodes } = req.body;
  try {
    let doesCardExist = await db.getData(LoyaltyCard, {
      _id: ObjectId(_id),
    });

    if (doesCardExist.length === 0) {
      res.json({
        status: false,
        msg: "Loyalty card not found.",
      });
    }
    let cardUpateFields = {};
    if (maxPoints) cardUpateFields.maxPoints = maxPoints;
    if (status) cardUpateFields.status = status;
    if (details) cardUpateFields.details = details;
    const result = await db.updateOneData(
      LoyaltyCard,
      {
        _id: ObjectId(_id),
      },
      cardUpateFields
    );
    if (Array.isArray(qrCodes) && qrCodes.length > 0) {
      qrCodes.map(async (qrCode) => {
        // Construct the update object dynamically
        const updateFields = {};
        if (qrCode.status !== undefined) updateFields.status = qrCode.status;
        if (qrCode.points !== undefined) updateFields.points = qrCode.points;
        if (qrCode.expiryDate !== undefined)
          updateFields.expiryDate = qrCode.expiryDate;

        // Perform the update operation
        let updateQrCodes = await db.updateOneData(
          Qrcode,
          { _id: qrCode._id },
          updateFields
        );
      });
    }

    res.json({
      status: "success",
      msg: "Loyalty card updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ status: false, msg: "Something went wrong: " + error });
  }
});

// frontend actions

router.get("/getCards", validation, async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };
  try {
    const result = await db.getPopulatedData(LoyaltyCard, {}, [
      { path: "vendorId", select: {} },
      { path: "qrCodes", select: {} },
    ]);
    resBody.status = true;
    resBody.result = result;
    resBody.msg = "Cards fetched successfully";
    res.json(resBody);
  } catch (error) {
    console.log(error);
    res.json({ status: false, msg: "Something went wrong: " + error });
  }
});

router.get("/getCardById/:id", async (req, res) => {
  let resBody = {
    result: [],
    msg: "",
    status: false,
  };
  const { id } = req.params;
  try {
    let doesCardExist = await db.getData(LoyaltyCard, {
      _id: ObjectId(id),
    });
    console.log(doesCardExist);
    if (doesCardExist.data.length === 0) {
      return res.json({
        status: false,
        msg: "Loyalty card not found.",
      });
    }
    const result = await db.getPopulatedData(
      LoyaltyCard,
      {
        _id: ObjectId(id),
      },
      [
        { path: "vendorId", select: {} },
        { path: "qrCodes", select: {} },
      ]
    );
    resBody.status = true;
    resBody.result = result;
    res.json(resBody);
  } catch (error) {
    console.log(error);
    res.json({ status: false, msg: "Something went wrong: " + error });
  }
});

// delete card by id
router.delete("/deleteCardById/:id", validation, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.deleteOne(LoyaltyCard, {
      _id: ObjectId(id),
    });
    // also delete it's qr codes
    await db.deleteOne(Qrcode, {
      LoyaltyCard: ObjectId(id),
    });
    console.log(result);
    // remove its reference id form providers account
    // await db.updateOneData(
    //   Customer,
    //   // { _id: ObjectId(result.data[0].vendorId) },
    //   { _id: ObjectId(result.data[0].vendorId) },
    //   { $pull: { loyaltyCards: ObjectId(id) } }
    // );
    res.json({
      status: true,
      msg: "Loyalty card deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ status: false, msg: "Something went wrong: " + error });
  }
});

// update qr code
router.post("/updateQrCode", validation, async (req, res) => {
  const { _id, status } = req.body;
  console.log(req.body, _id);
  try {
    const result = await db.updateOneData(
      Qrcode,
      {
        _id: ObjectId(_id),
      },
      {
        status: status,
      }
    );

    console.log(result);
    res.json({
      status: true,
      msg: "Qr code updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ status: false, msg: "Something went wrong: " + error });
  }
})

// functions for the following route\
// check if user has reached the daily limit
const checkUserDailyLimit = async (userId) => {
  const startOfToday = moment().startOf("day").toDate();
  const endOfToday = moment().endOf("day").toDate();
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    const count = await db.getData(qrLogs, {
      userId: ObjectId(userId),
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    console.log(count.data);
    if (count.data.length >= 500) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error checking user daily limit:", error);
    throw error;
  }
};
// check if card is enabled and is not expired
const cardValidationUsingCardId = async (cardId, timestamp, card) => {
  let obj = {};
  if (card.validUntil) {
    obj.validUntil = timestamp;
  }
  let iscardEnabled = await db.getData(LoyaltyCard, {
    _id: ObjectId(cardId),
    status: "enabled",
    ...obj,
  });
  return iscardEnabled ? true : false;
};

router.post("/claimQrCode", async (req, res) => {
  const { qrId, cardId, userId } = req.body;
  let user;
  let card;
  let qrCode;
  let userCards;
  let globalCardUsable;
  const currentDate = new Date();
  const timestamp = currentDate.getTime();
  try {
    // Check if QR code exists
    let doesQrCodeExist = await db.getData(Qrcode, {
      _id: ObjectId(qrId),
      status: "active",
    });
    if (doesQrCodeExist.data.length === 0) {
      return res.json({
        status: false,
        msg: "No qr code found. Please double check details you provided.",
      });
    }
    qrCode = doesQrCodeExist.data[0];

    // check if qrCode is valid
    let qrCodeWhereClause = { _id: ObjectId(qrId) };
    if (qrCode.expiryDate) {
      qrCodeWhereClause.expiryDate = { $gte: timestamp };
      qrCodeWhereClause.status = "active";
    }
    let isValidQrCode = await db.getData(Qrcode, qrCodeWhereClause);
    if (isValidQrCode.data.length === 0) {
      return res.json({
        status: false,
        msg: "Please scan a valid QR code. The provided QR code is invalid.",
      });
    }

    // Check if user exists
    let doesUserExist = await db.getData(Customer, {
      _id: ObjectId(userId),
    });
    console.log(doesUserExist)
    if (doesUserExist.data.length === 0) {
      return res.json({
        status: false,
        msg: "User not found.",
      });
    }
    user = doesUserExist.data[0];
    // working till here

    // if same user have scanned qr code 5 times today
    let isUserLimited = await checkUserDailyLimit(user._id);
    if (isUserLimited) {
      return res.json({
        status: false,
        msg: "You have scanned 5 times today. Please come back tomorrow.",
      });
    }
    console.log("======> User is not blocked");
    // Check if card exists
    let doesCardExist = await db.getData(LoyaltyCard, {
      _id: ObjectId(cardId),
    });
    if (doesCardExist.data.length === 0) {
      return res.json({
        status: false,
        msg: "Loyalty card not found.",
      });
    }
    card = doesCardExist.data[0];
    console.log("card =====>", card);
    // check if the qr code is associated with the given card or not
    let isQrValidForthisCard =
      card._id.toString() === qrCode.LoyaltyCard.toString();
    if (!isQrValidForthisCard) {
      return res.json({
        status: false,
        msg: "This QR code is not for this card.",
      });
    }

    console.log("======> card is valid for this user");

    globalCardUsable = await cardValidationUsingCardId(cardId, timestamp, card);
    console.log("globalCardUsable", globalCardUsable);
    // if user don't have the card already then just add the card and points of the qrcode to the card
    userCards = user.loyaltyCards;
    console.log(userCards);
    if (userCards.length === 0) {
      if (globalCardUsable) {
        // create card log
        let data = await db.getData(LoyaltyCard, {
          _id: ObjectId(cardId),
        });
        console.log("======> vendorId", data.data[0].vendorId);
        let createLog = await db.insertOneData(cardLogs, {
          userId: ObjectId(userId),
          cardId: ObjectId(cardId),
          providerId: ObjectId(data.data[0].vendorId),
          status: "incomplete",
          points: qrCode.points,
          redeemed: false,
        });
        // create qr log
        await db.insertOneData(qrLogs, {
          cardLogId: ObjectId(createLog._id),
          userId: ObjectId(userId),
        });

        // add the card id to the user
        user.loyaltyCards.push(ObjectId(cardId));
        user.save();
        return res.json({
          status: "success",
          msg: `You have successfully added this card to your account. ${qrCode.points} points added to your card.`,
        });
      }
    } else if (userCards.length > 0) {
      // check if the user have already this card with some points
      for (let userCard of userCards) {
        console.log(
          "======> User already have cards",
          userCard._id.toString(),
          cardId
        );
        if (
          userCard._id.toString() === cardId &&
          userCard.status !== "complete"
        ) {
          console.log(
            "======> User already have this card",
            userCard._id.toString()
          );
          // working till here ===========
          // in case the user have the card but not yet completed it
          let cardDetails = await db.getData(LoyaltyCard, {
            _id: ObjectId(userCard),
          });
          let existingPointsInCard = await db.getData(cardLogs, {
            userId: ObjectId(userId),
            cardId: ObjectId(userCard),
            redeemed: false,
          });
          let points = qrCode.points;
          let maxPoints = cardDetails.data[0].maxPoints;
          let existingPoints = existingPointsInCard.data[0].points;
          console.log(existingPoints, points, maxPoints, "1st condition");
          console.log(existingPoints, points, maxPoints, "2nd condition");
          console.log(existingPoints, points, maxPoints, "3rd condition");

          if (existingPoints + points == maxPoints) {
            // card can be  completed
            console.log("======> User can complete card");
            existingPointsInCard.data[0].status = "complete";
            existingPointsInCard.data[0].points= maxPoints;
            existingPointsInCard.data[0].save();
            // insert qr logs
            await db.insertOneData(qrLogs, {
              cardLogId: existingPointsInCard.data[0]._id,
              userId: ObjectId(userId),
            });
            return res.json({
              status: "success",
              msg: `${points} points added to your card.`,
            });
          } else if (existingPoints + points < maxPoints) {
            // card points can be added
            console.log("======> User can add points to card");
            existingPointsInCard.data[0].points = existingPoints + points;
            existingPointsInCard.data[0].save();
            // insert qr logs
            await db.insertOneData(qrLogs, {
              cardLogId: existingPointsInCard.data[0]._id,
              userId: ObjectId(userId),
            });
            return res.json({
              status: "success",
              msg: `${points} points added to your card.`,
            });
          } else if (existingPoints + points > maxPoints) {
            console.log(
              "======> User can complete card and also add another card"
            );
            let remainingPoints = existingPoints + points - maxPoints;
            existingPointsInCard.data[0].points = maxPoints;
            existingPointsInCard.data[0].save();
            // insert qr logs
            await db.insertOneData(qrLogs, {
              cardLogId: existingPointsInCard.data[0]._id,
              userId: ObjectId(userId),
            });
            // Create a new card for remaining points if any
            if (remainingPoints > 0) {
              const data = await db.getData(LoyaltyCard, {
                _id: ObjectId(cardId),
              });
              console.log("======> vendorId", data.data[0].vendorId);
              await db.insertOneData(cardLogs, {
                cardId: ObjectId(cardId),
                userId: ObjectId(userId),
                providerId: ObjectId(data.data[0].vendorId),
                status:
                  remainingPoints == maxPoints ? "complete" : "incomplete",
                points: remainingPoints,
                redeemed: false,
              });
            }
            return res.json({
              status: "success",
              msg: `${points} points added to your card.`,
            });
          }
        } else {
          if (globalCardUsable) {
            let data = await db.getData(LoyaltyCard, {
              _id: ObjectId(cardId),
            });
            console.log("======> vendorId", data.data[0].vendorId);
            // create card log
            let createLog = await db.insertOneData(cardLogs, {
              userId: ObjectId(userId),
              cardId: ObjectId(cardId),
              providerId: ObjectId(data.data[0].vendorId),
              status: "incomplete",
              points: qrCode.points,
              redeemed: false,
            });
            console.log("======> Created card log", createLog);
            // create qr log
            await db.insertOneData(qrLogs, {
              cardLogId: ObjectId(createLog._id),
              userId: ObjectId(userId),
            });

            // add the card id to the user
            user.loyaltyCards.push(ObjectId(cardId));
            user.save();
            return res.json({
              status: "success",
              msg: `You have successfully added this card to your account. ${qrCode.points} points added to your card.`,
            });
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: false, msg: "Something went wrong: " + error });
  }
});

router.get("/getCardsForVendor/:id", async (req, res) => {
  // get cards for a vendor using vendor id
  const { id } = req.params;
  try {
    // const result = await db.getPopulatedData(LoyaltyCard, {
    //   vendorId: ObjectId(id),
    // });
    // res.json({ status: true, result });
    const result = await LoyaltyCard.find({ vendorId: ObjectId(id) }).populate([
      {
        path: "qrCodes",
      },
      {
        path: "vendorId",
      },
    ]);

    res.json({ status: true, result });
  } catch (error) {
    console.log("Error", error);
    res.json({ status: false, msg: "Something went wrong: " + error });
  }
});

// get cards a specific user has
router.get("/getCardsForUser/:id", async (req, res) => {
  const { id } = req.params;
  try {
    let redeemedCards = await db.getPopulatedData(
      cardLogs,
      {
        userId: ObjectId(id),
        redeemed: true,
      },
      [
        { path: "cardId", select: "_id maxPoints status details validUntil " },
        {
          path: "providerId",
          select: "_id logo.filename providerName address region",
        },
      ]
    );
    let activeCards = await db.getPopulatedData(
      cardLogs,
      {
        userId: ObjectId(id),
        redeemed: false,
      },
      [
        { path: "cardId", select: "_id maxPoints status details validUntil " },
        {
          path: "providerId",
          select: "_id logo.filename providerName address region",
        },
      ]
    );
   

    res.json({ status: true, result: { redeemedCards, activeCards } });
  } catch (error) {
    console.log("Error", error);
    res.json({ status: false, msg: "Something went wrong: " + error });
  }
});

// redeem card by Id
router.get("/redeemCardById/:id", async (req, res) => {
  const { id } = req.params;
  try {
    let result = await db.updateOneData(
      cardLogs,
      {
        _id: ObjectId(id),
      },
      {
        redeemed: true,
        RedemptionDate: Math.floor(moment().valueOf() / 1000),
      }
    );
    if (result) {
      return res.json({
        status: true,
        result,
        msg: "Card redeemed successfully",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({ status: false, msg: "Something went wrong: " + error });
  }
});

router.post("/cardSubscribedByUser", async (req, res) => {
  const { cardId, userId } = req.body;
  try {
    let hasLoyaltyCardIncomplete= await db.getData(cardLogs, {
      userId: ObjectId(userId),
      status: "incomplete",
      cardId: ObjectId(cardId),
    })

    let cardDetails= await db.getData(LoyaltyCard, {
      _id: ObjectId(cardId),
    })

    let vendorId= cardDetails.data[0].vendorId;

    let vendorDetails= await db.getData(Provider, {
      _id: ObjectId(vendorId),
    })

    if(hasLoyaltyCardIncomplete.data.length > 0){
      
      return res.json({ hasCard: true, 
          details: 
            {
              cardId: cardId,
              vendorId: vendorId, 
              address: vendorDetails.data[0].address,
              region: vendorDetails.data[0].region,
              logo: vendorDetails.data[0].logo,
              providerName: vendorDetails.data[0].providerName,
              maxPoints: cardDetails.data[0].maxPoints,
              status: cardDetails.data[0].status,
              validUntil: cardDetails.data[0].validUntil,
              details: cardDetails.data[0].details,
              createdAt: cardDetails.data[0].createdAt,
              points: hasLoyaltyCardIncomplete.data[0].points
            } 
          });
    }

    
    return res.json({ hasCard: false, details: {
      cardId: cardId,
      vendorId: vendorId, 
      address: vendorDetails.data[0].address,
      region: vendorDetails.data[0].region,
      logo: vendorDetails.data[0].logo,
      providerName: vendorDetails.data[0].providerName,
      maxPoints: cardDetails.data[0].maxPoints,
      status: cardDetails.data[0].status,
      validUntil: cardDetails.data[0].validUntil,
      details: cardDetails.data[0].details,
      createdAt: cardDetails.data[0].createdAt
    } });
  } catch (error) {
    console.log(error);
    res.json({ status: false, msg: "Something went wrong: " + error });
  }

  
});

// card remeption reports for a provider
router.post("/getCardRedemptionReports", async (req, res) => {
  const { month, id } = req.body;

  console.log(req.body);

  // Validate month number
  if (month < 1 || month > 12) {
    return res.json({ status: false, msg: "Invalid month number. Please provide a value between 1 and 12.", data: [] });
  }

  if (!id) {
    return res.json({ status: false, msg: "Invalid user id. Please provide a valid user id.", data: [] });
  }

  // Define the start and end of the month for the current year as timestamps in milliseconds
  const startDate = Math.floor(moment().month(month - 1).startOf('month').valueOf() / 1000);
  const endDate = Math.floor(moment().month(month - 1).endOf('month').valueOf() / 1000);


  try {
    let result = await db.getPopulatedData(
      cardLogs,
      {
        userId: ObjectId(id),
        redeemed: true,
        // RedemptionDate: { $gte: startDate, $lte: endDate } // Filter by the date range
      },
      [
        { path: "cardId", select: "maxPoints status details validUntil " },
        {
          path: "userId",
          select: "firstName lastName email phone",
        },
      ]
    );

    
    // timestampToCheck >= startTimestamp && timestampToCheck <= endTimestamp;
    result= result.data.filter(item => item.RedemptionDate > startDate && item.RedemptionDate < endDate);

    if (result.length  < 1) {
      return res.json({ status: false, data: [] });
    }



    // Create array of objects
    let dataForResponse = result.map(item => ({
      BonusCardId: item.cardId._id,
      ProviderId: item.userId._id,
      CardDescription: item.cardId.details,
      RedemptionDate: moment.unix(item.RedemptionDate).format('DD/MM/YYYY hh:mm A')
    }));

    console.log("dataForResponse", dataForResponse);
    return res.json({ status: true, data: dataForResponse });
  } catch (error) {
    console.log("Error", error);
    res.json({ status: false, msg: "Something went wrong: " + error });
  }
});

module.exports = router;