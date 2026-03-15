/**
 * Thin compatibility shim — all real logic lives in user-store.ts.
 * Kept so existing imports throughout the codebase continue to work.
 */

export type { UserStatus, PublicUser as MockUser } from "./user-store";

export {
  getAllUsers,
  getUserById as getMockUser,
  verifyCredentials as verifyUserCredentials,
} from "./user-store";

/** Used by the login page to show demo account hints. */
export const DEMO_USERS = [
  { email: "david@demo.com",  password: "user123", name: "陳大文"    },
  { email: "mary@demo.com",   password: "user123", name: "李美玲"    },
  { email: "james@demo.com",  password: "user123", name: "James Wong" },
  { email: "sophie@demo.com", password: "user123", name: "Sophie Lam" },
];

/** Legacy helper still used by the register API route. */
export function registerUser(name: string, email: string): import("./user-store").PublicUser | null {
  // The register route will be updated to call user-store directly.
  // This shim keeps old callers working: password defaults to "demo123".
  const { registerUser: storeRegister } = require("./user-store");
  return storeRegister(name, email, "demo123");
}
