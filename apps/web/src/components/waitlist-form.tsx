import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { client, orpc } from "@/utils/orpc";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email"),
});
type FormSchema = z.infer<typeof formSchema>;

interface WaitlistFormProps {
  afterSubmit?: () => void;
}

export function WaitlistForm({ afterSubmit }: WaitlistFormProps) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // Type-safe client accessors
  const waitlistClient = client.waitlist as {
    check: (input: { email?: string }) => Promise<{ exists: boolean }>;
  };

  const waitlistMutations = orpc.waitlist as unknown as {
    add: {
      mutationOptions: () => {
        mutationFn: (input: {
          name: string;
          email: string;
        }) => Promise<{ id: string; success: boolean }>;
      };
    };
  };

  const waitlistMutation = useMutation({
    ...waitlistMutations.add.mutationOptions(),
    onSuccess: () => {
      toast.success(
        "Successfully joined the waitlist! Check your email for confirmation."
      );
      form.reset();
      afterSubmit?.();
    },
    onError: (error: Error) => {
      const errorMessage =
        error.message || "Failed to join waitlist. Please try again.";
      toast.error(errorMessage);
    },
  });

  async function onSubmit(values: FormSchema) {
    try {
      const result = await waitlistClient.check({
        email: values.email,
      });
      if (result.exists) {
        toast.info(
          "You are already in our waitlist! We will update you as soon as we are done. Check your email for confirmation."
        );
        return;
      }

      await waitlistMutation.mutateAsync({
        name: values.name,
        email: values.email,
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to check waitlist. Please try again.");
      }
      // Silently handle error - user will see toast notification if submission fails
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    className="capitalize"
                    disabled={waitlistMutation.isPending}
                    placeholder="John Doe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    className="lowercase"
                    disabled={waitlistMutation.isPending}
                    inputMode="email"
                    placeholder="johndoe@example.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          className="sm: ml-auto w-full py-3 sm:w-fit sm:px-16"
          disabled={waitlistMutation.isPending}
          type="submit"
        >
          {waitlistMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Joining...
            </>
          ) : (
            "Join"
          )}
        </Button>
      </form>
    </Form>
  );
}
