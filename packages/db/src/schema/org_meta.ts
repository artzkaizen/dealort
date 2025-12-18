import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { organization } from "./auth";

/**
 * Organization reference links (URLs, social profiles, source code, etc.)
 * This provides a normalized structure for all external links related to an organization.
 * One record per organization containing all URL references.
 */
export const organizationReference = sqliteTable("organization_reference", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  webUrl: text("web_url").notNull(),
  xUrl: text("x_url").notNull(),
  linkedinUrl: text("linkedin_url"),
  sourceCodeUrl: text("source_code_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

/**
 * Organization assets (logo and gallery images).
 * This decouples media assets from the main organization record.
 * One record per organization containing logo and gallery URLs.
 */
export const organizationAsset = sqliteTable("organization_asset", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  logo: text("logo"),
  gallery: text("gallery", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

export const organizationReferenceRelations = relations(
  organizationReference,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationReference.organizationId],
      references: [organization.id],
    }),
  })
);

export const organizationAssetRelations = relations(
  organizationAsset,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationAsset.organizationId],
      references: [organization.id],
    }),
  })
);
