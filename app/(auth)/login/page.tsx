import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";
import { getSessionFromCookies } from "@/lib/server/auth/session";

export const metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const session = await getSessionFromCookies();

  if (session) {
    redirect("/");
  }

  return (
    <main className="surface-grid flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Handelsfachwirt Kalender
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{APP_NAME}</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Melde dich mit dem in der Runtime-Umgebung hinterlegten Admin-Zugang an. Die Session
            liegt nur als signiertes httpOnly Cookie auf dem Server.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
