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
        "flex flex-col gap-2 border-b border-black/6 pb-2",
        "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        {eyebrow ? (
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-4xl text-base font-semibold tracking-tight text-balance sm:text-lg">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-[11px] leading-[1.15rem] text-muted-foreground sm:text-xs">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
    </header>
  );
}
