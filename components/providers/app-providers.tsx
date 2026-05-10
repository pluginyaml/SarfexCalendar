"use client";

import { Toaster } from "sonner";

export function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          className: "border border-border bg-card text-card-foreground",
        }}
      />
    </>
  );
}
