import crypto from "node:crypto";

const SALT = process.env.IP_HASH_SALT ?? "briberates-dev-salt";
export const ADMIN_COOKIE = "briberates_admin";

function password(): string {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.trim() ? p : "admin";
}

/** The value we store in the admin cookie — never the raw password. */
export function adminToken(): string {
  return crypto
    .createHash("sha256")
    .update("admin:" + SALT + password())
    .digest("hex");
}

export function checkPassword(input: string): boolean {
  return input === password();
}

export function isValidAdminCookie(value: string | undefined): boolean {
  return !!value && value === adminToken();
}
