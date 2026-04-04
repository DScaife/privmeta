"use client";

import { Button } from "./ui/button";
import { ArrowUp } from "lucide-react";

const SideNav = () => {
  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // or "auto" for instant
    });
  };
  return (
    <div className="fixed flex flex-col items-start bottom-(--space-lg) ml-(--max-content-width)">
      <Button size="icon" variant="outline" onClick={handleClick}>
        <ArrowUp />
      </Button>
      <div className="-ml-4 flex flex-col items-start">
        <Button
          onClick={() => {}}
          variant="link"
          className="text-xs font-normal text-muted-foreground hover:text-foreground transition-colors"
        >
          How it works
        </Button>
        <Button
          onClick={() => {}}
          variant="link"
          className="text-xs font-normal text-muted-foreground hover:text-foreground transition-colors"
        >
          Blog
        </Button>
        <div className="">
          <Button
            onClick={() => {}}
            variant="link"
            className="text-xs font-normal text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </Button>
          <Button
            onClick={() => {}}
            variant="link"
            className="text-xs font-normal text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Button>
        </div>
      </div>

      <span className="flex gap-(--space-md) items-baseline pt-2 select-none cursor-default text-xs">
        <p>&copy; {new Date().getFullYear()}</p>
        <p>All rights reserved</p>
      </span>
    </div>
  );
};

export default SideNav;
