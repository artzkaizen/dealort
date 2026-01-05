import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const organizationReference = pgTable("organization_reference", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  webUrl: text("web_url").notNull(),
  xUrl: text("x_url").notNull(),
  linkedinUrl: text("linkedin_url"),
  sourceCodeUrl: text("source_code_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Organization assets (logo and gallery images).
 * This decouples media assets from the main organization record.
 * One record per organization containing logo and gallery URLs.
 */

export const organizationReferenceRelations = relations(
  organizationReference,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationReference.organizationId],
      references: [organization.id],
    }),
  })
);
