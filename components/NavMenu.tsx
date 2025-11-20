"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import Image from "next/image";

const components: {
  title: string;
  href: string;
  description: string;
  comingSoon?: boolean;
}[] = [
  {
    title: "PrivMeta",
    href: "/",
    description: "A private platform for stripping files of hidden metadata.",
  },
  {
    title: "PixMill",
    href: "https://www.pixmill.io/",
    description: "The photo edit marketplace. Make your photos perfect!",
  },
  {
    title: "Buglet",
    href: "https://www.buglet.cc/",
    description: "Pinpoint feedback to fix bugs faster and delight your users.",
  },
  {
    title: "Blog",
    href: "/blog",
    description: "Insights, tips, and best practices for maximising digital privacy.",
  },
];

export function NavMenu() {
  return (
    <NavigationMenu className="hidden sm:block">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink className="font-medium hover:text-primary transition-colors px-4 py-2" href="/how-it-works">
            How It Works
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Overview</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    href="/"
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                  >
                    <Image
                      src="/PrivMetaLogoIconLightMode.png"
                      alt="PrivMeta Logo Icon"
                      width={214}
                      height={64}
                      className="w-12 h-auto dark:hidden"
                    />
                    <Image
                      src="/PrivMetaLogoIconDarkMode.png"
                      alt="PrivMeta Logo Icon"
                      width={214}
                      height={64}
                      className="w-12 h-auto hidden dark:inline"
                    />
                    <div className="mb-2 mt-4 text-lg font-medium">PrivMeta</div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      A fully private tool to remove hidden metadata from your files. Everything happens locally in your browser — your
                      files never leave your device.
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <ListItem title="Private">Files are processed entirely in your browser — nothing is uploaded.</ListItem>
              <ListItem title="Open source">Fully open source — view or audit the code on GitHub.</ListItem>
              <ListItem title="Free">Always free to use — no accounts, no tracking.</ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-3 p-4 md:w-[250px] md:grid-cols-1 lg:w-[300px]">
              {components.map((component) => (
                <ListItem key={component.title} title={component.title} href={component.href} comingSoon={component.comingSoon}>
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<React.ElementRef<"a">, React.ComponentPropsWithoutRef<"a"> & { comingSoon?: boolean }>(
  ({ className, title, children, comingSoon = false, ...props }, ref) => {
    return (
      <li className="relative">
        {comingSoon && (
          <div className="absolute top-2 right-2 z-10 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground backdrop-blur">
            Coming soon
          </div>
        )}
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            target={title === "PrivMeta" || "Blog" ? "_self" : "_blank"}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className,
              comingSoon && "pointer-events-none opacity-60"
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = "ListItem";
