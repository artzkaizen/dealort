import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Edit,
  EllipsisIcon,
  ExternalLinkIcon,
  FileText,
  Mail,
  MailPlusIcon,
  PlusIcon,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { BetterAuthActionButton } from "@/components/better-auth-action-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";
import {
  getOrganizationCategory,
  getOrganizationDescription,
  getOrganizationGallery,
  getOrganizationReleaseDate,
  getOrganizationTagline,
  isOrganizationInDev,
  isOrganizationOpenSource,
} from "@/lib/organization-utils";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

const MEMBER_LIMIT = 15;

const invitationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

/**
 * Helper to get invitation status badge className
 */
function getInvitationStatusClassName(status: string): string {
  if (status === "pending") {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  }
  if (status === "accepted") {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  }
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
}

export const Route = createFileRoute("/dashboard/products/$slug/")({
  loader: async ({ params }) => {
    const organization = await authClient.organization.getFullOrganization({
      query: {
        organizationSlug: params.slug,
      },
    });
    // Get full product data with references (use raw ORPC client, not tanstack utils)
    const productData = await (
      client.products as {
        getBySlug: (params: { slug: string }) => Promise<{
          url: string | null;
          xURL: string | null;
          linkedinURL: string | null;
          sourceCodeURL: string | null;
          logo: string | null;
          gallery: string[] | null;
        }>;
      }
    ).getBySlug({
      slug: params.slug,
    });
    const { data: session } = await authClient.getSession();
    return { organization, productData, session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { organization, productData, session } = Route.useLoaderData();
  const router = useRouter();
  const { data: currentSession } = authClient.useSession();

  if (!organization?.data) {
    return <div>Organization not found</div>;
  }

  const org = organization.data;
  const filteredInvitations = org.invitations.filter(
    (invitation) => invitation.status !== "canceled"
  );
  const userId = currentSession?.user?.id || session?.user?.id;

  // Check if current user is owner
  const isOwner = org.members?.some(
    (member: { userId: string; role: string }) =>
      member.userId === userId && member.role === "owner"
  );

  // Use productData for URLs (logo and gallery come from organization table)
  const gallery = productData ? getOrganizationGallery(productData) : [];
  const logo = productData?.logo ?? org.logo ?? "";
  const url = productData?.url ?? "";
  const xURL = productData?.xURL ?? "";
  const linkedinURL = productData?.linkedinURL ?? "";
  const sourceCodeURL = productData?.sourceCodeURL ?? "";
  const memberCount = org.members?.length ?? 0;
  const remainingSlots = MEMBER_LIMIT - memberCount;

  async function handleResendInvitation(email: string) {
    const result = await authClient.organization.inviteMember(
      {
        email,
        role: "member",
        resend: true,
        organizationId: org.id,
      },
      {
        onSuccess: () => {
          toast.success("Invitation resent successfully");
          router.invalidate();
        },
        onError: (error) => {
          toast.error(error.error.message || "Failed to resend invitation");
        },
      }
    );
    return result as { error: { message?: string } | null };
  }

  async function handleRevokeInvitation(invitationId: string) {
    const result = await authClient.organization.cancelInvitation(
      {
        invitationId,
      },
      {
        onSuccess: () => {
          toast.success("Invitation was revoked");
          router.invalidate();
        },
        onError: (error) => {
          toast.error(error.error.message || "Failed to revoke");
        },
      }
    );
    return result as { error: { message?: string } | null };
  }

  async function handleRemoveMember(memberId: string) {
    const result = await authClient.organization.removeMember(
      {
        memberIdOrEmail: memberId,
        organizationId: org.id,
      },
      {
        onSuccess: () => {
          toast.success("Member removed successfully");
          router.invalidate();
        },
        onError: (error) => {
          toast.error(error.error.message || "Failed to remove member");
        },
      }
    );
    return result as { error: { message?: string } | null };
  }

  async function handleDeleteOrganization() {
    const result = await authClient.organization.delete({
      organizationId: org.id,
    });
    if (!result.error) {
      router.navigate({ to: "/dashboard/products" });
    }
    return result as { error: { message?: string } | null };
  }

  async function handleLeaveOrganization() {
    const result = await authClient.organization.leave(
      {
        organizationId: org.id,
      },
      {
        onSuccess: () => {
          toast.success("You have left the organization");
          router.navigate({ to: "/dashboard/products" });
        },
        onError: (error) => {
          toast.error(error.error.message || "Failed to leave organization");
        },
      }
    );
    return result as { error: { message?: string } | null };
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
          <ProductDetailsTab
            gallery={gallery}
            handleDeleteOrganization={handleDeleteOrganization}
            isOwner={isOwner}
            linkedinURL={linkedinURL}
            logo={logo}
            org={org}
            sourceCodeURL={sourceCodeURL}
            url={url}
            xURL={xURL}
          />
        </TabsContent>

        <TabsContent className="space-y-4" value="members">
          <MembersTab
            handleLeaveOrganization={handleLeaveOrganization}
            handleRemoveMember={handleRemoveMember}
            isOwner={isOwner}
            org={org}
            remainingSlots={remainingSlots}
            session={session}
          />
        </TabsContent>

        <TabsContent className="space-y-4" value="invitations">
          <InvitationsTab
            filteredInvitations={filteredInvitations}
            handleResendInvitation={handleResendInvitation}
            handleRevokeInvitation={handleRevokeInvitation}
            isOwner={isOwner}
            org={org}
            remainingSlots={remainingSlots}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ProductDetailsTabProps {
  org: NonNullable<
    Awaited<
      ReturnType<typeof authClient.organization.getFullOrganization>
    >["data"]
  >;
  isOwner: boolean;
  gallery: string[];
  logo: string;
  url: string;
  xURL: string;
  linkedinURL: string;
  sourceCodeURL: string;
  handleDeleteOrganization: () => Promise<{
    error: { message?: string } | null;
  }>;
}

function ProductDetailsTab({
  org,
  isOwner,
  gallery,
  logo,
  url,
  xURL,
  linkedinURL,
  sourceCodeURL,
  handleDeleteOrganization,
}: ProductDetailsTabProps) {
  return (
    <>
      {/* Header Section - Chrome Web Store style */}
      <div className="flex flex-col gap-6 rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar className="size-16 shrink-0 sm:size-20">
            <AvatarImage alt={org.name} src={logo} />
            <AvatarFallback className="text-base sm:text-lg">
              {org.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex flex-row items-center gap-2">
                  <h1 className="font-semibold text-2xl capitalize leading-tight">
                    {org.name}
                  </h1>

                  <Badge
                    className="size-fit text-[10px]"
                    variant={
                      "isListed" in org && org.isListed
                        ? "default"
                        : "secondary"
                    }
                  >
                    {"isListed" in org && org.isListed
                      ? "Listed"
                      : "Not Listed"}
                  </Badge>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  {getOrganizationTagline(org)}
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
        {getOrganizationDescription(org) && (
          <div className="mt-4">
            <p className="text-muted-foreground leading-relaxed">
              {getOrganizationDescription(org)}
            </p>
          </div>
        )}

        {/* Gallery Carousel */}
        {gallery.length > 0 && (
          <div className="mt-6">
            <Carousel className="relative w-full">
              <CarouselContent>
                {gallery.map((imageUrl, index) => (
                  <CarouselItem key={imageUrl}>
                    <div className="flex items-center justify-center rounded-lg border bg-muted p-2">
                      <img
                        alt={`Gallery ${index + 1}`}
                        className="max-h-96 w-full rounded-lg object-contain"
                        height={100}
                        src={imageUrl}
                        width={100}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {gallery.length > 1 && (
                <>
                  <CarouselPrevious className="-translate-y-1/2 absolute top-1/2 left-0" />
                  <CarouselNext className="-translate-y-1/2 absolute top-1/2 right-0" />
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
          <div className="flex max-w-sm flex-col gap-1 max-sm:col-span-2">
            <span className="font-medium text-muted-foreground text-sm">
              Product Website
            </span>
            {url ? (
              <a
                className="flex items-center gap-1 text-primary hover:underline"
                href={url}
                rel="noopener noreferrer"
                target="_blank"
              >
                Visit Website
                <ExternalLinkIcon className="size-4" />
              </a>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </div>

          <div className="flex max-w-sm flex-col gap-1 max-sm:col-span-2">
            <span className="font-medium text-muted-foreground text-sm">
              X (Twitter)
            </span>
            {xURL ? (
              <a
                className="flex items-center gap-1 text-primary hover:underline"
                href={xURL}
                rel="noopener noreferrer"
                target="_blank"
              >
                Visit X
                <ExternalLinkIcon className="size-4" />
              </a>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </div>

          <div className="flex max-w-sm flex-col gap-1 max-sm:col-span-2">
            <span className="font-medium text-muted-foreground text-sm">
              LinkedIn
            </span>
            {linkedinURL ? (
              <a
                className="flex items-center gap-1 text-primary hover:underline"
                href={linkedinURL}
                rel="noopener noreferrer"
                target="_blank"
              >
                Visit LinkedIn
                <ExternalLinkIcon className="size-4" />
              </a>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </div>

          <div className="flex max-w-sm flex-col gap-1 max-sm:col-span-2">
            <span className="font-medium text-muted-foreground text-sm">
              Source Code
            </span>
            {sourceCodeURL ? (
              <a
                className="flex items-center gap-1 text-primary hover:underline"
                href={sourceCodeURL}
                rel="noopener noreferrer"
                target="_blank"
              >
                Visit Source Code
                <ExternalLinkIcon className="size-4" />
              </a>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </div>

          <div className="flex max-w-sm flex-col gap-1 max-sm:col-span-2">
            <span className="font-medium text-muted-foreground text-sm">
              Release Date
            </span>
            {(() => {
              const releaseDate = getOrganizationReleaseDate(org);
              return releaseDate ? (
                <span className="text-sm">{formatDate(releaseDate)}</span>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              );
            })()}
          </div>

          <div className="flex max-w-sm flex-col gap-1 max-sm:col-span-2">
            <span className="font-medium text-muted-foreground text-sm">
              Status
            </span>
            <span className="text-sm">
              {isOrganizationInDev(org) ? "In Development" : "Production Ready"}
            </span>
          </div>

          <div className="flex max-w-sm flex-col gap-1 max-sm:col-span-2">
            <span className="font-medium text-muted-foreground text-sm">
              Open Source
            </span>
            <span className="text-sm">
              {isOrganizationOpenSource(org) ? "Yes" : "No"}
            </span>
          </div>

          <div className="flex max-w-sm flex-col gap-1 max-sm:col-span-2">
            <span className="font-medium text-muted-foreground text-sm">
              Categories
            </span>
            <div className="flex flex-wrap gap-2">
              {getOrganizationCategory(org).length > 0 ? (
                getOrganizationCategory(org).map((cat) => (
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
    </>
  );
}

interface MembersTabProps {
  org: NonNullable<
    Awaited<
      ReturnType<typeof authClient.organization.getFullOrganization>
    >["data"]
  >;
  isOwner: boolean;
  session: Awaited<ReturnType<typeof authClient.getSession>>["data"];
  remainingSlots: number;
  handleRemoveMember: (
    memberId: string
  ) => Promise<{ error: { message?: string } | null }>;
  handleLeaveOrganization: () => Promise<{
    error: { message?: string } | null;
  }>;
}

function MembersTab({
  org,
  isOwner,
  session,
  remainingSlots,
  handleRemoveMember,
  handleLeaveOrganization,
}: MembersTabProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-xl">Members</h2>

        <p className="text-muted-foreground text-sm">
          <SlotCountBadge remainingSlots={remainingSlots} />
        </p>
      </div>
      {org.members && org.members.length > 0 ? (
        <div className="space-y-2">
          {org.members.map(
            (member: {
              id: string;
              userId: string;
              role: string;
              user?: { name?: string; email?: string };
            }) => (
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
                <Badge
                  className="size-fit text-xs capitalize"
                  variant={member.role === "owner" ? "default" : "secondary"}
                >
                  {member.role}
                </Badge>

                {!isOwner && session?.user?.id === member.userId && (
                  <BetterAuthActionButton
                    action={handleLeaveOrganization}
                    areYouSureDescription="Are you sure you want to leave this product? This action cannot be undone."
                    requireAreYouSure
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="size-4" />
                    Leave
                  </BetterAuthActionButton>
                )}

                {isOwner && session?.user?.id !== member.userId && (
                  <BetterAuthActionButton
                    action={() => handleRemoveMember(member.id)}
                    areYouSureDescription="Are you sure you want to remove this member from this product? This action cannot be undone."
                    className="text-[10px] sm:text-xs"
                    requireAreYouSure
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 className="size-4" />
                    Boot out
                  </BetterAuthActionButton>
                )}
              </div>
            )
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No members found.</p>
      )}
    </div>
  );
}

interface InvitationsTabProps {
  org: NonNullable<
    Awaited<
      ReturnType<typeof authClient.organization.getFullOrganization>
    >["data"]
  >;
  isOwner: boolean;
  remainingSlots: number;
  filteredInvitations: Array<{
    id: string;
    email: string;
    status: string;
    expiresAt: Date;
  }>;
  handleResendInvitation: (
    email: string
  ) => Promise<{ error: { message?: string } | null }>;
  handleRevokeInvitation: (
    invitationId: string
  ) => Promise<{ error: { message?: string } | null }>;
}

function InvitationsTab({
  org,
  isOwner,
  remainingSlots,
  filteredInvitations,
  handleResendInvitation,
  handleRevokeInvitation,
}: InvitationsTabProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between">
        <h2 className="font-semibold text-lg md:text-xl">Invitations</h2>
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground text-sm">
            <SlotCountBadge remainingSlots={remainingSlots} />
          </p>
          {isOwner && remainingSlots > 0 && (
            <InviteMemberDialog organizationId={org.id} />
          )}
        </div>
      </div>
      {filteredInvitations && filteredInvitations.length > 0 ? (
        <div className="space-y-2">
          {filteredInvitations.map((invitation) => (
            <div
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              key={invitation.id}
            >
              <div>
                <p className="font-medium text-sm sm:text-base">
                  {invitation.email}
                </p>
                <p className="text-[10px] text-muted-foreground sm:text-xs">
                  Expires on {formatDate(new Date(invitation.expiresAt))}
                </p>
              </div>

              <div className="flex gap-1 max-sm:justify-between">
                <span
                  className={cn(
                    "rounded px-2 py-1 font-medium text-xs capitalize",
                    getInvitationStatusClassName(invitation.status)
                  )}
                >
                  {invitation.status}
                </span>
              </div>

              {isOwner && (
                <Popover>
                  <PopoverTrigger>
                    <EllipsisIcon />
                  </PopoverTrigger>
                  <PopoverContent className="flex size-fit flex-col overflow-hidden p-0">
                    <BetterAuthActionButton
                      action={() => handleResendInvitation(invitation.email)}
                      className="text-xs"
                      variant="secondary"
                    >
                      <MailPlusIcon /> Resend Invitation
                    </BetterAuthActionButton>
                    <BetterAuthActionButton
                      action={() => handleRevokeInvitation(invitation.id)}
                      className="text-xs"
                      variant="destructive"
                    >
                      <Trash2 /> Revoke Invitation
                    </BetterAuthActionButton>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No invitations found.</p>
      )}
    </div>
  );
}

function InviteMemberDialog({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: InvitationFormData) {
    const result = await authClient.organization.listInvitations();
    if (result.error) {
      toast.error(result.error.message || "Failed to get invitations");
      return;
    }

    await authClient.organization.inviteMember(
      {
        email: data.email,
        role: "member",
        organizationId,
      },
      {
        onSuccess: () => {
          toast.success("Invitation sent successfully");
          form.reset();
          setOpen(false);
          router.invalidate();
        },
        onError: (error) => {
          toast.error(error.error.message || "Failed to send invitation");
        },
      }
    );
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="text-xs" size="sm">
          <PlusIcon className="size-4" />
          <span className="hidden md:inline">Invite Member</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new member to this organization.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <Button
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SlotCountBadge({ remainingSlots }: { remainingSlots: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          className={cn("ml-2", {
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200":
              remainingSlots > 5,
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200":
              remainingSlots > 0 && remainingSlots <= 5,
            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200":
              remainingSlots <= 0,
          })}
        >
          ({remainingSlots})/15 slots remaining
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-36">
        {remainingSlots} slots remaining
      </TooltipContent>
    </Tooltip>
  );
}
