import { type ImgHTMLAttributes, useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "loading"> {
  /**
   * The source URL of the image
   */
  src: string;
  /**
   * Alternative text for the image (required for accessibility)
   */
  alt: string;
  /**
   * Optional fallback image URL if the main image fails to load
   */
  fallback?: string;
  /**
   * Optional blur placeholder data URL (base64 encoded)
   */
  blurDataURL?: string;
  /**
   * Aspect ratio to prevent layout shift (e.g., "16/9", "4/3", "1/1")
   */
  aspectRatio?: string;
  /**
   * Whether to use native lazy loading (default: true)
   * Set to false to use Intersection Observer for more control
   */
  nativeLazy?: boolean;
  /**
   * Custom loading component to show while image is loading
   */
  loadingComponent?: React.ReactNode;
  /**
   * Custom error component to show if image fails to load
   */
  errorComponent?: React.ReactNode;
  /**
   * Callback fired when image loads successfully
   */
  onLoad?: () => void;
  /**
   * Callback fired when image fails to load
   */
  onError?: () => void;
}

/**
 * Custom Image component with best practices:
 * - Lazy loading with Intersection Observer or native loading
 * - Error handling with fallback support
 * - Loading states with skeleton placeholder
 * - Aspect ratio support to prevent layout shift
 * - Optional blur placeholder for better UX
 * - Full accessibility support
 */
export function Image({
  src,
  alt,
  fallback,
  blurDataURL,
  aspectRatio,
  nativeLazy = true,
  loadingComponent,
  errorComponent,
  onLoad,
  onError,
  className,
  style,
  ...props
}: ImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(nativeLazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for custom lazy loading
  useEffect(() => {
    if (nativeLazy) return;

    const imgElement = imgRef.current;
    if (!imgElement) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before image enters viewport
      }
    );

    observerRef.current.observe(imgElement);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [nativeLazy]);

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setIsLoading(false);
    if (fallback && imageSrc !== fallback) {
      setImageSrc(fallback);
      setHasError(false);
    } else {
      setHasError(true);
    }
    onError?.();
  };

  // Reset state when src changes
  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
    if (nativeLazy) {
      setIsInView(true);
    }
  }, [src, nativeLazy]);

  const aspectRatioStyle = aspectRatio
    ? {
        aspectRatio,
        ...style,
      }
    : style;

  // Show error component if image failed to load and no fallback
  if (hasError && errorComponent) {
    return <>{errorComponent}</>;
  }

  // Show loading component while loading
  if (isLoading && loadingComponent) {
    return (
      <div className={cn("relative", className)} style={aspectRatioStyle}>
        {loadingComponent}
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={aspectRatioStyle}
    >
      {/* Blur placeholder */}
      {blurDataURL && isLoading && (
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover blur-xl"
          src={blurDataURL}
          style={{ filter: "blur(20px)", transform: "scale(1.1)" }}
        />
      )}

      {/* Skeleton loading state */}
      {isLoading && !loadingComponent && (
        <Skeleton className="absolute inset-0 h-full w-full" />
      )}

      {/* Main image */}
      {isInView && (
        <img
          alt={alt}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          loading={nativeLazy ? "lazy" : undefined}
          onError={handleError}
          onLoad={handleLoad}
          ref={imgRef}
          src={imageSrc}
          {...props}
        />
      )}

      {/* Fallback for browsers that don't support lazy loading */}
      {!(isInView || nativeLazy) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Skeleton className="h-full w-full" />
        </div>
      )}
    </div>
  );
}
