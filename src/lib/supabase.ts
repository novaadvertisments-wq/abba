// The connection between the ABBA app and Supabase (our database and login
// system). The two values come from the file called .env.local in the main
// project folder.

import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

import { sessionStorage } from "./sessionStorage";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

// True only when both values were filled in with real ones.
export const isSupabaseConfigured =
  !!url && !!key && url.startsWith("https://") && !url.includes("PASTE");

export const supabase = createClient(
  isSupabaseConfigured ? url! : "https://not-set-up.supabase.co",
  isSupabaseConfigured ? key! : "not-set-up",
  {
    auth: {
      // Keeps people logged in after they close the app, in the phone's
      // encrypted storage. (Skipped while the web version is being pre-built
      // on a computer, where there is no storage at all.)
      storage: typeof window === "undefined" ? undefined : sessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Keep the login fresh while the app is open, and pause when it is not.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
