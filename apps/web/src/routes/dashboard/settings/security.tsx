import { zodResolver } from "@hookform/resolvers/zod";
import {
  createFileRoute,
  useLoaderData,
  useRouter,
} from "@tanstack/react-router";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";

const passkeySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type PasskeyForm = z.infer<typeof passkeySchema>;

export const Route = createFileRoute("/dashboard/settings/security")({
  loader: async () => {
    const passkey = await authClient.passkey.listUserPasskeys();
    return { passkey };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { passkey } = useLoaderData({
    from: "/dashboard/settings/security",
  });

  const { refetch } = authClient.useSession();

  const passkeyForm = useForm<PasskeyForm>({
    resolver: zodResolver(passkeySchema),
    defaultValues: {
      name: "",
    },
  });

  async function handleAddPasskey(data: PasskeyForm) {
    return await authClient.passkey.addPasskey(
      {
        name: data.name,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to add passkey");
        },
        onSuccess: () => {
          setIsDialogOpen(false);
          passkeyForm.reset();

          router.invalidate();
          refetch();
        },
      }
    );
  }

  async function handleDeletePasskey(id: string) {
    return await authClient.passkey.deletePasskey(
      {
        id,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to delete passkey");
          return { error: true, message: error.error.message };
        },
        onSuccess: () => {
          toast.success("Passkey deleted successfully");
          router.invalidate();
          refetch();
        },
      }
    );
  }

  return (
    <div>
      {/* <section className="px-2 py-2">
        <h1 className="font-bold text-xl sm:text-xl">Security</h1>
        <p className="text-muted-foreground text-xs">
          Manage your security settings
        </p>
      </section> */}

      {/* <Separator className="my-2" /> */}

      <section className="px-2">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-bold text-lg sm:text-lg">Passkey</h2>
            <p className="text-muted-foreground text-xs">
              Manage your passkey settings
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {passkey?.data && passkey?.data?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {passkey.data.map((passkey) => (
                  <div
                    className="flex w-full items-center justify-between gap-2 rounded-md border p-2"
                    key={passkey.id}
                  >
                    <div className="flex flex-col gap-1">
                      <h3 className="font-medium text-sm uppercase">
                        {passkey.name}
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(new Date(passkey.createdAt))}
                      </p>
                    </div>
                    <div>
                      <ActionButton
                        action={() => handleDeletePasskey(passkey.id)}
                        requireAreYouSure
                        variant="destructive"
                      >
                        <TrashIcon className="size-4" />
                      </ActionButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex w-full items-center text-center">
                <p className="text-muted-foreground text-xs">
                  You have 0 passkeys registered
                </p>
              </div>
            )}

            <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-6 size-fit" variant="outline">
                  <PlusIcon className="size-4" />
                  Add Passkey
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Passkey</DialogTitle>
                  <DialogDescription>
                    Create a new passkey for secure, passwordless
                    authentication.
                  </DialogDescription>
                </DialogHeader>

                <Form {...passkeyForm}>
                  <form
                    className="space-y-4"
                    onSubmit={passkeyForm.handleSubmit(handleAddPasskey)}
                  >
                    <FormField
                      control={passkeyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g desktop" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      className="max-sm:w-full"
                      disabled={passkeyForm.formState.isSubmitting}
                      type="submit"
                    >
                      <LoadingSwap
                        isLoading={passkeyForm.formState.isSubmitting}
                      >
                        Add Passkey
                      </LoadingSwap>
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>
    </div>
  );
}
