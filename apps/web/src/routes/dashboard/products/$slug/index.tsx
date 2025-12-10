import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Edit,
  ExternalLinkIcon,
  FileText,
  Mail,
  Trash2,
  Users,
} from "lucide-react";
import { BetterAuthActionButton } from "@/components/better-auth-action-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/products/$slug/")({
  loader: async ({ params }) => {
    const organization = await authClient.organization.getFullOrganization({
      query: {
        organizationSlug: params.slug,
      },
    });
    const { data: session } = await authClient.getSession();
    return { organization, session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { organization, session } = Route.useLoaderData();
  const router = useRouter();
  const { data: currentSession } = authClient.useSession();

  if (!organization?.data) {
    return <div>Organization not found</div>;
  }

  const org = organization.data;
  const userId = currentSession?.user?.id || session?.user?.id;

  // Check if current user is owner
  const isOwner = org.members?.some(
    (member) => member.userId === userId && member.role === "owner"
  );

  const gallery = (org.gallery as string[]) || [];

  async function handleDeleteOrganization() {
    const result = await authClient.organization.delete({
      organizationId: org.id,
    });
    if (!result.error) {
      router.navigate({ to: "/dashboard/products" });
    }
    return result;
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4">
      <Tabs className="w-full" defaultValue="details">
        <TabsList className="w-full justify-start">
          <TabsTrigger className="gap-2" value="details">
            <FileText className="size-4" />
            <span className="hidden md:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger className="gap-2" value="members">
            <Users className="size-4" />
            <span className="hidden md:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger className="gap-2" value="invitations">
            <Mail className="size-4" />
            <span className="hidden md:inline">Invitations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="details">
          {/* Header Section - Chrome Web Store style */}
          <div className="flex flex-col gap-6 rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Avatar className="size-20 shrink-0">
                <AvatarImage alt={org.name} src={org.logo ?? ""} />
                <AvatarFallback className="text-lg">
                  {org.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h1 className="font-semibold text-2xl leading-tight">
                      {org.name}
                    </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {org.tagline}
                    </p>
                  </div>
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          params={{ slug: org.slug }}
                          to="/dashboard/products/$slug/edit"
                        >
                          <Edit className="mr-2 size-4" />
                          Edit
                        </Link>
                      </Button>
                      <BetterAuthActionButton
                        action={handleDeleteOrganization}
                        areYouSureDescription="This will permanently delete the organization and all associated data. This action cannot be undone."
                        requireAreYouSure
                        size="sm"
                        successMessage="Organization deleted successfully"
                        variant="destructive"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </BetterAuthActionButton>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {org.description && (
              <div className="mt-4">
                <p className="text-muted-foreground leading-relaxed">
                  {org.description}
                </p>
              </div>
            )}

            {/* Gallery Carousel */}
            {gallery.length > 0 && (
              <div className="mt-6">
                <Carousel className="w-full">
                  <CarouselContent>
                    {gallery.map((imageUrl, index) => (
                      <CarouselItem key={index}>
                        <div className="flex items-center justify-center rounded-lg border bg-muted p-2">
                          <img
                            alt={`Gallery image ${index + 1}`}
                            className="max-h-96 w-full rounded-lg object-contain"
                            src={imageUrl}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {gallery.length > 1 && (
                    <>
                      <CarouselPrevious />
                      <CarouselNext />
                    </>
                  )}
                </Carousel>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-xl">Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-muted-foreground text-sm">
                  Product URL
                </span>
                {org.url ? (
                  <a
                    className="flex items-center gap-1 text-primary hover:underline"
                    href={org.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {org.url}
                    <ExternalLinkIcon className="size-4" />
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-medium text-muted-foreground text-sm">
                  X (Twitter) URL
                </span>
                {org.xURL ? (
                  <a
                    className="flex items-center gap-1 text-primary hover:underline"
                    href={org.xURL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {org.xURL}
                    <ExternalLinkIcon className="size-4" />
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-medium text-muted-foreground text-sm">
                  LinkedIn URL
                </span>
                {org.linkedinURL ? (
                  <a
                    className="flex items-center gap-1 text-primary hover:underline"
                    href={org.linkedinURL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {org.linkedinURL}
                    <ExternalLinkIcon className="size-4" />
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-medium text-muted-foreground text-sm">
                  Source Code URL
                </span>
                {org.sourceCodeURL ? (
                  <a
                    className="flex items-center gap-1 text-primary hover:underline"
                    href={org.sourceCodeURL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {org.sourceCodeURL}
                    <ExternalLinkIcon className="size-4" />
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-medium text-muted-foreground text-sm">
                  Release Date
                </span>
                {org.releaseDate ? (
                  <span className="text-sm">
                    {formatDate(new Date(org.releaseDate))}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-medium text-muted-foreground text-sm">
                  Status
                </span>
                <span className="text-sm">
                  {org.isDev ? "In Development" : "Production Ready"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-medium text-muted-foreground text-sm">
                  Open Source
                </span>
                <span className="text-sm">
                  {org.isOpenSource ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-medium text-muted-foreground text-sm">
                  Categories
                </span>
                <div className="flex flex-wrap gap-2">
                  {(org.category as string[])?.length > 0 ? (
                    (org.category as string[]).map((cat) => (
                      <span
                        className="rounded bg-muted px-2 py-1 font-medium text-xs"
                        key={cat}
                      >
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="members">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-xl">Members</h2>
            {org.members && org.members.length > 0 ? (
              <div className="space-y-2">
                {org.members.map((member) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-3"
                    key={member.id}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarFallback>
                          {member.user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user?.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {member.user?.email}
                        </p>
                      </div>
                    </div>
                    <span className="rounded bg-muted px-2 py-1 font-medium text-xs capitalize">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No members found.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="invitations">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-xl">Invitations</h2>
            {org.invitations && org.invitations.length > 0 ? (
              <div className="space-y-2">
                {org.invitations.map((invitation) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-3"
                    key={invitation.id}
                  >
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-muted-foreground text-sm">
                        Invited by {invitation.user?.name}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded px-2 py-1 font-medium text-xs capitalize",
                        invitation.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : invitation.status === "accepted"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      )}
                    >
                      {invitation.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No invitations found.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
