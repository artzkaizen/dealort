import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ProductForm,
  type ProductFormData,
} from "@/components/dashboard/product-form";
import { authClient } from "@/lib/auth-client";
import { slugify } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/products/$slug/edit")({
  loader: async ({ params }) => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      throw redirect({
        to: "/dashboard/products",
      });
    }

    const organization = await authClient.organization.getFullOrganization({
      query: {
        organizationSlug: params.slug,
      },
    });

    if (!organization?.data) {
      throw redirect({
        to: "/dashboard/products",
      });
    }

    // Check if current user is owner
    const isOwner = organization.data.members?.some(
      (member) => member.userId === session.user.id && member.role === "owner"
    );

    if (!isOwner) {
      throw redirect({
        to: "/dashboard/products/$slug",
        params: { slug: params.slug },
      });
    }

    return { organization: organization.data, session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { organization } = Route.useLoaderData();
  const router = useRouter();

  const syncMetadataMutation = useMutation({
    ...orpc.products.syncOrganizationMetadata.mutationOptions(),
  });

  // Type assertion for organization with additional fields
  const org = organization as typeof organization & {
    url?: string;
    isDev?: boolean;
    releaseDate?: number | Date;
    tagline?: string;
    description?: string;
    category?: string[];
    xURL?: string;
    linkedinURL?: string;
    isOpenSource?: boolean;
    sourceCodeURL?: string;
    logo?: string;
    gallery?: string[];
    references?: Array<{
      webUrl: string;
      xUrl: string;
      linkedinUrl?: string | null;
      sourceCodeUrl?: string | null;
    }>;
    assets?: Array<{
      logo?: string | null;
      gallery?: string[] | null;
    }>;
  };

  // Get references and assets from normalized tables
  const ref = org.references?.[0];
  const asset = org.assets?.[0];

  // Transform organization data to form format
  const initialValues: Partial<ProductFormData> = {
    getStarted: {
      url: ref?.webUrl || org.url || "",
      isDev: org.isDev ?? false,
      releaseDate: org.releaseDate ? new Date(org.releaseDate) : undefined,
    },
    productInformation: {
      name: org.name || "",
      tagline: org.tagline || "",
      description: org.description || "",
      category: (org.category as string[]) || [],
      xUrl: ref?.xUrl || org.xURL || "",
      linkedinUrl: ref?.linkedinUrl || org.linkedinURL || "",
      isOpenSource: org.isOpenSource ?? false,
      sourceCodeUrl: ref?.sourceCodeUrl || org.sourceCodeURL || "",
    },
    media: {
      logo: [],
      gallery: [],
    },
  };

  function buildGetStartedData(data: ProductFormData): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};
    if (typeof data.getStarted.isDev === "boolean")
      updateData.isDev = data.getStarted.isDev;
    if (data.getStarted.releaseDate)
      updateData.releaseDate = new Date(
        data.getStarted.releaseDate
      ).toISOString();
    return updateData;
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Necessary for building update object
  function buildProductInfoData(
    data: ProductFormData
  ): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};
    if (data.productInformation.name) {
      updateData.name = data.productInformation.name;
      if (data.productInformation.name !== org.name) {
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
      const updateData = {
        ...buildGetStartedData(data),
        ...buildProductInfoData(data),
      };

      // Update organization basic fields
      await authClient.organization.update(
        {
          organizationId: org.id,
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

      // Sync metadata (URLs and assets) to separate tables
      const logoUrl = data.media.logoUrls?.[0] || asset?.logo || org.logo;
      const galleryUrls =
        data.media.galleryUrls ||
        (asset?.gallery as string[]) ||
        (org.gallery as string[]) ||
        [];

      await syncMetadataMutation.mutateAsync({
        organizationId: org.id,
        url: data.getStarted.url,
        xUrl: data.productInformation.xUrl,
        linkedinUrl: data.productInformation.linkedinUrl,
        sourceCodeUrl: data.productInformation.sourceCodeUrl,
        logo: logoUrl,
        gallery: galleryUrls.length > 0 ? galleryUrls : undefined,
      });

      toast.success("Product updated successfully");
      router.navigate({
        to: "/dashboard/products/$slug",
        params: { slug: org.slug },
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update product");
    }
  }

  function handleCancel() {
    router.navigate({
      to: "/dashboard/products/$slug",
      params: { slug: org.slug },
    });
  }

  return (
    <main className="grid min-h-screen gap-0 lg:grid-cols-2">
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
