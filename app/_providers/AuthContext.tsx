'use client';

import { createContext, useContext, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabase as supabaseClient } from "@/lib/supabaseClient";
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth";
import type { Profile } from "@/types/supabase";

export interface AuthContextValue {
  supabase: SupabaseClient;
  user: User | null;
  profile: Profile | null;
  displayName: string;
  isGuest: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (params: { firstName: string; lastName: string; email: string; password: string }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = supabaseClient;
  const { user, profile, loading } = useSupabaseAuth();

  const displayName =
    profile?.full_name?.trim() ||
    `${user?.user_metadata?.first_name ?? ""} ${user?.user_metadata?.last_name ?? ""}`.trim() ||
    (user?.email ? user.email.split("@")[0] : "Guest");

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    [supabase]
  );

  const signUp = useCallback(
    async ({ firstName, lastName, email, password }: { firstName: string; lastName: string; email: string; password: string }) => {
      const firstTrimmed = firstName.trim();
      const lastTrimmed = lastName.trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstTrimmed,
            last_name: lastTrimmed,
          },
        },
      });
      if (error) {
        return { error: error.message };
      }
      const userId = data.user?.id;
      const fullName = `${firstTrimmed} ${lastTrimmed}`.trim();
      if (userId && fullName) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({ id: userId, full_name: fullName }, { onConflict: "id" });
        if (profileError) {
          console.error("Failed to upsert profile", profileError);
        }
      }
      return {};
    },
    [supabase]
  );

  const handleSignOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Failed to sign out", error);
    }
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      supabase,
      user,
      profile,
      displayName,
      loading,
      isGuest: !user,
      signIn,
      signUp,
      signOut: handleSignOut,
    }),
    [displayName, handleSignOut, loading, profile, signIn, signUp, supabase, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
