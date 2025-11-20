import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CopyrightIcon,
  HandCoinsIcon,
  RocketIcon,
  StoreIcon,
  WrenchIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import DashboardImage from "@/assets/screenshots/dashboard-screenshot.svg";
import DashboardImageNoNav from "@/assets/screenshots/dashboard-screenshot-no-nav.svg";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WaitlistForm } from "@/components/waitlist-form";

export const Route = createFileRoute("/_public/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <main className="max-w-screen">
      <MouseFollower />
      <section
        className="min-h-screen"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200, 200, 200, 0.1) 3px, transparent 3px), linear-gradient(90deg, rgba(200, 200, 200, 0.15) 1px, transparent 1px)",
          backgroundSize: "90px 150px",
        }}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="z-10 mt-24 ml-4 flex min-w-[35%] max-w-[90vw] flex-col gap-2 px-4 md:px-32 lg:px-[17%] xl:px-[23%]">
            <motion.h1
              className="max-w-xl text-5xl md:text-6xl"
              initial={{ filter: "blur(10px)", y: -10 }}
              transition={{ type: "spring", duration: 3 }}
              viewport={{ once: true }}
              whileInView={{ filter: "blur(0px)", y: 0 }}
            >
              The Best Launchpad For Your Start up
            </motion.h1>

            <motion.p
              className="max-w-xl text-foreground/50 max-md:text-sm"
              initial={{ filter: "blur(10px)", y: -10 }}
              transition={{ type: "spring", duration: 3, delay: 0.5 }}
              viewport={{ once: true }}
              whileInView={{ filter: "blur(0px)", y: 0 }}
            >
              A Virtual Data Room (VDR) that transforms promising startups into
              proven, investment-ready opportunities..
            </motion.p>

            <motion.div
              className="mt-3 flex gap-1"
              initial={{ filter: "blur(10px)", y: -10 }}
              transition={{ type: "spring", duration: 3, delay: 1 }}
              viewport={{ once: true }}
              whileInView={{ filter: "blur(0px)", y: 0 }}
            >
              <Button asChild>
                <a href="#waitlist">Join Waitlist</a>
              </Button>
              <Button asChild variant={"ghost"}>
                <Link to="/products">
                  View Products <StoreIcon />
                </Link>
              </Button>
            </motion.div>
          </div>

          <div className="flex max-sm:mt-[10%] lg:mt-[-80px]">
            <motion.img
              alt="Dashboard screenshot"
              className="transform-[perspective(900px)_rotateX(15deg)_rotateY(0deg)_rotateZ(-13deg)_skewX(30deg)_scale(0.78)] relative left-[2%] w-auto rounded-xl shadow-[0_16px_40px_0_rgba(0,0,0,0.13),0_2px_8px_0_rgba(0,0,0,0.11)]"
              height=""
              initial={{ filter: "blur(10px)", top: -100 }}
              src={DashboardImage}
              transition={{ type: "spring", duration: 2, delay: 1.5 }}
              viewport={{ once: true }}
              whileInView={{ filter: "blur(0px)", top: 0 }}
              width=""
            />

            <motion.img
              alt="Dashboard screenshot"
              className="transform-[perspective(900px)_rotateX(15deg)_rotateY(0deg)_rotateZ(-13deg)_skewX(30deg)_scale(0.78)] relative left-[-85%] z-1 mt-[-48px] w-auto rounded-xl shadow-[0_16px_40px_0_rgba(0,0,0,0.13),0_2px_8px_0_rgba(0,0,0,0.11)]"
              height=""
              initial={{ filter: "blur(10px)", top: -200 }}
              src={DashboardImageNoNav}
              transition={{ type: "spring", duration: 4, delay: 1.6 }}
              viewport={{ once: true }}
              whileInView={{ filter: "blur(0px)", top: 0 }}
              width=""
            />
          </div>
        </div>
      </section>

      <section
        className="mb-10 flex flex-col items-center justify-center"
        id="waitlist"
      >
        <div className="flex w-fit items-center justify-center gap-1 overflow-hidden border-t border-b bg-background px-10 pt-10">
          <RollingCubeFeature />
        </div>

        <Card className="mt-5 max-w-full overflow-hidden border-none bg-transparent py-0 shadow-none sm:min-w-sm sm:max-w-xl">
          <CardHeader>
            <CardTitle>Join the wait list</CardTitle>
            <CardDescription>
              Be the first to know when we launch so you do not miss out on
              early perks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WaitlistForm />
          </CardContent>
        </Card>
      </section>

      <footer
        className="flex items-center justify-center border-t py-12"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200, 200, 200, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 200, 200, 0.15) 1px, transparent 1px)",
          backgroundSize: "90px 150px",
        }}
      >
        <p className="flex items-center gap-2 text-foreground/50 text-sm">
          <CopyrightIcon /> {new Date().getFullYear()}, Dealort. All rights
          reserved
        </p>
      </footer>
    </main>
  );
}

function MouseFollower() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const movementTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsMoving(true);

      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current);
      }

      movementTimeoutRef.current = window.setTimeout(() => {
        setIsMoving(false);
      }, 150);
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      setIsInputFocused(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      animate={{
        x: mousePosition.x - 10,
        y: mousePosition.y - 10,
        opacity: isInputFocused ? 0 : 1,
        scale: isMoving ? 0.6 : 1,
      }}
      className="pointer-events-none fixed z-1 h-5 w-5 rounded-full bg-foreground/10"
      style={{
        left: 0,
        top: 0,
        transform: "translate(-50%, -50%)",
      }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 15,
        mass: 0.1,
        opacity: { duration: 0.2 },
        scale: { duration: 0.3, ease: "easeOut" },
      }}
    />
  );
}

function RollingCubeFeature() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const items = [
    {
      icon: <WrenchIcon className="size-4" />,
      text: "Build Better",
    },
    {
      icon: <RocketIcon className="size-4" />,
      text: "Launch Quicker",
    },
    {
      icon: <HandCoinsIcon className="size-4" />,
      text: "Get Funded",
    },
  ];

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-6 flex-col gap-2 pb-3" style={{ perspective: 100 }}>
      <AnimatePresence mode="wait">
        <motion.p
          animate={{
            opacity: 1,
            rotateX: 0,
            y: 0,
            transition: {
              duration: 0.7,
              ease: "easeInOut",
            },
          }}
          className="flex h-6 min-h-6 origin-bottom items-center justify-center gap-0.5 text-foreground/60 text-lg"
          exit={{
            opacity: 0,
            rotateX: 90,
            y: 20,
            transition: {
              duration: 0.7,
              ease: "easeInOut",
            },
          }}
          initial={{
            opacity: 0,
            rotateX: -90,
            y: 20,
          }}
          key={currentIdx}
          style={{
            backfaceVisibility: "hidden",
            willChange: "transform",
          }}
        >
          {items[currentIdx].icon} {items[currentIdx].text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
