import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { useState } from "react";
import { MenuIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScroll, motion } from "motion/react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  const links = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Products" },
    { to: "/launches", label: "Launches" },
  ] as const;

  return (
    <div
      className={cn("sticky top-0 z-50 bg-background/60 backdrop-blur-sm", { "border-b": !isOpen })}
    >
      <div className="flex flex-row items-center justify-between">
        <nav className="relative flex justify-between items-center w-full gap-4 px-2 sm:px-4 py-3">
          <Link to="/" className="grow">
            <img src="/logo.svg" alt="Logo" className="h-5 invert" />
          </Link>

          <div
            className={cn(
              "grow flex items-center gap-3 max-sm:absolute max-sm:top-14 max-sm:left-0 max-sm:right-0 max-sm:flex-col max-sm:w-full max-sm:bg-background/60 max-sm:backdrop-blur-lg max-sm:border-bottom max-sm:overflow-y-hidden ease-in-out duration-1000 transition-[height]",
              { "max-sm:h-auto": isOpen, "max-sm:h-0": !isOpen },
            )}
          >
            <div className="grow flex gap-3 max-sm:flex-col">
              {links.map(({ to, label }) => (
                <Link key={to} to={to}>
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex gap-2 max-sm:pb-5">
              <Button asChild>
                <a href="#waitlist" className="text-xs">
                  Join Waitlist
                </a>
              </Button>
            </div>
          </div>

          <Button
            className={cn(
              " sm:hidden relative flex items-center justify-center w-10 h-10 transition-colors duration-200",
              isOpen ? "bg-muted/60" : "",
            )}
            variant={"outline"}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span
              className="absolute left-0 right-0 mx-auto flex items-center justify-center transition-all duration-300 ease-in-out"
              aria-hidden={!isOpen}
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? "scale(1)" : "scale(0.7)",
                transition: "opacity 0.2s, transform 0.3s",
              }}
            >
              <X
                className={cn(
                  "w-5 h-5 pointer-events-none transition-all duration-300",
                  isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75 absolute",
                )}
              />
            </span>
            <span
              className="absolute left-0 right-0 mx-auto flex items-center justify-center transition-all duration-300 ease-in-out"
              aria-hidden={isOpen}
              style={{
                opacity: isOpen ? 0 : 1,
                transform: isOpen ? "scale(0.7)" : "scale(1)",
                transition: "opacity 0.2s, transform 0.3s",
              }}
            >
              <MenuIcon
                className={cn(
                  "w-5 h-5 pointer-events-none transition-all duration-300",
                  isOpen ? "opacity-0 scale-75 absolute" : "opacity-100 scale-100",
                )}
              />
            </span>
            <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
          </Button>
        </nav>
      </div>

      {!isOpen && (
        <motion.div
          style={{ scaleX: scrollYProgress }}
          className="bg-foreground h-px flex justify-start items-start  "
        />
      )}
    </div>
  );
}
