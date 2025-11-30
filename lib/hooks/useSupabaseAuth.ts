import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/supabase";

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error && error.name !== "AuthSessionMissingError") {
        console.error("Failed to fetch Supabase session", error);
      }
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const deriveName = (u: User) => {
      const first = u.user_metadata?.first_name?.toString?.()?.trim() ?? "";
      const last = u.user_metadata?.last_name?.toString?.()?.trim() ?? "";
      const combined = `${first} ${last}`.trim();
      if (combined) return combined;
      if (u.email) {
        return u.email.split("@")[0] ?? "MediGuard user";
      }
      return "MediGuard user";
    };

    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        const code = (error as { code?: string }).code;
        if (code && code !== "PGRST116") {
          console.warn("Unexpected error fetching profile", error);
        }
        setProfile(null);
        return;
      }

      if (data) {
        setProfile(data as Profile);
        return;
      }

      const fallbackName = deriveName(user);
      if (!fallbackName || !user.id) {
        setProfile(null);
        return;
      }

      const { data: upserted, error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: fallbackName }, { onConflict: "id" })
        .select()
        .maybeSingle();

      if (!active) return;

      if (profileError && profileError.code) {
        console.error("Failed to upsert profile", profileError);
        setProfile(null);
        return;
      }

      setProfile((upserted as Profile) ?? { id: user.id, full_name: fallbackName });
    };

    void fetchProfile();

    return () => {
      active = false;
    };
  }, [user]);

  return { user, profile, loading };
}
