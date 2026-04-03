"use client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Code, Heart } from "lucide-react";
import Link from "next/link";

const Navbar = () => {
  return (
    <header className="z-50 flex justify-center w-full">
      <nav className="h-40 flex justify-between items-center w-full max-w-[var(--max-content-width)] px-[var(--space-xl)]">
        <div className="flex gap-[var(--space-2xl)] items-center">
          <p className="text-5xl font-semibold">PrivMeta</p>
        </div>

        <div className="flex flex-col items-end gap-[var(--space-md)]">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Link href="https://buymeacoffee.com/privco" target="_blank" rel="noopener noreferrer">
                  <Button
                    aria-label="Support PrivMeta on Buy Me a Coffee"
                    className="h-16 w-64 text-xl font-semibold text-foreground bg-background hover:bg-muted border-2 border-foreground"
                  >
                    <Heart fill="var(--red)" />
                    Buy me a coffee
                  </Button>
                </Link>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">Support PrivMeta</TooltipContent>
          </Tooltip>

          <div className="flex gap-[var(--space-md)]">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="View source on GitHub" asChild>
                  <a href="https://github.com/DScaife/privmeta/tree/master" target="_blank" rel="noopener noreferrer">
                    <Code className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">View source code on GitHub</TooltipContent>
            </Tooltip>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
