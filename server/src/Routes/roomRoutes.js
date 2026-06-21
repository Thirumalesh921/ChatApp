const express = require("express");
const bcrypt = require("bcrypt");
const Room = require("../models/Room");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

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

      const sessionId = uuidv4();
      const token = jwt.sign(
        { roomId, username, sessionId },
        process.env.JWT_SECRET,
        { expiresIn: "72h" }
      );

      return res.json({
        details: { roomid: roomId, username },
        token: token,
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

    const sessionId = uuidv4();

    const token = jwt.sign(
      {
        roomId,
        username,
        sessionId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "72h",
      }
    );

    return res.json({
      token,
      details: {
        roomId,
        username,
      },
    });

  } catch (err) {
    console.error("Error in /join route:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
});

module.exports = router;
