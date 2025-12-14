"use client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { NavMenu } from "./NavMenu";
import { Code, Coffee, MessageSquareText, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 flex justify-center w-full border-b border-[var(--border)] backdrop-blur-lg">
      <nav className="flex justify-between items-center w-full max-w-[var(--max-content-width)] px-[var(--space-md)] h-14">
        <TooltipProvider>
          <div className="flex gap-[var(--space-2xl)] items-center">
            <Link href="/" passHref>
              <Image
                src="/PrivMetaLogoLightMode.png"
                alt="PrivMeta Logo"
                width={516}
                height={115}
                className="w-24 h-auto cursor-pointer dark:hidden"
              />
              <Image
                src="/PrivMetaLogoDarkMode.png"
                alt="PrivMeta Logo"
                width={516}
                height={115}
                className="hidden dark:inline w-24 h-auto cursor-pointer"
              />
            </Link>

            <NavMenu />
          </div>

          <div className="flex gap-[var(--space-md)]">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/how-it-works">
                  <Button variant="secondary" size="icon" className="buglet-trigger md:hidden">
                    <Info />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">Find out more about PrivMeta</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button variant="secondary" className="buglet-trigger hidden md:inline">
                    Feedback
                  </Button>
                  <Button variant="secondary" size="icon" className="buglet-trigger md:hidden">
                    <MessageSquareText />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Share your feedback</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Link href="https://buymeacoffee.com/privco" target="_blank" rel="noopener noreferrer">
                    <Button
                      aria-label="Support me on Buy Me a Coffee"
                      className="md:hidden bg-[var(--bmc)] hover:bg-[var(--bmc)]/50  text-black border-2 border-black"
                      size="icon"
                    >
                      <Coffee />
                    </Button>
                  </Link>
                  <Link href="https://buymeacoffee.com/privco" target="_blank" rel="noopener noreferrer">
                    <Button
                      aria-label="Support me on Buy Me a Coffee"
                      className="hidden md:flex bg-[var(--bmc)] hover:bg-[var(--bmc)]/50  text-black border-1 border-black"
                    >
                      <Coffee />
                      Buy me a coffee
                    </Button>
                  </Link>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Support PrivMeta</TooltipContent>
            </Tooltip>

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
        </TooltipProvider>
      </nav>
    </header>
  );
};

export default Navbar;
