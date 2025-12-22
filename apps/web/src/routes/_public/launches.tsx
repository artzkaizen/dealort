import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon, ArrowUpAZIcon, ListFilter } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ProductCard,
  ProductCardCategory,
  ProductCardCommentAndImpressionCount,
  ProductCardDetails,
  ProductCardLaunchInfo,
  ProductCardLogo,
  ProductCardRateAndReview,
  ProductCardTimeAndDuration,
} from "@/components/product-card";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { categories as allCategories } from "@/utils/constants";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/_public/launches")({
  component: RouteComponent,
});

type LaunchSortMode = "recent_launch" | "top_launches" | "launching_soon";

interface LaunchItem {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  logo: string | null;
  category: string[] | null;
  rating: number;
  reviewCount: number;
  commentCount: number;
  impressions: number;
  releaseDate: Date | string | null;
  createdAt: Date | string;
}

interface LaunchesListResponse {
  items: LaunchItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface RecentProductsResponse {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  logo: string | null;
  category: string[] | null;
  rating: number;
  reviewCount: number;
  commentCount: number;
  impressions: number;
  createdAt: Date | string;
}

function RouteComponent() {
  const [sortMode, setSortMode] = useState<LaunchSortMode>("recent_launch");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Type-safe client accessors
  const productsClient = client.products as {
    listLaunches: (input: {
      cursor?: string;
      limit: number;
      categories?: string[];
      sortBy: LaunchSortMode;
    }) => Promise<LaunchesListResponse>;
    listRecent: (input: { limit: number }) => Promise<RecentProductsResponse[]>;
  };

  // Fetch launches with infinite query
  const {
    data: launchesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["products", "listLaunches", sortMode, selectedCategories],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      productsClient.listLaunches({
        cursor: pageParam,
        limit: 10,
        categories:
          selectedCategories.length > 0 ? selectedCategories : undefined,
        sortBy: sortMode,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  // Fetch recent products for sidebar
  const { data: recentProducts } = useQuery({
    queryKey: ["products", "listRecent"],
    queryFn: () => productsClient.listRecent({ limit: 10 }),
  });

  // Flatten all launches from pages
  const allLaunches = useMemo(
    () =>
      launchesData?.pages.flatMap((page: LaunchesListResponse) => page.items) ??
      [],
    [launchesData]
  );

  // Compute category counts from all launches
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of allCategories) {
      map.set(c, 0);
    }
    for (const launch of allLaunches) {
      for (const cat of launch.category ?? []) {
        map.set(cat, (map.get(cat) ?? 0) + 1);
      }
    }
    return map;
  }, [allLaunches]);

  const toggleCategory = (category: string) =>
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );

  // Categories to show filtered by search
  const categoriesToShow = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    return allCategories.filter((c) => c.toLowerCase().includes(q));
  }, [categorySearch]);

  // Infinite scroll: detect when user reaches bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sortModeLabel = useMemo(() => {
    switch (sortMode) {
      case "recent_launch":
        return "Recent Launches";
      case "top_launches":
        return "Top Launches";
      case "launching_soon":
        return "Launching Soon";
      default:
        return "Launches";
    }
  }, [sortMode]);

  // Helper to format date for components
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    if (typeof date === "string") return date;
    return date.toISOString().split("T")[0];
  };

  return (
    <main>
      <section className="relative min-h-[40vh]">
        <div className="relative z-10 flex flex-col items-center justify-center py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 select-none bg-[linear-gradient(to_right,var(--color-primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-primary)_1px,transparent_1px)] opacity-5 [background-size:40px_40px]"
          />
          <h1 className="text-center font-bold text-2xl sm:text-4xl">
            &bull; Product Launches &bull;
          </h1>
          <p className="mt-4 max-w-2xl text-center text-muted-foreground text-sm sm:text-base">
            Discover the latest product launches and upcoming releases from
            innovative creators and companies.
          </p>
        </div>
      </section>

      <hr />

      <section className="grid-cols-7 md:grid">
        <main className="col-span-4 flex flex-col space-y-3 px-2 lg:col-span-5">
          <div className="flex w-full items-center justify-between gap-2 pt-3">
            <h3 className="max-sm:text-xs">{sortModeLabel}</h3>

            <div className="space-x-2">
              {/* Categories filter (shadcn combobox = Popover + Command) */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="text-xs"
                    variant={selectedCategories.length ? "default" : "outline"}
                  >
                    <ListFilter />
                    {selectedCategories.length
                      ? `Tags (${selectedCategories.length})`
                      : "Tags"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[300px] p-2">
                  <Command>
                    <CommandInput
                      onValueChange={(v: string) => setCategorySearch(v)}
                      placeholder="Search feature tags..."
                      value={categorySearch}
                    />
                    <CommandList>
                      <CommandEmpty>No results.</CommandEmpty>

                      {/* Selected group */}
                      <CommandGroup heading="Selected">
                        {selectedCategories.length === 0 ? (
                          <div className="px-2 py-1 text-muted-foreground text-sm">
                            No selected tags
                          </div>
                        ) : (
                          selectedCategories.map((cat) => (
                            <CommandItem
                              key={cat}
                              onSelect={() => {
                                toggleCategory(cat);
                              }}
                            >
                              <div className="flex w-full items-center justify-between">
                                <span>{cat}</span>
                                <span className="text-muted-foreground text-sm">
                                  ({categoryCounts.get(cat) ?? 0})
                                </span>
                              </div>
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>

                      {/* Available categories group */}
                      <CommandGroup heading="Categories">
                        {categoriesToShow
                          .filter((c) => !selectedCategories.includes(c))
                          .map((cat) => (
                            <CommandItem
                              key={cat}
                              onSelect={() => {
                                toggleCategory(cat);
                              }}
                            >
                              <div className="flex w-full items-center justify-between">
                                <span>{cat}</span>
                                <span className="text-muted-foreground text-sm">
                                  ({categoryCounts.get(cat) ?? 0})
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Sort popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="text-xs" variant="outline">
                    <ArrowUpAZIcon />
                    Sort
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[200px] p-2">
                  <div className="flex flex-col gap-1">
                    <Button
                      className={`rounded px-2 py-1 text-left ${sortMode === "recent_launch" ? "bg-muted text-muted-foreground" : ""}`}
                      onClick={() => setSortMode("recent_launch")}
                      variant="ghost"
                    >
                      Recent launch
                    </Button>
                    <Button
                      className={`rounded px-2 py-1 text-left ${sortMode === "top_launches" ? "bg-muted text-muted-foreground" : ""}`}
                      onClick={() => setSortMode("top_launches")}
                      variant="ghost"
                    >
                      Top launches
                    </Button>
                    <Button
                      className={`rounded px-2 py-1 text-left ${sortMode === "launching_soon" ? "bg-muted text-muted-foreground" : ""}`}
                      onClick={() => setSortMode("launching_soon")}
                      variant="ghost"
                    >
                      Launching soon
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            {isLoading && (
              <div className="py-12 text-center text-muted-foreground">
                Loading launches...
              </div>
            )}

            {!isLoading && allLaunches.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No launches found
              </div>
            )}

            {allLaunches.map((launch) => (
              <ProductCard className="rounded-lg" key={launch.id}>
                <div className="flex justify-between gap-4 max-sm:flex-wrap">
                  <div className="flex items-start gap-1">
                    <ProductCardLogo
                      logo={launch.logo ?? ""}
                      name={launch.name}
                    />
                    <div className="flex flex-col gap-px">
                      <ProductCardDetails
                        name={launch.name}
                        slug={launch.slug}
                        tagline={launch.tagline ?? ""}
                      />
                      <ProductCardRateAndReview
                        rating={launch.rating}
                        reviewsCount={launch.reviewCount}
                      />
                      <ProductCardCategory
                        category={launch.category ?? []}
                        className="mt-2 flex-wrap"
                      />

                      {launch.releaseDate && (
                        <ProductCardLaunchInfo
                          launchDate={formatDate(launch.releaseDate)}
                        />
                      )}

                      <ProductCardTimeAndDuration
                        createdAt={formatDate(launch.createdAt)}
                      />
                    </div>
                  </div>

                  <ProductCardCommentAndImpressionCount
                    commentCount={launch.commentCount}
                    impressions={launch.impressions}
                  />
                </div>
              </ProductCard>
            ))}

            {/* Infinite scroll trigger */}
            <div className="h-4" ref={loadMoreRef} />

            {/* Loading indicator */}
            {isFetchingNextPage && (
              <div className="py-4 text-center text-muted-foreground text-sm">
                Loading more launches...
              </div>
            )}

            {/* End of results */}
            {!hasNextPage && allLaunches.length > 0 && (
              <div className="py-4 text-center text-muted-foreground text-sm">
                No more contents to load
              </div>
            )}
          </div>
        </main>

        <aside className="col-span-3 flex flex-col space-y-8 border-l px-2 max-md:hidden lg:col-span-2">
          <h1 className="pt-3">Recent Products</h1>

          <div className="flex flex-col space-y-2">
            {!recentProducts && (
              <div className="text-muted-foreground text-sm">Loading...</div>
            )}

            {recentProducts && recentProducts.length === 0 && (
              <div className="text-muted-foreground text-sm">
                No recent products
              </div>
            )}

            {recentProducts?.map((product: RecentProductsResponse) => (
              <ProductCard className="rounded-lg" key={product.id}>
                <div className="flex justify-between gap-4">
                  <div className="flex items-start gap-1">
                    <ProductCardLogo
                      logo={product.logo ?? ""}
                      name={product.name}
                    />
                    <div className="flex flex-col gap-px">
                      <ProductCardDetails
                        className="[&>a]:text-xs [&>p]:text-[10px]"
                        name={product.name}
                        slug={product.slug}
                        tagline={product.tagline ?? ""}
                      />
                      <ProductCardTimeAndDuration
                        createdAt={formatDate(product.createdAt)}
                      />
                    </div>
                  </div>
                </div>
              </ProductCard>
            ))}

            {!!recentProducts && recentProducts.length > 0 && (
              <Button asChild className="w-full" variant="outline">
                <Link to="/products">
                  View All Products <ArrowRightIcon />
                </Link>
              </Button>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
