import { cn } from "@/lib/utils";

type HeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function Header({
  eyebrow,
  title,
  description,
  actions,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 rounded-[1.35rem] border border-white/60 bg-white/70 px-4 py-3 backdrop-blur",
        "md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-4xl text-xl font-semibold tracking-tight text-balance sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
