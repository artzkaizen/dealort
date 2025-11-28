import { createFileRoute } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import { GithubIcon, GoogleIcon } from "@/assets/icons";
import InvestmentSVG from "@/assets/illustrations/auth-investment.svg";
import PitchingSVG from "@/assets/illustrations/auth-pitching.svg";
import UnlockSVG from "@/assets/illustrations/auth-unlock.svg";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/authenticate")({
  component: RouteComponent,
});

function RouteComponent() {
  // const [showSignIn, setShowSignIn] = useState(false);

  // return showSignIn ? (
  //   <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  // ) : (
  //   <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  // );

  async function requestGoogleAuth() {
    try {
      const data = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard`,
        newUserCallbackURL: `${window.location.origin}/dashboard/profile`,
      });

      console.log(data);
    } catch (error) {
      console.error(error);
    }

    console.log("clicked");
  }

  return (
    <div className="*:min-h-screen md:grid md:grid-cols-5">
      <div className="flex flex-col gap-6 px-4 pt-16 md:col-span-3 md:px-20 md:pt-[20%]">
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

            <div className="my-4 flex items-center gap-1">
              <span className="grow border" />
              <span className="font-light text-sm">OR</span>
              <span className="grow border" />
            </div>

            <Button className="cursor-pointer py-6 text-sm" variant={"default"}>
              <GithubIcon className="size-6 invert" /> Sign In with Github
            </Button>
          </div>
        </div>
      </div>
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
                Get noticed by potential users and investors. Give your product
                a chance of getting seed funding.
              </p>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
