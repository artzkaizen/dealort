import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  ProductForm,
  type ProductFormData,
} from "@/components/dashboard/product-form";
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
import { categories } from "@/utils/constants";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/products/new")({
  component: RouteComponent,
});

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
          {categories.map((category) => (
            <ComboboxItem key={category} outset value={category}>
              {category}
            </ComboboxItem>
          ))}
      </ComboboxContent>
    </Combobox>
  );
}

function RouteComponent() {
  const router = useRouter();

  const syncMetadataMutation = useMutation({
    ...orpc.products.syncOrganizationMetadata.mutationOptions(),
  });

  async function handleSubmit(data: ProductFormData) {
    if (data.media.logo.length === 0) {
      toast.error("Please upload at least one logo");
      return;
    }

    const slug = slugify(data.productInformation.name);

    try {
      // Build the create payload matching BetterAuth schema exactly
      const createPayload = {
        name: data.productInformation.name,
        slug,
        isDev: Boolean(data.getStarted.isDev),
        tagline: data.productInformation.tagline,
        description: data.productInformation.description ?? "",
        category: Array.isArray(data.productInformation.category)
          ? data.productInformation.category
          : [],
        isOpenSource: Boolean(data.productInformation.isOpenSource),
        rating: 0,
        impressions: 0,
        ...(data.getStarted.releaseDate && {
          releaseDate: new Date(data.getStarted.releaseDate).toISOString(),
        }),
      };

      console.log("Creating organization with payload:", createPayload);

      const result = await authClient.organization.create(
        createPayload as Parameters<typeof authClient.organization.create>[0],
        {
          onError: (error) => {
            console.error("Organization create error:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            toast.error(
              error.error?.message ||
                error.error?.statusText ||
                "Failed to create product"
            );
          },
        }
      );

      if (result.data?.organization?.id) {
        // Sync metadata to separate tables
        await syncMetadataMutation.mutateAsync({
          organizationId: result.data.organization.id,
          url: data.getStarted.url,
          xUrl: data.productInformation.xUrl,
          linkedinUrl: data.productInformation.linkedinUrl,
          sourceCodeUrl: data.productInformation.sourceCodeUrl,
          logo:
            data.media.logoUrls && data.media.logoUrls.length > 0
              ? data.media.logoUrls[0]
              : undefined,
          gallery: data.media.galleryUrls || undefined,
        });

        toast.success("Product created successfully");
        router.navigate({
          to: "/dashboard/products/$slug",
          params: { slug },
        });
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    }
  }

  return (
    <main className="grid min-h-screen gap-0">
      <section className="min-h-screen">
        <div className="flex flex-col gap-2 px-2 py-3">
          <ProductForm mode="new" onSubmit={handleSubmit} />
        </div>
      </section>
    </main>
  );
}
