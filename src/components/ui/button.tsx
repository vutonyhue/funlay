import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta text-foreground shadow-[0_0_40px_rgba(0,102,255,0.8)] hover:shadow-[0_0_80px_rgba(0,255,255,1)] hover:scale-105 border-2 border-glow-cyan/60",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_20px_rgba(239,68,68,0.6)]",
        outline: "border-2 border-cosmic-magenta/70 bg-transparent hover:bg-cosmic-magenta/20 hover:border-glow-magenta hover:shadow-[0_0_50px_rgba(217,0,255,0.9)] transition-all duration-500",
        secondary: "bg-gradient-to-r from-cosmic-magenta to-divine-rose-gold text-foreground shadow-[0_0_30px_rgba(217,0,255,0.7)] hover:shadow-[0_0_60px_rgba(255,183,246,0.9)]",
        ghost: "hover:bg-cosmic-sapphire/20 hover:text-cosmic-cyan hover:shadow-[0_0_35px_rgba(0,255,255,0.6)] transition-all duration-500",
        link: "text-cosmic-cyan underline-offset-4 hover:underline hover:text-cosmic-magenta transition-colors duration-300",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-13 rounded-lg px-10 text-base",
        icon: "h-11 w-11",
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
