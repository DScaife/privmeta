"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast border-2 shadow-none rounded-[var(--corner-radius)] px-(--space-lg) py-(--space-md)",
          title: "type-fluid type-sonner-title -ml-6",
          description: "type-fluid type-sonner-body -ml-6",
          icon: "invisible",
          actionButton:
            "rounded-[var(--corner-radius)] border-2 border-[var(--toast-border)] bg-transparent hover:opacity-70 px-(--space-md) h-8",
          cancelButton:
            "rounded-[var(--corner-radius)] border-2 border-[var(--toast-border)] bg-transparent hover:opacity-70 px-(--space-md) h-8",
          closeButton: "rounded-[var(--corner-radius)] border-2 border-[var(--toast-border)] bg-transparent hover:opacity-70",
        },
      }}
      style={
        {
          "--normal-bg": "var(--toast-neutral)",
          "--normal-border": "var(--toast-border)",
          "--normal-text": "var(--toast-text)",
          "--success-bg": "var(--toast-success)",
          "--success-border": "var(--toast-border)",
          "--success-text": "var(--toast-text)",
          "--error-bg": "var(--toast-error)",
          "--error-border": "var(--toast-border)",
          "--error-text": "var(--toast-text)",
          "--warning-bg": "var(--toast-warning)",
          "--warning-border": "var(--toast-border)",
          "--warning-text": "var(--toast-text)",
          "--info-bg": "var(--toast-info)",
          "--info-border": "var(--toast-border)",
          "--info-text": "var(--toast-text)",
          "--border-radius": "var(--corner-radius)",
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
