import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      routeToken: "layout",
      basePath: "/",
      routesDir: "./src/routes",
      routeFilePattern: "**/*.{ts,tsx}",
      routeFilePrefix: "page",
      routeFileSuffix: "page",
      routeFileExtension: "tsx",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // server: {
  //   headers: {
  //     // Allow images from Google and GitHub user content
  //     "Content-Security-Policy": [
  //       "default-src 'self';",
  //       "img-src 'self' https://lh3.googleusercontent.com https://avatars.githubusercontent.com data: blob:;",
  //       "script-src 'self';",
  //       "style-src 'self' 'unsafe-inline';",
  //       "connect-src *;",
  //       "font-src 'self';",
  //       "frame-src 'self';",
  //     ].join(" "),
  //   },
  // },
});
