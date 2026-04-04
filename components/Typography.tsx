import React from "react";
import { cn } from "@/lib/utils";

type TypographyVariant = "display" | "hero" | "h1" | "h2" | "bodyLg" | "body" | "label" | "footer";

type TypographyProps = {
  as?: React.ElementType;
  variant?: TypographyVariant;
  className?: string;
  children: React.ReactNode;
  weight?: number;
  muted?: boolean;
};

const variantClasses: Record<TypographyVariant, string> = {
  display: "type-fluid type-display",
  hero: "type-fluid type-hero",
  h1: "type-fluid type-h1",
  h2: "type-fluid type-h2",
  bodyLg: "type-fluid type-body-lg",
  body: "type-fluid type-body",
  label: "type-fluid type-label",
  footer: "type-fluid type-footer",
};

const Typography = ({ as: Comp = "p", variant = "body", className, children, weight, muted = false }: TypographyProps) => {
  return (
    <Comp
      className={cn(variantClasses[variant], muted && "text-muted-foreground", className)}
      style={weight ? ({ ["--weight" as string]: weight } as React.CSSProperties) : undefined}
    >
      {children}
    </Comp>
  );
};

export default Typography;
