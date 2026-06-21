const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const socketHandler = require("./socket");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Sample Comment

dotenv.config();
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const allowedOrigins = process.env.FRONTEND_URLS.split(",");

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

socketHandler(io);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
