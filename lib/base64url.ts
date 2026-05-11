function toBase64Url(base64Value: string) {
  return base64Value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function toBase64(base64UrlValue: string) {
  const base64Value = base64UrlValue.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (base64Value.length % 4)) % 4;

  return `${base64Value}${"=".repeat(paddingLength)}`;
}

export function encodeUtf8ToBase64Url(input: string) {
  return toBase64Url(Buffer.from(input, "utf8").toString("base64"));
}

export function decodeBase64UrlToUtf8(input: string) {
  return Buffer.from(toBase64(input), "base64").toString("utf8");
}

export function encodeBase64ToBase64Url(input: string) {
  return toBase64Url(input);
}
