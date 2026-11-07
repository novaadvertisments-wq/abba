// Small checks used by the sign-up and login forms.
// Each one returns a message to show under the field, or "" if all is fine.

export function checkName(value: string, label: string): string {
  return value.trim().length < 2 ? `Enter your ${label.toLowerCase()}` : "";
}

export function checkEmail(value: string): string {
  const email = value.trim();
  if (!email) return "Enter your email address";
  // Looks like name@something.something
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
  return "";
}

// Ghana numbers: 0241234567 or +233241234567 (spaces are ignored)
export function checkPhone(value: string): string {
  const phone = value.replace(/[\s-]/g, "");
  if (!phone) return "Enter your phone number";
  if (!/^(\+233|0)\d{9}$/.test(phone)) {
    return "Enter a valid Ghana number, like 024 123 4567";
  }
  return "";
}

export function checkPassword(value: string): string {
  if (!value) return "Enter a password";
  if (value.length < 8) return "Use at least 8 characters";
  return "";
}

export function checkConfirm(password: string, confirm: string): string {
  if (!confirm) return "Type your password again";
  return password !== confirm ? "The passwords do not match" : "";
}

// ---- Nova profile checks ----

// Handles on Instagram, TikTok, X and so on: letters, numbers, dots and
// underscores. A leading "@" is allowed and ignored.
export function cleanHandle(value: string): string {
  return value.trim().replace(/^@+/, "");
}

export function checkHandle(value: string, platform: string): string {
  if (platform === "whatsapp") return checkPhone(value);
  const handle = cleanHandle(value);
  if (!handle) return "Enter your handle or page name";
  if (!/^[A-Za-z0-9._]{2,40}$/.test(handle)) {
    return "Use 2 to 40 letters, numbers, dots or underscores";
  }
  return "";
}

// Followers are typed as a plain number. Commas and spaces are ignored.
export function parseFollowers(value: string): number | null {
  const digits = value.replace(/[\s,]/g, "");
  if (!/^\d{1,10}$/.test(digits)) return null;
  const n = Number(digits);
  return n <= 1_000_000_000 ? n : null;
}

export function checkFollowers(value: string): string {
  if (!value.trim()) return "Enter your number of followers";
  return parseFollowers(value) === null ? "Enter a whole number, like 5400" : "";
}

export function checkViews(value: string): string {
  if (!value.trim()) return "Enter your usual number of views";
  return parseFollowers(value) === null ? "Enter a whole number, like 1200" : "";
}

// 5400 -> "5.4K", 1200000 -> "1.2M"
export function shortNumber(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function checkBusinessName(value: string): string {
  const v = value.trim();
  if (v.length < 2) return "Enter your business name";
  if (v.length > 60) return "Keep the name under 60 characters";
  return "";
}

export function checkDescription(value: string): string {
  return value.trim().length > 280 ? "Keep it under 280 characters" : "";
}

export function checkOfferTitle(value: string): string {
  const v = value.trim();
  if (v.length < 3) return "Give your offer a short title";
  if (v.length > 60) return "Keep the title under 60 characters";
  return "";
}

export function parseBudget(value: string): number | null {
  const v = value.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(v)) return null;
  return Number(v);
}

export function checkBudget(value: string): string {
  const n = parseBudget(value);
  if (n === null) return "Enter your budget in cedis, numbers only";
  if (n < 5) return "The smallest budget is GHS 5";
  if (n > 100000) return "The largest budget is GHS 100,000";
  return "";
}
