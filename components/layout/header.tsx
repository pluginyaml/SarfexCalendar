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
        "flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/65 px-5 py-5 backdrop-blur sm:px-6",
        "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  );
}
