import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  EllipsisIcon,
  EyeIcon,
  ListIcon,
  PlusIcon,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/products/")({
  component: RouteComponent,
});

const ITEMS_PER_PAGE = 10;

function RouteComponent() {
  const { data: organizations } = authClient.useListOrganizations();
  const [currentPage, setCurrentPage] = useState(1);

  const removeNullOrganizations = organizations?.filter(
    (organization) => organization !== null
  );

  // Calculate pagination
  const totalPages = Math.ceil(
    (removeNullOrganizations?.length ?? 0) / ITEMS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrganizations = (removeNullOrganizations ?? []).slice(
    startIndex,
    endIndex
  );

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div>
      <section className="flex items-center justify-between gap-4 px-2 py-4">
        <h1 className="font-bold md:text-xl">Your Products</h1>
        <Button aria-label="Add New Product" asChild className="text-xs">
          <Link to="/dashboard/products/new">
            <PlusIcon />
            Upload
          </Link>
        </Button>
      </section>

      <section className="border px-2 py-4">
        {!removeNullOrganizations || removeNullOrganizations.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedOrganizations.map((organization) => (
                <Card className="gap-1 p-0" key={organization.id}>
                  <CardHeader className="flex flex-row gap-2 px-2 py-2">
                    <Avatar className="size-10">
                      <AvatarImage src={organization.logo ?? ""} />
                      <AvatarFallback>
                        {organization.name?.charAt(0) ?? ""}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-1">
                      <h2 className="font-semibold text-sm">
                        {organization.name}
                      </h2>
                      <p className="text-muted-foreground text-xs">
                        {"tagline" in organization
                          ? (organization as { tagline?: string }).tagline
                          : ""}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-wrap gap-1 px-2 py-0">
                    {"category" in organization &&
                      Array.isArray(
                        (organization as { category?: string[] }).category
                      ) &&
                      (organization as { category: string[] }).category.map(
                        (category: string) => (
                          <Badge key={category} variant="secondary">
                            {category}
                          </Badge>
                        )
                      )}
                  </CardContent>

                  <CardFooter className="flex flex-wrap justify-between gap-2 border-t px-2 pt-0 pb-2">
                    <p className="flex items-center gap-1 text-muted-foreground text-xs">
                      <CalendarIcon className="size-4" />
                      {format(new Date(organization.createdAt), "MMM d, yyyy")}
                    </p>

                    <div className="flex gap-1">
                      <Popover>
                        <PopoverTrigger>
                          <EllipsisIcon />
                        </PopoverTrigger>

                        <PopoverContent className="flex size-fit flex-col overflow-hidden p-0 *:rounded-none *:text-xs">
                          <Button
                            aria-label="View Product Public Page"
                            asChild
                            variant="secondary"
                          >
                            <a
                              href={`/products/${organization.slug}`}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              <EyeIcon className="size-4" /> View Public Page
                            </a>
                          </Button>

                          <Button
                            aria-label="Full details"
                            asChild
                            variant="default"
                          >
                            <Link
                              params={{ slug: organization.slug ?? "" }}
                              to="/dashboard/products/$slug"
                            >
                              <ListIcon className="size-4" /> Full details
                            </Link>
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="flex-1 text-muted-foreground text-sm max-lg:hidden">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, removeNullOrganizations.length)} of{" "}
                  {removeNullOrganizations.length} products
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    disabled={currentPage === 1}
                    onClick={handlePreviousPage}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronLeft className="size-4" />
                    <span className="hidden md:inline">Previous</span>
                  </Button>
                  <div className="text-muted-foreground text-sm">
                    {currentPage} of {totalPages}
                  </div>
                  <Button
                    disabled={currentPage === totalPages}
                    onClick={handleNextPage}
                    size="sm"
                    variant="outline"
                  >
                    <span className="hidden md:inline">Next</span>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
