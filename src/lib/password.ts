import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (isHashed(stored)) {
    return bcrypt.compare(plain, stored);
  }
  // Plain-text fallback for migration
  return plain === stored;
}

export function isHashed(pw: string): boolean {
  return pw.startsWith("$2a$") || pw.startsWith("$2b$") || pw.startsWith("$2y$");
}
