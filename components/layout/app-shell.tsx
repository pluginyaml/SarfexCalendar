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
      <div className="min-h-screen pl-0 md:pl-72">
        <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-28 pt-6 sm:px-6 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
