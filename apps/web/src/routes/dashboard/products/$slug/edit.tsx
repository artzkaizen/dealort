import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { ProductForm, type ProductFormData } from "@/components/product-form";
import { authClient } from "@/lib/auth-client";
import { slugify } from "@/lib/utils";

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
  };

  // Transform organization data to form format
  const initialValues: Partial<ProductFormData> = {
    getStarted: {
      url: org.url || "",
      isDev: org.isDev ?? false,
      releaseDate: org.releaseDate ? new Date(org.releaseDate) : undefined,
    },
    productInformation: {
      name: org.name || "",
      tagline: org.tagline || "",
      description: org.description || "",
      category: (org.category as string[]) || [],
      xUrl: org.xURL || "",
      linkedinUrl: org.linkedinURL || "",
      isOpenSource: org.isOpenSource ?? false,
      sourceCodeUrl: org.sourceCodeURL || "",
    },
    media: {
      logo: [],
      gallery: [],
    },
  };

  function buildGetStartedData(data: ProductFormData): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};
    if (data.getStarted.url) updateData.url = data.getStarted.url;
    if (typeof data.getStarted.isDev === "boolean")
      updateData.isDev = data.getStarted.isDev;
    if (data.getStarted.releaseDate)
      updateData.releaseDate = data.getStarted.releaseDate;
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
    if (data.productInformation.xUrl)
      updateData.xURL = data.productInformation.xUrl;
    if (data.productInformation.linkedinUrl)
      updateData.linkedinURL = data.productInformation.linkedinUrl;
    if (typeof data.productInformation.isOpenSource === "boolean")
      updateData.isOpenSource = data.productInformation.isOpenSource;
    if (data.productInformation.sourceCodeUrl)
      updateData.sourceCodeURL = data.productInformation.sourceCodeUrl;
    return updateData;
  }

  function buildUpdateData(
    data: ProductFormData,
    logoUrl: string | undefined,
    galleryUrls: string[]
  ): Record<string, unknown> {
    return {
      ...buildGetStartedData(data),
      ...buildProductInfoData(data),
      ...(logoUrl && { logo: logoUrl }),
      ...(galleryUrls.length > 0 && { gallery: galleryUrls }),
    };
  }

  async function handleSubmit(data: ProductFormData) {
    try {
      const logoUrl = data.media.logoUrls?.[0] || org.logo;
      const galleryUrls =
        data.media.galleryUrls || (org.gallery as string[]) || [];
      const updateData = buildUpdateData(data, logoUrl, galleryUrls);

      await authClient.organization.update(
        {
          organizationId: org.id,
          data: updateData,
        },
        {
          onSuccess: () => {
            toast.success("Product updated successfully");
            router.navigate({
              to: "/dashboard/products/$slug",
              params: { slug: org.slug },
            });
          },
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
