const mongoose = require("../database/mongoose");
const { Schema } = mongoose.mongoose;

const qrCodes = new Schema({
  status: { type: String },
  LoyaltyCard: { type: Schema.Types.ObjectId, ref: "LoyaltyCard" },
  points: { type: Number },
  expiryDate: { type: Number },
});

const Qrcode = mongoose.mongoose.model("Qrcode", qrCodes);
module.exports = Qrcode;
