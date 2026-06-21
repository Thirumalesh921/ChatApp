import React, { useContext, useState } from "react";
import axios from "axios";
import { context } from "../context/context";
import "../styles/JoinRoom.css";
import { BACKEND_URL } from "../config";

function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setAuth } = useContext(context);

  const handleJoin = async () => {
    if (!roomId || !username || !password) {
      setError("All fields are required.");
      return;
    }

    try {
      const res = await axios.post(`${BACKEND_URL}/api/rooms/join`, {
        roomId,
        username,
        password,
      });

      const userFromServer = res.data.details.username;
      const authToken = res.data.token;
      setAuth({
        username: userFromServer,
        roomId,
        token: authToken,
      });
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="join-room-container">
      <h2>Join or Create a Room</h2>

      <input
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleJoin}>Enter Room</button>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default JoinRoom;
