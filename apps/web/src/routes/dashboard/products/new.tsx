import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, InfoIcon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxTrigger,
} from "@/components/ui/dice-combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
} from "@/components/ui/tags-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const X_URL_REGEX = /^[a-zA-Z0-9_]+$/;
const LINKEDIN_REGEX = /^[a-zA-Z0-9_-]+$/;

export const Route = createFileRoute("/dashboard/products/new")({
  component: RouteComponent,
});

const getStartedForm = z.object({
  url: z.string().url("Please enter a valid URL"),
  isDev: z.boolean(),
});

const productInformationForm = z
  .object({
    name: z.string("Type product name").max(40, "Product name is too long"),
    tagline: z.string("Type product name").max(60, "Product name is too long"),
    description: z
      .string()
      .max(600, "Description cannot exceed 600 characters"),
    category: z.array(z.string()),
    xUrl: z.string().refine((val) => val === "" || X_URL_REGEX.test(val), {
      message: "Please enter a valid X profile username",
    }),
    linkedinUrl: z
      .string()
      .optional()
      .refine((val) => !val || LINKEDIN_REGEX.test(val), {
        message: "Please enter a valid LinkedIn URL",
      }),
    // links: z
    //   .array(
    //     z.object({
    //       url: z.string().url("Please enter a valid URL"),
    //     })
    //   )
    //   .optional(),
    isOpenSource: z.boolean(),
    sourceCodeUrl: z
      .string()
      .url("Please enter a valid source code repository URL")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.isOpenSource) {
        return !!data.sourceCodeUrl && data.sourceCodeUrl !== "";
      }
      return true;
    },
    {
      message: "Source code link is required if the product is open source.",
      path: ["sourceCodeUrl"],
    }
  );

const productConfirmationForm = z.object({
  name: z.string("Type product name"),
});

// Full staff form schema
const productFormSchema = z.object({
  getStarted: getStartedForm,
  productInformation: productInformationForm,
  productConfirmation: productConfirmationForm,
});

// type NewProductForm = z.infer<typeof productFormSchema>;

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
      productInformation: {
        name: "",
        tagline: "",
        description: "",
        category: "",
        xUrl: "",
        linkedinUrl: "",
        isOpenSource: false,
        sourceCodeUrl: "https://",
      },
    },
    validators: {
      onSubmit: productFormSchema,
      onDynamic: productFormSchema
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
    formCollection[1]
  );
  const [isTransitioning, setIsTransitioning] = useState(false); // New state for loader
  const [isOpenSourced, setIsOpenSourced] = useState(false); // New state for loader

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

      if (formStep?.step === 2) {
        const isValid =
          form.state.fieldMeta["productInformation.name"].isValid &&
          form.state.fieldMeta["productInformation.tagline"].isValid &&
          form.state.fieldMeta["productInformation.description"].isValid &&
          form.state.fieldMeta["productInformation.category"].isValid &&
          form.state.fieldMeta["productInformation.xUrl"].isValid &&
          form.state.fieldMeta["productInformation.linkedinUrl"].isValid;

        console.log(
          form.runValidator()
          form.getFieldMeta("productInformation.name")?.isValid
        );

        // if (isValid) {
        //   setFormStep(formCollection[formStep.step]);
        // }
        // console.log(form.state.fieldMeta);
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
                        <Label
                          className="text-xs sm:text-sm"
                          htmlFor={field.name}
                        >
                          Product link
                        </Label>
                        <Input
                          id={field.name}
                          inputMode="url"
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="https://www.dealort.com"
                          type="url"
                          value={field.state.value}
                        />
                        {field.state.meta.errors.map((error) => (
                          <p
                            className="text-red-500 text-xs"
                            key={
                              (error as unknown as { message?: string })
                                ?.message
                            }
                          >
                            {
                              (error as unknown as { message?: string })
                                ?.message
                            }
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

            {formStep?.step === 2 && (
              <div>
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl sm:text-4xl">
                    Describe your project
                  </h1>
                  <p className="font-light text-xs sm:text-sm">
                    We need a concise information about your product
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-10">
                  <div className="flex flex-col gap-4">
                    <form.Field name="productInformation.name">
                      {(field) => (
                        <div className="space-y-2">
                          <TextField
                            inputType="input"
                            label="Name of Product"
                            maxLength={40}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => field.handleChange(e.target.value)}
                            placeholder="The name of the product you would launch "
                            value={field.state.value}
                          />

                          {field.state.meta.errors.map((error) => (
                            <p
                              className="text-red-500 text-xs"
                              key={
                                (error as unknown as { message?: string })
                                  ?.message
                              }
                            >
                              {
                                (error as unknown as { message?: string })
                                  ?.message
                              }
                            </p>
                          ))}
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="productInformation.tagline">
                      {(field) => (
                        <div className="space-y-2">
                          <TextField
                            infoTooltip="A short formal description"
                            inputType="input"
                            label="Tagline"
                            maxLength={60}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => field.handleChange(e.target.value)}
                            placeholder="The name of the product you would launch "
                            value={field.state.value}
                          />
                          {field.state.meta.errors.map((error) => (
                            <p
                              className="text-red-500 text-xs"
                              key={
                                (error as unknown as { message?: string })
                                  ?.message
                              }
                            >
                              {
                                (error as unknown as { message?: string })
                                  ?.message
                              }
                            </p>
                          ))}
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="productInformation.description">
                      {(field) => (
                        <div className="space-y-2">
                          <TextField
                            infoTooltip="Describe your project in detail, what it is all about and what makes you stand out from the crowd"
                            inputType="textarea"
                            label="Description"
                            maxLength={600}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => field.handleChange(e.target.value)}
                            placeholder="The name of the product you would launch "
                            value={field.state.value}
                          />
                          {field.state.meta.errors.map((error) => (
                            <p
                              className="text-red-500 text-xs"
                              key={
                                (error as unknown as { message?: string })
                                  ?.message
                              }
                            >
                              {
                                (error as unknown as { message?: string })
                                  ?.message
                              }
                            </p>
                          ))}
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="productInformation.category">
                      {(field) => (
                        <div className="space-y-2">
                          <CategoriesCombobox
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={field.handleChange}
                            value={field.state.value}
                          />

                          {field.state.meta.errors.map((error) => (
                            <p
                              className="text-red-500 text-xs"
                              key={
                                (error as unknown as { message?: string })
                                  ?.message
                              }
                            >
                              {
                                (error as unknown as { message?: string })
                                  ?.message
                              }
                            </p>
                          ))}
                        </div>
                      )}
                    </form.Field>
                  </div>

                  <hr className="border border-secondary" />

                  <div className="flex flex-col gap-2">
                    <h1 className="text-xl sm:text-3xl">Links</h1>

                    <div className="flex flex-col gap-7">
                      <form.Field name="productInformation.xUrl">
                        {(field) => (
                          <div className="space-y-2">
                            <Label
                              className="text-xs sm:text-sm"
                              htmlFor={field.name}
                            >
                              X account of the project
                            </Label>
                            <div className="flex items-center">
                              <span className="h-full rounded-s-lg border bg-sidebar px-1 py-2.5 text-xs shadow-sm">
                                x.com/@
                              </span>
                              <Input
                                className="rounded-s-none"
                                id={field.name}
                                inputMode="text"
                                name={field.name}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                placeholder="username"
                                type="text"
                                value={field.state.value}
                              />
                            </div>
                            {field.state.meta.errors.map((error) => (
                              <p
                                className="text-red-500 text-xs"
                                key={
                                  (error as unknown as { message?: string })
                                    ?.message
                                }
                              >
                                {
                                  (error as unknown as { message?: string })
                                    ?.message
                                }
                              </p>
                            ))}
                          </div>
                        )}
                      </form.Field>

                      <form.Field name="productInformation.linkedinUrl">
                        {(field) => (
                          <div className="space-y-2">
                            <Label
                              className="text-xs sm:text-sm"
                              htmlFor={field.name}
                            >
                              Linkedin (optional)
                            </Label>
                            <div className="flex items-center">
                              <span className="h-full rounded-s-lg border bg-sidebar px-1 py-2.5 text-xs shadow-sm">
                                linkedin.com/company/
                              </span>
                              <Input
                                className="rounded-s-none"
                                id={field.name}
                                inputMode="text"
                                name={field.name}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                placeholder="company-name"
                                type="text"
                                value={field.state.value}
                              />
                            </div>
                            {field.state.meta.errors.map((error) => (
                              <p
                                className="text-red-500 text-xs"
                                key={
                                  (error as unknown as { message?: string })
                                    ?.message
                                }
                              >
                                {
                                  (error as unknown as { message?: string })
                                    ?.message
                                }
                              </p>
                            ))}
                          </div>
                        )}
                      </form.Field>

                      <div className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-accent/50 has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950">
                        <form.Field name="productInformation.isOpenSource">
                          {(field) => (
                            <div className="flex w-full items-center space-x-2">
                              <Label className="flex w-full items-center gap-1 *:text-light">
                                <Checkbox
                                  checked={field.state.value}
                                  className="h-4 w-4"
                                  id={field.name}
                                  name={field.name}
                                  onCheckedChange={(checked) => {
                                    field.handleChange(checked === true);
                                    setIsOpenSourced(checked === true);
                                  }}
                                />

                                <div className="flex flex-col gap-1">
                                  <p className="text-sm">
                                    is project open source?
                                  </p>
                                </div>
                              </Label>
                            </div>
                          )}
                        </form.Field>

                        {isOpenSourced && (
                          <form.Field name="productInformation.sourceCodeUrl">
                            {(field) => (
                              <div className="space-y-2">
                                <Label
                                  className="font-extralight text-xs"
                                  htmlFor={field.name}
                                >
                                  Github, Gitlab or Bitbucket
                                </Label>
                                <Input
                                  id={field.name}
                                  inputMode="url"
                                  name={field.name}
                                  onBlur={field.handleBlur}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                  placeholder="https://www.dealort.com"
                                  type="url"
                                  value={field.state.value}
                                />
                                {field.state.meta.errors.map((error) => (
                                  <p
                                    className="text-red-500 text-xs"
                                    key={
                                      (error as unknown as { message?: string })
                                        ?.message
                                    }
                                  >
                                    {
                                      (error as unknown as { message?: string })
                                        ?.message
                                    }
                                  </p>
                                ))}
                              </div>
                            )}
                          </form.Field>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div>
              <Button
                className="mt-4 size-fit w-full rounded-full px-16"
                disabled={isTransitioning}
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

interface TextFieldProps
  extends React.HTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  name: string;
  maxLength?: number;
  placeholder: string;
  value: string;
  helperText?: string;
  className?: string;
  infoTooltip?: string;
  inputType: "input" | "textarea";
}

export function TextField({
  label,
  name,
  maxLength,
  placeholder,
  helperText,
  className = "",
  infoTooltip,
  value,
  inputType = "input",
  ...props
}: TextFieldProps) {
  return (
    <div className={`mb-4 w-full ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-px">
          <Label
            className="mb-1 block text-foreground text-xs sm:text-sm"
            htmlFor={name}
          >
            {label}
            {/* {required ? <span className="text-destructive">*</span> : null} */}
          </Label>

          {infoTooltip && (
            <Tooltip>
              <TooltipTrigger className="size-fit [&>svg]:size-3">
                <InfoIcon />
              </TooltipTrigger>
              <TooltipContent>{infoTooltip}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-1">
          {maxLength != null && (
            <span className="text-muted-foreground text-xs">
              {value?.length ?? 0}/{maxLength}
            </span>
          )}
        </div>
      </div>

      {inputType === "input" && (
        <Input
          className="w-full rounded border border-border px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1"
          id={name}
          inputMode="text"
          maxLength={maxLength}
          name={name}
          placeholder={placeholder}
          value={value}
          {...props}
        />
      )}

      {inputType === "textarea" && (
        <Textarea
          className="w-full rounded border border-border px-3 py-2 text-sm"
          id={name}
          inputMode="text"
          maxLength={maxLength}
          name={name}
          placeholder={placeholder}
          value={value}
          {...props}
        />
      )}
      {helperText && (
        <div className="mt-1 text-muted-foreground text-xs">{helperText}</div>
      )}
    </div>
  );
}

export const categories: string[] = [
  "AI",
  "SaaS",
  "Web App",
  "Mobile App",
  "Productivity",
  "Developer Tools",
  "Open Source",
  "E-commerce",
  "Fintech",
  "HealthTech",
  "EdTech",
  "Marketing",
  "Design",
  "Gaming",
  "Cybersecurity",
  "IoT",
  "Blockchain",
  "Hardware",
  "Social",
  "Cloud",
  "Analytics",
  "VR/AR",
  "Marketplace",
  "Remote Work",
  "API",
  "No-Code",
];

interface ComboboxFieldProps {
  name: string;
  value: string[];
  onChange: (value: string[]) => void;
  onBlur: () => void;
  className?: string;
}

export function CategoriesCombobox({
  name,
  onChange,
  onBlur,
}: ComboboxFieldProps) {
  const [currentValue, setCurrentValue] = useState<string[]>([]);

  useEffect(() => {
    onChange(currentValue);
  }, [currentValue, onChange]);

  return (
    <Combobox multiple onValueChange={setCurrentValue} value={currentValue}>
      <ComboboxLabel className="pt-0 font-medium text-xs sm:text-sm">
        Categories
      </ComboboxLabel>
      <ComboboxAnchor asChild>
        <TagsInput
          className="relative flex h-full min-h-10 w-full flex-row flex-wrap items-center justify-start gap-1.5 px-2.5 py-2"
          name={name}
          onBlur={onBlur}
          onValueChange={setCurrentValue}
          value={currentValue}
        >
          {currentValue.map((item) => (
            <TagsInputItem key={item} value={item}>
              {item}
            </TagsInputItem>
          ))}
          <ComboboxInput asChild className="h-fit flex-1 p-0">
            <TagsInputInput placeholder="Categories..." />
          </ComboboxInput>
          <ComboboxTrigger className="absolute top-2.5 right-2">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </ComboboxTrigger>
        </TagsInput>
      </ComboboxAnchor>
      <ComboboxContent className="max-h-52 overflow-y-auto" sideOffset={5}>
        <ComboboxEmpty>No category found.</ComboboxEmpty>
        <ComboboxGroup>
          <ComboboxGroupLabel>Category</ComboboxGroupLabel>
          {categories.map((category) => (
            <ComboboxItem key={category} outset value={category}>
              {category}
            </ComboboxItem>
          ))}
        </ComboboxGroup>
      </ComboboxContent>
    </Combobox>
  );
}
