import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { organization, user } from "./auth";

/**
 * Review table - stores user reviews for organizations/products
 * Each review can have a rating and text content
 */
export const review = sqliteTable(
  "review",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // Typically 1-5 stars
    title: text("title"),
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("review_organizationId_idx").on(table.organizationId),
    index("review_userId_idx").on(table.userId),
    index("review_rating_idx").on(table.rating),
  ]
);

/**
 * Comment table - stores comments/replies
 * Comments can be top-level (parentId is null) or replies to other comments
 * Comments are associated with both a user and an organization
 */
export const comment = sqliteTable(
  "comment",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: text("parent_id"), // null for top-level comments, ID for replies (self-referential FK handled via relations)
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("comment_organizationId_idx").on(table.organizationId),
    index("comment_userId_idx").on(table.userId),
    index("comment_parentId_idx").on(table.parentId),
  ]
);

// Relations
export const reviewRelations = relations(review, ({ one }) => ({
  organization: one(organization, {
    fields: [review.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [review.userId],
    references: [user.id],
  }),
}));

/**
 * Comment like table - tracks likes on comments
 */
export const commentLike = sqliteTable(
  "comment_like",
  {
    id: text("id").primaryKey(),
    commentId: text("comment_id")
      .notNull()
      .references(() => comment.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("commentLike_commentId_idx").on(table.commentId),
    index("commentLike_userId_idx").on(table.userId),
    // Ensure one like per user-comment pair
    index("commentLike_userId_commentId_idx").on(table.userId, table.commentId),
  ]
);

/**
 * Report table - stores reports for comments, reviews, etc.
 */
export const report = sqliteTable(
  "report",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reportableType: text("reportable_type").notNull(), // 'comment', 'review', etc.
    reportableId: text("reportable_id").notNull(), // ID of the reported item
    reason: text("reason").notNull(),
    description: text("description"),
    status: text("status").default("pending").notNull(), // 'pending', 'resolved', 'dismissed'
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("report_userId_idx").on(table.userId),
    index("report_reportableType_reportableId_idx").on(
      table.reportableType,
      table.reportableId
    ),
  ]
);

export const commentRelations = relations(comment, ({ one, many }) => ({
  organization: one(organization, {
    fields: [comment.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [comment.userId],
    references: [user.id],
  }),
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
    relationName: "replies",
  }),
  replies: many(comment, {
    relationName: "replies",
  }),
  likes: many(commentLike),
}));

export const commentLikeRelations = relations(commentLike, ({ one }) => ({
  comment: one(comment, {
    fields: [commentLike.commentId],
    references: [comment.id],
  }),
  user: one(user, {
    fields: [commentLike.userId],
    references: [user.id],
  }),
}));
