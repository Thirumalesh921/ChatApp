import { createContext, useState, useEffect } from "react";
export const context = createContext();
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const storedAuth = localStorage.getItem("auth");
    return storedAuth
      ? JSON.parse(storedAuth)
      : { username: null, roomId: null };
  });
  useEffect(() => {
    if (auth && auth.username) {
      localStorage.setItem("auth", JSON.stringify(auth));
    } else {
      localStorage.removeItem("auth");
    }
  }, [auth]);
  return (
    <context.Provider value={{ auth, setAuth }}>{children}</context.Provider>
  );
};
