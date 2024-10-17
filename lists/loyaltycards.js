const mongoose = require("../database/mongoose");
const { Schema } = mongoose.mongoose;
const moment = require("moment");
const loyaltyCardSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Provider" },
    maxPoints: { type: Number, required: true },
    status: { type: String, default: "disabled" },
    details: { type: String, default: "the is just a test details" },
    validUntil: { type: Number },
    image: {type: String, default: "https://static.thenounproject.com/png/183470-200.png"},
    qrCodes: [{ type: Schema.Types.ObjectId, ref: "Qrcode" }],
  },
  { timestamps: true }
);

const LoyaltyCard = mongoose.mongoose.model("LoyaltyCard", loyaltyCardSchema);
module.exports = LoyaltyCard;
