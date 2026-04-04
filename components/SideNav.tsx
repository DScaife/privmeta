"use client";

import { Button } from "./ui/button";
import { ArrowUp } from "lucide-react";
import Typography from "./Typography";
import Link from "next/link";

const sideNavLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/blog", label: "Blog" },
];

const SideNav = () => {
  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // or "auto" for instant
    });
  };

  return (
    <aside className="fixed flex flex-col items-start bottom-(--space-3xl) ml-(--max-content-width)">
      <div className="pointer-events-auto w-fit flex flex-col items-start gap-(--space-lg)">
        <Button
          size="icon"
          variant="outline"
          onClick={handleClick}
          aria-label="Scroll to top"
          className="rounded-(--corner-radius) border-2 border-foreground"
        >
          <ArrowUp className="size-5" />
        </Button>

        <nav className="flex flex-col items-start gap-(--space-md)">
          <Typography as="span" variant="label">
            PrivMeta
          </Typography>
          {sideNavLinks.map((link) => (
            <Link key={link.label} href={link.href} className="text-muted-foreground hover:text-foreground">
              <Typography as="span" variant="sidenav">
                {link.label}
              </Typography>
            </Link>
          ))}
          <div className="flex gap-(--space-sm) items-baseline select-none cursor-default">
            <Typography as="span" variant="legal" muted>
              &copy; {new Date().getFullYear()}
            </Typography>
            <Typography as="span" variant="legal" muted>
              All rights reserved
            </Typography>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default SideNav;
