import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowBigUp,
  ChevronDown,
  ChevronUp,
  Edit,
  Flag,
  Heart,
  Loader2,
  MoreVertical,
  Reply,
  Share2,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { ReplyFormDialog } from "@/components/reply-form-dialog";
import { ReportDialog } from "@/components/report-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Rating, RatingItem } from "@/components/ui/rating";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { formatNumber, formatShortTime } from "@/lib/utils";
import { client, orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_public/products/$slug/")({
  beforeLoad: async ({ params }) => {
    try {
      // Check if the product is listed
      const product = await client.products.getBySlug({
        slug: params.slug,
      });

      // If product doesn't exist or is not listed, redirect to products page
      if (!(product && (product as { isListed?: boolean }).isListed)) {
        throw redirect({
          to: "/products",
        });
      }
    } catch (error) {
      // If it's already a redirect, re-throw it
      if (error && typeof error === "object" && "status" in error) {
        throw error;
      }
      // Otherwise redirect to products page
      throw redirect({
        to: "/products",
      });
    }
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session;

  // Fetch product data (use raw ORPC client instead of query utils here)
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["products", "getBySlug", slug],
    queryFn: () => client.products.getBySlug({ slug }),
  });

  // Fetch reviews with infinite query (not used directly but kept for future use)
  useInfiniteQuery({
    queryKey: ["reviews", "list", product?.id, "all", "recent"],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) =>
      client.reviews.list({
        organizationId: product?.id || "",
        limit: 10,
        filter: "all",
        sortBy: "recent",
        cursor: pageParam,
      }),
    enabled: !!product?.id,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  // Fetch comments with infinite query
  const {
    data: commentsData,
    fetchNextPage: fetchNextComments,
    hasNextPage: hasMoreComments,
    isFetchingNextPage: isFetchingComments,
  } = useInfiniteQuery({
    queryKey: ["comments", "list", product?.id],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) =>
      client.comments.list({
        organizationId: product?.id || "",
        limit: 10,
        cursor: pageParam,
      }),
    enabled: !!product?.id,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  // Mutations
  const likeMutation = useMutation({
    ...orpc.products.toggleLike.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products", "getBySlug", slug],
      });
    },
  });

  const followMutation = useMutation({
    ...orpc.products.toggleFollow.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products", "getBySlug", slug],
      });
    },
  });

  const createReviewMutation = useMutation({
    ...orpc.reviews.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "list"] });
      queryClient.invalidateQueries({
        queryKey: ["products", "getBySlug", slug],
      });
      setReviewDialogOpen(false);
      setReviewRating(0);
      setReviewContent("");
      toast.success("Review created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create review");
    },
  });

  const createCommentMutation = useMutation({
    ...orpc.comments.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "list"] });
      setCommentContent("");
      setReplyingTo(null);
      setReplyDialogOpen(false);
      toast.success("Comment posted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to post comment");
    },
  });

  // Comment mutations
  const likeCommentMutation = useMutation({
    ...orpc.comments.toggleLike.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "list"] });
    },
  });

  const updateCommentMutation = useMutation({
    ...orpc.comments.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "list"] });
      setEditCommentDialogOpen(false);
      setEditingComment(null);
    },
  });

  const deleteCommentMutation = useMutation({
    ...orpc.comments.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "list"] });
    },
  });

  const createReportMutation = useMutation({
    ...orpc.reports.create.mutationOptions(),
    onSuccess: () => {
      setReportDialogOpen(false);
      setReportTarget(null);
    },
  });

  // State
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: "comment" | "review";
    id: string;
  } | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    username: string;
    name?: string;
  } | null>(null);
  const [editCommentDialogOpen, setEditCommentDialogOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<{
    id: string;
    content: string;
  } | null>(null);

  // Handlers
  const handleLike = () => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" });
      return;
    }
    if (product) {
      likeMutation.mutate({ organizationId: product.id });
    }
  };

  const handleFollow = () => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" });
      return;
    }
    if (product) {
      followMutation.mutate({ organizationId: product.id });
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product.tagline,
          url: window.location.href,
        });
      } catch {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleSubmitReview = () => {
    if (!product || reviewRating === 0 || !reviewContent.trim()) return;
    createReviewMutation.mutate({
      organizationId: product.id,
      rating: reviewRating,
      content: reviewContent.trim(),
    });
  };

  const handleSubmitComment = () => {
    if (!(product && commentContent.trim())) return;
    createCommentMutation.mutate({
      organizationId: product.id,
      content: commentContent.trim(),
    });
  };

  const handleReport = (type: "comment" | "review", id: string) => {
    setReportTarget({ type, id });
    setReportDialogOpen(true);
  };

  const handleSubmitReport = async (reason: string, description?: string) => {
    if (!reportTarget) return;
    createReportMutation.mutate({
      reportableType: reportTarget.type,
      reportableId: reportTarget.id,
      reason,
      description,
    });
  };

  if (productLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Product not found</p>
      </div>
    );
  }

  const descriptionLength = product.description?.length || 0;
  const shouldShowMoreButton = descriptionLength > 500;
  const displayDescription = showFullDescription
    ? product.description
    : product.description?.substring(0, 500);

  const averageRating = product.averageRating || 0;
  const reviewCount = product.reviewCount || 0;
  const allComments: CommentItemProps["comment"][] =
    commentsData?.pages.flatMap(
      (page) => (page as { items: CommentItemProps["comment"][] }).items
    ) || [];

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {product.logo && (
              <img
                alt={product.name}
                className="size-16 rounded-lg object-cover sm:size-20"
                height={80}
                src={product.logo}
                width={80}
              />
            )}
            <div className="flex-1">
              <h1 className="font-bold text-2xl sm:text-3xl">{product.name}</h1>
              <p className="mt-1 text-muted-foreground text-sm sm:text-base">
                {product.tagline}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleLike}
              size="sm"
              variant={product.hasLiked ? "default" : "outline"}
            >
              <Heart
                className={`mr-2 size-4 ${product.hasLiked ? "fill-current" : ""}`}
              />
              Like{" "}
              {product.likeCount
                ? `(${formatNumber.format(product.likeCount)})`
                : ""}
            </Button>
            {isAuthenticated && (
              <Button
                onClick={handleFollow}
                size="sm"
                variant={product.isFollowing ? "default" : "outline"}
              >
                {product.isFollowing ? "Following" : "Follow"}{" "}
                {product.followerCount
                  ? `(${formatNumber.format(product.followerCount)})`
                  : ""}
              </Button>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
          {product.owner && (
            <span>
              Owner:{" "}
              <span className="font-medium text-foreground">
                {product.owner.name || "Unknown"}
              </span>
            </span>
          )}
          <span>{reviewCount} ratings</span>
          {product.releaseDate && (
            <span>
              Released{" "}
              {formatDistanceToNow(new Date(product.releaseDate), {
                addSuffix: true,
              })}
            </span>
          )}
          <Button onClick={handleShare} size="sm" variant="ghost">
            <Share2 className="mr-2 size-4" />
            Share
          </Button>
        </div>

        {/* Categories */}
        {product.category && Array.isArray(product.category) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(product.category as string[]).map((cat) => (
              <span
                className="rounded-full bg-muted px-3 py-1 font-medium text-xs"
                key={cat}
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Carousel */}
      {product.gallery &&
        Array.isArray(product.gallery) &&
        (product.gallery as string[]).length > 0 && (
          <div className="mb-8">
            <Carousel className="w-full">
              <CarouselContent>
                {(product.gallery as string[]).map((image, index) => (
                  <CarouselItem key={`gallery-${image}-${index}`}>
                    <img
                      alt={`${product.name} gallery ${index + 1}`}
                      className="h-[400px] w-full rounded-lg object-cover"
                      height={400}
                      src={image}
                      width={800}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}

      <Separator className="my-8" />

      {/* Description Section */}
      <section className="mb-8">
        <h2 className="mb-4 font-semibold text-lg sm:text-xl">
          Product description
        </h2>
        <p className="whitespace-pre-wrap text-muted-foreground">
          {displayDescription}
          {!showFullDescription && descriptionLength > 500 && "..."}
        </p>
        {shouldShowMoreButton && (
          <Button
            className="mt-4"
            onClick={() => setShowFullDescription(!showFullDescription)}
            variant="ghost"
          >
            {showFullDescription ? "Show less" : "Show more"}
          </Button>
        )}
      </section>

      <Separator className="my-8" />

      {/* Ratings and Reviews Section */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Rating readOnly value={averageRating}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <RatingItem index={value - 1} key={value} />
                ))}
              </Rating>
              <span className="ml-2 font-medium">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-muted-foreground text-sm">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
          </div>
          {isAuthenticated && (
            <Button onClick={() => setReviewDialogOpen(true)} size="sm">
              Write a review
            </Button>
          )}
        </div>

        <Button asChild className="mt-4" variant="outline">
          <Link params={{ slug }} to="/products/$slug/reviews">
            See all reviews
          </Link>
        </Button>
      </section>

      <Separator className="my-8" />

      {/* Comments Section */}
      <section>
        <h2 className="mb-4 font-semibold text-lg sm:text-xl">Comments</h2>
        {isAuthenticated && (
          <div className="mb-6">
            <Textarea
              className="mb-2 min-h-[100px]"
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Add a comment..."
              value={commentContent}
            />
            <Button
              disabled={
                !commentContent.trim() || createCommentMutation.isPending
              }
              onClick={handleSubmitComment}
            >
              {createCommentMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Post Comment
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {allComments.map((comment) => (
            <CommentItem
              comment={comment}
              currentUserId={session?.user?.id}
              key={comment.id}
              onDelete={(id) => {
                if (
                  window.confirm(
                    "Are you sure you want to delete this comment?"
                  )
                ) {
                  deleteCommentMutation.mutate({ id });
                }
              }}
              onEdit={(id, content) => {
                setEditingComment({ id, content });
                setEditCommentDialogOpen(true);
              }}
              onLike={(id) => {
                if (isAuthenticated) {
                  likeCommentMutation.mutate({ commentId: id });
                }
              }}
              onReply={(id, username, name) => {
                setReplyingTo({ id, username, name });
                setReplyDialogOpen(true);
              }}
              onReport={(id) => handleReport("comment", id)}
            />
          ))}
        </div>

        {hasMoreComments && (
          <div className="mt-8 text-center">
            <Button
              disabled={isFetchingComments}
              onClick={() => fetchNextComments()}
              variant="outline"
            >
              {isFetchingComments ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more comments"
              )}
            </Button>
          </div>
        )}
        {!hasMoreComments && allComments.length > 0 && (
          <p className="mt-4 text-center text-muted-foreground text-sm">
            No more comments to load
          </p>
        )}
      </section>

      {/* Review Dialog */}
      <Dialog onOpenChange={setReviewDialogOpen} open={reviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Write a review</DialogTitle>
            <DialogDescription>
              Share your experience with this product
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="review-rating">
                Rating
              </label>
              <Rating
                id="review-rating"
                onValueChange={(value) => setReviewRating(value ?? 0)}
                value={reviewRating}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <RatingItem index={value - 1} key={value} />
                ))}
              </Rating>
            </div>
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="review-content">
                Review
              </label>
              <Textarea
                className="min-h-[120px]"
                id="review-content"
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="Write your review..."
                value={reviewContent}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setReviewDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={
                reviewRating === 0 ||
                !reviewContent.trim() ||
                createReviewMutation.isPending
              }
              onClick={handleSubmitReview}
            >
              {createReviewMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      {reportTarget && (
        <ReportDialog
          onOpenChange={setReportDialogOpen}
          onSubmit={handleSubmitReport}
          open={reportDialogOpen}
          reportableType={reportTarget.type}
        />
      )}

      {/* Reply Dialog */}
      {replyingTo && (
        <ReplyFormDialog
          isLoading={createCommentMutation.isPending}
          onOpenChange={setReplyDialogOpen}
          onSubmit={async (content) => {
            if (!product) return;
            createCommentMutation.mutate({
              organizationId: product.id,
              content,
              parentId: replyingTo.id,
            });
            setReplyingTo(null);
          }}
          open={replyDialogOpen}
          replyingTo={replyingTo}
        />
      )}

      {/* Edit Comment Dialog */}
      {editingComment && (
        <EditCommentDialog
          comment={editingComment}
          onOpenChange={setEditCommentDialogOpen}
          onSave={async (content) => {
            if (editingComment) {
              updateCommentMutation.mutate({
                id: editingComment.id,
                content,
              });
            }
          }}
          open={editCommentDialogOpen}
        />
      )}
    </main>
  );
}

// Comment Item Component
type CommentData = {
  id: string;
  content: string;
  createdAt: Date;
  parentId: string | null;
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  } | null;
  likeCount: number;
  hasLiked: boolean;
  replies?: CommentData[];
};

interface CommentItemProps {
  comment: CommentData;
  currentUserId?: string;
  onReply: (id: string, username: string, name?: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  onLike: (id: string) => void;
  depth?: number;
  parentUserName?: string;
  parentUsername?: string;
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReport,
  onLike,
  depth = 0,
  parentUserName,
}: CommentItemProps) {
  const isOwner = currentUserId === comment.user?.id;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const [showReplies, setShowReplies] = useState(true);
  // All replies have the same indentation regardless of depth
  const paddingLeft = depth > 0 ? "ml-12" : "";

  return (
    <div className={`space-y-4 ${paddingLeft}`}>
      <div className="flex gap-3">
        <Avatar>
          <AvatarImage
            alt={comment.user?.name ?? undefined}
            src={comment.user?.image ?? undefined}
          />
          <AvatarFallback>
            {comment.user?.name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              {parentUserName ? (
                <>
                  <span className="font-medium">{comment.user?.name}</span>
                  <span className="text-muted-foreground text-sm">
                    replying to {parentUserName}
                  </span>
                </>
              ) : (
                <span className="font-medium">{comment.user?.name}</span>
              )}
            </div>
            {currentUserId && (
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
                        onClick={() => onReport(comment.id)}
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
                          onClick={() => onEdit(comment.id, comment.content)}
                          size="sm"
                          variant="ghost"
                        >
                          <Edit className="mr-2 size-4" />
                          Edit
                        </Button>
                        <Button
                          className="w-full justify-start text-destructive"
                          onClick={() => onDelete(comment.id)}
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
          <p className="mt-2 whitespace-pre-wrap">{comment.content}</p>
          <div className="mt-2 flex items-center gap-4">
            <span className="text-muted-foreground text-sm">
              {formatShortTime(new Date(comment.createdAt))}
            </span>
            <Button
              className="h-8"
              onClick={() => onLike(comment.id)}
              size="sm"
              variant={comment.hasLiked ? "default" : "ghost"}
            >
              <ArrowBigUp
                className={`mr-1 size-4 ${comment.hasLiked ? "fill-current" : ""}`}
              />
              {formatNumber.format(comment.likeCount || 0)}
            </Button>
            {currentUserId && (
              <Button
                onClick={() =>
                  onReply(
                    comment.id,
                    comment.user?.username || "",
                    comment.user?.name
                  )
                }
                size="sm"
                variant="ghost"
              >
                <Reply className="mr-1 size-4" />
                Reply
              </Button>
            )}
            {hasReplies && (
              <Button
                onClick={() => setShowReplies(!showReplies)}
                size="sm"
                variant="ghost"
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="mr-1 size-4" />
                    Hide replies
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 size-4" />
                    Show replies ({comment.replies?.length || 0})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Recursively render nested replies */}
      {hasReplies && showReplies && (
        <div className="space-y-4 border-l-2 pl-4">
          {comment.replies?.map((reply) => (
            <CommentItem
              comment={reply}
              currentUserId={currentUserId}
              depth={depth + 1}
              key={reply.id}
              onDelete={onDelete}
              onEdit={onEdit}
              onLike={onLike}
              onReply={onReply}
              onReport={onReport}
              parentUserName={comment.user?.name || undefined}
              parentUsername={comment.user?.username || undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Edit Comment Dialog Component
interface EditCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comment: { id: string; content: string };
  onSave: (content: string) => Promise<void>;
}

function EditCommentDialog({
  open,
  onOpenChange,
  comment,
  onSave,
}: EditCommentDialogProps) {
  const [content, setContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setContent(comment.content);
    }
  }, [open, comment.content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSave(content.trim());
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit comment</DialogTitle>
          <DialogDescription>Make changes to your comment</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Textarea
              className="min-h-[120px]"
              onChange={(e) => setContent(e.target.value)}
              required
              value={content}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={!content.trim() || isLoading} type="submit">
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
