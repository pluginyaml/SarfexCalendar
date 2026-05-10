export function encodeEventId(href: string) {
  return Buffer.from(href, "utf8").toString("base64url");
}

export function decodeEventId(id: string) {
  return Buffer.from(id, "base64url").toString("utf8");
}
