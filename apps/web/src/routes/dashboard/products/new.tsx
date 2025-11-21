import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  CloudUploadIcon,
  ExternalLinkIcon,
  InfoIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
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
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
} from "@/components/ui/file-field";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
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

const PROTOCOL_REGEX = /^https?:\/\//i;
const DOMAIN_EXTENSION_REGEX = /\.[a-zA-Z]{2,}/;
const URL_REGEX =
  /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
const X_URL_REGEX =
  /^(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/)([A-Za-z0-9_]{1,15})$/i;
const acceptedFormats = ["image/jpg", "image/jpeg", "image/png"];

const getImageDimensions = (
  file: File | Blob
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url); // Clean up the object URL
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for dimension check."));
    };

    img.src = url;
  });
};

export const Route = createFileRoute("/dashboard/products/new")({
  component: RouteComponent,
});

const getStartedForm = z.object({
  url: z
    .string({
      message: "URL is required.",
    })
    .refine((val) => !PROTOCOL_REGEX.test(val), {
      message:
        "Please enter only the website address (e.g., company.com) and not the full URL starting with https://",
    })
    .refine((val) => !val || DOMAIN_EXTENSION_REGEX.test(val), {
      message: "Please include a domain extension (e.g., .com, .org).",
    })
    .transform((val) => {
      if (!val) {
        return val;
      }
      return `https://${val}`;
    })
    .pipe(
      z.url({
        message: "Please enter a valid URL (e.g., example.com)",
      })
    ),
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
    xUrl: z
      .string()
      .refine((val) => !PROTOCOL_REGEX.test(val), {
        message:
          "Please enter only the username (e.g., username) and not the full URL.",
      })
      .transform((val) => {
        if (!val) {
          return val;
        }
        // Assuming a clean username is now prepended
        return `https://x.com/${val}`;
      })
      .pipe(z.url("Please input a valid X/Twitter username."))
      .refine(
        (val) => !val || X_URL_REGEX.test(val), // X_URL_REGEX must check for the full 'https://x.com/username' format
        {
          message: "Please enter a valid X/Twitter username format.",
        }
      ),
    linkedinUrl: z
      .string()
      .refine((val) => !PROTOCOL_REGEX.test(val), {
        message:
          "Please enter only the company path (e.g., company-name) and not the full URL.",
      })
      .transform((val) => {
        if (!val) {
          return val;
        }
        return `https://www.linkedin.com/company/${val}`;
      })
      .pipe(z.url("Please enter a valid LinkedIn company path."))
      .or(z.literal("")),

    isOpenSource: z.boolean(),
    sourceCodeUrl: z
      .string()
      .refine((val) => !(val && PROTOCOL_REGEX.test(val)), {
        message:
          "Please enter only the domain and path (e.g., github.com/user/repo), not a full URL starting with https://.",
      })
      .transform((val) => {
        if (!val) {
          return val;
        }
        return `https://${val}`;
      })
      .pipe(
        z.union([
          z.literal(""), // Explicitly allow the empty string
          z.url({
            message: "Please enter a valid source code URL.",
          }),
        ])
      )
      .refine((val) => !val || URL_REGEX.test(val), {
        message:
          "Please enter a valid source code link (must include domain and path).",
      })
      .optional(),
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

const mediaForm = z.object({
  logo: z
    .array(z.custom<File>())
    .min(1, "Please select at least one file")
    .max(1, "Please select only one file")
    .refine((files) => files.every((file) => file.size <= 3 * 1024 * 1024), {
      message: "File size must be less than 3MB",
      path: ["logo"],
    })
    .refine(
      (files) => files.every((file) => acceptedFormats.includes(file.type)),
      {
        message: "Only JPG and PNG images are allowed",
        path: ["logo"],
      }
    )
    .superRefine(async (files, ctx) => {
      try {
        const { width, height } = await getImageDimensions(files[0]);
        console.log(await getImageDimensions(files[0]));
        if (
          !(
            (width === 240 && height === 240) ||
            (width === 128 && height === 128)
          )
        ) {
          // Add a detailed error message to the Zod context
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Image must be exactly 240x240 or 128x128 pixels. Found ${width}x${height}.`,
          });
          return; // Stop further validation checks
        }
      } catch (error) {
        // Handle errors during image loading (e.g., corrupted file)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Could not determine image dimensions.",
        });
      }
    }),
  gallery: z
    .array(z.custom<File>())
    .min(0)
    .max(3, "Cannot select more than 3 files")
    .refine((files) => files.every((file) => file.size <= 2 * 1024 * 1024), {
      message: "File size must be less than 2MB",
      path: ["gallery"],
    })
    .refine(
      (files) => files.every((file) => acceptedFormats.includes(file.type)),
      {
        message: "Only JPG and PNG images are allowed",
        path: ["gallery"],
      }
    )
    .optional(),
});
// Full form schema - note: confirmation validation is dynamic
const productFormSchema = z.object({
  getStarted: getStartedForm,
  productInformation: productInformationForm,
  media: mediaForm,
});

type NewProductForm = z.infer<typeof productFormSchema>;

const formSteps = [
  {
    value: "get-started",
    title: "Get Started",
    description: "",
    fields: ["getStarted.url", "getStarted.isDev"] as const,
  },
  {
    value: "product-information",
    title: "Product Information",
    description: "Details about your product",
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
    value: "media",
    title: "Media contents",
    description: "Logos and screenshots",
    fields: ["media.logo", "media.gallery"] as const,
  },
  {
    value: "confirmation",
    title: "Confirmation",
    description: "Preview and confirm inputs",
    fields: [] as const,
  },
] as const;

function RouteComponent() {
  const form = useForm<NewProductForm>({
    defaultValues: {
      getStarted: {
        url: "",
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
        sourceCodeUrl: "",
      },
      media: {
        logo: [],
        gallery: [],
      },
    },
    resolver: zodResolver(productFormSchema),
  });

  const [step, setStep] = useState("get-started");
  const stepIndex = formSteps.findIndex(
    (currentStep) => currentStep.value === step
  );

  const [isOpenSourced, setIsOpenSourced] = useState(false);

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

  return (
    <main className="grid min-h-screen gap-0 lg:grid-cols-2">
      <section className="min-h-screen">
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
                orientation="horizontal"
                value={step}
              >
                <StepperList className="w-full scale-90 flex-wrap">
                  {formSteps.map((step) => (
                    <StepperItem key={step.value} value={step.value}>
                      <StepperTrigger>
                        <StepperIndicator />
                        <div className="flex flex-col gap-px">
                          <StepperTitle>{step.title}</StepperTitle>
                          <StepperDescription>
                            {step.description}
                          </StepperDescription>
                        </div>
                      </StepperTrigger>
                      <StepperSeparator className="mx-4" />
                    </StepperItem>
                  ))}
                </StepperList>

                <div className="flex flex-col space-y-8">
                  <StepperContent
                    className="flex flex-col gap-2"
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
                                    field.onChange(e.target.value)
                                  }
                                  placeholder="dealort"
                                  value={field.value ?? ""}
                                />
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
                    className="flex flex-col gap-2"
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
                          render={() => (
                            <Controller
                              control={form.control}
                              defaultValue={[]}
                              name="productInformation.category"
                              render={({ field }) => (
                                <CategoriesCombobox
                                  name={field.name}
                                  onBlur={field.onBlur}
                                  onChange={field.onChange}
                                  value={field.value || []}
                                />
                              )}
                            />
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
                                      field.onChange(e.target.value)
                                    }
                                    placeholder="dealort"
                                    value={field.value}
                                  />
                                </InputGroup>
                              </FormControl>
                              <FormMessage />
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
                                      field.onChange(e.target.value)
                                    }
                                    placeholder="dealort"
                                    value={field.value}
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
                                          field.onChange(e.target.value)
                                        }
                                        placeholder="repository remote url"
                                        value={field.value}
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

                  <StepperContent className="flex flex-col gap-2" value="media">
                    <div className="mb-6 flex flex-col gap-2">
                      <h1 className="text-xl sm:text-2xl">Media and Images</h1>
                      <p className="font-light text-xs sm:text-sm">
                        Important media and images that describe your product.
                      </p>
                    </div>

                    <FieldGroup>
                      <FieldSet>
                        <FormField
                          control={form.control}
                          name="media.logo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Logo</FormLabel>

                              <FileUpload
                                accept=".jpg, .png, .jpeg"
                                onFileReject={(_, message) => {
                                  form.setError("media.logo", {
                                    message,
                                  });
                                }}
                                onValueChange={(val) => {
                                  field.onChange([val.at(-1)]);
                                }}
                                value={field.value}
                              >
                                <FileUploadDropzone className="flex-row flex-wrap border-dotted text-center">
                                  <CloudUploadIcon className="size-4" />
                                  Drag and drop or to upload
                                  <div className="mt-px text-[8px]">
                                    recommended 240x240
                                  </div>
                                </FileUploadDropzone>

                                {field.value.map((file, index) => (
                                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                  <FileUploadItem key={index} value={file}>
                                    <FileUploadItemPreview />
                                    <FileUploadItemMetadata />
                                    <FileUploadItemDelete asChild>
                                      <Button
                                        className="size-7"
                                        size="icon"
                                        variant="ghost"
                                      >
                                        <XIcon />
                                        <span className="sr-only">Delete</span>
                                      </Button>
                                    </FileUploadItemDelete>
                                  </FileUploadItem>
                                ))}
                              </FileUpload>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </FieldSet>

                      <FieldSeparator />

                      <FieldSet>
                        <div className="flex flex-col gap-1">
                          <h3 className="sm:text-lg">Gallery</h3>
                          <p className="font-light text-sm">
                            A carefully selected snapshots of your projects
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="media.gallery"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Attachments</FormLabel>
                              <FormControl>
                                <FileUpload
                                  accept=".png, .jpg, .jpeg"
                                  maxFiles={3}
                                  maxSize={2 * 1024 * 1024}
                                  multiple
                                  onFileReject={(_, message) => {
                                    form.setError("media.gallery", {
                                      message,
                                    });
                                  }}
                                  onValueChange={(val) => {
                                    field.onChange(val);
                                    console.log(form.formState.errors.media);
                                  }}
                                  value={field.value}
                                >
                                  <FileUploadDropzone className="flex-row flex-wrap border-dotted text-center">
                                    <CloudUploadIcon className="size-4" />
                                    Drag and drop or choose files to upload
                                    <div className="text-[8px]">
                                      recommended 1270x760px
                                    </div>
                                  </FileUploadDropzone>
                                  <FileUploadList>
                                    {field.value?.map((file, index) => (
                                      <FileUploadItem
                                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                        key={index}
                                        value={file}
                                      >
                                        <FileUploadItemPreview />
                                        <FileUploadItemMetadata />
                                        <FileUploadItemDelete asChild>
                                          <Button
                                            className="size-7"
                                            size="icon"
                                            variant="ghost"
                                          >
                                            <XIcon />
                                            <span className="sr-only">
                                              Delete
                                            </span>
                                          </Button>
                                        </FileUploadItemDelete>
                                      </FileUploadItem>
                                    ))}
                                  </FileUploadList>
                                </FileUpload>
                              </FormControl>

                              <FormMessage />
                              <FormDescription>
                                Optional [jpg, png] and cannot select more than
                                3 images
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </FieldSet>
                    </FieldGroup>
                  </StepperContent>

                  <StepperContent
                    className="flex w-full flex-col gap-2"
                    value="confirmation"
                  >
                    <ProductPreview values={form.getValues()} />
                  </StepperContent>

                  <div className="mt-4 flex justify-between">
                    <StepperPrev asChild>
                      <Button type="button" variant="outline">
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
                        <Button type="button">
                          <ArrowRight />
                        </Button>
                      </StepperNext>
                    )}
                  </div>
                </div>
              </Stepper>
            </form>
          </Form>
        </div>
      </section>

      {step !== "confirmation" && (
        <aside className="max-lg:hidden">
          <ProductPreview values={form.getValues()} />
        </aside>
      )}
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
  value = [],
  onChange,
  onBlur,
  className,
}: ComboboxFieldProps) {
  // no internal state — use the value provided by RHF
  return (
    <Combobox multiple onValueChange={onChange} value={value}>
      <FieldLabel className="pt-0 font-medium text-xs sm:text-sm">
        Categories
      </FieldLabel>
      <ComboboxAnchor asChild>
        <TagsInput
          className={`relative flex h-full min-h-10 w-full flex-row flex-wrap items-center justify-start gap-1.5 px-2.5 py-2 ${className}`}
          name={name}
          onBlur={onBlur}
          onValueChange={onChange}
          value={value}
        >
          {value.map((item) => (
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

interface PreviewProps {
  values: NewProductForm;
}

function getFirstFileUrl(files: File[] = []) {
  if (!files?.length) return "";
  return URL.createObjectURL(files[0]);
}
function getFilesUrls(files: File[] = []) {
  if (!files?.length) return [];
  return files.map((f) => URL.createObjectURL(f));
}

export function ProductPreview({ values }: PreviewProps) {
  const logoUrl = values.media.logo?.length
    ? getFirstFileUrl(values.media.logo)
    : null;
  const galleryUrls = values.media.gallery?.length
    ? getFilesUrls(values.media.gallery)
    : [];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-lg border p-5">
      {/* Logo, Name, Tagline */}
      <div className="flex items-center gap-1">
        <Avatar className="size-16 shrink-0">
          {logoUrl ? (
            <AvatarImage
              alt={values.productInformation.name || "Logo"}
              src={logoUrl}
            />
          ) : (
            <AvatarFallback>
              <Skeleton className="h-16 w-16 rounded-full" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="ml-3 flex flex-col gap-2">
          <h3 className="font-semibold text-lg">
            {values.productInformation.name ? (
              values.productInformation.name
            ) : (
              <Skeleton className="h-6 w-24 rounded" />
            )}
          </h3>
          <p className="font-light text-muted-foreground text-sm">
            {values.productInformation.tagline ? (
              values.productInformation.tagline
            ) : (
              <Skeleton className="h-4 w-40 rounded" />
            )}
          </p>
        </div>
      </div>
      {/* Links */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <span className="mr-2 font-medium text-muted-foreground text-xs">
            Product URL:
          </span>
          {values.getStarted.url ? (
            <a
              className="flex gap-px text-primary/80 text-sm"
              href={values.getStarted.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {values.getStarted.url}
              <ExternalLinkIcon className="size-4" />
            </a>
          ) : (
            <Skeleton className="inline-block h-4 w-36 rounded align-middle" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 font-medium text-muted-foreground text-xs">
            X URL:
          </span>
          {values.productInformation.xUrl ? (
            <a
              className="flex gap-px text-primary text-sm underline"
              href={values.productInformation.xUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {values.productInformation.xUrl}
              <ExternalLinkIcon className="size-4" />
            </a>
          ) : (
            <Skeleton className="inline-block h-4 w-24 rounded align-middle" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 font-medium text-muted-foreground text-xs">
            LinkedIn URL:
          </span>
          {values.productInformation.linkedinUrl ? (
            <a
              className="flex gap-px text-primary text-sm underline"
              href={values.productInformation.linkedinUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {values.productInformation.linkedinUrl}
              <ExternalLinkIcon className="size-4" />
            </a>
          ) : (
            <Skeleton className="inline-block h-4 w-24 rounded align-middle" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 font-medium text-muted-foreground text-xs">
            Source Code:
          </span>
          {values.productInformation.sourceCodeUrl ? (
            <a
              className="flex gap-px text-primary text-sm underline"
              href={values.productInformation.sourceCodeUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {values.productInformation.sourceCodeUrl}
              <ExternalLinkIcon className="size-4" />
            </a>
          ) : (
            <Skeleton className="inline-block h-4 w-28 rounded align-middle" />
          )}
        </div>
      </div>
      {/* Description */}
      <div>
        <div className="mb-1 font-semibold text-muted-foreground text-xs">
          Description
        </div>
        <div className="text-sm">
          {values.productInformation.description ? (
            values.productInformation.description
          ) : (
            <Skeleton className="h-5 w-full rounded" />
          )}
        </div>
      </div>
      {/* Categories */}
      <div>
        <div className="mb-1 font-semibold text-muted-foreground text-xs">
          Categories
        </div>
        <div className="flex flex-wrap gap-2">
          {values.productInformation.category?.length ? (
            values.productInformation.category.map((c) => (
              <span
                className="rounded bg-muted px-2 py-0.5 font-medium text-xs"
                key={c}
              >
                {c}
              </span>
            ))
          ) : (
            <Skeleton className="h-6 w-24 rounded" />
          )}
        </div>
      </div>
      {/* isOpenSource & isDev */}
      <div className="flex gap-4">
        <div>
          <span className="mr-1 font-semibold text-muted-foreground text-xs">
            Open Source:
          </span>
          <span className="font-medium text-sm">
            {typeof values.productInformation.isOpenSource === "boolean" ? (
              values.productInformation.isOpenSource ? (
                "Yes"
              ) : (
                "No"
              )
            ) : (
              <Skeleton className="inline-block h-4 w-8 align-middle" />
            )}
          </span>
        </div>
        <div>
          <span className="mr-1 font-semibold text-muted-foreground text-xs">
            In Development:
          </span>
          <span className="font-medium text-sm">
            {typeof values.getStarted.isDev === "boolean" ? (
              values.getStarted.isDev ? (
                "Yes"
              ) : (
                "No"
              )
            ) : (
              <Skeleton className="inline-block h-4 w-8 align-middle" />
            )}
          </span>
        </div>
      </div>
      {/* Gallery */}
      <div className="mt-2">
        <div className="mb-1 font-semibold text-muted-foreground text-xs">
          Gallery
        </div>
        {galleryUrls.length > 0 ? (
          <Carousel className="w-full max-w-md">
            <CarouselContent>
              {galleryUrls.map((url, idx) => (
                <CarouselItem className="flex justify-center" key={url}>
                  <img
                    alt={`Gallery ${idx + 1}`}
                    className="max-h-72 w-full rounded-lg border bg-muted object-contain"
                    height=""
                    src={url}
                    width=""
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="flex gap-2">
            <Skeleton className="h-28 w-40 rounded-lg" />
            <Skeleton className="h-28 w-40 rounded-lg" />
            <Skeleton className="h-28 w-40 rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}
