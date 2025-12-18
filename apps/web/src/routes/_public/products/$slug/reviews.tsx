import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Edit, Flag, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { ReportDialog } from "@/components/report-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Rating, RatingItem } from "@/components/ui/rating";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { client, orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_public/products/$slug/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session;
  const currentUserId = session?.user?.id;

  // Fetch product data
  const { data: product } = useQuery(
    orpc.products.getBySlug.queryOptions({ input: { slug } })
  );

  // Filter and sort state
  const [filter, setFilter] = useState<"all" | "my">("all");
  const [sortBy, setSortBy] = useState<
    "recent" | "top_rating" | "lowest_rating"
  >("recent");

  // Fetch reviews with infinite query
  const {
    data: reviewsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["reviews", "list", product?.id, filter, sortBy],
    queryFn: async ({ pageParam }) =>
      client.reviews.list({
        organizationId: product?.id || "",
        limit: 10,
        filter,
        sortBy,
        cursor: pageParam as string | undefined,
      }),
    enabled: !!product?.id,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
  });

  // Mutations
  const deleteReviewMutation = useMutation({
    ...orpc.reviews.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "list"] });
      queryClient.invalidateQueries({ queryKey: ["products", "getBySlug"] });
    },
  });

  const updateReviewMutation = useMutation({
    ...orpc.reviews.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "list"] });
      queryClient.invalidateQueries({ queryKey: ["products", "getBySlug"] });
      setEditDialogOpen(false);
      setEditingReview(null);
    },
  });

  // State
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<{
    id: string;
    rating: number;
    content: string;
  } | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editContent, setEditContent] = useState("");

  // Handlers
  const handleReport = (reviewId: string) => {
    setReportTarget(reviewId);
    setReportDialogOpen(true);
  };

  const handleSubmitReport = async (reason: string, description?: string) => {
    if (!reportTarget) return;
    // Implementation will be added when reports API is ready
    console.log("Report submitted", {
      reviewId: reportTarget,
      reason,
      description,
    });
    setReportDialogOpen(false);
    setReportTarget(null);
  };

  const handleEdit = (review: {
    id: string;
    rating: number;
    content: string;
  }) => {
    setEditingReview({
      id: review.id,
      rating: review.rating,
      content: review.content,
    });
    setEditRating(review.rating);
    setEditContent(review.content);
    setEditDialogOpen(true);
  };

  const handleDelete = (reviewId: string) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      deleteReviewMutation.mutate({ id: reviewId });
    }
  };

  const handleSaveEdit = () => {
    if (!editingReview) return;
    updateReviewMutation.mutate({
      id: editingReview.id,
      rating: editRating,
      content: editContent,
    });
  };

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  const allReviews =
    reviewsData?.pages.flatMap((page: { items: unknown[] }) => page.items) ||
    [];

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          {product.logo && (
            <img
              alt={product.name}
              className="size-12 rounded-lg object-cover sm:size-16"
              height={64}
              src={product.logo || ""}
              width={64}
            />
          )}
          <div>
            <h1 className="font-bold text-2xl sm:text-3xl">{product.name}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Reviews
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="space-y-2">
          <label className="font-medium text-sm" htmlFor="filter-select">
            Filter by
          </label>
          <Select
            onValueChange={(value) => setFilter(value as "all" | "my")}
            value={filter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reviews</SelectItem>
              <SelectItem value="my">My reviews</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="font-medium text-sm" htmlFor="sort-select">
            Sort by
          </label>
          <Select
            onValueChange={(value) =>
              setSortBy(value as "recent" | "top_rating" | "lowest_rating")
            }
            value={sortBy}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="top_rating">Top rating</SelectItem>
              <SelectItem value="lowest_rating">Lowest rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {allReviews.map((review) => {
          const typedReview = review as {
            id: string;
            rating: number;
            content: string;
            title?: string | null;
            createdAt: Date;
            user: {
              id: string;
              name: string;
              username: string | null;
              image: string | null;
            } | null;
          };
          const isOwner = currentUserId === typedReview.user?.id;

          return (
            <div
              className="flex gap-4 rounded-lg border p-4"
              key={typedReview.id}
            >
              <Avatar>
                <AvatarImage
                  alt={typedReview.user?.name ?? undefined}
                  src={typedReview.user?.image ?? undefined}
                />
                <AvatarFallback>
                  {typedReview.user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {typedReview.user?.name}
                      </span>
                      {typedReview.user?.username && (
                        <span className="text-muted-foreground text-sm">
                          @{typedReview.user.username}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Rating readOnly value={typedReview.rating}>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <RatingItem index={value - 1} key={value} />
                        ))}
                      </Rating>
                      <span className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(typedReview.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    {typedReview.title && (
                      <h3 className="mt-2 font-semibold">
                        {typedReview.title}
                      </h3>
                    )}
                    <p className="mt-2 whitespace-pre-wrap">
                      {typedReview.content}
                    </p>
                  </div>
                  {isAuthenticated && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="size-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-48 p-2">
                        <div className="space-y-1">
                          {!isOwner && (
                            <Button
                              className="w-full justify-start"
                              onClick={() => handleReport(typedReview.id)}
                              size="sm"
                              variant="ghost"
                            >
                              <Flag className="mr-2 size-4" />
                              Report
                            </Button>
                          )}
                          {isOwner && (
                            <>
                              <Button
                                className="w-full justify-start"
                                onClick={() => handleEdit(typedReview)}
                                size="sm"
                                variant="ghost"
                              >
                                <Edit className="mr-2 size-4" />
                                Edit
                              </Button>
                              <Button
                                className="w-full justify-start text-destructive"
                                onClick={() => handleDelete(typedReview.id)}
                                size="sm"
                                variant="ghost"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="mt-8 text-center">
          <Button
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            variant="outline"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more reviews"
            )}
          </Button>
        </div>
      )}
      {!hasNextPage && allReviews.length > 0 && (
        <p className="mt-4 text-center text-muted-foreground text-sm">
          No more reviews to load
        </p>
      )}

      {allReviews.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No reviews yet</p>
        </div>
      )}

      {/* Report Dialog */}
      {reportTarget && (
        <ReportDialog
          onOpenChange={setReportDialogOpen}
          onSubmit={handleSubmitReport}
          open={reportDialogOpen}
          reportableType="review"
        />
      )}

      {/* Edit Review Dialog */}
      {editingReview && (
        <Dialog onOpenChange={setEditDialogOpen} open={editDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit review</DialogTitle>
              <DialogDescription>Make changes to your review</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="font-medium text-sm" htmlFor="edit-rating">
                  Rating
                </label>
                <Rating
                  id="edit-rating"
                  onValueChange={(value) => setEditRating(value ?? 0)}
                  value={editRating}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <RatingItem index={value - 1} key={value} />
                  ))}
                </Rating>
              </div>
              <div className="space-y-2">
                <label className="font-medium text-sm" htmlFor="edit-content">
                  Review
                </label>
                <Textarea
                  className="min-h-[120px]"
                  id="edit-content"
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Write your review..."
                  value={editContent}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={updateReviewMutation.isPending}
                onClick={() => setEditDialogOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  editRating === 0 ||
                  !editContent.trim() ||
                  updateReviewMutation.isPending
                }
                onClick={handleSaveEdit}
              >
                {updateReviewMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
