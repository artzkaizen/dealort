import { useRouter } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import { FingerprintPatternIcon } from "lucide-react";
import { toast } from "sonner";
import { GithubIcon, GoogleIcon } from "@/assets/icons";
import InvestmentSVG from "@/assets/illustrations/auth-investment.svg";
import PitchingSVG from "@/assets/illustrations/auth-pitching.svg";
import UnlockSVG from "@/assets/illustrations/auth-unlock.svg";
import { BetterAuthActionButton } from "@/components/better-auth-action-button";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { authClient } from "@/lib/auth-client";

interface LoginFormProps {
  /**
   * Whether to show the carousel (full page) or just the login form (dialog)
   */
  showCarousel?: boolean;
  /**
   * Callback when user successfully logs in
   */
  onLoginSuccess?: () => void;
  /**
   * Custom callback URL for OAuth redirects (defaults to /dashboard)
   */
  callbackURL?: string;
  /**
   * Custom callback URL for new users (defaults to /dashboard/settings)
   */
  newUserCallbackURL?: string;
}

export function LoginForm({
  showCarousel = true,
  onLoginSuccess,
  callbackURL,
  newUserCallbackURL,
}: LoginFormProps) {
  const { refetch } = authClient.useSession();
  const router = useRouter();

  const defaultCallbackURL =
    callbackURL || `${window.location.origin}/dashboard`;
  const defaultNewUserCallbackURL =
    newUserCallbackURL || `${window.location.origin}/dashboard/settings`;

  async function requestGoogleAuth() {
    return await authClient.signIn.social({
      provider: "google",
      callbackURL: defaultCallbackURL,
      newUserCallbackURL: defaultNewUserCallbackURL,
    });
  }

  async function requestGithubAuth() {
    return await authClient.signIn.social({
      provider: "github",
      callbackURL: defaultCallbackURL,
      newUserCallbackURL: defaultNewUserCallbackURL,
    });
  }

  async function requestPasskeyAuth() {
    return await authClient.signIn.passkey(undefined, {
      onError: (error) => {
        toast.error(error.error.message || "Failed to request passkey auth");
      },
      onSuccess: () => {
        toast.success("Passkey auth requested successfully");
        router.invalidate();
        refetch();
        onLoginSuccess?.();
      },
    });
  }

  const loginContent = (
    <div className="flex flex-col gap-6 px-4 pt-16 md:px-20 md:pt-[20%]">
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-3xl">Welcome,</h1>
        <p className="mb-4 font-light text-sm">
          Safely Create an account or Login safely withing a few clicks using
          your favorite OAuth provider.
        </p>

        <div className="flex flex-col gap-4 space-y-4">
          <Button
            className="cursor-pointer py-6 text-sm"
            onClick={() => requestGoogleAuth()}
            variant={"outline"}
          >
            <GoogleIcon className="size-6" /> Sign In with Google
          </Button>

          <Button
            className="cursor-pointer py-6 text-sm"
            onClick={() => requestGithubAuth()}
            variant={"default"}
          >
            <GithubIcon className="size-6 invert dark:invert-0" /> Sign In with
            Github
          </Button>
        </div>

        <div className="my-4 flex items-center gap-1">
          <span className="grow border" />
          <span className="font-light text-sm">OR</span>
          <span className="grow border" />
        </div>

        <BetterAuthActionButton
          action={() => requestPasskeyAuth()}
          className="cursor-pointer py-6 text-sm"
          variant={"secondary"}
        >
          <FingerprintPatternIcon className="size-6" /> Use Passkey
        </BetterAuthActionButton>
      </div>
    </div>
  );

  const carouselContent = showCarousel ? (
    <div className="col-span-2 min-h-screen max-md:hidden">
      <Carousel
        className="flex h-full w-full items-center justify-center border-l bg-secondary"
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 5000,
          }),
        ]}
      >
        <CarouselContent className="flex">
          <CarouselItem className="mx-auto flex h-full w-full flex-col items-center justify-center px-4">
            <img
              alt="unlock"
              className="h-60 w-50"
              height=""
              src={UnlockSVG}
              width=""
            />
            <p className="mt-3 max-w-sm text-center text-[#6c63ff]">
              Get a free secured account or login to your existing account to
              access your Virtual Data Room (VDR)
            </p>
          </CarouselItem>
          <CarouselItem className="mx-auto flex h-full w-full flex-col items-center justify-center px-4">
            <img
              alt="pitch"
              className="h-60 w-50"
              height=""
              src={PitchingSVG}
              width=""
            />
            <p className="mt-3 max-w-sm text-center text-foreground">
              Give your self and your team a chance of building in public and
              letting investors know about your product.
            </p>
          </CarouselItem>

          <CarouselItem className="mx-auto flex h-full w-full flex-col items-center justify-center px-4">
            <img
              alt="investment"
              className="h-60 w-50"
              height=""
              src={InvestmentSVG}
              width=""
            />
            <p className="mt-3 max-w-sm text-center text-[#f50057]">
              Get noticed by potential users and investors. Give your product a
              chance of getting seed funding.
            </p>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </div>
  ) : null;

  if (showCarousel) {
    return (
      <div className="*:min-h-screen md:grid md:grid-cols-5">
        <div className="md:col-span-3">{loginContent}</div>
        {carouselContent}
      </div>
    );
  }

  return <div className="w-full">{loginContent}</div>;
}
