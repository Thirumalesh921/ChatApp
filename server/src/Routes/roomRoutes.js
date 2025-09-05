const express = require("express");
const bcrypt = require("bcrypt");
const Room = require("../models/Room");
const router = express.Router();

// Join or Create Room
router.post("/join", async (req, res) => {
  const { roomId, password, username } = req.body;
  if (!roomId || !password || !username) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    let room = await Room.findOne({ roomId });

    if (!room) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await Room.create({
        roomId,
        password: hashedPassword,
        users: [username],
      });

      return res.json({
        details: { roomid: roomId, username },
        message: "Room created and joined.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, room.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    if (room.users.includes(username)) {
      return res.status(409).json({
        error: "Username already in use. Please choose a different one.",
      });
    }

    room.users.push(username);
    await room.save();

    return res.json({
      details: { roomid: roomId, username },
      message: "Joined existing room.",
    });
  } catch (err) {
    console.error("Error in /join route:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
});

module.exports = router;
