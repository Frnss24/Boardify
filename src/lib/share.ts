import { createHash, randomBytes } from "crypto";

export type SharePermission = "view_only" | "edit";

export function createShareToken(boardId: string, permission: SharePermission) {
  const nonce = randomBytes(16).toString("hex");
  const payload = `${boardId}:${permission}:${nonce}`;
  const token = createHash("sha256").update(payload).digest("hex");

  return {
    token,
    payload,
    permission,
  };
}

export function verifyShareToken(token: string, payload: string) {
  const expected = createHash("sha256").update(payload).digest("hex");
  return expected === token;
}
