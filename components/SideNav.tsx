"use client";

import { Button } from "./ui/button";
import { ArrowUp } from "lucide-react";
import Typography from "./Typography";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sideNavLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/blog", label: "Blog" },
];

const SideNav = () => {
  const pathname = usePathname();

  const getVisibleLinks = () => {
    return sideNavLinks.filter((link) => {
      if (link.href === "/") return pathname !== "/";
      if (link.href === "/blog") return !pathname.startsWith("/blog");
      return pathname !== link.href;
    });
  };

  const visibleLinks = getVisibleLinks();

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // or "auto" for instant
    });
  };

  return (
    <>
      <aside className="fixed flex-col items-start bottom-(--space-3xl) ml-(--max-content-width) hidden xl:flex">
        <div className="pointer-events-auto w-fit flex flex-col items-start gap-(--space-lg)">
          <Button
            size="icon"
            onClick={handleClick}
            aria-label="Scroll to top"
            className="rounded-(--corner-radius) border-2 border-foreground bg-background text-foreground hover:bg-foreground/10"
          >
            <ArrowUp className="size-5" />
          </Button>

          <nav className="flex flex-col items-start gap-(--space-md)">
            {visibleLinks.map((link) => (
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

      <div className="flex flex-col sm:flex-row gap-(--space-md) items-start sm:items-center justify-between xl:hidden pb-(--space-2xl)">
        <div className="flex gap-(--space-sm) items-baseline select-none cursor-default">
          <Typography as="span" variant="legal" muted>
            &copy;{new Date().getFullYear()}
          </Typography>
          <Typography as="span" variant="legal" muted>
            All rights reserved
          </Typography>
        </div>
        <div className="flex items-start gap-(--space-lg)">
          {visibleLinks.map((link) => (
            <Link key={link.label} href={link.href} className="text-muted-foreground hover:text-foreground">
              <Typography as="span" variant="sidenav">
                {link.label}
              </Typography>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default SideNav;
