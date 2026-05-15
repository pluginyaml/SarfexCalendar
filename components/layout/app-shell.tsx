import { AppShellControls } from "@/components/layout/app-shell-controls";
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
      <main className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col px-3 pb-24 pt-3 sm:px-4 md:pl-14 md:pr-5 md:pb-8 md:pt-3 xl:pl-16 xl:pr-6">
        {children}
      </main>
      <AppShellControls />
      <MobileNav />
    </div>
  );
}
