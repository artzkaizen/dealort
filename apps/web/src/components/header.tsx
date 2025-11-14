import { Link } from "@tanstack/react-router";
import { MenuIcon, X } from "lucide-react";
import { motion, useScroll } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  const links = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Products" },
    { to: "/launches", label: "Launches" },
  ] as const;

  return (
    <div
      className={cn("sticky top-0 z-50 bg-background/60 backdrop-blur-sm", {
        "border-b": !isOpen,
      })}
    >
      <div className="flex flex-row items-center justify-between">
        <nav className="relative flex w-full items-center justify-between gap-4 px-2 py-3 sm:px-4">
          <Link className="grow" to="/">
            <img
              alt="Logo"
              className="h-5 invert dark:invert-0"
              height={24}
              src="/logo.svg"
              width={100}
            />
          </Link>

          <div
            className={cn(
              "flex grow items-center gap-3 transition-[height] duration-1000 ease-in-out max-sm:absolute max-sm:top-14 max-sm:right-0 max-sm:left-0 max-sm:w-full max-sm:flex-col max-sm:overflow-y-hidden max-sm:border-bottom max-sm:bg-background/60 max-sm:backdrop-blur-lg",
              { "max-sm:h-auto": isOpen, "max-sm:h-0": !isOpen }
            )}
          >
            <div className="flex grow gap-3 max-sm:flex-col">
              {links.map(({ to, label }) => (
                <Link key={to} to={to}>
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex gap-2 max-sm:pb-5">
              <Button asChild>
                <a className="text-xs" href="#waitlist">
                  Join Waitlist
                </a>
              </Button>
            </div>
          </div>

          <Button
            className={cn(
              "relative flex h-10 w-10 items-center justify-center transition-colors duration-200 sm:hidden",
              isOpen ? "bg-muted/60" : ""
            )}
            onClick={() => setIsOpen((prev) => !prev)}
            variant={"outline"}
          >
            <span
              aria-hidden={!isOpen}
              className="absolute right-0 left-0 mx-auto flex items-center justify-center transition-all duration-300 ease-in-out"
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? "scale(1)" : "scale(0.7)",
                transition: "opacity 0.2s, transform 0.3s",
              }}
            >
              <X
                className={cn(
                  "pointer-events-none h-5 w-5 transition-all duration-300",
                  isOpen
                    ? "scale-100 opacity-100"
                    : "absolute scale-75 opacity-0"
                )}
              />
            </span>
            <span
              aria-hidden={isOpen}
              className="absolute right-0 left-0 mx-auto flex items-center justify-center transition-all duration-300 ease-in-out"
              style={{
                opacity: isOpen ? 0 : 1,
                transform: isOpen ? "scale(0.7)" : "scale(1)",
                transition: "opacity 0.2s, transform 0.3s",
              }}
            >
              <MenuIcon
                className={cn(
                  "pointer-events-none h-5 w-5 transition-all duration-300",
                  isOpen
                    ? "absolute scale-75 opacity-0"
                    : "scale-100 opacity-100"
                )}
              />
            </span>
            <span className="sr-only">
              {isOpen ? "Close menu" : "Open menu"}
            </span>
          </Button>
        </nav>
      </div>

      {!isOpen && (
        <motion.div
          className="flex h-px items-start justify-start bg-foreground"
          style={{ scaleX: scrollYProgress }}
        />
      )}
    </div>
  );
}
