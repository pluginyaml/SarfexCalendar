import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({
  userEmail,
  children,
}: Readonly<{
  userEmail: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <Sidebar userEmail={userEmail} />
      <main className="mx-auto flex min-h-screen w-full max-w-none flex-col px-3 pb-24 pt-3 sm:px-4 md:px-5 md:pb-8 md:pt-4 xl:px-6">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
