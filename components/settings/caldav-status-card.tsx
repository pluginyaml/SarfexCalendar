import { AlertCircle, PlugZap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type CalDavStatusCardProps = {
  status: "pending" | "success" | "error";
  message: string;
  detail: string;
  actions?: React.ReactNode;
};

export function CalDavStatusCard({
  status,
  message,
  detail,
  actions,
}: CalDavStatusCardProps) {
  const badgeVariant = status === "success" ? "default" : status === "error" ? "outline" : "secondary";

  return (
    <Card className="card-shadow border-white/70 bg-card/90">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            {status === "error" ? (
              <AlertCircle className="size-5 text-destructive" />
            ) : (
              <PlugZap className="size-5 text-primary" />
            )}
            CalDAV-Status
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </div>
        <Badge variant={badgeVariant}>{status === "success" ? "Verbunden" : status === "error" ? "Fehler" : "Offen"}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
        {actions ? <div>{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
