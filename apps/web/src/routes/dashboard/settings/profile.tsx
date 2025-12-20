import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { EditIcon, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { TextField } from "@/components/custom-form-components/text-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  CircularProgress,
  CircularProgressIndicator,
  CircularProgressRange,
  CircularProgressTrack,
  CircularProgressValueText,
} from "@/components/ui/circular-progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { UploadButton } from "@/lib/uploadthing";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/settings/profile")({
  component: RouteComponent,
});

const profileDetailsFormSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(15)
    .transform((val) => val?.trim())
    .optional(),
  username: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, {
      message:
        "Username must start with a letter and can only contain letters, numbers, dashes, and underscores",
    })
    .transform((val: string) => val?.trim())
    .optional(),
  bio: z
    .string()
    .max(100)
    .transform((val) => val?.trim())
    .optional(),
});

type ProfileDetailsForm = z.infer<typeof profileDetailsFormSchema>;

function RouteComponent() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { refetch } = authClient.useSession();

  const detailsForm = useForm<ProfileDetailsForm>({
    resolver: zodResolver(profileDetailsFormSchema),
    defaultValues: {
      name: user?.name,
      username: user?.username ?? "",
      bio: (user as { bio?: string })?.bio ?? "",
    },
  });

  const handleProfileInformationUpdate = async (data: ProfileDetailsForm) => {
    const { data: usernameResponse } = await authClient.isUsernameAvailable({
      username: data.username ?? "", // required
    });

    if (!usernameResponse?.available && data.username !== user?.username) {
      toast.error("Username is not available");
      return;
    }

    await authClient.updateUser(
      {
        name: data.name,
        username: data.username,
        bio: data.bio,
      },
      {
        onError: () => {
          toast.error("Failed to update profile information");
        },
        onSuccess: () => {
          toast.success("Profile information updated successfully");
          refetch();
        },
      }
    );
  };

  return (
    <div className="py-2">
      {/* Profile picture section */}
      <section className="mb-12 px-2">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <div className="relative">
              <Avatar className="size-24">
                {isUploading ? (
                  <Skeleton className="size-full">
                    <CircularProgress
                      className="size-full"
                      value={uploadProgress}
                    >
                      <CircularProgressIndicator>
                        <CircularProgressTrack />
                        <CircularProgressRange />
                      </CircularProgressIndicator>
                      <CircularProgressValueText />
                    </CircularProgress>
                  </Skeleton>
                ) : (
                  <>
                    <AvatarImage
                      alt={user?.name || "User"}
                      src={user?.image || ""}
                    />
                    <AvatarFallback>
                      <User className="size-12" />
                    </AvatarFallback>
                  </>
                )}
              </Avatar>

              <UploadButton
                appearance={{
                  container:
                    "absolute left-16 right-0 -bottom-0 size-fit! rounded-full [&>div]:h-0 [&>div]:p-0! [&>div]leading-0! cursor-pointer! disabled:cursor-not-allowed! overflow-hidden!",
                  button:
                    "rounded-full size-fit! p-0! bg-transparent! cursor-pointer! disabled:cursor-not-allowed!",
                }}
                className="size-fit cursor-pointer! disabled:cursor-not-allowed!"
                content={{
                  button: (
                    <Button
                      aria-hidden="true"
                      className="pointer-events-none cursor-pointer rounded-full opacity-75 hover:opacity-100 disabled:bg-red-500!"
                      // Remove onClick and add pointer-events-none so parent handles click
                      disabled={isUploading}
                      size="icon" // prevent tab focus as button is now decorative
                      tabIndex={-1}
                    >
                      {isUploading ? (
                        <Spinner className="size-3" />
                      ) : (
                        <EditIcon className="size-3" />
                      )}
                    </Button>
                  ),
                }}
                disabled={isUploading}
                endpoint="profileImage"
                onBeforeUploadBegin={(files) => {
                  setIsUploading(true);
                  return files;
                }}
                onClientUploadComplete={async (res) => {
                  if (res?.[0]?.ufsUrl) {
                    try {
                      await client.updateUserImage({ image: res[0].ufsUrl });
                      toast.success("Profile picture updated successfully");
                      // navigate({ to: "/dashboard/settings/profile" });
                      refetch();
                    } catch (error) {
                      toast.error("Failed to update profile picture");
                    }
                  }
                  setIsUploading(false);
                }}
                onUploadError={(error: Error) => {
                  // Do something with the error.
                  setIsUploading(false);

                  toast.error(`ERROR! ${error.message}`);
                }}
                onUploadProgress={(progress) => {
                  setUploadProgress(progress);
                }}
              />
            </div>

            <div className="flex max-w-[100px] flex-col gap-px">
              <h5 className="font-bold text-xs">Max Size: 2MB</h5>
              <p className="text-[9px] text-muted-foreground">
                Accepts only images (png, jpg, jpeg, webp)
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-px">
            <h1 className="font-bold text-base sm:text-lg">Profile Picture</h1>
            <p className="text-muted-foreground text-xs sm:text-xs">
              Click the edit button to upload a new profile picture
            </p>
            {isUploading && (
              <p className="text-muted-foreground text-xs">Uploading...</p>
            )}
          </div>
        </div>
      </section>

      <Separator className="my-2" />

      {/* Profile details section */}
      <section className="px-2">
        <Form {...detailsForm}>
          <form
            className="space-y-8"
            onSubmit={detailsForm.handleSubmit(handleProfileInformationUpdate)}
          >
            <div>
              <h1 className="font-bold text-xl sm:text-xl">Profile Details</h1>
              <p className="text-muted-foreground text-xs">
                Update your profile information
              </p>
            </div>

            <div className="max-w-md space-y-12">
              <FormField
                control={detailsForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="capitalize"
                        defaultValue={user?.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={detailsForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} className="lowercase" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={detailsForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TextField
                        infoTooltip="Describe your bio in detail, what it is all about and what makes you stand out from the crowd"
                        inputType="textarea"
                        label="Bio"
                        maxLength={100}
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          field.onChange(e.target.value)
                        }
                        placeholder="Describe your bio in details (use formal tone devoid of stickers and emojis)"
                        required={false}
                        value={field.value as string}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button disabled={detailsForm.formState.isSubmitting} type="submit">
              {detailsForm.formState.isSubmitting
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </form>
        </Form>
      </section>
    </div>
  );
}
