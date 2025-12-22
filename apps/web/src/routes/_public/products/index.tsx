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

export const Route = createFileRoute("/_public/products/")({
  component: RouteComponent,
});

type SortMode = "newest" | "top" | "trending";

interface ProductItem {
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

interface ProductsListResponse {
  items: ProductItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface LaunchesListResponse {
  items: ProductItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

function RouteComponent() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Type-safe client accessors
  const productsClient = client.products as {
    list: (input: {
      cursor?: string;
      limit: number;
      categories?: string[];
      sortBy: SortMode;
    }) => Promise<ProductsListResponse>;
    listLaunches: (input: {
      sortBy: "launching_soon";
      limit: number;
    }) => Promise<LaunchesListResponse>;
  };

  // Fetch products with infinite query
  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["products", "list", selectedCategories, sortMode],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      productsClient.list({
        cursor: pageParam,
        limit: 10,
        categories:
          selectedCategories.length > 0 ? selectedCategories : undefined,
        sortBy: sortMode,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  // Fetch upcoming launches (limited to 10)
  const { data: upcomingLaunches } = useQuery({
    queryKey: ["products", "listLaunches", "launching_soon"],
    queryFn: () =>
      productsClient.listLaunches({
        sortBy: "launching_soon",
        limit: 10,
      }),
  });

  // Flatten all products from pages
  const allProducts = useMemo(
    () =>
      productsData?.pages.flatMap((page: ProductsListResponse) => page.items) ??
      [],
    [productsData]
  );

  // Compute category counts from all products
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of allCategories) {
      map.set(c, 0);
    }
    for (const p of allProducts) {
      for (const cat of p.category ?? []) {
        map.set(cat, (map.get(cat) ?? 0) + 1);
      }
    }
    return map;
  }, [allProducts]);

  const toggleCategory = (category: string) =>
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );

  // Upcoming launch products (first 10)
  const upcomingLaunchProducts = useMemo(
    () => (upcomingLaunches?.items ?? []).slice(0, 10),
    [upcomingLaunches]
  );

  // Categories to show filtered by search
  const categoriesToShow = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    return allCategories.filter((c) => c.toLowerCase().includes(q));
  }, [categorySearch]);

  // Helper to format date for components
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    if (typeof date === "string") return date;
    return date.toISOString().split("T")[0];
  };

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

  return (
    <main>
      <section className="relative min-h-[40vh]">
        <div className="relative z-10 flex flex-col items-center justify-center py-10">
          {/* Subtle grid lines background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 select-none"
            style={{
              backgroundImage: `
                linear-gradient(
                  to right,
                  var(--tw-bg-primary, theme(bgColor.primary)) 1px,
                  transparent 1px
                ),
                linear-gradient(
                  to bottom,
                  var(--tw-bg-primary, theme(bgColor.primary)) 1px,
                  transparent 1px
                )
              `,
              backgroundSize: "40px 40px",
              opacity: 0.05,
            }}
          />
          <h1 className="relative z-10 text-center font-bold text-2xl sm:text-4xl">
            &bull; Explore Products &bull;
          </h1>
          <p className="relative z-10 mt-4 max-w-2xl text-center text-muted-foreground text-sm sm:text-base">
            Discover a curated selection of innovative products designed by
            industry experts to solve real-world problems and enhance your
            development workflow.
          </p>
        </div>
      </section>

      <hr />

      <section className="grid-cols-7 md:grid">
        <main className="col-span-4 flex flex-col space-y-3 px-2 lg:col-span-5">
          <div className="flex w-full items-center justify-between gap-2 pt-3">
            <h3 className="max-sm:text-xs">
              {sortMode === "trending" && "Trending Products"}
              {sortMode === "top" && "Top Performing Products"}
              {sortMode === "newest" && "Recent Products"}
            </h3>

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
                      className={`rounded px-2 py-1 text-left ${sortMode === "newest" ? "bg-muted text-muted-foreground" : ""}`}
                      onClick={() => setSortMode("newest")}
                      variant="ghost"
                    >
                      Newest
                    </Button>
                    <Button
                      className={`rounded px-2 py-1 text-left ${sortMode === "top" ? "bg-muted text-muted-foreground" : ""}`}
                      onClick={() => setSortMode("top")}
                      variant="ghost"
                    >
                      Top products
                    </Button>
                    <Button
                      className={`rounded px-2 py-1 text-left ${sortMode === "trending" ? "bg-muted text-muted-foreground" : ""}`}
                      onClick={() => setSortMode("trending")}
                      variant="ghost"
                    >
                      Trending
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            {isLoading && (
              <div className="py-12 text-center text-muted-foreground">
                Loading products...
              </div>
            )}

            {!isLoading && allProducts.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No products found
              </div>
            )}

            {allProducts.map((product) => (
              <ProductCard className="rounded-lg" key={product.id}>
                <div className="flex justify-between gap-4 max-sm:flex-wrap">
                  <div className="flex items-start gap-1">
                    <ProductCardLogo
                      logo={product.logo ?? ""}
                      name={product.name}
                    />
                    <div className="flex flex-col gap-px">
                      <ProductCardDetails
                        name={product.name}
                        slug={product.slug}
                        tagline={product.tagline ?? ""}
                      />
                      <ProductCardRateAndReview
                        rating={product.rating}
                        reviewsCount={product.reviewCount}
                      />
                      <ProductCardCategory
                        category={product.category ?? []}
                        className="mt-2 flex-wrap"
                      />

                      {product.releaseDate && (
                        <ProductCardLaunchInfo
                          launchDate={formatDate(product.releaseDate)}
                        />
                      )}

                      <ProductCardTimeAndDuration
                        createdAt={formatDate(product.createdAt)}
                      />
                    </div>
                  </div>

                  <ProductCardCommentAndImpressionCount
                    commentCount={product.commentCount}
                    impressions={product.impressions}
                  />
                </div>
              </ProductCard>
            ))}

            {/* Infinite scroll trigger */}
            <div className="h-4" ref={loadMoreRef} />

            {/* Loading indicator */}
            {isFetchingNextPage && (
              <div className="py-4 text-center text-muted-foreground text-sm">
                Loading more products...
              </div>
            )}

            {/* End of results */}
            {!hasNextPage && allProducts.length > 0 && (
              <div className="py-4 text-center text-muted-foreground text-sm">
                No more contents to load
              </div>
            )}
          </div>
        </main>

        <aside className="col-span-3 flex flex-col space-y-8 border-l px-2 max-md:hidden lg:col-span-2">
          <h1 className="pt-3">Launch Announcements</h1>

          <div className="flex flex-col space-y-2">
            {upcomingLaunchProducts.length === 0 && (
              <div className="text-muted-foreground text-sm">
                No upcoming launches
              </div>
            )}
            {upcomingLaunchProducts.map((product: ProductItem) => (
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
                      {product.releaseDate && (
                        <ProductCardLaunchInfo
                          launchDate={formatDate(product.releaseDate)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </ProductCard>
            ))}

            {upcomingLaunchProducts.length > 0 && (
              <Button asChild className="w-full" variant="outline">
                <Link to="/launches">
                  View All Launches <ArrowRightIcon />
                </Link>
              </Button>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
