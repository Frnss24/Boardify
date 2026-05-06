import { randomBytes } from "crypto";

export type SharePermission = "view_only" | "edit";

export function createShareCode() {
  return randomBytes(16).toString("hex");
}

export function verifyShareCode(code: string | null | undefined) {
  return typeof code === "string" && code.length >= 16;
}
