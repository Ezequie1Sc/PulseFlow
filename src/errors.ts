const messages: Record<number, string> = {
  1: "SDK is not ready. Stop and retry.",
  2: "Authentication failed. Check your Presage key and restart.",
  3: "SDK configuration failed. Check the installation and retry.",
  4: "Presage credits exhausted. Check your account.",
  5: "Presage is unreachable. Check your connection and retry.",
  6: "Presage service is unavailable. Try again later.",
  7: "Camera unavailable. Reconnect it, close other camera apps and check Windows camera permissions.",
  8: "Measurement interrupted. Stop and retry.",
  13: "This key lacks access to a requested metric. Check its permissions.",
  14: "Camera frame rate is too low. Close other camera apps and retry.",
};
export function sdkError(code: unknown) {
  return (
    messages[Number(code)] ??
    "SmartSpectra could not complete this operation. Restart monitoring."
  );
}
