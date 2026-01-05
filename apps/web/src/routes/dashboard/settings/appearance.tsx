import { createFileRoute } from "@tanstack/react-router";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

const appearanceOptions = [
  {
    label: "Light",
    value: "light" as const,
    icon: SunIcon,
    description: "This will use a light theme for the application.",
  },
  {
    label: "Dark",
    value: "dark" as const,
    icon: MoonIcon,
    description: "This will use a dark theme for the application.",
  },
  {
    label: "System",
    value: "system" as const,
    icon: MonitorIcon,
    description: "This will use a system theme for the application.",
  },
] as const;

export const Route = createFileRoute("/dashboard/settings/appearance")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const { user } = session || {};
  const { refetch } = authClient.useSession();

  async function handleThemeChange(theme: string) {
    await authClient.updateUser(
      {
        theme,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to update theme");
        },
        onSuccess: () => {
          setTheme(theme);
          refetch();
        },
      }
    );
  }
  return (
    <div>
      <section className="space-y-4 p-2">
        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-lg sm:text-lg">Appearance</h2>
          <p className="text-muted-foreground text-xs">
            Choose your preferred appearance mode
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {appearanceOptions.map((option) => (
            <Card
              className={cn(
                "overflow-hidden p-0",
                user?.theme === option.value
                  ? "border-primary"
                  : "border-transparent"
              )}
              key={option.value}
            >
              <CardHeader className="p-0">
                <div className="flex items-center justify-between gap-1 bg-muted px-2 py-4">
                  <div className="flex items-center gap-2">
                    <option.icon className="size-4" />
                    <CardTitle className="text-sm">{option.label}</CardTitle>
                  </div>

                  <Checkbox
                    aria-label={`Select ${option.label} theme`}
                    checked={(user as User)?.theme === option.value}
                    className="cursor-pointer rounded-full border-2 border-primary"
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleThemeChange(option.value);
                      }
                    }}
                  />
                </div>
                <CardDescription className="px-2 text-muted-foreground text-xs">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AppearanceSkeleton theme={option.value} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function AppearanceSkeleton({
  theme,
}: {
  theme: (typeof appearanceOptions)[number]["value"];
}) {
  if (theme === "system") {
    return (
      <div className="relative flex gap-2 overflow-hidden rounded-md border">
        <div className="flex-1">
          <SkeletonPreview themeMode="light" />
        </div>
        <div className="absolute right-0 left-[40%] flex-1">
          <SkeletonPreview themeMode="dark" />
        </div>
      </div>
    );
  }

  return <SkeletonPreview themeMode={theme} />;
}

function SkeletonPreview({ themeMode }: { themeMode: "light" | "dark" }) {
  const isDark = themeMode === "dark";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border",
        isDark ? "border-gray-800 bg-[#1a1a1a]" : "border-gray-200 bg-white"
      )}
    >
      <TopNavBar isDark={isDark} />
      <div className="flex">
        <Sidebar isDark={isDark} />
        <MainContent isDark={isDark} />
      </div>
    </div>
  );
}

function TopNavBar({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b px-3 py-2",
        isDark ? "border-gray-800 bg-[#1f1f1f]" : "border-gray-200 bg-white"
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "size-6 rounded",
            isDark ? "bg-primary-foreground" : "bg-primary"
          )}
        />
        <div className="flex gap-1">
          <div
            className={cn(
              "h-2 w-12 rounded blur-sm",
              isDark ? "bg-muted-foreground" : "bg-muted"
            )}
          />
          <div
            className={cn(
              "h-2 w-12 rounded blur-sm",
              isDark ? "bg-secondary-foreground" : "bg-secondary"
            )}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Avatar className="size-6">
          <AvatarFallback
            className={cn(isDark ? "bg-secondary" : "bg-secondary", "text-xs")}
          >
            JD
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "h-6 w-16 rounded",
            isDark ? "bg-blue-500/30" : "bg-blue-600/20"
          )}
        />
      </div>
    </div>
  );
}

function Sidebar({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={cn(
        "w-20 border-r p-2",
        isDark ? "border-gray-800 bg-[#1f1f1f]" : "border-gray-200 bg-gray-50"
      )}
    >
      <div className="mb-4">
        <div
          className={cn(
            "mb-3 size-6 rounded",
            isDark ? "bg-muted-foreground" : "bg-muted"
          )}
        />
        <Avatar className="mb-3 size-6">
          <AvatarFallback
            className={cn(isDark ? "bg-secondary" : "bg-secondary", "text-xs")}
          >
            JD
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "h-8 w-full rounded",
            isDark ? "bg-blue-500/30" : "bg-blue-600/20"
          )}
        />
      </div>
      <div className="space-y-2">
        {["menu-1", "menu-2", "menu-3", "menu-4"].map((id) => (
          <div
            className={cn(
              "h-2 w-full rounded",
              isDark ? "bg-gray-700" : "bg-gray-300"
            )}
            key={id}
          />
        ))}
      </div>
    </div>
  );
}

function MainContent({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex-1 p-3">
      <div className="mb-4 flex items-center justify-between">
        <div
          className={cn(
            "h-6 w-32 rounded blur-sm",
            isDark ? "bg-gray-700" : "bg-gray-300"
          )}
        />
        <div
          className={cn(
            "h-6 w-16 rounded",
            isDark ? "bg-primary-foreground" : "bg-primary"
          )}
        />
      </div>
      <StatusCards isDark={isDark} />
      <FormArea isDark={isDark} />
    </div>
  );
}

function StatusCards({ isDark }: { isDark: boolean }) {
  const cards = [
    { id: "blue", dot: isDark ? "bg-blue-500" : "bg-blue-600" },
    { id: "green", dot: "bg-green-500" },
    { id: "red", dot: "bg-red-500" },
  ];

  return (
    <div className="mb-4 grid grid-cols-3 gap-2">
      {cards.map((card) => (
        <div
          className={cn(
            "rounded-md border p-2",
            isDark ? "border-gray-800 bg-[#1f1f1f]" : "border-gray-200 bg-white"
          )}
          key={card.id}
        >
          <div className={cn("mb-2 size-2 rounded-full", card.dot)} />
          <div
            className={cn(
              "mb-1 h-2 w-full rounded blur-sm",
              isDark ? "bg-gray-700" : "bg-gray-300"
            )}
          />
          <div
            className={cn(
              "h-2 w-3/4 rounded blur-sm",
              isDark ? "bg-gray-700" : "bg-gray-300"
            )}
          />
        </div>
      ))}
    </div>
  );
}

function FormArea({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        isDark ? "border-gray-800 bg-[#1f1f1f]" : "border-gray-200 bg-white"
      )}
    >
      <div
        className={cn(
          "mb-3 h-2 w-24 rounded blur-sm",
          isDark ? "bg-gray-700" : "bg-gray-300"
        )}
      />
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Input
          className={cn(
            "h-7",
            isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"
          )}
          disabled
        />
        <Input
          className={cn(
            "h-7",
            isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"
          )}
          disabled
        />
      </div>
      <div
        className={cn(
          "mb-2 h-2 w-32 rounded blur-sm",
          isDark ? "bg-gray-700" : "bg-gray-300"
        )}
      />
      <Input
        className={cn(
          "h-16",
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"
        )}
        disabled
      />
    </div>
  );
}
