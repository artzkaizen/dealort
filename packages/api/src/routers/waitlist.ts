import { sendWaitlistConfirmationEmail } from "@dealort/auth/emails/service";
import { db } from "@dealort/db";
import { waitlist } from "@dealort/db/schema";
import { apiLogger } from "@dealort/utils/logger";
import { eq } from "drizzle-orm";
import z from "zod";
import { publicProcedure } from "..";

export const waitlistRouter = {
  /**
   * Check if email is already in the waitlist
   */
  check: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .handler(async ({ input }) => {
      const existing = await db.query.waitlist.findFirst({
        where: eq(waitlist.email, input.email),
      });

      return { exists: !!existing };
    }),

  /**
   * Add a user to the waitlist
   */
  add: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })
    )
    .handler(async ({ input }) => {
      // Check if email already exists
      const existingByEmail = await db.query.waitlist.findFirst({
        where: eq(waitlist.email, input.email),
      });

      if (existingByEmail) {
        throw new Error("This email is already on our waitlist");
      }

      const id = crypto.randomUUID();
      try {
        await db.insert(waitlist).values({
          id,
          name: input.name,
          email: input.email,
          ipAddress: "", // Default empty string for IP address
        });

        await sendWaitlistConfirmationEmail({
          to: input.email,
          name: input.name,
        });

        return { id, success: true };
      } catch (error) {
        apiLogger.error(
          {
            error: error instanceof Error ? error.message : String(error),
            input: { email: input.email },
          },
          "Failed to add user to waitlist"
        );
        throw error;
      }
    }),
};
