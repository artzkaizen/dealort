import { TooltipContent } from "@radix-ui/react-tooltip";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Dot, ExternalLinkIcon, HandFist, MessageSquare } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Rating, RatingItem } from "./ui/rating";
import { Tooltip, TooltipTrigger } from "./ui/tooltip";

export function ProductCard({
  className,
  children,
  productSlug,
  ...props
}: React.HTMLAttributes<HTMLAnchorElement> & {
  productSlug: string;
}) {
  return (
    <Link
      className={cn(
        "group flex flex-col overflow-hidden rounded-sm border border-border bg-card p-3 transition-all hover:border-primary/60",
        className
      )}
      to={`/products/${encodeURIComponent(productSlug)}`}
      {...props}
    >
      {children}
    </Link>
  );
}

interface ProductCardLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  logo: string;
}
export function ProductCardLogo({
  className,
  name,
  logo,
  ...props
}: ProductCardLogoProps) {
  return (
    <Avatar className={cn("size-10 rounded-sm", className)} {...props}>
      <AvatarImage className="rounded-sm!" src={logo} />
      <AvatarFallback className="rounded-sm!">{name.charAt(0)}</AvatarFallback>
    </Avatar>
  );
}

interface ProductCardDetailsProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  tagline: string;
}
export function ProductCardDetails({
  className,
  name,
  tagline,
  ...props
}: ProductCardDetailsProps) {
  return (
    <div className={cn("flex flex-col gap-px", className)} {...props}>
      <h3
        className="group flex items-baseline gap-1 font-semibold max-sm:text-sm [&>svg]:size-3"
      >
        {name}
        <ExternalLinkIcon className="opacity-0 transition-opacity group-hover:opacity-100" />
      </h3>
      <p className="truncate text-muted-foreground text-xs sm:text-sm">
        {tagline}
      </p>
    </div>
  );
}

interface ProductCardRateAndReviewProps
  extends React.HTMLAttributes<HTMLDivElement> {
  rating: number;
  reviewsCount: number;
}
export function ProductCardRateAndReview({
  className,
  rating,
  reviewsCount,
  ...props
}: ProductCardRateAndReviewProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className="flex items-center gap-[0.4px]">
        <Rating
          className="gap-px text-yellow-500 [&>svg]:size-3"
          defaultValue={rating}
          readOnly
          step={1}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <RatingItem className="size-3" key={i} />
          ))}
        </Rating>
      </div>

      <span className="text-muted-foreground text-xs">
        ({formatNumber.format(reviewsCount)} reviews)
      </span>
    </div>
  );
}

interface ProductCardCategoryProps
  extends React.HTMLAttributes<HTMLDivElement> {
  category: string[];
}
export function ProductCardCategory({
  className,
  category,
  ...props
}: ProductCardCategoryProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)} {...props}>
      {category.slice(0, 3).map((cat) => (
        <Badge
          className="size-fit px-2 py-0.5 text-accent-foreground text-xs lowercase"
          key={cat}
          variant={"secondary"}
        >
          {cat}
        </Badge>
      ))}
    </div>
  );
}

interface ProductCardCommentAndImpressionCountProps
  extends React.HTMLAttributes<HTMLDivElement> {
  impressions: number;
  commentCount: number;
}
export function ProductCardCommentAndImpressionCount({
  className,
  impressions,
  commentCount,
  ...props
}: ProductCardCommentAndImpressionCountProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)} {...props}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className="size-fit px-2 py-0.5 text-accent-foreground text-xs lowercase"
            variant={"outline"}
          >
            <HandFist /> {formatNumber.format(impressions)}
          </Badge>
        </TooltipTrigger>

        <TooltipContent className="z-35 max-w-36 bg-popover p-2 text-xs shadow">
          About {impressions} person{impressions !== 1 ? "s is " : " is "}{" "}
          impressed with this project
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className="size-fit px-2 py-0.5 text-accent-foreground text-xs lowercase"
            variant={"outline"}
          >
            <MessageSquare /> {formatNumber.format(commentCount)}
          </Badge>
        </TooltipTrigger>

        <TooltipContent className="z-35 max-w-36 bg-popover p-2 text-xs shadow">
          About {commentCount} person{commentCount !== 1 ? "s" : ""} commented
          on this project
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

interface ProductCardTimeAndDurationProps
  extends React.HTMLAttributes<HTMLDivElement> {
  createdAt: string;
}

export function ProductCardTimeAndDuration({
  className,
  createdAt,
  ...props
}: ProductCardTimeAndDurationProps) {
  const date = new Date(createdAt);
  const result = formatDistanceToNow(date, { addSuffix: true });

  return (
    <div
      className={cn(
        "flex items-center gap-[0.4px] text-[10px] text-muted-foreground",
        className
      )}
      {...props}
    >
      <Dot /> Listed {result}
    </div>
  );
}

interface ProductCardLaunchInfoProps
  extends React.HTMLAttributes<HTMLDivElement> {
  launchDate: string;
}
export function ProductCardLaunchInfo({
  className,
  launchDate = "",
  ...props
}: ProductCardLaunchInfoProps) {
  if (!launchDate) return null;

  const date = new Date(launchDate);
  const result = formatDistanceToNow(date, { addSuffix: false });
  const isFuture = date.getTime() > Date.now();
  return (
    <div
      className={cn(
        "flex items-center gap-[0.4px] text-[10px] text-muted-foreground",
        className
      )}
      {...props}
    >
      <Dot /> {isFuture ? `Launching in ${result}` : `Launched ${result} ago`}
    </div>
  );
}
