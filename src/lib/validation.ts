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
