import React, { useContext } from "react";
import ChatRoom from "./components/ChatRoom";
import JoinRoom from "./components/JoinRoom";
import { AuthProvider, context } from "./context/context";
function AppContent() {
  const { auth } = useContext(context);
  return auth?.username && auth?.roomId ? <ChatRoom /> : <JoinRoom />;
}
export default function App() {
  return (
    <AuthProvider>
      {" "}
      <AppContent />{" "}
    </AuthProvider>
  );
}
