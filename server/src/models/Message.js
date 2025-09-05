const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  username: { type: String, required: true },
  content: { type: String, required: true },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null,
  },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 72 },
});

module.exports = mongoose.model("Message", messageSchema);
