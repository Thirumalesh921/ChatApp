const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  users: [String],
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 72 },
});

module.exports = mongoose.model("Room", roomSchema);
