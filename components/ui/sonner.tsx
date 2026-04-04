"use client";

import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast border-2 border-foreground bg-background text-foreground shadow-none rounded-[var(--corner-radius)] px-(--space-lg) py-(--space-md)",
          title: "type-fluid type-sonner-title text-foreground",
          description: "type-fluid type-sonner-body text-muted-foreground",
          actionButton:
            "rounded-[var(--corner-radius)] border-2 border-foreground bg-background text-foreground hover:bg-muted px-(--space-md) h-8",
          cancelButton:
            "rounded-[var(--corner-radius)] border-2 border-foreground bg-background text-foreground hover:bg-muted px-(--space-md) h-8",
          closeButton: "rounded-[var(--corner-radius)] border-2 border-foreground bg-background text-foreground hover:bg-muted",
          success: "border-2 border-foreground",
          error: "border-2 border-(--red)",
          warning: "border-2 border-foreground",
          info: "border-2 border-foreground",
          loading: "border-2 border-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--foreground)",
          "--border-radius": "var(--corner-radius)",
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
