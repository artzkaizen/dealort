import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { orpc } from "@/utils/orpc";
import { DashboardImage } from "@/assets/screenshots";
import { Button } from "@/components/ui/button";
import { StoreIcon } from "lucide-react";
import { AnimatePresence, motion, useScroll } from "motion/react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const healthCheck = useQuery(orpc.healthCheck.queryOptions());

  const { scrollYProgress } = useScroll();

  return (
    <>
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="bg-foreground/50 h-[2px] sticky top-10 z-40"
      />
      <section
        className="min-h-screen flex overflow-hidden items-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200, 200, 200, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 200, 200, 0.15) 1px, transparent 1px)",
          backgroundSize: "90px 150px",
        }}
      >
        <div className="flex flex-col gap-2 min-w-[35%] px-4">
          <AnimatePresence>
            <motion.h1
              className="text-4xl md:text-6xl max-w-md"
              initial={{ y: -100 }}
              whileInView={{ y: 0 }}
              transition={{ type: "spring", duration: 0.7 }}
            >
              The Best Launchpad For Your Start up
            </motion.h1>
          </AnimatePresence>

          <AnimatePresence>
            <motion.p
              className="text-foreground/50 max-md:text-sm max-w-ms"
              initial={{ x: -100 }}
              whileInView={{ x: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              A Virtual Data Room (VDR) that transforms promising startups into proven,
              investment-ready opportunities..
            </motion.p>
          </AnimatePresence>

          <AnimatePresence>
            <motion.div
              className="flex gap-1 mt-3"
              initial={{ y: 100 }}
              whileInView={{ y: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <Button asChild>
                <Link to="#waitlist">Join Waitlist</Link>
              </Button>
              <Button asChild variant={"ghost"}>
                <Link to="/products">
                  View Products <StoreIcon />
                </Link>
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          <motion.img
            className="relative max-md:hidden shadow-[0_16px_40px_0_rgba(0,0,0,0.13),0_2px_8px_0_rgba(0,0,0,0.11)] rounded-xl transform-[perspective(10px)_rotateY(-0.4deg)_skewY(1deg)_scale(0.75)]"
            initial={{ right: -300 }}
            whileInView={{ right: 0 }}
            transition={{ type: "spring", duration: 2 }}
            src={DashboardImage}
            alt="Dashboard screenshot"
          />
        </AnimatePresence>

        {/* <div className="grid gap-6">
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium">API Status</h2>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-muted-foreground text-sm">
                {healthCheck.isLoading
                  ? "Checking..."
                  : healthCheck.data
                    ? "Connected"
                    : "Disconnected"}
              </span>
            </div>
          </section>
        </div> */}
      </section>
    </>
  );
}
