// components/AuthProvider.jsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ITEMSApi, { getUser, getToken, saveAuth, logout as apiLogout } from "@/lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Load from storage
    setToken(getToken());
    setUser(getUser());
    setAuthReady(true);
  }, []);

  // login saves token + user to storage and set state
  const login = (newToken, userObj) => {
    saveAuth(newToken, userObj);
    setToken(newToken);
    setUser((prev) => {
      // normalize roles to array
      const roles = Array.isArray(userObj.roles) ? userObj.roles : (userObj.role ? [userObj.role] : []);
      return { ...userObj, roles };
    });
  };

  const logout = () => {
    apiLogout(); // clears storage + redirects to /login (defined in api.js)
    setToken(null);
    setUser(null);
  };

  const signupUser = async (signupData) => {
    const res = await ITEMSApi.signup(signupData);
    // backend should return { token, username, roles, identifier? }
    if (res?.token) {
      const userObj = { username: res.username, roles: res.roles || [] };
      login(res.token, userObj);
    }
    return res;
  };

  const loginUser = async (loginData) => {
    const res = await ITEMSApi.login(loginData);
    if (res?.token) {
      const userObj = {
        username: res.username,
        roles: res.roles || [],
        id: res.identifier || res.id || null,
      };
      login(res.token, userObj);
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        signupUser,
        loginUser,
        isAuthenticated: !!token,
        isAdmin: () => (user?.roles || []).includes("ADMIN"),
        isStaff: () => (user?.roles || []).includes("STAFF"),
        isSuperAdmin: () => (user?.roles || []).includes("SUPERADMIN"),
        authReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
