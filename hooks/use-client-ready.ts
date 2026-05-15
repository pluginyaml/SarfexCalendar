"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

export function useClientReady() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
