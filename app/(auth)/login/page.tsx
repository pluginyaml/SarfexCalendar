import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="surface-grid flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Handelsfachwirt Kalender
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{APP_NAME}</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Die Anmeldelogik wird im nächsten Schritt direkt mit httpOnly Session-Cookie und
            ENV-basiertem Admin-Zugang verdrahtet.
          </p>
        </div>

        <Card className="card-shadow border-white/70 bg-card/90 backdrop-blur">
          <CardHeader>
            <CardTitle>Admin-Login</CardTitle>
            <CardDescription>
              Ruhige, lokale Verwaltungsoberfläche mit Nextcloud als Quelle der Wahrheit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sarfex.net"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Passwort"
                autoComplete="current-password"
              />
            </div>
            <Button className="w-full" disabled>
              Login folgt im nächsten Schritt
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
