const mongoose = require("../database/mongoose");
const { Schema } = mongoose.mongoose;

const qrLogsSchema = new Schema(
  {
    cardLogId: { type: Schema.Types.ObjectId, ref: "CardLog" },
    userId: { type: Schema.Types.ObjectId, ref: "Customer" },
  },
  { timestamps: true }
);

const qrLogs = mongoose.mongoose.model("qrLogs", qrLogsSchema);
module.exports = qrLogs;
