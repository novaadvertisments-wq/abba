// ABBA security check. Run it from the main project folder:
//
//     node scripts/security-check.js
//
// It looks for the mistakes that most often leak a secret key, and tells you
// in plain words what to fix. Run it before every "git push".

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = process.cwd();
let failures = 0;
let warnings = 0;
const ok = (m) => console.log("  ✔ " + m);
const bad = (m, fix) => { failures++; console.log("  ✖ " + m + (fix ? "\n      Fix: " + fix : "")); };
const warn = (m, fix) => { warnings++; console.log("  ! " + m + (fix ? "\n      Tip: " + fix : "")); };
const read = (f) => { try { return fs.readFileSync(path.join(root, f), "utf8"); } catch { return null; } };
const git = (args) => { try { return execSync("git " + args, { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch { return null; } };

console.log("\nABBA security check\n");

// 1. .gitignore keeps the secrets file out of GitHub
console.log("1. Is the secrets file kept out of GitHub?");
const ignore = read(".gitignore");
if (ignore === null) bad("There is no .gitignore file.", "Create one containing the line:  .env*.local");
else if (/^\s*\.env(\*|\.local|\*\.local)?\s*$/m.test(ignore) || /^\s*\.env\*\.local\s*$/m.test(ignore)) ok(".gitignore hides the .env files.");
else bad(".gitignore does not hide .env.local.", "Add a line with exactly:  .env*.local");

// 2. Git: is a secrets file tracked, or was it ever saved in history?
console.log("2. Has a secrets file ever been saved to Git?");
if (git("rev-parse --is-inside-work-tree") === null) {
  warn("This folder is not a Git repository, so history was not checked.");
} else {
  const tracked = (git("ls-files") || "").split("\n").filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !/\.example$/.test(f));
  if (tracked.length) bad("These files are tracked by Git: " + tracked.join(", "), "Run:  git rm --cached " + tracked[0] + "   then commit and push. Then replace any key that was inside.");
  else ok("No .env file is tracked by Git.");
  const history = (git("log --all --oneline -- .env .env.local .env.production") || "").trim();
  if (history) bad("A .env file was saved in the Git history (" + history.split("\n").length + " commit(s)).", "Treat the keys inside as exposed and replace them in Supabase. Tell Claude if you need help cleaning the history.");
  else ok("No .env file appears anywhere in the history.");
}

// 3. Look through the code and settings for keys that must never be in the app
console.log("3. Are there secret keys in the code?");
const SKIP = new Set(["node_modules", ".git", ".expo", "dist", "android", "ios", ".claude"]);
const TEXT = /\.(ts|tsx|js|jsx|json|md|env|local|txt|yml|yaml|html)$|(^|\/)\.env/;
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (TEXT.test(e.name) || TEXT.test(path.relative(root, full))) files.push(full);
  }
})(root);
const patterns = [
  [/sb_secret_[A-Za-z0-9_\-]{10,}/, "a Supabase SECRET key"],
  [/sk_(live|test)_[A-Za-z0-9]{10,}/, "a Paystack SECRET key"],
  [/sk-ant-[A-Za-z0-9_\-]{10,}/, "an Anthropic (AI) secret key"],
  [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, "a private key"],
  [/postgres(ql)?:\/\/[^\s:]+:[^\s@]+@/, "a database password inside a connection address"],
];
let found = 0;
for (const f of files) {
  if (path.basename(f) === "security-check.js") continue;
  const text = fs.readFileSync(f, "utf8");
  const rel = path.relative(root, f);
  for (const [re, what] of patterns) if (re.test(text)) { found++; bad(rel + " contains " + what + ".", "Delete it from the file and replace the key in its dashboard."); }
  for (const m of text.matchAll(/eyJ[A-Za-z0-9_\-]{10,}\.([A-Za-z0-9_\-]{10,})\.[A-Za-z0-9_\-]{10,}/g)) {
    try {
      const payload = JSON.parse(Buffer.from(m[1], "base64").toString("utf8"));
      if (payload.role === "service_role") { found++; bad(rel + " contains the Supabase service_role (master) key.", "Remove it now and replace the key in Supabase."); }
    } catch {}
  }
}
if (!found) ok("Checked " + files.length + " files. No secret keys found.");

// 4. The values in .env.local
console.log("4. Is .env.local set up safely?");
const env = read(".env.local");
if (env === null) warn(".env.local was not found, so the app cannot reach the database.");
else {
  const vars = Object.fromEntries(env.split(/\r?\n/).filter((l) => l.includes("=") && !l.trim().startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1)]; }));
  const names = Object.keys(vars);
  const risky = names.filter((n) => n.startsWith("EXPO_PUBLIC_") && /SECRET|PRIVATE|SERVICE|PASSWORD|PAYSTACK/i.test(n));
  if (risky.length) bad("These settings start with EXPO_PUBLIC_, so they are packed INTO the app for everyone to read: " + risky.join(", "), "Never put secrets in EXPO_PUBLIC_ settings. Secrets belong on the server only.");
  else ok("Only public settings are packed into the app.");
  const url = (vars.EXPO_PUBLIC_SUPABASE_URL || "").trim();
  if (!url || url.includes("PASTE")) warn("EXPO_PUBLIC_SUPABASE_URL is not filled in yet.");
  else if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)) bad("EXPO_PUBLIC_SUPABASE_URL should look like https://xxxx.supabase.co (no extra text on the end).", "Fix the address in .env.local.");
  else ok("The database address uses HTTPS and is in the right format.");
  const key = (vars.EXPO_PUBLIC_SUPABASE_KEY || "");
  if (key !== key.trim()) bad("The key line has a blank space at the end.", "Delete the spaces after the key.");
  if (/^sb_secret_/.test(key.trim())) bad("EXPO_PUBLIC_SUPABASE_KEY holds a SECRET key.", "Use the publishable (anon) key instead and replace this one in Supabase.");
}

// 5. Is the app refusing insecure connections?
console.log("5. Does the app insist on HTTPS?");
const sb = read("src/lib/supabase.ts") || "";
if (/startsWith\(\s*["']https:\/\/["']\s*\)/.test(sb)) ok("The app refuses a database address that is not HTTPS.");
else bad("src/lib/supabase.ts no longer checks for HTTPS.", "Restore the check that the address starts with https://");

console.log("\n" + (failures ? "✖ " + failures + " problem(s) to fix." : "✔ All checks passed.") + (warnings ? "  (" + warnings + " tip(s) above)" : "") + "\n");
process.exit(failures ? 1 : 0);
