const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const socketHandler = require("./socket");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const FRONTEND_URL = process.env.IS_DEVELOPMENT === "true" ? process.env.LOCAL_FRONTEND_URL
    : process.env.PROD_FRONTEND_URL;

const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL],
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.roomId = payload.roomId;
    socket.username = payload.username;
    socket.sessionId = payload.sessionId;

    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
});

socketHandler(io);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
