"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { adminAuthApi } from "@/lib/admin-auth-api";
import { AUTH_TOKEN_KEY, getApiErrorMessage } from "@/lib/api";
import type {
  AdminUser,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  VerifyResetOtpPayload,
} from "@/types/auth";

type AuthContextValue = {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (payload: LoginPayload) => Promise<{ success: boolean; message?: string }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  forgotPassword: (
    payload: ForgotPasswordPayload,
  ) => Promise<{ success: boolean; message?: string }>;
  verifyResetOtp: (
    payload: VerifyResetOtpPayload,
  ) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (
    payload: ResetPasswordPayload,
  ) => Promise<{ success: boolean; message?: string }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredToken() {
  return typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [isLoading, setIsLoading] = useState(() => Boolean(getStoredToken()));
  const [error, setError] = useState<string | null>(null);

  const signOut = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await adminAuthApi.me();
      setUser(nextUser);
    } catch (refreshError) {
      setError(getApiErrorMessage(refreshError));
      signOut();
    }
  }, [signOut]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!token) {
      return;
    }

    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser, token]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const handleExpired = () => signOut();
    window.addEventListener("forge-admin-auth-expired", handleExpired);
    return () => window.removeEventListener("forge-admin-auth-expired", handleExpired);
  }, [signOut]);

  const signIn = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminAuthApi.login(payload);
      window.localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
      return { success: true };
    } catch (signInError) {
      const message = getApiErrorMessage(signInError);
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (payload: ForgotPasswordPayload) => {
    setError(null);
    try {
      const response = await adminAuthApi.forgotPassword(payload);
      return { success: true, message: response.message };
    } catch (forgotError) {
      const message = getApiErrorMessage(forgotError);
      setError(message);
      return { success: false, message };
    }
  }, []);

  const verifyResetOtp = useCallback(async (payload: VerifyResetOtpPayload) => {
    setError(null);
    try {
      const response = await adminAuthApi.verifyResetOtp(payload);
      return { success: true, message: response.message };
    } catch (otpError) {
      const message = getApiErrorMessage(otpError);
      setError(message);
      return { success: false, message };
    }
  }, []);

  const resetPassword = useCallback(async (payload: ResetPasswordPayload) => {
    setError(null);
    try {
      const response = await adminAuthApi.resetPassword(payload);
      return { success: true, message: response.message };
    } catch (resetError) {
      const message = getApiErrorMessage(resetError);
      setError(message);
      return { success: false, message };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      error,
      signIn,
      signOut,
      refreshUser,
      forgotPassword,
      verifyResetOtp,
      resetPassword,
    }),
    [
      user,
      token,
      isLoading,
      error,
      signIn,
      signOut,
      refreshUser,
      forgotPassword,
      verifyResetOtp,
      resetPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return context;
}
