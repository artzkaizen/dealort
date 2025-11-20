import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronDown, InfoIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
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
  ComboboxTrigger,
} from "@/components/ui/dice-combobox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperNext,
  StepperPrev,
  type StepperProps,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
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

const URL_REGEX =
  /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
const X_URL_REGEX =
  /^(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/)([A-Za-z0-9_]{1,15})$/i;

export const Route = createFileRoute("/dashboard/products/new")({
  component: RouteComponent,
});

const getStartedForm = z.object({
  url: z.url("Please enter a valid URL"),
  isDev: z.boolean(),
});

const productInformationForm = z
  .object({
    name: z
      .string()
      .min(1, "Type product name")
      .max(40, "Product name is too long"),
    tagline: z.string().min(1, "Type tagline").max(60, "Tagline is too long"),
    description: z
      .string()
      .min(1, "Type description")
      .max(600, "Description cannot exceed 600 characters"),
    category: z.array(z.string()).min(1, "Please select at least one category"),
    xUrl: z.url("Please input x username").refine(
      (val) => {
        console.log(val);
        return !val || X_URL_REGEX.test(val);
      },
      {
        message: "Please enter a valid LinkedIn username",
      }
    ),
    linkedinUrl: z
      .string()
      .refine((val) => !val || URL_REGEX.test(val), {
        message: "Please enter a valid LinkedIn company name",
      })
      .or(z.literal("")),
    isOpenSource: z.boolean(),
    sourceCodeUrl: z
      .url("Please enter a valid source code repository URL")
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

const createProductConfirmationForm = (productName: string) =>
  z.object({
    name: z
      .string()
      .min(1, "Type product name")
      .refine((val) => val === productName, {
        message: "Product name does not match",
      }),
  });

// Full form schema - note: confirmation validation is dynamic
const productFormSchema = z.object({
  getStarted: getStartedForm,
  productInformation: productInformationForm,
  productConfirmation: z.object({
    name: z.string().min(1, "Type product name"),
  }),
});

type NewProductForm = z.infer<typeof productFormSchema>;

// const formCollection = [
//   {
//     key: "get started",
//     step: 1,
//   },
//   {
//     key: "product information",
//     step: 2,
//   },
//   {
//     key: "product confirmation",
//     step: 3,
//   },
// ] as const;

const formSteps = [
  {
    value: "get-started",
    title: "Get Started",
    description: "Provide a concise information about your project",
    fields: ["getStarted.url", "getStarted.isDev"] as const,
  },
  {
    value: "product-information",
    title: "Product Information",
    description: "Details about your products",
    fields: [
      "productInformation.name",
      "productInformation.tagline",
      "productInformation.description",
      "productInformation.category",
      "productInformation.xUrl",
      "productInformation.linkedinUrl",
      "productInformation.isOpenSource",
      "productInformation.sourceCodeUrl",
    ] as const,
  },
  {
    value: "review",
    title: "Review",
    description: "Review your information",
    fields: [] as const,
  },
] as const;

function RouteComponent() {
  const form = useForm<NewProductForm>({
    defaultValues: {
      getStarted: {
        url: "https://",
        isDev: false,
      },
      productInformation: {
        name: "",
        tagline: "",
        description: "",
        category: [] as string[],
        xUrl: "",
        linkedinUrl: "",
        isOpenSource: false,
        sourceCodeUrl: "https://",
      },
      productConfirmation: {
        name: "",
      },
    },
    resolver: zodResolver(productFormSchema),
  });

  const [step, setStep] = useState("get-started");
  const stepIndex = formSteps.findIndex(
    (currentStep) => currentStep.value === step
  );

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isOpenSourced, setIsOpenSourced] = useState(false);

  // Validate current step before proceeding
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      // Validate getStarted section
      const result = getStartedForm.safeParse(form.state.values.getStarted);
      if (!result.success) {
        // Trigger validation errors
        form.validateAllFields("change");
        form.handleSubmit();

        return false;
      }
      return true;
    }

    if (step === 2) {
      // Validate productInformation section
      const result = productInformationForm.safeParse(
        form.state.values.productInformation
      );

      if (!result.success) {
        // Trigger validation errors
        form.validateAllFields("change");
        form.handleSubmit();

        return false;
      }
      return true;
    }

    if (step === 3) {
      // Validate productConfirmation section
      const productName = form.state.values.productInformation.name;
      const confirmationSchema = createProductConfirmationForm(productName);
      const result = confirmationSchema.safeParse(
        form.state.values.productConfirmation
      );
      if (!result.success) {
        // Trigger validation to show errors
        form.validateAllFields("change");
        return false;
      }
      return true;
    }

    return false;
  };

  const onValidate: NonNullable<StepperProps["onValidate"]> = useCallback(
    async (_value, direction) => {
      if (direction === "prev") return true;

      const stepData = formSteps.find(
        (currentStep) => currentStep.value === step
      );

      if (!stepData) return true;
      const isValid = await form.trigger(stepData.fields);
      console.log(isValid);

      if (!isValid) {
        toast.info("Please complete all required fields to continue");
      }

      return isValid;
    },
    [form, step]
  );

  const onSubmit = (value: NewProductForm) => {
    toast("You submitted the following values:", {
      description: (
        <pre className="mt-2 w-[320px] overflow-x-auto rounded-md bg-code p-4 text-code-foreground">
          <code>{JSON.stringify(value, null, 2)}</code>
        </pre>
      ),
    });
  };

  const handleProceed = () => {
    if (!formStep) return;

    setIsTransitioning(true);
    try {
      const isValid = validateStep(formStep.step);

      // setFormStep();

      if (isValid) {
        if (formStep.step < formCollection.length) {
          setFormStep(formCollection[formStep.step]);
        }
      } else {
        // Show error toast if validation fails
        toast.error("Please fix the errors before proceeding", {
          position: "bottom-right",
        });
      }
    } finally {
      setIsTransitioning(false);
    }
  };

  const handlePrevious = () => {
    if (formStep && formStep.step > 1) {
      setFormStep(formCollection[formStep.step - 2]);
    }
  };

  return (
    <main className="min-h-screen gap-0">
      <section className="min-h-screen">
        {/* <div className="sticky top-14 flex min-h-10 items-center justify-end border-t *:font-light">
          <div className="flex size-fit items-center gap-1 bg-sidebar px-2 py-3 *:text-xs">
            {formStep && formStep.step > 1 && (
              <Button
                aria-label="previous form"
                onClick={handlePrevious}
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
        </div> */}

        <div className="flex flex-col gap-2 px-2 py-3">
          <Form {...form}>
            <form
              className="mt-4 flex flex-col gap-2"
              id="new-product-form"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <Stepper
                onValidate={onValidate}
                onValueChange={setStep}
                orientation="vertical"
                value={step}
              >
                <StepperList>
                  {formSteps.map((step) => (
                    <StepperItem key={step.value} value={step.value}>
                      <StepperTrigger className="not-last:pb-6">
                        <StepperIndicator />
                        <div className="flex flex-col gap-1">
                          <StepperTitle>{step.title}</StepperTitle>
                          <StepperDescription>
                            {step.description}
                          </StepperDescription>
                        </div>
                      </StepperTrigger>
                      <StepperSeparator className="-order-1 -translate-x-1/2 -z-10 absolute inset-y-0 top-5 left-3.5 h-full" />
                    </StepperItem>
                  ))}
                </StepperList>

                <div className="flex flex-col space-y-8">
                  <StepperContent
                    className="flex max-w-md flex-col gap-2"
                    value="get-started"
                  >
                    <h1 className="text-3xl sm:text-4xl">Submit a product</h1>
                    <p className="font-light text-xs sm:text-sm">
                      Have you stumbled upon something awesome? Or maybe you've
                      been working hard on your own creation? You've landed in
                      the right spot to spread the news! Take a deep breath and
                      jump into the steps.
                    </p>

                    <FieldGroup className="mt-5">
                      <FormField
                        control={form.control}
                        name="getStarted.url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link to product</FormLabel>
                            <FormControl>
                              <InputGroup>
                                <InputGroupAddon>
                                  <InputGroupText>https://</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                  className="pl-0.5!"
                                  id={field.name}
                                  inputMode="url"
                                  onBlur={field.onBlur}
                                  onChange={(e) =>
                                    field.onChange(`https://${e.target.value}`)
                                  }
                                  placeholder="dealort"
                                />
                                {/* <InputGroupAddon align="inline-end">
                                  <InputGroupText>.com</InputGroupText>
                                </InputGroupAddon> */}
                              </InputGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="getStarted.isDev"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="cursor-pointer rounded-lg border p-3 font-normal hover:bg-accent/50 has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  className="h-4 w-4"
                                  id={field.name}
                                  name={field.name}
                                  onCheckedChange={(checked) =>
                                    field.onChange(checked === true)
                                  }
                                />
                              </FormControl>

                              <div className="flex flex-col gap-1">
                                <p className="text-sm">
                                  is this product still in development?
                                </p>
                                <FieldDescription className="font-light text-xs">
                                  Check the box if your product is not a fully
                                  production ready software.
                                </FieldDescription>
                              </div>
                            </FormLabel>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FieldGroup>
                  </StepperContent>

                  <StepperContent
                    className="flex max-w-md flex-col gap-2"
                    value="product-information"
                  >
                    <div className="flex flex-col gap-2">
                      <h1 className="text-xl sm:text-2xl">
                        Describe your project
                      </h1>
                      <p className="font-light text-xs sm:text-sm">
                        We need a concise information about your product
                      </p>
                    </div>

                    <FieldGroup className="mt-6">
                      <FieldSet>
                        <FormField
                          control={form.control}
                          name="productInformation.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <TextField
                                  inputType="input"
                                  label="Name of Product"
                                  maxLength={40}
                                  name={field.name}
                                  onBlur={field.onBlur}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) => field.onChange(e.target.value)}
                                  placeholder="The name of the product you would launch "
                                  value={field.value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="productInformation.tagline"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <TextField
                                  inputType="input"
                                  label="Tagline"
                                  maxLength={60}
                                  name={field.name}
                                  onBlur={field.onBlur}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) => field.onChange(e.target.value)}
                                  placeholder="A short intro about your project"
                                  value={field.value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="productInformation.description"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <TextField
                                  infoTooltip="Describe your project in detail, what it is all about and what makes you stand out from the crowd"
                                  inputType="textarea"
                                  label="Description"
                                  maxLength={600}
                                  name={field.name}
                                  onBlur={field.onBlur}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) => field.onChange(e.target.value)}
                                  placeholder="Describe your product in details (use formal tone devoid of stickers and emojis)"
                                  value={field.value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="productInformation.category"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <CategoriesCombobox
                                  name={field.name}
                                  onBlur={field.onBlur}
                                  onChange={(value) => field.onChange(value)}
                                  value={field.value}
                                />
                              </FormControl>
                              <FormMessage className="mt-4" />
                            </FormItem>
                          )}
                        />
                      </FieldSet>
                      <FieldSeparator />

                      <FieldSet>
                        <FieldLegend className="text-xl sm:text-3xl">
                          Links
                        </FieldLegend>

                        <FormField
                          control={form.control}
                          name="productInformation.xUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel
                                className="text-xs sm:text-sm"
                                htmlFor={field.name}
                              >
                                X account of the project
                              </FormLabel>
                              <FormControl>
                                <InputGroup>
                                  <InputGroupAddon>
                                    <InputGroupText>x.com/</InputGroupText>
                                  </InputGroupAddon>
                                  <InputGroupInput
                                    className="pl-0.5!"
                                    id={field.name}
                                    inputMode="text"
                                    name={field.name}
                                    onBlur={field.onBlur}
                                    onChange={(e) =>
                                      field.onChange(
                                        `https://x.com/${e.target.value}`
                                      )
                                    }
                                    placeholder="dealort"
                                  />
                                </InputGroup>
                              </FormControl>
                              <FormMessage className="mt-4" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="productInformation.linkedinUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel
                                className="text-xs sm:text-sm"
                                htmlFor={field.name}
                              >
                                Linkedin (optional)
                              </FormLabel>
                              <FormControl>
                                <InputGroup>
                                  <InputGroupAddon>
                                    <InputGroupText>
                                      linkedin.com/company/
                                    </InputGroupText>
                                  </InputGroupAddon>
                                  <InputGroupInput
                                    className="pl-0.5!"
                                    id={field.name}
                                    inputMode="text"
                                    name={field.name}
                                    onBlur={field.onBlur}
                                    onChange={(e) =>
                                      field.onChange(
                                        `https://linkedin.com/company/${e.target.value}`
                                      )
                                    }
                                    placeholder="dealort"
                                  />
                                </InputGroup>
                              </FormControl>
                              <FormMessage className="mt-4" />
                            </FormItem>
                          )}
                        />

                        <Field className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-accent/50 has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950">
                          <FormField
                            control={form.control}
                            name="productInformation.isOpenSource"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="cursor-pointer rounded-lg border p-3 font-normal hover:bg-accent/50 has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      className="h-4 w-4"
                                      id={field.name}
                                      name={field.name}
                                      onCheckedChange={(checked) => {
                                        setIsOpenSourced(checked === true);
                                        field.onChange(checked === true);
                                      }}
                                    />
                                  </FormControl>

                                  <div className="flex flex-col gap-1">
                                    <p className="text-sm">
                                      is this product still in development?
                                    </p>
                                    <FieldDescription className="font-light text-xs">
                                      Check the box if your product is not a
                                      fully production ready software.
                                    </FieldDescription>
                                  </div>
                                </FormLabel>
                              </FormItem>
                            )}
                          />

                          {isOpenSourced && (
                            <FormField
                              control={form.control}
                              name="productInformation.sourceCodeUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-extralight">
                                    Github, Gitlab, Bitbucket...
                                  </FormLabel>
                                  <FormControl>
                                    <InputGroup>
                                      <InputGroupAddon>
                                        <InputGroupText>
                                          https://
                                        </InputGroupText>
                                      </InputGroupAddon>
                                      <InputGroupInput
                                        className="pl-0.5!"
                                        id={field.name}
                                        inputMode="url"
                                        onBlur={field.onBlur}
                                        onChange={(e) =>
                                          field.onChange(
                                            `https://${e.target.value}`
                                          )
                                        }
                                        placeholder="repository remote url"
                                      />
                                    </InputGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </Field>
                      </FieldSet>
                    </FieldGroup>
                  </StepperContent>

                  <div className="mt-4 flex justify-between">
                    <StepperPrev asChild>
                      <Button variant="outline">
                        <ArrowLeft />
                      </Button>
                    </StepperPrev>
                    <div className="text-muted-foreground text-sm">
                      Step {stepIndex + 1} of {formSteps.length}
                    </div>
                    {stepIndex === formSteps.length - 1 ? (
                      <Button type="submit">Complete</Button>
                    ) : (
                      <StepperNext asChild>
                        <Button>
                          <ArrowRight />
                        </Button>
                      </StepperNext>
                    )}
                  </div>
                </div>

                {/* {formStep?.step === 2 && (
              <div>
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl sm:text-4xl">
                    Describe your project
                  </h1>
                  <p className="font-light text-xs sm:text-sm">
                    We need a concise information about your product
                  </p>
                </div>

                <FieldGroup className="mt-6">
                

                  <FieldSeparator />

                  <FieldSet>
                    <FieldLegend className="text-xl sm:text-3xl">
                      Links
                    </FieldLegend>
                    <FieldGroup>
                      <form.Field name="productInformation.xUrl">
                        {(field) => (
                          <Field
                            data-invalid={field.state.meta.errors.length > 0}
                          >
                            <FieldLabel
                              className="text-xs sm:text-sm"
                              htmlFor={field.name}
                            >
                              X account of the project
                            </FieldLabel>

                            <InputGroup>
                              <InputGroupAddon>
                                <InputGroupText>x.com/</InputGroupText>
                              </InputGroupAddon>
                              <InputGroupInput
                                aria-invalid={
                                  field.state.meta.errors.length > 0
                                }
                                className="pl-0.5!"
                                id={field.name}
                                inputMode="text"
                                name={field.name}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(
                                    `https://x.com/${e.target.value}`
                                  )
                                }
                                placeholder="dealort"
                              />
                            </InputGroup>
                            <FieldError errors={field.state.meta.errors} />
                          </Field>
                        )}
                      </form.Field>

                      <form.Field name="productInformation.linkedinUrl">
                        {(field) => (
                          <Field
                            data-invalid={field.state.meta.errors.length > 0}
                          >
                            <FieldLabel
                              className="text-xs sm:text-sm"
                              htmlFor={field.name}
                            >
                              Linkedin (optional)
                            </FieldLabel>

                            <InputGroup>
                              <InputGroupAddon>
                                <InputGroupText>
                                  linkedin.com/company/
                                </InputGroupText>
                              </InputGroupAddon>
                              <InputGroupInput
                                aria-invalid={
                                  field.state.meta.errors.length > 0
                                }
                                className="pl-0.5!"
                                id={field.name}
                                inputMode="text"
                                name={field.name}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(
                                    `https://linkedin.com/company/${e.target.value}`
                                  )
                                }
                                placeholder="dealort"
                              />
                            </InputGroup>
                            <FieldError errors={field.state.meta.errors} />
                          </Field>
                        )}
                      </form.Field>

                      <Field className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-accent/50 has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950">
                        <form.Field name="productInformation.isOpenSource">
                          {(field) => (
                            <Field orientation="horizontal">
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
                              <FieldLabel
                                className="font-normal"
                                htmlFor={field.name}
                              >
                                is project open source?
                              </FieldLabel>
                            </Field>
                          )}
                        </form.Field>

                        {isOpenSourced && (
                          <form.Field name="productInformation.sourceCodeUrl">
                            {(field) => (
                              <Field
                                data-invalid={
                                  field.state.meta.errors.length > 0
                                }
                              >
                                <FieldLabel
                                  className="font-extralight text-xs"
                                  htmlFor={field.name}
                                >
                                  Github, Gitlab or Bitbucket
                                </FieldLabel>
                                <InputGroup>
                                  <InputGroupAddon>
                                    <InputGroupText>https://</InputGroupText>
                                  </InputGroupAddon>
                                  <InputGroupInput
                                    aria-invalid={
                                      field.state.meta.errors.length > 0
                                    }
                                    className="pl-0.5!"
                                    id={field.name}
                                    inputMode="text"
                                    name={field.name}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                      field.handleChange(
                                        `https://${e.target.value}`
                                      )
                                    }
                                    placeholder="dealort"
                                  />
                                </InputGroup>
                                <FieldError errors={field.state.meta.errors} />
                              </Field>
                            )}
                          </form.Field>
                        )}
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </FieldGroup>
              </div>
            )}

            {formStep?.step === 3 && (
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl sm:text-4xl">
                  Confirm your submission
                </h1>
                <p className="font-light text-xs sm:text-sm">
                  Please review your information before submitting. You can go
                  back to make changes if needed.
                </p>

                <div className="mt-6 flex flex-col gap-6">
                  <div className="flex flex-col gap-4 rounded-lg border p-4">
                    <h2 className="font-semibold text-lg">Product Details</h2>
                    <div className="flex flex-col gap-2 text-sm">
                      <div>
                        <span className="font-medium">Name: </span>
                        <span>{form.state.values.productInformation.name}</span>
                      </div>
                      <div>
                        <span className="font-medium">Tagline: </span>
                        <span>
                          {form.state.values.productInformation.tagline}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Description: </span>
                        <span>
                          {form.state.values.productInformation.description}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Categories: </span>
                        <span>
                          {form.state.values.productInformation.category.join(
                            ", "
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 rounded-lg border p-4">
                    <h2 className="font-semibold text-lg">Links</h2>
                    <div className="flex flex-col gap-2 text-sm">
                      <div>
                        <span className="font-medium">Product URL: </span>
                        <span>{form.state.values.getStarted.url}</span>
                      </div>
                      <div>
                        <span className="font-medium">X Account: </span>
                        <span>
                          {form.state.values.productInformation.xUrl
                            ? `x.com/@${form.state.values.productInformation.xUrl}`
                            : "Not provided"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">LinkedIn: </span>
                        <span>
                          {form.state.values.productInformation.linkedinUrl
                            ? `linkedin.com/company/${form.state.values.productInformation.linkedinUrl}`
                            : "Not provided"}
                        </span>
                      </div>
                      {form.state.values.productInformation.isOpenSource && (
                        <div>
                          <span className="font-medium">Source Code: </span>
                          <span>
                            {form.state.values.productInformation.sourceCodeUrl}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 rounded-lg border p-4">
                    <h2 className="font-semibold text-lg">Additional Info</h2>
                    <div className="flex flex-col gap-2 text-sm">
                      <div>
                        <span className="font-medium">In Development: </span>
                        <span>
                          {form.state.values.getStarted.isDev ? "Yes" : "No"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Open Source: </span>
                        <span>
                          {form.state.values.productInformation.isOpenSource
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <form.Field name="productConfirmation.name">
                    {(field) => (
                      <Field data-invalid={field.state.meta.errors.length > 0}>
                        <FieldLabel
                          className="text-xs sm:text-sm"
                          htmlFor={field.name}
                        >
                          Type the product name to confirm
                        </FieldLabel>
                        <Input
                          aria-invalid={field.state.meta.errors.length > 0}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={
                            form.state.values.productInformation.name
                          }
                          type="text"
                          value={field.state.value}
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    )}
                  </form.Field>
                </div>
              </div>
            )} */}

                {/* <div>
                <Button
                  className="mt-4 size-fit w-full rounded-full px-16"
                  disabled={isTransitioning}
                  onClick={
                    formStep?.step === 3
                      ? () => form.handleSubmit()
                      : handleProceed
                  }
                  type={formStep?.step === 3 ? "submit" : "button"}
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
              </div> */}
              </Stepper>
            </form>
          </Form>
        </div>
      </section>

      {/* <aside
        className="col-span-2 hidden items-center justify-center overflow-x-hidden bg-sidebar bg-size-[22px_32px] md:flex"
        style={{
          backgroundImage:
            "linear-gradient(rgba(128,128,128,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.12) 1px, transparent 1px)",
        }}
      >
        <h1 className="text-8xl text-foreground opacity-5">Dealort</h1>
      </aside> */}
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
    <div className={`w-full ${className}`}>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-px">
          <FieldLabel
            className="text-foreground text-xs sm:text-sm"
            htmlFor={name}
          >
            {label}
            {/* {required ? <span className="text-destructive">*</span> : null} */}
          </FieldLabel>

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
        <FieldDescription className="mt-1 text-xs">
          {helperText}
        </FieldDescription>
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

  // useEffect(() => {
  //   onChange(currentValue);
  // }, [currentValue, onChange]);

  return (
    <Combobox multiple onValueChange={setCurrentValue} value={currentValue}>
      <FieldLabel className="pt-0 font-medium text-xs sm:text-sm">
        Categories
      </FieldLabel>
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
