import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ProductForm, type ProductFormData } from "@/components/product-form";
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
import { FieldLabel } from "@/components/ui/field";
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
} from "@/components/ui/tags-input";
import { authClient } from "@/lib/auth-client";
import { slugify } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/products/new")({
  component: RouteComponent,
});

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

function RouteComponent() {
  const router = useRouter();

  async function handleSubmit(data: ProductFormData) {
    if (data.media.logo.length === 0) {
      toast.error("Please upload at least one logo");
      return;
    }

    const slug = slugify(data.productInformation.name);

    await authClient.organization.create(
      {
        name: data.productInformation.name,
        slug,
        logo:
          data.media.logoUrls && data.media.logoUrls.length > 0
            ? data.media.logoUrls[0]
            : "",
        url: data.getStarted.url,
        isDev: data.getStarted.isDev,
        tagline: data.productInformation.tagline,
        description: data.productInformation.description,
        category: data.productInformation.category,
        xURL: data.productInformation.xUrl,
        linkedinURL: data.productInformation.linkedinUrl ?? "",
        isOpenSource: data.productInformation.isOpenSource,
        sourceCodeURL: data.productInformation.sourceCodeUrl ?? "",
        rating: 0,
        impressions: 0,
        gallery: data.media.galleryUrls || [],
        releaseDate: data.getStarted.releaseDate,
      } as Parameters<typeof authClient.organization.create>[0],
      {
        onSuccess: () => {
          toast.success("Product created successfully");
          router.navigate({
            to: "/dashboard/products/$slug",
            params: { slug },
          });
        },
        onError: (error) => {
          console.log(error);
          toast.error(
            error.error?.message ||
              error.error?.statusText ||
              "Failed to create product"
          );
        },
      }
    );
  }

  return (
    <main className="grid min-h-screen gap-0 lg:grid-cols-2">
      <section className="min-h-screen">
        <div className="flex flex-col gap-2 px-2 py-3">
          <ProductForm mode="new" onSubmit={handleSubmit} />
        </div>
      </section>
    </main>
  );
}
