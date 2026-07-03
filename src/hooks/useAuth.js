"use client";

import { useContext } from "react";
import { AuthContext } from "@/stores/authStore";
import {
  fetchProfile,
  login as loginRequest,
  logout as logoutRequest,
  refreshAccessToken,
  register as registerRequest,
} from "@/lib/api";
import { clearAuthState, setAuthState } from "@/stores/authStore";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  const login = async (credentials) => {
    const response = await loginRequest(credentials);
    const user = await fetchProfile();

    setAuthState({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user,
      isInitialized: true,
      isLoading: false,
    });

    return { ...response, user };
  };

  const register = async (payload) => {
    const response = await registerRequest(payload);

    if (response?.accessToken) {
      setAuthState({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
        isInitialized: true,
        isLoading: false,
      });
    }

    return response;
  };

  const loadProfile = async () => {
    const user = await fetchProfile();
    setAuthState({ user });
    return user;
  };

  const refresh = async () => {
    const accessToken = await refreshAccessToken();
    if (accessToken) {
      setAuthState({ accessToken });
    }
    return accessToken;
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      clearAuthState();
    }
  };

  return {
    ...context,
    login,
    register,
    logout,
    refresh,
    loadProfile,
  };
}
