import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../services/api.ts";
import { User, UserRole, ApiResponse } from "../types/index.ts";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string, role?: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  switchQuickAccount: (role: "student" | "admin") => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("campusiq_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    const storedToken = localStorage.getItem("campusiq_token");
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>("/auth/me");
      if (response.data.success && response.data.data?.user) {
        setUser(response.data.data.user);
        localStorage.setItem("campusiq_user", JSON.stringify(response.data.data.user));
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem("campusiq_token");
        localStorage.removeItem("campusiq_user");
      }
    } catch (err) {
      console.warn("[Auth] Session validation failed:", err);
      setUser(null);
      setToken(null);
      localStorage.removeItem("campusiq_token");
      localStorage.removeItem("campusiq_user");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>("/auth/login", {
      email,
      password,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to log in.");
    }

    const { user: loggedInUser, token: authToken } = response.data.data;
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem("campusiq_token", authToken);
    localStorage.setItem("campusiq_user", JSON.stringify(loggedInUser));
    return loggedInUser;
  };

  const signup = async (name: string, email: string, password: string, role: UserRole = "student"): Promise<User> => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>("/auth/signup", {
      name,
      email,
      password,
      role,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to sign up.");
    }

    const { user: registeredUser, token: authToken } = response.data.data;
    setUser(registeredUser);
    setToken(authToken);
    localStorage.setItem("campusiq_token", authToken);
    localStorage.setItem("campusiq_user", JSON.stringify(registeredUser));
    return registeredUser;
  };

  const switchQuickAccount = async (role: "student" | "admin") => {
    if (role === "admin") {
      await login("admin@campusiq.edu", "Admin@123");
    } else {
      await login("student@campusiq.edu", "Student@123");
    }
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (err) {
      // Ignore network failure on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("campusiq_token");
      localStorage.removeItem("campusiq_user");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
        switchQuickAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
