import React, { useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { context } from "../context/context";
import "../styles/ChatRoom.css";

export default function ChatRoom() {
  const { auth, setAuth } = useContext(context);
  const { roomId, username } = auth;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 🔹 Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest(".message-actions")) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔹 Connect socket
  useEffect(() => {
    if (!roomId || !username) return;

    const socket = io("https://chatroombackend-unv4.onrender.com");
    socketRef.current = socket;

    socket.emit("join-room", { roomId, username });

    socket.on("room-history", setMessages);
    socket.on("receive-message", (msg) =>
      setMessages((prev) => [...prev, msg])
    );
    socket.on("delete-message", (msgId) =>
      setMessages((prev) => prev.filter((msg) => msg.id !== msgId))
    );
    socket.on("online-users", setOnlineUsers);

    socket.on("user-typing", (user) => {
      if (user !== username) {
        setTypingUsers((prev) =>
          prev.includes(user) ? prev : [...prev, user]
        );
      }
    });

    socket.on("user-stop-typing", (user) =>
      setTypingUsers((prev) => prev.filter((u) => u !== user))
    );

    return () => socket.disconnect();
  }, [roomId, username]);

  // 🔹 Send message
  const sendMessage = () => {
    if (!message.trim()) return;
    socketRef.current.emit("send-message", {
      roomId,
      username,
      message,
      replyTo: replyingTo,
    });
    setMessage("");
    setReplyingTo(null);
  };

  // 🔹 Handle typing
  const handleTyping = (e) => {
    setMessage(e.target.value);
    socketRef.current.emit("typing", { roomId, username });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("stop-typing", { roomId, username });
    }, 1500);
  };

  // 🔹 Logout
  const handleLogout = () => setAuth(null);

  // 🔹 Delete message
  const handleDelete = (msgId) => {
    socketRef.current.emit("delete-message", { roomId, msgId });
    setMenuOpenId(null);
  };

  // 🔹 Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-room-container">
      <div className="chat-room-header">
        <h3>Room Id: {roomId}</h3>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="chat-box">
        {messages.map((msg) => {
          const isOwnMessage = msg.username === username;
          return (
            <div
              key={msg.id}
              className={`message ${isOwnMessage ? "own" : "other"}`}
            >
              {msg.replyTo && (
                <div className="reply-box">
                  <strong>{msg.replyTo.username}</strong>:{" "}
                  <span>{msg.replyTo.content}</span>
                </div>
              )}

              {!isOwnMessage && (
                <span className="username">{msg.username}</span>
              )}

              <div className="message-content">
                <span>{msg.content}</span>
              </div>

              <div className="timestamp">
                {new Date(msg.timestamp).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </div>

              {/* Circle + menu */}
              <div className="message-actions">
                <div
                  className="action-circle"
                  onClick={() =>
                    setMenuOpenId(menuOpenId === msg.id ? null : msg.id)
                  }
                >
                  ⋮
                </div>

                {menuOpenId === msg.id && (
                  <div className="action-menu">
                    <button
                      onClick={() => {
                        setReplyingTo({
                          id: msg.id,
                          username: msg.username,
                          content: msg.content,
                        });
                        setMenuOpenId(null);
                      }}
                    >
                      Reply
                    </button>
                    {isOwnMessage && (
                      <button onClick={() => handleDelete(msg.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"}{" "}
          typing...
        </div>
      )}

      {/* Reply preview before sending */}
      {replyingTo && (
        <div className="replying-box">
          Replying to <strong>{replyingTo.username}</strong>:{" "}
          <span>{replyingTo.content}</span>
          <button onClick={() => setReplyingTo(null)}>✖</button>
        </div>
      )}

      <div className="input-area">
        <input
          value={message}
          onChange={handleTyping}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
        <button onClick={() => setShowUsers((prev) => !prev)}>
          {showUsers
            ? "Hide Users"
            : `Show Online Users (${onlineUsers.length})`}
        </button>
      </div>

      {showUsers && (
        <div className="online-users">
          <h4>Online Users:</h4>
          <ul>
            {onlineUsers.map((user, i) => (
              <li key={i}>
                🟢 <strong>{user}</strong>
                {user === username && (
                  <span style={{ color: "blue", marginLeft: 6 }}>(You)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
