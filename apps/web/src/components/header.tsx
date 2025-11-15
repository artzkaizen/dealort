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
        <nav className="relative flex w-full items-center gap-4 px-4 py-3 sm:px-4 md:justify-evenly md:px-2">
          <Link className="max-md:grow" to="/">
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
              "flex items-start gap-7 transition-[height] duration-1000 ease-in-out max-sm:absolute max-sm:top-14 max-sm:right-0 max-sm:left-0 max-sm:w-full max-sm:flex-col max-sm:overflow-y-hidden max-sm:border-bottom max-sm:bg-background/90 max-sm:px-[50px] max-sm:backdrop-blur-sm sm:items-center sm:justify-between sm:gap-3",
              { "max-sm:h-[calc(100vh-56px)]": isOpen, "max-sm:h-0": !isOpen }
            )}
          >
            <div className="flex gap-4 max-sm:mt-6 max-sm:flex-col max-sm:text-xl sm:gap-3 sm:border-r sm:pr-3">
              {links.map(({ to, label }) => (
                <Link
                  activeProps={{
                    className: "text-foreground opacity-100",
                  }}
                  className="opacity-80 transition-transform hover:scale-105"
                  key={to}
                  onClick={() => setIsOpen(false)}
                  to={to}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild>
              <a className="text-xs" href="#waitlist">
                Join Waitlist
              </a>
            </Button>

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
          </div>
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
