"use client";

import type { CSSProperties } from "react";
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
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
          title: "type-fluid type-label text-foreground",
          description: "type-fluid type-legal text-muted-foreground",
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
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
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
