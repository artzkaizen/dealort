import { db } from "@dealort/db";
import { report } from "@dealort/db/schema";
import { ORPCError } from "@orpc/server";
import * as z from "zod/v4";
import { protectedProcedure } from "../index";

export const reportsRouter = {
  /**
   * Create a report
   */
  create: protectedProcedure
    .input(
      z.object({
        reportableType: z.enum(["comment", "review"]),
        reportableId: z.string(),
        reason: z.string(),
        description: z.string().optional(),
      })
    )
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const id = crypto.randomUUID();
      await db.insert(report).values({
        id,
        userId: context.session.user.id,
        reportableType: input.reportableType,
        reportableId: input.reportableId,
        reason: input.reason,
        description: input.description,
        status: "pending",
      });

      return { id, success: true };
    }),
};

export type ReportsRouter = typeof reportsRouter;
