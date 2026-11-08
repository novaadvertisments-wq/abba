// The actions a person can take: create an account, log in, log out.
// Each returns { ok: true } or { ok: false, message } with a friendly message.

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Role } from "@/lib/auth";

type Result = { ok: true; needsConfirmation?: boolean } | { ok: false; message: string };

const NOT_SET_UP =
  "The app is not connected to Supabase yet. Check the .env.local file.";

function friendly(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (text.includes("invalid login credentials")) {
    return "Wrong email or password.";
  }
  if (text.includes("email not confirmed")) {
    return "Please confirm your email first. Check your inbox for the link.";
  }
  if (text.includes("network") || text.includes("fetch") || text.includes("failed to")) {
    return "Could not reach the server. Check your internet connection and try again.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (text.includes("password")) {
    return "That password is not accepted. Try a longer one.";
  }
  return "Something went wrong. Please try again.";
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: Role;
}): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_SET_UP };

  try {
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      // Saved with the account. A database rule turns this into the profile.
      options: {
        data: {
          role: input.role,
          full_name: input.fullName.trim(),
          phone: input.phone.trim(),
        },
      },
    });

    if (error) return { ok: false, message: friendly(error.message) };

    // Supabase hides "email already used" by returning a user with no identities
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { ok: false, message: friendly("User already registered") };
    }

    // No session yet means the person must confirm their email first
    return { ok: true, needsConfirmation: !data.session };
  } catch (e) {
    return { ok: false, message: friendly(String(e)) };
  }
}

export async function logIn(email: string, password: string): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_SET_UP };

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, message: friendly(error.message) };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: friendly(String(e)) };
  }
}

export async function logOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // If this fails (no internet) we still clear things locally below.
    await supabase.auth.signOut({ scope: "local" });
  }
}

// Forgot password, step 1: email a 6-digit code. We always report success for a
// well-formed email, so nobody can use this to find out who has an account.
export async function sendResetCode(email: string): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_SET_UP };
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) return { ok: false, message: friendly(error.message) };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: friendly(String(e)) };
  }
}

// Forgot password, step 2: check the code, then set the new password.
export async function resetPassword(email: string, code: string, newPassword: string): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_SET_UP };
  try {
    const verified = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "recovery",
    });
    if (verified.error) {
      const text = verified.error.message.toLowerCase();
      if (text.includes("network") || text.includes("fetch")) return { ok: false, message: friendly(text) };
      return { ok: false, message: "That code is wrong or has expired. Ask for a new one." };
    }
    const updated = await supabase.auth.updateUser({ password: newPassword });
    if (updated.error) return { ok: false, message: friendly(updated.error.message) };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: friendly(String(e)) };
  }
}
