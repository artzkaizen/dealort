import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/dashboard/products/new")({
  component: RouteComponent,
});

const getStartedForm = z.object({
  url: z.string().url("Please enter a valid URL"),
  isDev: z.boolean(),
});

const productInformationForm = z.object({
  name: z.string("Type product name"),
});

const productConfirmationForm = z.object({
  name: z.string("Type product name"),
});

// Full staff form schema
const productFormSchema = z.object({
  getStarted: getStartedForm,
  productInformation: productInformationForm,
  productConfirmation: productConfirmationForm,
});

type NewProductForm = z.infer<typeof productFormSchema>;

const formCollection = [
  {
    key: "get started" as const,
    step: 1,
  },
  {
    key: "product information" as const,
    step: 2,
  },
  {
    key: "product confirmation" as const,
    step: 3,
  },
];
type FormStep = (typeof formCollection)[number];

function RouteComponent() {
  const form = useForm({
    defaultValues: {
      getStarted: {
        url: "https://",
        isDev: false,
      },
    },
    validators: {
      onSubmit: productFormSchema,
    },

    onSubmit: ({ value }) => {
      toast("You submitted the following values:", {
        description: (
          <pre className="mt-2 w-[320px] overflow-x-auto rounded-md bg-code p-4 text-code-foreground">
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

  const [formStep, setFormStep] = useState<FormStep | undefined>(
    formCollection[0]
  );
  const [isTransitioning, setIsTransitioning] = useState(false); // New state for loader

  console.log(form.fieldInfo.getStarted);

  const handleProceed = () => {
    setIsTransitioning(true);
    try {
      if (formStep?.step === 1) {
        const isValid =
          form.state.fieldMeta["getStarted.url"].isValid &&
          form.state.fieldMeta["getStarted.isDev"].isValid;

        if (isValid) {
          setFormStep(formCollection[formStep.step]);
        }
        console.log(isValid);
      }
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-5 gap-0">
      <section className="col-span-5 min-h-screen md:col-span-3">
        <div className="sticky top-14 flex min-h-10 items-center justify-end border-t *:font-light">
          <div className="flex size-fit items-center gap-1 bg-sidebar px-2 py-3 *:text-xs">
            {formStep && formStep.step > 1 && (
              <Button
                aria-label="previous form"
                onClick={() => {
                  if (formStep.step > 1) {
                    setFormStep(formCollection[formStep.step - 2]);
                  }
                }}
                size="sm"
                variant={"outline"}
              >
                <ArrowLeft />
              </Button>
            )}
            <span>
              {formStep?.step}/{formCollection.length}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-2 py-3">
          <form
            className="mt-4 flex flex-col gap-2 sm:max-w-sm"
            id="new-product-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            {formStep?.step === 1 && (
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl sm:text-4xl">Submit a product</h1>
                <p className="font-light text-xs sm:text-sm">
                  Have you stumbled upon something awesome? Or maybe you've been
                  working hard on your own creation? You've landed in the right
                  spot to spread the news! Take a deep breath and jump into the
                  steps.
                </p>

                <div className="mt-5 flex flex-col gap-4">
                  <form.Field name="getStarted.url">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Product link</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="https://www.dealort.com"
                          type="text"
                          value={field.state.value}
                        />
                        {field.state.meta.errors.map((error) => (
                          <p
                            className="text-red-500 text-xs"
                            key={error?.message}
                          >
                            {error?.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="getStarted.isDev">
                    {(field) => (
                      <div className="flex w-full items-center space-x-2">
                        <Label className="flex w-full items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950">
                          <Checkbox
                            checked={field.state.value}
                            className="h-4 w-4"
                            id={field.name}
                            name={field.name}
                            onCheckedChange={(checked) =>
                              field.handleChange(checked === true)
                            }
                          />

                          <div className="flex flex-col gap-1">
                            <p className="text-sm">
                              is this product still in development?
                            </p>
                            <p className="font-light text-xs">
                              Check the box if your product is not a fully
                              production ready software.
                            </p>
                          </div>
                        </Label>
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            )}

            <div>
              <Button
                className="mt-4 size-fit w-full rounded-full px-16"
                disabled={false}
                onClick={handleProceed}
                type={formStep?.step === 1 ? "submit" : "button"}
              >
                {(() => {
                  if (isTransitioning) {
                    return "Loading...";
                  }
                  if (formStep && formStep.step < 3) {
                    return "Next";
                  }
                  return "Submit";
                })()}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <aside
        className="col-span-2 hidden items-center justify-center overflow-x-hidden bg-sidebar bg-size-[22px_32px] md:flex"
        style={{
          backgroundImage:
            "linear-gradient(rgba(128,128,128,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.12) 1px, transparent 1px)",
        }}
      >
        <h1 className="text-8xl text-foreground opacity-5">Dealort</h1>
      </aside>
    </main>
  );
}
