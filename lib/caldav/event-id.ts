import { decodeBase64UrlToUtf8, encodeUtf8ToBase64Url } from "@/lib/base64url";

const EVENT_ID_ROUNDTRIP_SAMPLE =
  "/remote.php/dav/calendars/pluginyaml/handelsfachwirt/2c43f0d9-f69c-4df9-8995-6d3b33fd7f08.ics";

export function encodeEventId(href: string) {
  return encodeUtf8ToBase64Url(href);
}

export function decodeEventId(id: string) {
  return decodeBase64UrlToUtf8(id);
}

const encodedSample = encodeEventId(EVENT_ID_ROUNDTRIP_SAMPLE);

if (decodeEventId(encodedSample) !== EVENT_ID_ROUNDTRIP_SAMPLE) {
  throw new Error("Event ID base64url roundtrip failed.");
}
