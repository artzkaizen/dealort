import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ProductForm,
  type ProductFormData,
} from "@/components/dashboard/product-form";
import { authClient } from "@/lib/auth-client";
import { slugify } from "@/lib/utils";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/products/new")({
  component: RouteComponent,
});

interface SyncMetadataPayload {
  organizationId: string;
  url?: string;
  xUrl?: string;
  linkedinUrl?: string;
  sourceCodeUrl?: string;
  releaseDateMs?: number | null;
}

function RouteComponent() {
  const router = useRouter();

  const syncMetadataMutation = useMutation({
    mutationFn: async (payload: SyncMetadataPayload) =>
      (
        client.products as {
          syncOrganizationMetadata: (
            payload: SyncMetadataPayload
          ) => Promise<{ success: boolean }>;
        }
      ).syncOrganizationMetadata(payload),
  });

  /**
   * Extract media URLs from form data
   */
  function extractMediaUrls(data: ProductFormData): {
    logoUrl: string | undefined;
    galleryUrls: string[];
  } {
    const logoUrl =
      data.media.logoUrls && data.media.logoUrls.length > 0
        ? data.media.logoUrls[0]
        : undefined;
    const galleryUrls =
      data.media.galleryUrls && data.media.galleryUrls.length > 0
        ? data.media.galleryUrls
        : [];

    return { logoUrl, galleryUrls };
  }

  /**
   * Build organization create payload
   */
  function buildCreatePayload(
    data: ProductFormData,
    slug: string,
    logoUrl: string | undefined,
    galleryUrls: string[]
  ) {
    return {
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
      ...(data.productInformation.description && {
        description: data.productInformation.description,
      }),
      ...(logoUrl && { logo: logoUrl }),
      ...(galleryUrls.length > 0 && { gallery: galleryUrls }),
    };
  }

  /**
   * Build metadata sync payload with only valid URLs and release date
   */
  function buildMetadataPayload(organizationId: string, data: ProductFormData) {
    return {
      organizationId,
      ...(data.getStarted.url && { url: data.getStarted.url }),
      ...(data.productInformation.xUrl && {
        xUrl: data.productInformation.xUrl,
      }),
      ...(data.productInformation.linkedinUrl && {
        linkedinUrl: data.productInformation.linkedinUrl,
      }),
      ...(data.productInformation.sourceCodeUrl && {
        sourceCodeUrl: data.productInformation.sourceCodeUrl,
      }),
      // Always include releaseDateMs to handle clearing (null) or setting a date
      releaseDateMs: data.getStarted.releaseDate
        ? data.getStarted.releaseDate.getTime()
        : null,
    };
  }

  async function handleSubmit(data: ProductFormData) {
    if (data.media.logo.length === 0) {
      toast.error("Please upload at least one logo");
      return;
    }

    const slug = slugify(data.productInformation.name);

    try {
      const { logoUrl, galleryUrls } = extractMediaUrls(data);
      const createPayload = buildCreatePayload(
        data,
        slug,
        logoUrl,
        galleryUrls
      );

      const result = await authClient.organization.create(createPayload, {
        onError: (error) => {
          toast.error(
            error.error?.message ||
              error.error?.statusText ||
              "Failed to create product"
          );
        },
      });

      if (result.data?.id) {
        const metadataPayload = buildMetadataPayload(result.data.id, data);
        await syncMetadataMutation.mutateAsync(metadataPayload);

        toast.success("Product created successfully");
        router.navigate({
          to: "/dashboard/products/$slug",
          params: { slug },
        });
      }
    } catch (_error) {
      toast.error("Failed to create product");
    }
  }

  return (
    <main className="relative h-fit gap-0">
      <section className="min-h-screen">
        <div className="z-5! flex flex-col gap-2 px-2 py-3">
          <ProductForm mode="new" onSubmit={handleSubmit} />
        </div>
      </section>

      <aside
        aria-hidden="true"
        className="max-md:hidden! pointer-events-none absolute top-0 right-0 z-0 h-full w-[40%] opacity-70"
        style={{
          inset: "0 0 0 auto",
          height: "100%", // Fill the height of the containing element
          minHeight: 0, // Allow shrinking
          maxHeight: "100%",
        }}
      >
        <motion.div
          animate={{
            backgroundPosition: ["top left", "bottom left"],
          }}
          className="h-full w-full"
          style={{
            position: "relative",
            overflow: "hidden",
            height: "100%", // Full height to parent
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 10,
            ease: "linear",
          }}
        >
          <div
            className={
              "absolute inset-0 grid h-full w-full grid-cols-6 grid-rows-8"
            }
            style={{
              height: "100%",
              width: "100%",
            }}
          >
            {Array.from({ length: 6 * 8 }).map((_, idx) => {
              const row = Math.floor(idx / 12);
              const col = idx % 12;
              return (
                <div
                  className="border border-secondary/70"
                  key={`cell-${col}-${row}`}
                />
              );
            })}
          </div>
        </motion.div>
      </aside>
    </main>
  );
}
