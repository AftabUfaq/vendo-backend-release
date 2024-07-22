const { Timestamp } = require("mongodb");
const mongoose = require("../database/mongoose");
const { Schema } = mongoose.mongoose;

const providerAvailibilitySchema = new Schema(
  {
    providerId: { type: Schema.Types.ObjectId, ref: "Provider" },
    day: { type: String },
    from: { type: String, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
    to: { type: String, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
  },
  { timestamps: true }
);

const ProviderAvailibility = mongoose.mongoose.model("ProviderAvailibility", providerAvailibilitySchema);
module.exports = ProviderAvailibility;
