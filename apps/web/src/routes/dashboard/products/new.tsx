import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ProductForm,
  type ProductFormData,
} from "@/components/dashboard/product-form";
import { authClient } from "@/lib/auth-client";
import { slugify } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/products/new")({
  component: RouteComponent,
});

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
      // Upload files first
      let logoUrl: string | undefined;
      let galleryUrls: string[] = [];

      if (data.media.logoUrls && data.media.logoUrls.length > 0) {
        logoUrl = data.media.logoUrls[0];
      }

      if (data.media.galleryUrls && data.media.galleryUrls.length > 0) {
        galleryUrls = data.media.galleryUrls;
      }

      // Build the create payload matching BetterAuth schema exactly
      const createPayload: Record<string, unknown> = {
        name: data.productInformation.name,
        slug,
        isDev: Boolean(data.getStarted.isDev),
        tagline: data.productInformation.tagline,
        category: Array.isArray(data.productInformation.category)
          ? data.productInformation.category
          : [],
        isOpenSource: Boolean(data.productInformation.isOpenSource),
        rating: 0,
        impressions: 0,
        isListed: Boolean(data.getStarted.isListed),
      };

      // Only add optional fields if they have values (BetterAuth may reject empty strings for optional fields)
      if (data.productInformation.description) {
        createPayload.description = data.productInformation.description;
      }
      if (logoUrl) {
        createPayload.logo = logoUrl;
      }
      if (galleryUrls.length > 0) {
        createPayload.gallery = galleryUrls;
      }
      // BetterAuth date type expects ISO string format
      // if (data.getStarted.releaseDate) {
      //   createPayload.releaseDate = new Date(
      //     data.getStarted.releaseDate
      //   ).getTime();
      // }

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

      if (result.data?.id) {
        // Sync URLs to separate table
        await syncMetadataMutation.mutateAsync({
          organizationId: result.data.id,
          // Only send valid URLs; omit empty strings so Zod url() passes
          url: data.getStarted.url || undefined,
          xUrl: data.productInformation.xUrl || undefined,
          linkedinUrl: data.productInformation.linkedinUrl || undefined,
          sourceCodeUrl: data.productInformation.sourceCodeUrl || undefined,
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
