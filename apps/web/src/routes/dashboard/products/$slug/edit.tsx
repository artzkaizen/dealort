import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  ProductForm,
  type ProductFormData,
} from "@/components/dashboard/product-form";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Image as ImageComponent } from "@/components/ui/image";
import { authClient } from "@/lib/auth-client";
import {
  getOrganizationGallery,
  getOrganizationLogo,
} from "@/lib/organization-utils";
import { slugify } from "@/lib/utils";
import type { OrganizationWithMetadata } from "@/types/organization";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/products/$slug/edit")({
  loader: async ({ params }) => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      throw redirect({
        to: "/dashboard/products",
      });
    }

    const fullOrganization = await authClient.organization.getFullOrganization({
      query: {
        organizationSlug: params.slug,
      },
    });

    if (!fullOrganization?.data) {
      throw redirect({
        to: "/dashboard/products",
      });
    }

    const organizationMetadata = await (
      client.products as {
        getBySlug: (params: { slug: string }) => Promise<{
          url: string | null;
          xURL: string | null;
          linkedinURL: string | null;
          sourceCodeURL: string | null;
        }>;
      }
    ).getBySlug({
      slug: params.slug,
    });

    const organization: OrganizationWithMetadata = {
      ...fullOrganization.data,
      references: {
        webUrl: organizationMetadata.url ?? null,
        xUrl: organizationMetadata.xURL ?? null,
        linkedinUrl: organizationMetadata.linkedinURL ?? null,
        sourceCodeUrl: organizationMetadata.sourceCodeURL ?? null,
      },
    };

    // Check if current user is owner
    const isOwner = organization.members?.some(
      (member: { userId: string; role: string }) =>
        member.userId === session.user.id && member.role === "owner"
    );

    if (!isOwner) {
      throw redirect({
        to: "/dashboard/products/$slug",
        params: { slug: params.slug },
      });
    }

    return { organization, session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { organization } = Route.useLoaderData();
  const router = useRouter();

  // Track existing URLs and which gallery URLs should be removed
  const initialLogoUrl = getOrganizationLogo(organization);
  const initialGalleryUrls = getOrganizationGallery(organization);

  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(
    initialLogoUrl
  );
  const [currentGalleryUrls] = useState<string[]>(initialGalleryUrls);
  const [removedGalleryUrls, setRemovedGalleryUrls] = useState<Set<string>>(
    new Set()
  );

  interface SyncMetadataPayload {
    organizationId: string;
    url?: string;
    xUrl?: string;
    linkedinUrl?: string;
    sourceCodeUrl?: string;
    releaseDateMs?: number | null;
  }

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
   * Determine final logo URL from form data or current logo
   */
  function getLogoUrl(data: ProductFormData): string | undefined {
    return data.media.logoUrls?.[0] ?? currentLogoUrl ?? undefined;
  }

  /**
   * Merge existing gallery URLs (excluding removed ones) with new URLs from form
   */
  function getGalleryUrls(data: ProductFormData): string[] {
    const existingUrls = currentGalleryUrls.filter(
      (url) => !removedGalleryUrls.has(url)
    );
    const newGalleryUrls = data.media.galleryUrls ?? [];
    return [...existingUrls, ...newGalleryUrls];
  }

  /**
   * Build metadata sync payload with only valid URLs and release date
   */
  function buildMetadataPayload(
    organizationId: string,
    data: ProductFormData
  ): SyncMetadataPayload {
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

  // Transform organization data to form format
  const initialValues: Partial<ProductFormData> = {
    getStarted: {
      url: organization.references?.webUrl ?? "",
      isDev: organization.isDev ?? false,
      releaseDate: organization.releaseDate
        ? new Date(organization.releaseDate)
        : undefined,
      isListed: organization.isListed ?? false,
    },
    productInformation: {
      name: organization.name ?? "",
      tagline: organization.tagline ?? "",
      description: organization.description ?? "",
      category: Array.isArray(organization.category)
        ? organization.category
        : [],
      xUrl: organization.references?.xUrl ?? "",
      linkedinUrl: organization.references?.linkedinUrl ?? "",
      isOpenSource: organization.isOpenSource ?? false,
      sourceCodeUrl: organization.references?.sourceCodeUrl ?? "",
    },
    media: {
      logo: [], // Empty initially - user can add new file
      gallery: [], // Empty initially - user can add new files
      logoUrls: currentLogoUrl ? [currentLogoUrl] : [],
      galleryUrls: currentGalleryUrls.filter(
        (url) => !removedGalleryUrls.has(url)
      ),
    },
  };

  function buildGetStartedData(data: ProductFormData): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};
    if (typeof data.getStarted.isDev === "boolean")
      updateData.isDev = data.getStarted.isDev;
    if (typeof data.getStarted.isListed === "boolean")
      updateData.isListed = data.getStarted.isListed;
    return updateData;
  }

  function buildProductInfoData(
    data: ProductFormData
  ): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};
    if (data.productInformation.name) {
      updateData.name = data.productInformation.name;
      if (data.productInformation.name !== organization.name) {
        updateData.slug = slugify(data.productInformation.name);
      }
    }
    if (data.productInformation.tagline)
      updateData.tagline = data.productInformation.tagline;
    if (data.productInformation.description)
      updateData.description = data.productInformation.description;
    if (
      data.productInformation.category &&
      data.productInformation.category.length > 0
    )
      updateData.category = data.productInformation.category;
    if (typeof data.productInformation.isOpenSource === "boolean")
      updateData.isOpenSource = data.productInformation.isOpenSource;
    return updateData;
  }

  async function handleSubmit(data: ProductFormData) {
    try {
      const logoUrl = getLogoUrl(data);
      const galleryUrls = getGalleryUrls(data);

      const updateData = {
        ...buildGetStartedData(data),
        ...buildProductInfoData(data),
        ...(logoUrl !== undefined && { logo: logoUrl }),
        ...(galleryUrls.length > 0 && { gallery: galleryUrls }),
      };

      // Update organization fields (including logo and gallery)
      await authClient.organization.update(
        {
          organizationId: organization.id,
          data: updateData,
        },
        {
          onError: (error) => {
            toast.error(
              error.error?.message ||
                error.error?.statusText ||
                "Failed to update product"
            );
          },
        }
      );

      // Sync URLs and release date to separate table
      const metadataPayload = buildMetadataPayload(organization.id, data);
      await syncMetadataMutation.mutateAsync(metadataPayload);

      toast.success("Product updated successfully");
      router.navigate({
        to: "/dashboard/products/$slug",
        params: { slug: organization.slug ?? "" },
      });
    } catch (_error) {
      toast.error("Failed to update product");
    }
  }

  function handleCancel() {
    router.navigate({
      to: "/dashboard/products/$slug",
      params: { slug: organization.slug ?? "" },
    });
  }

  const handleRemoveGalleryUrl = (url: string) => {
    setRemovedGalleryUrls((prev) => new Set([...prev, url]));
  };

  const handleRemoveLogo = () => {
    setCurrentLogoUrl(null);
  };

  // Filter out removed gallery URLs for display
  const visibleGalleryUrls = currentGalleryUrls.filter(
    (url) => !removedGalleryUrls.has(url)
  );

  return (
    <main className="min-h-screen gap-0">
      <section className="min-h-screen">
        <div className="flex flex-col gap-2 px-2 py-3">
          {/* Display current logo if exists */}
          {currentLogoUrl && (
            <div className="mb-4 rounded-lg border p-4">
              <p className="mb-2 font-medium text-sm">Current Logo</p>
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage alt="Current logo" src={currentLogoUrl} />
                </Avatar>
                <Button
                  onClick={handleRemoveLogo}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <XIcon className="mr-2 size-4" />
                  Remove
                </Button>
              </div>
              <p className="mt-2 text-muted-foreground text-xs">
                Select a new logo below to replace this one
              </p>
            </div>
          )}

          {/* Display current gallery if exists */}
          {visibleGalleryUrls.length > 0 && (
            <div className="mb-4 rounded-lg border p-4">
              <p className="mb-2 font-medium text-sm">Current Gallery</p>
              <Carousel className="w-full">
                <CarouselContent>
                  {visibleGalleryUrls.map((url, index) => (
                    <CarouselItem className="basis-1/3" key={url}>
                      <div className="relative">
                        <ImageComponent
                          alt={`Gallery ${index + 1}`}
                          className="h-32 w-full rounded-lg border bg-muted object-cover"
                          src={url}
                        />
                        <Button
                          className="absolute top-2 right-2 size-6"
                          onClick={() => handleRemoveGalleryUrl(url)}
                          size="icon"
                          type="button"
                          variant="destructive"
                        >
                          <XIcon className="size-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              <p className="mt-2 text-muted-foreground text-xs">
                Remove images above or add new ones below
              </p>
            </div>
          )}

          <ProductForm
            initialValues={initialValues}
            mode="edit"
            onCancel={handleCancel}
            onSubmit={handleSubmit}
          />
        </div>
      </section>
    </main>
  );
}
