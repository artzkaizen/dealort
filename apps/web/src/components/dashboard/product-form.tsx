import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  ChevronDown,
  CloudUploadIcon,
  ExternalLinkIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { TextField } from "@/components/custom-form-components/text-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CircularProgress,
  CircularProgressIndicator,
  CircularProgressRange,
  CircularProgressTrack,
} from "@/components/ui/circular-progress";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Field,
  FieldDescription,
  FieldGroup,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { authClient } from "@/lib/auth-client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn, slugify } from "@/lib/utils";
import { categories } from "@/utils/constants";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
} from "../ui/dice-combobox";
import { FieldLabel } from "../ui/field";
import { Image } from "../ui/image";
import { TagsInput, TagsInputInput, TagsInputItem } from "../ui/tags-input";

const PROTOCOL_REGEX = /^https?:\/\//i;
const DOMAIN_EXTENSION_REGEX = /\.[a-zA-Z]{2,}/;
const URL_REGEX =
  /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
const X_URL_REGEX =
  /^(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/)([A-Za-z0-9_]{1,15})$/i;
const acceptedFormats = ["image/jpg", "image/jpeg", "image/png"];

const getImageDimensions = (
  file: File | Blob
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Set a timeout to prevent hanging indefinitely
    timeoutId = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load timeout"));
    }, 10_000); // 10 second timeout

    img.onload = () => {
      if (timeoutId) clearTimeout(timeoutId);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(url);
      resolve({
        width,
        height,
      });
    };

    img.onerror = () => {
      if (timeoutId) clearTimeout(timeoutId);
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for dimension check."));
    };

    img.src = url;
  });

// Base schemas
const getStartedFormBase = z.object({
  url: z
    .string()
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
  releaseDate: z.date().optional(),
  isListed: z.boolean(),
});

const productInformationFormBase = z
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
        return `https://x.com/${val}`;
      })
      .pipe(z.url("Please input a valid X/Twitter username."))
      .refine((val) => !val || X_URL_REGEX.test(val), {
        message: "Please enter a valid X/Twitter username format.",
      }),
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
          z.literal(""),
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

const mediaFormBase = z.object({
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
        if (
          !(
            (width === 240 && height === 240) ||
            (width === 128 && height === 128)
          )
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Image must be exactly 240x240 or 128x128 pixels. Found ${width}x${height}.`,
          });
          return;
        }
      } catch (_error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Could not determine image dimensions.",
        });
      }
    }),
  gallery: z
    .array(z.custom<File>())
    .min(1, "Please select at least one file")
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

// Create schemas based on mode
function createSchemas(mode: "new" | "edit") {
  if (mode === "edit") {
    // All fields optional for edit mode - create new schemas instead of extending
    const getStartedForm = z.object({
      url: z
        .string()
        .refine((val) => !(val && PROTOCOL_REGEX.test(val)), {
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
          z.union([
            z.literal(""),
            z.url({
              message: "Please enter a valid URL (e.g., example.com)",
            }),
          ])
        )
        .optional(),
      isDev: z.boolean().optional(),
      releaseDate: z.date().optional(),
      isListed: z.boolean().optional(),
    });

    const productInformationForm = z
      .object({
        name: z.string().max(40, "Product name is too long").optional(),
        tagline: z.string().max(60, "Tagline is too long").optional(),
        description: z
          .string()
          .max(600, "Description cannot exceed 600 characters")
          .optional(),
        category: z.array(z.string()).optional(),
        xUrl: z
          .string()
          .refine((val) => !(val && PROTOCOL_REGEX.test(val)), {
            message:
              "Please enter only the username (e.g., username) and not the full URL.",
          })
          .transform((val) => {
            if (!val) {
              return val;
            }
            return `https://x.com/${val}`;
          })
          .pipe(
            z.union([
              z.literal(""),
              z.url("Please input a valid X/Twitter username."),
            ])
          )
          .refine((val) => !val || X_URL_REGEX.test(val), {
            message: "Please enter a valid X/Twitter username format.",
          })
          .optional(),
        linkedinUrl: z
          .string()
          .refine((val) => !(val && PROTOCOL_REGEX.test(val)), {
            message:
              "Please enter only the company path (e.g., company-name) and not the full URL.",
          })
          .transform((val) => {
            if (!val) {
              return val;
            }
            return `https://www.linkedin.com/company/${val}`;
          })
          .pipe(
            z.union([
              z.literal(""),
              z.url("Please enter a valid LinkedIn company path."),
            ])
          )
          .optional(),
        isOpenSource: z.boolean().optional(),
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
              z.literal(""),
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
          message:
            "Source code link is required if the product is open source.",
          path: ["sourceCodeUrl"],
        }
      );

    const mediaForm = z.object({
      logo: z.array(z.custom<File>()).optional(),
      gallery: z
        .array(z.custom<File>())
        .max(3, "Cannot select more than 3 files")
        .refine(
          (files) =>
            !files || files.every((file) => file.size <= 2 * 1024 * 1024),
          {
            message: "File size must be less than 2MB",
            path: ["gallery"],
          }
        )
        .refine(
          (files) =>
            !files ||
            files.every((file) => acceptedFormats.includes(file.type)),
          {
            message: "Only JPG and PNG images are allowed",
            path: ["gallery"],
          }
        )
        .optional(),
    });

    return {
      getStarted: getStartedForm,
      productInformation: productInformationForm,
      media: mediaForm,
    };
  }

  // New mode - all required
  // Create a new schema with the name validation instead of extending
  const productInformationFormNew = z
    .object({
      name: z
        .string()
        .min(1, "Type product name")
        .max(40, "Product name is too long")
        .refine(
          async (val) => {
            const { data } = await authClient.organization.checkSlug({
              slug: slugify(val),
            });
            if (data?.status) {
              return true;
            }
            return false;
          },
          {
            message: "Product name is already taken",
            path: ["name"],
          }
        ),
      tagline: z.string().min(1, "Type tagline").max(60, "Tagline is too long"),
      description: z
        .string()
        .min(1, "Type description")
        .max(2500, "Description cannot exceed 600 characters"),
      category: z
        .array(z.string())
        .min(1, "Please select at least one category"),
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
          return `https://x.com/${val}`;
        })
        .pipe(z.url("Please input a valid X/Twitter username."))
        .refine((val) => !val || X_URL_REGEX.test(val), {
          message: "Please enter a valid X/Twitter username format.",
        }),
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
            z.literal(""),
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

  return {
    getStarted: getStartedFormBase,
    productInformation: productInformationFormNew,
    media: mediaFormBase,
  };
}

const formSteps = [
  {
    value: "get-started" as const,
    title: "Get Started",
    description: "",
    fields: [
      "getStarted.url",
      "getStarted.isDev",
      "getStarted.releaseDate",
      "getStarted.isListed",
    ] as const,
  },
  {
    value: "product-information" as const,
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
    value: "media" as const,
    title: "Media contents",
    description: "Logos and screenshots",
    fields: ["media.logo", "media.gallery"] as const,
  },
  {
    value: "confirmation" as const,
    title: "Confirmation",
    description: "Preview and confirm inputs",
    fields: [] as const,
  },
] as const;

export interface ProductFormData {
  getStarted: {
    url: string;
    isDev: boolean;
    releaseDate?: Date;
    isListed: boolean;
  };
  productInformation: {
    name: string;
    tagline: string;
    description: string;
    category: string[];
    xUrl: string;
    linkedinUrl: string;
    isOpenSource: boolean;
    sourceCodeUrl?: string;
  };
  media: {
    logo: File[];
    gallery?: File[];
    logoUrls?: string[];
    galleryUrls?: string[];
  };
}

export interface ProductFormProps {
  mode: "new" | "edit";
  initialValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel?: () => void;
}

// ProductPreview component with all fields
interface PreviewProps {
  values: {
    getStarted: {
      url?: string;
      isDev?: boolean;
      releaseDate?: Date;
      isListed?: boolean;
    };
    productInformation: {
      name?: string;
      tagline?: string;
      description?: string;
      category?: string[];
      xUrl?: string;
      linkedinUrl?: string;
      isOpenSource?: boolean;
      sourceCodeUrl?: string;
    };
    media: {
      logo?: File[];
      gallery?: File[];
    };
  };
  isUploadingLogo: boolean;
  isUploadingGallery: boolean;
  uploadProgressLogo: number;
  uploadProgressGallery: number;
}

function getFirstFileUrl(files: File[] = []) {
  if (!files?.length) return "";
  return URL.createObjectURL(files[0]);
}

function getFilesUrls(files: File[] = []) {
  if (!files?.length) return [];
  return files.map((f) => URL.createObjectURL(f));
}

function ProductPreview({
  values,
  isUploadingLogo,
  isUploadingGallery,
  uploadProgressLogo,
  uploadProgressGallery,
}: PreviewProps) {
  const logoUrl = values.media?.logo?.length
    ? getFirstFileUrl(values.media.logo)
    : null;
  const galleryUrls = values.media?.gallery?.length
    ? getFilesUrls(values.media.gallery)
    : [];

  const getStarted = values.getStarted;
  const productInfo = values.productInformation;

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-4">
      {/* Logo and Basic Info */}
      <div className="flex justify-between">
        <div className="flex items-center gap-3 border-b pb-4">
          <Avatar className="size-16 shrink-0">
            {isUploadingLogo ? (
              <Skeleton className="size-full">
                <CircularProgress
                  className="size-full"
                  value={uploadProgressLogo}
                >
                  <CircularProgressIndicator>
                    <CircularProgressTrack />
                    <CircularProgressRange />
                  </CircularProgressIndicator>
                </CircularProgress>
              </Skeleton>
            ) : (
              <>
                <AvatarImage
                  alt={productInfo?.name || "Logo"}
                  src={logoUrl ?? ""}
                />
                <AvatarFallback>
                  {(productInfo?.name || "L").charAt(0).toUpperCase()}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-lg">
              {productInfo?.name || (
                <span className="text-muted-foreground">Product Name</span>
              )}
            </h3>
            <p className="font-light text-muted-foreground text-sm">
              {productInfo?.tagline || (
                <span className="text-muted-foreground">Tagline</span>
              )}
            </p>
          </div>
        </div>

        <Badge className="size-fit">
          {values.getStarted.isListed ? "Listed" : "Unlisted"}
        </Badge>
      </div>

      {/* Description */}
      {productInfo?.description && (
        <div className="border-b pb-4">
          <h4 className="mb-2 font-semibold text-sm">Description</h4>
          <p className="whitespace-pre-wrap text-muted-foreground text-sm">
            {productInfo.description}
          </p>
        </div>
      )}

      {/* Categories */}
      {productInfo?.category && productInfo.category.length > 0 && (
        <div className="border-b pb-4">
          <h4 className="mb-2 font-semibold text-sm">Categories</h4>
          <div className="flex flex-wrap gap-2">
            {productInfo.category.map((cat) => (
              <Badge key={cat} variant="secondary">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* URL */}
      {getStarted?.url && (
        <div className="border-b pb-4">
          <h4 className="mb-2 font-semibold text-sm">Website URL</h4>
          <a
            className="inline-flex items-center gap-1 text-primary hover:underline"
            href={`https://${getStarted.url.toLowerCase()}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {getStarted.url.toLowerCase()}
            <ExternalLinkIcon className="size-3" />
          </a>
        </div>
      )}

      {/* Social Links */}
      {(productInfo?.xUrl ||
        productInfo?.linkedinUrl ||
        productInfo?.sourceCodeUrl) && (
        <div className="border-b pb-4">
          <h4 className="mb-2 font-semibold text-sm">Links</h4>
          <div className="flex flex-col gap-2">
            {productInfo.xUrl && (
              <a
                className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
                href={`https://x.com/${productInfo.xUrl.toLowerCase()}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                X (Twitter) <ExternalLinkIcon className="size-3" />
              </a>
            )}
            {productInfo.linkedinUrl && (
              <a
                className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
                href={`https://www.linkedin.com/company/${productInfo.linkedinUrl.toLowerCase()}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                LinkedIn <ExternalLinkIcon className="size-3" />
              </a>
            )}
            {productInfo.sourceCodeUrl && (
              <a
                className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
                href={`https://${productInfo.sourceCodeUrl.toLowerCase()}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                Source Code <ExternalLinkIcon className="size-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Product Details */}
      <div className="border-b pb-4">
        <h4 className="mb-2 font-semibold text-sm">Product Details</h4>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={getStarted?.isDev ? "default" : "secondary"}>
              {getStarted?.isDev ? "In Development" : "Production Ready"}
            </Badge>
          </div>
          {getStarted?.releaseDate && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Release Date:</span>
              <span>{format(getStarted.releaseDate, "PPP")}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Open Source:</span>
            <Badge variant={productInfo?.isOpenSource ? "default" : "outline"}>
              {productInfo?.isOpenSource ? "Yes" : "No"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {galleryUrls.length > 0 && (
        <div className="border-b pb-4">
          <h4 className="mb-2 font-semibold text-sm">Gallery</h4>
          {isUploadingGallery && (
            <div className="mb-2">
              <Progress className="h-1" value={uploadProgressGallery} />
            </div>
          )}
          <Carousel className="w-full">
            <CarouselContent>
              {galleryUrls.map((url, idx) => (
                <CarouselItem className="flex justify-center" key={url}>
                  <Image
                    alt={`Gallery ${idx + 1}`}
                    className="max-h-72 w-full rounded-lg border bg-muted object-contain"
                    src={url}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}
    </div>
  );
}

// Responsive Preview Component (Sheet on large, Drawer on small)
interface ResponsivePreviewProps extends PreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function ResponsivePreview({
  open,
  onOpenChange,
  children,
  ...previewProps
}: ResponsivePreviewProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer onOpenChange={onOpenChange} open={open}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="max-h-[96vh]">
          <DrawerHeader>
            <DrawerTitle>Product Preview</DrawerTitle>
            <DrawerDescription>
              Review all your product information
            </DrawerDescription>
          </DrawerHeader>
          <ProductPreview {...previewProps} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Product Preview</SheetTitle>
          <SheetDescription>
            Review all your product information
          </SheetDescription>
        </SheetHeader>
        <ProductPreview {...previewProps} />
      </SheetContent>
    </Sheet>
  );
}

export function ProductForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const schemas = createSchemas(mode);
  const productFormSchema = z.object({
    getStarted: schemas.getStarted,
    productInformation: schemas.productInformation,
    media: schemas.media,
  });

  type FormData = z.infer<typeof productFormSchema>;

  // Transform initial values for edit mode
  const getDefaultValues = (): FormData => {
    if (mode === "edit" && initialValues) {
      return {
        getStarted: {
          url: initialValues.getStarted?.url
            ? initialValues.getStarted.url.replace("https://", "")
            : "",
          isDev: initialValues.getStarted?.isDev ?? false,
          releaseDate: initialValues.getStarted?.releaseDate
            ? new Date(initialValues.getStarted.releaseDate)
            : undefined,
          isListed: initialValues.getStarted?.isListed ?? false,
        },
        productInformation: {
          name: initialValues.productInformation?.name ?? "",
          tagline: initialValues.productInformation?.tagline ?? "",
          description: initialValues.productInformation?.description ?? "",
          category: initialValues.productInformation?.category ?? [],
          xUrl: initialValues.productInformation?.xUrl
            ? initialValues.productInformation.xUrl.replace(
                "https://x.com/",
                ""
              )
            : "",
          linkedinUrl: initialValues.productInformation?.linkedinUrl
            ? initialValues.productInformation.linkedinUrl.replace(
                "https://www.linkedin.com/company/",
                ""
              )
            : "",
          isOpenSource: initialValues.productInformation?.isOpenSource ?? false,
          sourceCodeUrl: initialValues.productInformation?.sourceCodeUrl
            ? initialValues.productInformation.sourceCodeUrl.replace(
                "https://",
                ""
              )
            : "",
        },
        media: {
          logo: initialValues.media?.logo ?? [],
          gallery: initialValues.media?.gallery ?? [],
        },
      };
    }

    return {
      getStarted: {
        url: "",
        isDev: false,
        releaseDate: undefined,
        isListed: false,
      },
      productInformation: {
        name: "",
        tagline: "",
        description: "",
        category: [],
        xUrl: "",
        linkedinUrl: "",
        isOpenSource: false,
        sourceCodeUrl: "",
      },
      media: {
        logo: [],
        gallery: [],
      },
    };
  };

  const form = useForm<FormData>({
    defaultValues: getDefaultValues(),
    resolver: zodResolver(productFormSchema),
  });

  const [step, setStep] =
    useState<(typeof formSteps)[number]["value"]>("get-started");
  const stepIndex = formSteps.findIndex(
    (currentStep) => currentStep.value === step
  );
  const [isOpenSourced, setIsOpenSourced] = useState(
    initialValues?.productInformation?.isOpenSource ?? false
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [uploadProgressLogo, setUploadProgressLogo] = useState(0);
  const [uploadProgressGallery, setUploadProgressGallery] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  const logoUpload = useUploadThing("productLogo", {
    onBeforeUploadBegin: (files) => {
      setIsUploadingLogo(true);
      return files;
    },
    onUploadError: (error) => {
      console.error(error);
      toast.error(error.message);
      setIsUploadingLogo(false);
    },
    onUploadProgress: (progress) => {
      setUploadProgressLogo(progress);
    },
    onClientUploadComplete: () => {
      setIsUploadingLogo(false);
    },
  });

  const galleryUpload = useUploadThing("productGallery", {
    onBeforeUploadBegin: (files) => {
      setIsUploadingGallery(true);
      return files;
    },
    onUploadError: (error) => {
      console.error(error);
      toast.error(error.message);
      setIsUploadingGallery(false);
    },
    onUploadProgress: (progress) => {
      setUploadProgressGallery(progress);
    },
    onClientUploadComplete: () => {
      setIsUploadingGallery(false);
    },
  });

  const onValidate: NonNullable<StepperProps["onValidate"]> = useCallback(
    async (_value, direction) => {
      if (direction === "prev") return true;

      const stepData = formSteps.find(
        (currentStep) => currentStep.value === step
      );

      if (!stepData) return true;
      const isValid = await form.trigger(stepData.fields);

      if (!isValid) {
        toast.info("Please complete all required fields to continue");
      }

      return isValid;
    },
    [form, step]
  );

  async function handleSubmit(data: FormData) {
    if (mode === "new" && data.media.logo?.length === 0) {
      toast.error("Please upload at least one logo");
      return;
    }

    // Upload files if provided
    let logoUrls: string[] = [];
    let galleryUrls: string[] = [];

    if (data.media.logo && data.media.logo.length > 0) {
      const logoResult = await logoUpload.startUpload(data.media.logo);
      if (logoResult) {
        logoUrls = logoResult.map((r) => r.ufsUrl);
      }
    }

    if (data.media.gallery && data.media.gallery.length > 0) {
      const galleryResult = await galleryUpload.startUpload(data.media.gallery);
      if (galleryResult) {
        galleryUrls = galleryResult.map((r) => r.ufsUrl);
      }
    }

    // For edit mode, only include fields that have values
    const submitData: ProductFormData = {
      getStarted: {
        url: data.getStarted.url || "",
        isDev: data.getStarted.isDev ?? false,
        releaseDate: data.getStarted.releaseDate,
        isListed: data.getStarted.isListed ?? false,
      },
      productInformation: {
        name: data.productInformation.name || "",
        tagline: data.productInformation.tagline || "",
        description: data.productInformation.description || "",
        category: data.productInformation.category || [],
        xUrl: data.productInformation.xUrl || "",
        linkedinUrl: data.productInformation.linkedinUrl || "",
        isOpenSource: data.productInformation.isOpenSource ?? false,
        sourceCodeUrl: data.productInformation.sourceCodeUrl,
      },
      media: {
        logo: data.media.logo || [],
        gallery: data.media.gallery,
        logoUrls,
        galleryUrls,
      },
    };

    await onSubmit(submitData);
  }

  return (
    <Form {...form}>
      <form
        className="mt-4 flex flex-col gap-2"
        id="product-form"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <Stepper
          onValidate={onValidate}
          onValueChange={(value) =>
            setStep(value as (typeof formSteps)[number]["value"])
          }
          orientation="horizontal"
          value={step}
        >
          <StepperList className="w-full scale-90 flex-wrap">
            {formSteps.map((stepItem) => (
              <StepperItem key={stepItem.value} value={stepItem.value}>
                <StepperTrigger>
                  <StepperIndicator />
                  <div className="flex flex-col gap-px">
                    <StepperTitle>{stepItem.title}</StepperTitle>
                    <StepperDescription>
                      {stepItem.description}
                    </StepperDescription>
                  </div>
                </StepperTrigger>
                <StepperSeparator className="mx-4" />
              </StepperItem>
            ))}
          </StepperList>

          <div className="flex max-w-xl flex-col space-y-8">
            <StepperContent className="flex flex-col gap-2" value="get-started">
              <h1 className="text-3xl sm:text-4xl">
                {mode === "edit" ? "Update product" : "Submit a product"}
              </h1>
              <p className="font-light text-xs sm:text-sm">
                {mode === "edit"
                  ? "Update your product information below."
                  : "Have you stumbled upon something awesome? Or maybe you've been working hard on your own creation? You've landed in the right spot to spread the news! Take a deep breath and jump into the steps."}
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
                            className="pl-0.5! lowercase"
                            id={field.name}
                            inputMode="url"
                            onBlur={field.onBlur}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="dealort.com"
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
                    <FormItem className="rounded-2xl border px-3 py-6 font-normal hover:bg-accent/50 has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950">
                      <div className="flex items-center gap-1">
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

                        <FormLabel htmlFor={field.name}>
                          <p className="text-sm">
                            is this product still in development?
                          </p>
                        </FormLabel>
                      </div>

                      <div className="flex flex-col gap-1">
                        <FieldDescription className="font-light text-xs">
                          Check the box if your product is not a fully
                          production ready software.
                        </FieldDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="getStarted.releaseDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Release Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              variant="outline"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar
                            disabled={(date) => date < new Date("1900-01-01")}
                            mode="single"
                            onSelect={field.onChange}
                            selected={field.value}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        The date when your product was or will be released.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="getStarted.isListed"
                  render={({ field }) => (
                    <FormItem className="rounded-2xl border px-3 py-6 font-normal hover:bg-accent/50 has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950">
                      <div className="flex items-center gap-1">
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

                        <FormLabel htmlFor={field.name}>
                          <p className="text-sm">Is This product public?</p>
                        </FormLabel>
                      </div>

                      <div className="flex flex-col gap-1">
                        <FieldDescription className="font-light text-xs">
                          If you check this box, your product will be listed
                          among products on the products page, it will be
                          visible to both potential users and investors.
                        </FieldDescription>
                      </div>
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
                  {mode === "edit"
                    ? "Update product information"
                    : "Describe your project"}
                </h1>
                <p className="font-light text-xs sm:text-sm">
                  {mode === "edit"
                    ? "Update the details about your product"
                    : "We need a concise information about your product"}
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
                            className="[&>input]:capitalize"
                            inputType="input"
                            label="Product name"
                            maxLength={40}
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => field.onChange(e.target.value)}
                            placeholder="The name of the product you would launch "
                            value={field.value ?? ""}
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
                            value={field.value ?? ""}
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
                            maxLength={2500}
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => field.onChange(e.target.value)}
                            placeholder="Describe your product in details (use formal tone devoid of stickers and emojis)"
                            value={field.value ?? ""}
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
                          <div>
                            <CategoriesCombobox
                              name={field.name}
                              onBlur={field.onBlur}
                              onChange={field.onChange}
                              value={field.value || []}
                            />
                            <FormMessage />
                          </div>
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
                              className="pl-0.5! lowercase"
                              id={field.name}
                              inputMode="text"
                              name={field.name}
                              onBlur={field.onBlur}
                              onChange={(e) => field.onChange(e.target.value)}
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
                              className="pl-0.5! lowercase"
                              id={field.name}
                              inputMode="text"
                              name={field.name}
                              onBlur={field.onBlur}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="dealort"
                              value={field.value ?? ""}
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
                        <FormItem className="rounded-lg border p-3 font-normal has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950">
                          <div className="flex gap-1">
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
                            <FormLabel htmlFor={field.name}>
                              <p className="text-sm">
                                Is this product open source?
                              </p>
                            </FormLabel>
                          </div>
                          <FieldDescription className="font-light text-xs">
                            Check the box if your product is open source.
                          </FieldDescription>
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
                                  <InputGroupText>https://</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                  className="pl-0.5! lowercase"
                                  id={field.name}
                                  inputMode="url"
                                  onBlur={field.onBlur}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  placeholder="repository remote url"
                                  value={field.value ?? ""}
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
                  {mode === "edit"
                    ? "Update media and images for your product (optional)"
                    : "Important media and images that describe your product."}
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
                          maxFiles={1}
                          onFileReject={(_, message) => {
                            form.setError("media.logo", {
                              message,
                              type: "custom",
                            });
                          }}
                          onValueChange={(val) => {
                            field.onChange(val ?? []);
                            form.trigger("media.logo");
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
                          {field.value?.map((file, index) => (
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
                        {isUploadingLogo && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Uploading logo...</span>
                              <span>{uploadProgressLogo}%</span>
                            </div>
                            <Progress value={uploadProgressLogo} />
                          </div>
                        )}
                        <FormMessage />
                        {mode === "edit" && (
                          <FormDescription>
                            Leave empty to keep the current logo.
                          </FormDescription>
                        )}
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
                            </FileUploadList>
                          </FileUpload>
                        </FormControl>
                        {isUploadingGallery && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Uploading gallery...</span>
                              <span>{uploadProgressGallery}%</span>
                            </div>
                            <Progress value={uploadProgressGallery} />
                          </div>
                        )}
                        <FormMessage />
                        <FormDescription>
                          Optional [jpg, png] and cannot select more than 3
                          images
                          {mode === "edit" &&
                            ". Leave empty to keep current gallery."}
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
              <div className="flex flex-col gap-4">
                <h1 className="text-xl sm:text-2xl">Confirmation</h1>
                <p className="font-light text-xs sm:text-sm">
                  Review all your product information before submitting.
                </p>
              </div>

              <ProductPreview
                isUploadingGallery={isUploadingGallery}
                isUploadingLogo={isUploadingLogo}
                uploadProgressGallery={uploadProgressGallery}
                uploadProgressLogo={uploadProgressLogo}
                values={form.getValues()}
              />
            </StepperContent>

            <div>
              {step !== "confirmation" && (
                <ResponsivePreview
                  isUploadingGallery={isUploadingGallery}
                  isUploadingLogo={isUploadingLogo}
                  onOpenChange={setPreviewOpen}
                  open={previewOpen}
                  uploadProgressGallery={uploadProgressGallery}
                  uploadProgressLogo={uploadProgressLogo}
                  values={form.getValues()}
                >
                  <Button
                    className="w-full sm:w-auto"
                    type="button"
                    variant="outline"
                  >
                    Open Preview
                  </Button>
                </ResponsivePreview>
              )}
              <div className="mt-4 flex justify-between">
                {onCancel ? (
                  <Button onClick={onCancel} type="button" variant="outline">
                    Cancel
                  </Button>
                ) : (
                  <StepperPrev asChild>
                    <Button type="button" variant="outline">
                      <ArrowLeft />
                    </Button>
                  </StepperPrev>
                )}
                <div className="text-muted-foreground text-sm">
                  Step {stepIndex + 1} of {formSteps.length}
                </div>
                {stepIndex === formSteps.length - 1 ? (
                  <Button disabled={form.formState.isSubmitting} type="submit">
                    <LoadingSwap isLoading={form.formState.isSubmitting}>
                      {mode === "edit" ? "Update" : "Complete"}
                    </LoadingSwap>
                  </Button>
                ) : (
                  <StepperNext asChild>
                    <Button type="button">
                      <ArrowRight />
                    </Button>
                  </StepperNext>
                )}
              </div>
            </div>
          </div>
        </Stepper>
      </form>
    </Form>
  );
}

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
  return (
    <Combobox autoHighlight multiple onValueChange={onChange} value={value}>
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
            <TagsInputItem
              className="text-xs capitalize"
              key={item}
              value={item}
            >
              {item}
            </TagsInputItem>
          ))}
          <ComboboxInput asChild className="h-fit flex-1 p-0">
            <TagsInputInput className="text-xs" placeholder="Categories..." />
          </ComboboxInput>
          <ComboboxTrigger className="absolute top-2.5 right-2">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </ComboboxTrigger>
        </TagsInput>
      </ComboboxAnchor>

      <ComboboxContent className="max-h-52 overflow-y-auto" sideOffset={5}>
        <ComboboxEmpty>No category found.</ComboboxEmpty>
        {categories.map((category) => (
          <ComboboxItem
            className="text-xs capitalize"
            key={category}
            outset
            value={category}
          >
            {category}
          </ComboboxItem>
        ))}
      </ComboboxContent>
    </Combobox>
  );
}
