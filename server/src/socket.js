const Message = require("./models/Message");
const Room = require("./models/Room");

function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join-room", async () => {
      const roomId = socket.roomId;
      const username = socket.username;
      socket.join(roomId);

      try {
        const messages = await Message.find({ roomId });
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

        // FIX: guard against a missing room instead of crashing on room.users
        const room = await Room.findOneAndUpdate(
          { roomId },
          { $addToSet: { users: username } },
          { new: true }
        );

        if (room) {
          io.to(roomId).emit("online-users", room.users);
        } else {
          console.error(`join-room: no Room found for roomId ${roomId}`);
        }
      } catch (err) {
        console.error("Failed to join room:", err);
      }
    });

    socket.on("send-message", async ({ message, replyTo }) => {
      const roomId = socket.roomId;
      const username = socket.username;
      try {
        const newMessage = new Message({
          roomId,
          username,
          content: message,
          sessionId: socket.sessionId,
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
        console.error("Error saving message:", err);
      }
    });

    // FIX: use an ack callback so the client actually learns about failures
    socket.on("delete-message", async ({ msgId }, callback) => {
      const roomId = socket.roomId;
      try {
        const msg = await Message.findById(msgId);

        if (!msg) {
          return callback?.({ error: "Message not found" });
        }

        if (msg.sessionId !== socket.sessionId) {
          return callback?.({ error: "You can't delete others' messages" });
        }

        await Message.findByIdAndDelete(msgId);
        io.to(roomId).emit("delete-message", msgId);
        callback?.({ success: true });
      } catch (err) {
        console.error("Error deleting message:", err);
        callback?.({ error: "Server error" });
      }
    });

    socket.on("typing", () => {
      socket.to(socket.roomId).emit("user-typing", socket.username);
    });

    socket.on("stop-typing", () => {
      socket.to(socket.roomId).emit("user-stop-typing", socket.username);
    });

    // FIX: removed duplicate query / shadowed `room` variable, restored the guard
    socket.on("disconnect", async () => {
      const { roomId, username } = socket;
      if (!roomId || !username) return;

      try {
        const room = await Room.findOneAndUpdate(
          { roomId },
          { $pull: { users: username } },
          { new: true }
        );
        if (room) {
          io.to(roomId).emit("online-users", room.users);
        }
      } catch (err) {
        console.error("Error updating room on disconnect:", err);
      }
    });
  });
}

module.exports = socketHandler;