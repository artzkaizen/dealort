export const NotFoundComponent = () => (
  <main className="flex max-h-screen min-h-full w-full flex-col items-center justify-center">
    <div className="relative h-40 w-40" style={{ perspective: "900px" }}>
      {/* Bottom square, points to 4 O'clock (rotated 45deg, a bit towards bottom-right) */}
      {/* Both squares rotated to point at 10 O'Clock (from bottom to top), using same degrees */}
      <div
        className="absolute top-1/2 left-1/2 h-24 w-24 rounded-lg bg-popover"
        style={{
          transform: `
            translate(-50%, -50%)
            rotateZ(-45deg)
            rotateX(-18deg)
            rotateY(18deg)
          `,
          zIndex: 1,
          boxShadow: "0 8px 16px rgba(0,0,0,0.09)",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 h-24 w-24 rounded-lg bg-popover"
        style={{
          transform: `
            translate(-50%, -50%)
            translateY(-16px)
            rotateZ(-45deg)
            rotateX(-18deg)
            rotateY(318deg)
          `,
          zIndex: 2,
          boxShadow: "0 12px 24px rgba(90,90,255,0.1)",
        }}
      />
    </div>
    <h1 className="mb-3 px-2 font-bold text-2xl">404 - Not Found</h1>
    <p className="px-2 text-muted-foreground text-sm">
      The page you are looking for does not exist.
    </p>
  </main>
);
