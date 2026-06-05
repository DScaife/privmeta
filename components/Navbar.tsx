"use client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Typography from "./Typography";

const Navbar = () => {
  return (
    <header className="relative z-50">
      <nav className="h-24 flex flex-row gap-(--space-lg) justify-between items-center">
        <Link href="/" prefetch={false} aria-label="Go to CleanPhoto homepage">
          <span className="flex items-center gap-(--fluid-sm-lg) type-fluid type-h1">
            <Image src="/logo-dark.svg" alt="CleanPhoto logo" width={52} height={52} className="block h-[0.9em] w-auto dark:hidden" />
            <Image
              src="/logo-light.svg"
              alt="CleanPhoto logo"
              width={52}
              height={52}
              className="hidden h-[0.9em] w-auto dark:block"
            />
            <span className="flex flex-col leading-none">
              <Typography as="span" variant="h1" className="leading-none">
                CleanPhoto
              </Typography>
              <Typography as="span" variant="legal" muted className="leading-none mt-0.5">
                fork of PrivMeta
              </Typography>
            </span>
          </span>
        </Link>

        <div className="flex gap-(--space-md) items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-lg" aria-label="View source on GitHub" asChild>
                <a href="https://github.com/VentureAlex/privmeta" target="_blank" rel="noopener noreferrer">
                  <Code className="size-5" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">View source code on GitHub</TooltipContent>
          </Tooltip>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;