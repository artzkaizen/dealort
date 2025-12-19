import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ProductForm,
  type ProductFormData,
} from "@/components/dashboard/product-form";
import { authClient } from "@/lib/auth-client";
import { slugify } from "@/lib/utils";
import { client, orpc } from "@/utils/orpc";

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

    const organizationMetadata = await client.products.getBySlug({
      slug: params.slug,
    });

    const organization = {
      ...fullOrganization?.data,
      references: {
        webUrl: organizationMetadata.url,
        xUrl: organizationMetadata.xURL,
        linkedinUrl: organizationMetadata.linkedinURL,
        sourceCodeUrl: organizationMetadata.sourceCodeURL,
      },
    };
    console.log(organization);
    if (!organization) {
      throw redirect({
        to: "/dashboard/products",
      });
    }

    // Check if current user is owner
    const isOwner = organization.members?.some(
      (member) => member.userId === session.user.id && member.role === "owner"
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

  const syncMetadataMutation = useMutation({
    ...orpc.products.syncOrganizationMetadata.mutationOptions(),
  });

  // Infer a defined type on the organization to prevent type errors

  const betterOrg = organization as typeof organization & {
    isDev: boolean;
    releaseDate: Date;
    isListed: boolean;
    tagline: string;
    description: string;
    category: string[];
    isOpenSource: boolean;
    gallery: string[];
  };

  // Transform organization data to form format
  const initialValues: Partial<ProductFormData> = {
    getStarted: {
      url: betterOrg?.references?.webUrl || "",
      isDev: betterOrg?.isDev ?? false,
      releaseDate: betterOrg?.releaseDate
        ? new Date(betterOrg?.releaseDate)
        : undefined,
      isListed: betterOrg?.isListed ?? false,
    },
    productInformation: {
      name: betterOrg?.name ?? "",
      tagline: betterOrg?.tagline ?? "",
      description: betterOrg?.description ?? "",
      category: betterOrg?.category ?? [],
      xUrl: betterOrg?.references?.xUrl ?? "",
      linkedinUrl: betterOrg?.references?.linkedinUrl ?? "",
      isOpenSource: betterOrg?.isOpenSource ?? false,
      sourceCodeUrl: betterOrg?.references?.sourceCodeUrl ?? "",
    },
    media: {
      logo: betterOrg?.logo ? [betterOrg.logo] : [],
      gallery: betterOrg?.gallery ? [betterOrg.gallery] : [],
    },
  };

  console.log(initialValues);

  function buildGetStartedData(data: ProductFormData): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};
    if (typeof data.getStarted.isDev === "boolean")
      updateData.isDev = data.getStarted.isDev;
    if (typeof data.getStarted.isListed === "boolean")
      updateData.isListed = data.getStarted.isListed;
    return updateData;
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Necessary for building update object
  function buildProductInfoData(
    data: ProductFormData
  ): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};
    if (data.productInformation.name) {
      updateData.name = data.productInformation.name;
      if (data.productInformation.name !== organization?.name) {
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
      // Get logo and gallery URLs
      const logoUrl = data.media.logoUrls?.[0] || betterOrg?.logo;
      const galleryUrls = data.media.galleryUrls || betterOrg?.gallery || [];

      const updateData = {
        ...buildGetStartedData(data),
        ...buildProductInfoData(data),
        ...(logoUrl && { logo: logoUrl }),
        ...(galleryUrls.length > 0 && { gallery: galleryUrls }),
      };

      // Update organization fields (including logo and gallery)
      await authClient.organization.update(
        {
          organizationId: organization?.id ?? "",
          data: updateData,
        },
        {
          onError: (error) => {
            console.error(error);
            toast.error(
              error.error?.message ||
                error.error?.statusText ||
                "Failed to update product"
            );
          },
        }
      );

      // Sync URLs and release date to separate table
      await syncMetadataMutation.mutateAsync({
        organizationId: organization?.id ?? "",
        // Only send valid URLs; omit empty strings so Zod url() passes
        url: data.getStarted.url || undefined,
        xUrl: data.productInformation.xUrl || undefined,
        linkedinUrl: data.productInformation.linkedinUrl || undefined,
        sourceCodeUrl: data.productInformation.sourceCodeUrl || undefined,
        releaseDateMs: data.getStarted.releaseDate
          ? data.getStarted.releaseDate.getTime()
          : undefined,
      });

      toast.success("Product updated successfully");
      router.navigate({
        to: "/dashboard/products/$slug",
        params: { slug: organization?.slug ?? "" },
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update product");
    }
  }

  function handleCancel() {
    router.navigate({
      to: "/dashboard/products/$slug",
      params: { slug: organization?.slug ?? "" },
    });
  }

  return (
    <main className="min-h-screen gap-0">
      <section className="min-h-screen">
        <div className="flex flex-col gap-2 px-2 py-3">
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
