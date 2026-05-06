export function isInvalidRefreshTokenError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.toLowerCase().includes("refresh token");
}
