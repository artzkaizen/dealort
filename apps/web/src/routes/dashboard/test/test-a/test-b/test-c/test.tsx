import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/dashboard/test/test-a/test-b/test-c/test',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/test/test-a/test-b/test-c/test"!</div>
}
