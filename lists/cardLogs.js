const mongoose = require("../database/mongoose");
const { Schema } = mongoose.mongoose;

const cardLogSchema = new Schema(
  {
    cardId: { type: Schema.Types.ObjectId, ref: "LoyaltyCard" },
    userId: { type: Schema.Types.ObjectId, ref: "Customer" },
    providerId: { type: Schema.Types.ObjectId, ref: "Provider" },
    status: { type: String },
    points: { type: Number },
    redeemed: { type: Boolean, default: false },
    RedemptionDate: { type: Number },
  },
  { timestamps: true }
);

const CardLogs = mongoose.mongoose.model("CardLog", cardLogSchema);
module.exports = CardLogs;
