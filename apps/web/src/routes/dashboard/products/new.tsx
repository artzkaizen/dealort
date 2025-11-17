import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/products/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main>
      <aside />
      <section />
    </main>
  );
}
