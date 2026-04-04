"use client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Code, Heart } from "lucide-react";
import Link from "next/link";
import Typography from "./Typography";

const Navbar = () => {
  return (
    <header className="relative z-50">
      <nav className="h-40 flex flex-col sm:flex-row gap-(--space-lg) justify-center sm:justify-between items-start sm:items-center">
        <div className="flex justify-between items-center w-full">
          <Typography as="h1" variant="h1" className="leading-none">
            PrivMeta
          </Typography>
          <div className="flex gap-(--space-md) sm:hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-lg" aria-label="View source on GitHub" asChild>
                  <a href="https://github.com/DScaife/privmeta/tree/master" target="_blank" rel="noopener noreferrer">
                    <Code className="size-5" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">View source code on GitHub</TooltipContent>
            </Tooltip>
            <ThemeToggle />
          </div>
        </div>

        <div className="relative">
          <Link href="https://buymeacoffee.com/privco" target="_blank" rel="noopener noreferrer">
            <Button
              aria-label="Support PrivMeta on Buy Me a Coffee"
              className="h-16 w-64 type-fluid type-button-feature text-foreground bg-background hover:bg-muted border-2 border-foreground"
            >
              <Heart fill="var(--red)" />
              Buy me a coffee
            </Button>
          </Link>
          <div className="absolute gap-(--space-md) top-full mt-(--space-lg) right-0 hidden sm:flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-lg" aria-label="View source on GitHub" asChild>
                  <a href="https://github.com/DScaife/privmeta/tree/master" target="_blank" rel="noopener noreferrer">
                    <Code className="size-5" />
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
