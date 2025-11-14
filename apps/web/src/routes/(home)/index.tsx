import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardImage } from "@/assets/screenshots";
import { Button } from "@/components/ui/button";
import { CopyrightIcon, HandCoinsIcon, RocketIcon, StoreIcon, WrenchIcon } from "lucide-react";
import { AnimatePresence, motion, useScroll } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const formSchema = z.object({
  firstname: z.string().min(1, "First name is required."),
  lastname: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email"),
});

function HomeComponent() {
  // const healthCheck = useQuery(orpc.healthCheck.queryOptions());

  const form = useForm({
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast("You submitted the following values:", {
        description: (
          <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
            <code>{JSON.stringify(value, null, 2)}</code>
          </pre>
        ),
        position: "bottom-right",
        classNames: {
          content: "flex flex-col gap-2",
        },
        style: {
          "--border-radius": "calc(var(--radius)  + 4px)",
        } as React.CSSProperties,
      });
    },
  });

  return (
    <main className="max-w-screen">
      <section
        className="min-h-screen"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200, 200, 200, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 200, 200, 0.15) 1px, transparent 1px)",
          backgroundSize: "90px 150px",
        }}
      >
        <div className="flex overflow-hidden items-center  h-full">
          <div className="flex flex-col gap-2 min-w-[35%] px-4 max-md: mt-24">
            <AnimatePresence>
              <motion.h1
                className="text-5xl md:text-6xl max-w-md"
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
                // initial={{ y: 100 }}
                // whileInView={{ y: 0 }}
                // transition={{ type: "spring", duration: 0.8 }}
                // viewport={{ once: true }}
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
        </div>

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

      <section id="waitlist" className="flex flex-col justify-center items-center mb-16">
        <div className="flex gap-1 bg-background w-full mb-1 border-t items-center justify-center py-5 overflow-hidden">
          <RollingCubeFeature />
        </div>

        <Card className="max-w-full  sm:min-w-sm sm:max-w-xl overflow-hidden">
          <CardHeader>
            <CardTitle>Join the wait list</CardTitle>
            <CardDescription>
              Be the first to know when we launch so you do not miss out on early perks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="waitlist-form"
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="flex flex-col gap-2"
            >
              <div className="flex *:flex-1 gap-1">
                <AnimatePresence>
                  <motion.div
                    initial={{ x: -100 }}
                    whileInView={{ x: 0 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    viewport={{ once: true }}
                  >
                    <form.Field name="firstname">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>First name</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            type="text"
                            placeholder="john"
                            value={field.state.value}
                          />
                          {field.state.meta.errors.map((error) => (
                            <p className="text-red-500" key={error?.message}>
                              {error?.message}
                            </p>
                          ))}
                        </div>
                      )}
                    </form.Field>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence>
                  <motion.div
                    initial={{ x: 100 }}
                    whileInView={{ x: 0 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    viewport={{ once: true }}
                  >
                    <form.Field name="lastname">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>Last name</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            type="text"
                            placeholder="doe"
                            value={field.state.value}
                          />
                          {field.state.meta.errors.map((error) => (
                            <p className="text-red-500" key={error?.message}>
                              {error?.message}
                            </p>
                          ))}
                        </div>
                      )}
                    </form.Field>
                  </motion.div>
                </AnimatePresence>
              </div>

              <AnimatePresence>
                <motion.div
                  className="flex flex-col gap-5"
                  initial={{ y: 100 }}
                  whileInView={{ y: 0 }}
                  transition={{ type: "spring", duration: 1 }}
                  viewport={{ once: true }}
                >
                  <form.Field name="email">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Email</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          type="email"
                          placeholder="johndoe@example.com"
                          inputMode="email"
                          value={field.state.value}
                        />
                        {field.state.meta.errors.map((error) => (
                          <p className="text-red-500" key={error?.message}>
                            {error?.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </form.Field>

                  <Button className="w-full sm:w-fit py-3 sm:px-16 sm: ml-auto">Join</Button>
                </motion.div>
              </AnimatePresence>
            </form>
          </CardContent>
        </Card>
      </section>

      <footer
        className="border-t py-12 flex items-center justify-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200, 200, 200, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 200, 200, 0.15) 1px, transparent 1px)",
          backgroundSize: "90px 150px",
        }}
      >
        <p className="flex gap-2 text-sm text-foreground/50">
          <CopyrightIcon /> {new Date().getFullYear()}, Dealort. All rights reserved
        </p>
      </footer>
    </main>
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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex-col gap-2 h-6 min-h-6" style={{ perspective: 80 }}>
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIdx}
          initial={{
            opacity: 0,
            rotateX: -90,
            y: 20,
          }}
          animate={{
            opacity: 1,
            rotateX: 0,
            y: 0,
            transition: {
              duration: 0.7,
              ease: "easeInOut",
            },
          }}
          exit={{
            opacity: 0,
            rotateX: 90,
            y: 20,
            transition: {
              duration: 0.7,
              ease: "easeInOut",
            },
          }}
          className="flex gap-0.5 text-xs text-foreground/60 items-center justify-center h-6 min-h-6 origin-bottom"
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
