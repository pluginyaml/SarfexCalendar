import "server-only";
import { createHash } from "node:crypto";

function isAuthDebugEnabled() {
  return process.env.NODE_ENV !== "production";
}

function fingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export function describeAuthString(value: string | undefined | null) {
  if (typeof value !== "string") {
    return {
      present: false,
      length: 0,
      trimmedLength: 0,
      leadingWhitespace: false,
      trailingWhitespace: false,
      fingerprint: null,
    };
  }

  return {
    present: value.length > 0,
    length: value.length,
    trimmedLength: value.trim().length,
    leadingWhitespace: /^\s/.test(value),
    trailingWhitespace: /\s$/.test(value),
    fingerprint: value.length > 0 ? fingerprint(value) : null,
  };
}

export function logAuthDebug(label: string, payload: Record<string, unknown>) {
  if (!isAuthDebugEnabled()) {
    return;
  }

  console.info(
    `[auth-debug] ${label}`,
    JSON.stringify(payload),
  );
}
