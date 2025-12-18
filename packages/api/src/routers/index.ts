import { db } from "@dealort/db";
import type { RouterClient } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";
import { commentsRouter } from "./comments";
import { productsRouter } from "./products";
import { reportsRouter } from "./reports";
import { reviewsRouter } from "./reviews";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
  updateUserImage: protectedProcedure
    .input(z.object({ image: z.string().url() }))
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new Error("Unauthorized");
      }

      // Update user image using SQL directly
      await db.$client.execute({
        sql: "UPDATE user SET image = ?, updated_at = ? WHERE id = ?",
        args: [input.image, new Date().toISOString(), context.session.user.id],
      });

      return { success: true };
    }),
  // Product routes
  products: productsRouter,
  // Review routes
  reviews: reviewsRouter,
  // Comment routes
  comments: commentsRouter,
  // Report routes
  reports: reportsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
