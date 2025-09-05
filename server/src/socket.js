const Message = require("./models/Message");
const Room = require("./models/Room");

function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    socket.on("join-room", async ({ roomId, username }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.username = username;

      try {
        const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
        const hydrated = [];

        for (let msg of messages) {
          let replyData = null;
          if (msg.replyTo) {
            const repliedMsg = await Message.findById(msg.replyTo);
            if (repliedMsg) {
              replyData = {
                id: repliedMsg._id,
                username: repliedMsg.username,
                content: repliedMsg.content,
              };
            }
          }
          hydrated.push({
            id: msg._id,
            username: msg.username,
            content: msg.content,
            timestamp: msg.createdAt,
            replyTo: replyData,
          });
        }

        socket.emit("room-history", hydrated);

        const room = await Room.findOne({ roomId });
        if (room && !room.users.includes(username)) {
          room.users.push(username);
          await room.save();
        }
        io.to(roomId).emit("online-users", room.users);
      } catch (err) {
        console.error("❌ Failed to join room:", err);
      }
    });

    socket.on(
      "send-message",
      async ({ roomId, username, message, replyTo }) => {
        try {
          const newMessage = new Message({
            roomId,
            username,
            content: message,
            replyTo: replyTo ? replyTo.id : null,
          });
          await newMessage.save();

          let replyData = null;
          if (replyTo && replyTo.id) {
            const repliedMsg = await Message.findById(replyTo.id);
            if (repliedMsg) {
              replyData = {
                id: repliedMsg._id,
                username: repliedMsg.username,
                content: repliedMsg.content,
              };
            }
          }

          io.to(roomId).emit("receive-message", {
            id: newMessage._id,
            username,
            content: newMessage.content,
            timestamp: newMessage.createdAt,
            replyTo: replyData,
          });
        } catch (err) {
          console.error("❌ Error saving message:", err);
        }
      }
    );

    socket.on("delete-message", async ({ roomId, msgId }) => {
      try {
        await Message.findByIdAndDelete(msgId);
        io.to(roomId).emit("delete-message", msgId);
      } catch (err) {
        console.error("❌ Error deleting message:", err);
      }
    });

    socket.on("typing", ({ roomId, username }) => {
      socket.to(roomId).emit("user-typing", username);
    });

    socket.on("stop-typing", ({ roomId, username }) => {
      socket.to(roomId).emit("user-stop-typing", username);
    });

    socket.on("disconnect", async () => {
      const { roomId, username } = socket;
      if (roomId && username) {
        const room = await Room.findOne({ roomId });
        if (room) {
          room.users = room.users.filter((u) => u !== username);
          await room.save();
          io.to(roomId).emit("online-users", room.users);
        }
      }
    });
  });
}

module.exports = socketHandler;
