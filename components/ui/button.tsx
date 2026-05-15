import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.7rem] border border-transparent text-[12px] font-semibold transition-[background-color,color,border-color,box-shadow] duration-150 disabled:pointer-events-none disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-[#7c6840]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-[#d8c48d] bg-[#ead8a7] text-[#1b1a17] shadow-[0_1px_2px_rgba(15,23,42,0.08)] hover:border-[#ceb97f] hover:bg-[#e4cf95] active:bg-[#ddc784] disabled:border-[#e4dbc5] disabled:bg-[#f1ebdc] disabled:text-[#8f8574]",
        secondary:
          "border-[#ddd3c1] bg-[#f2ede3] text-[#1e1c18] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#d4c8b2] hover:bg-[#ebe4d7] active:bg-[#e4dccd] disabled:border-[#e7dfd1] disabled:bg-[#f6f2ea] disabled:text-[#968d7f]",
        outline:
          "border-[#d7cebf] bg-white text-[#1f1d18] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#cbc0ad] hover:bg-[#f7f3ea] active:bg-[#f1ecdf] disabled:border-[#e7dfd1] disabled:bg-[#fbf9f4] disabled:text-[#9a9182]",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-black/[0.045] hover:text-foreground disabled:text-muted-foreground",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground shadow-[0_1px_2px_rgba(180,35,24,0.18)] hover:bg-[#9f1f14] active:bg-[#8f1c12] disabled:border-destructive/25 disabled:bg-destructive/35 disabled:text-destructive-foreground/80",
      },
      size: {
        default: "h-9 px-3.5 py-2",
        sm: "h-[1.875rem] rounded-[0.65rem] px-2.5 text-[11px]",
        lg: "h-12 px-6 text-base",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
