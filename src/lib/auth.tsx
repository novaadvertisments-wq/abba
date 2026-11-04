// Who is logged in? This file keeps track of that for the whole app.
// Any screen can ask: const { status, profile } = useAuth();

import { Session } from "@supabase/supabase-js";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

export type Role = "business" | "nova";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  phone: string;
};

type AuthState = {
  // "loading"   = still checking if someone is already logged in
  // "signedOut" = nobody is logged in
  // "signedIn"  = someone is logged in and we have their profile
  status: "loading" | "signedOut" | "signedIn";
  profile: Profile | null;
  email: string | null;
};

const AuthContext = createContext<AuthState>({
  status: "loading",
  profile: null,
  email: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    profile: null,
    email: null,
  });

  useEffect(() => {
    let active = true;

    // Given the current login (or none), work out the state of the app.
    const apply = async (session: Session | null) => {
      if (!session) {
        if (active) setState({ status: "signedOut", profile: null, email: null });
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, full_name, phone")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        // Logged in, but we could not read their profile (for example no
        // internet). Treat as signed out so the app never gets stuck.
        setState({ status: "signedOut", profile: null, email: null });
        return;
      }

      setState({
        status: "signedIn",
        profile: data as Profile,
        email: session.user.email ?? null,
      });
    };

    // Runs once at start, and again whenever someone logs in or out.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      // Run outside the listener, as Supabase recommends
      setTimeout(() => apply(session), 0);
    });

    // Safety net: never stay on "loading" forever (for example offline).
    const timeout = setTimeout(() => {
      if (active) {
        setState((current) =>
          current.status === "loading"
            ? { status: "signedOut", profile: null, email: null }
            : current,
        );
      }
    }, 8000);

    return () => {
      active = false;
      clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

// Where each kind of person lands after logging in.
export function homeFor(profile: Profile | null) {
  return profile?.role === "nova"
    ? ("/nova/requests" as const)
    : ("/business/find" as const);
}
