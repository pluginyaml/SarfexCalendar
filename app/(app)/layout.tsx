import { AppShell } from "@/components/layout/app-shell";
import { requirePageSession } from "@/lib/server/auth/session";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requirePageSession();

  return <AppShell userEmail={session.email}>{children}</AppShell>;
}
