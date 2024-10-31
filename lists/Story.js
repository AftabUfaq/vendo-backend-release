const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Provider",
    required: true,
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "24h", // Automatically deletes after 24 hours
  },
  views: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
      viewedAt: { type: Date, default: Date.now },
    },
  ],
  likes: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
      likedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Story", storySchema);
