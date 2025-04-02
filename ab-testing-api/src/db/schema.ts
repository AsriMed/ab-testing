import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Define the Bindings type for Hono
export type Bindings = {
  DB: D1Database;
};

// Experiments table
export const experiments = sqliteTable("experiments", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// Variations table
export const variations = sqliteTable("variations", {
  id: text("id").primaryKey().notNull(),
  experimentId: text("experiment_id")
    .notNull()
    .references(() => experiments.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  weight: integer("weight", { mode: "number" }).notNull(),
  type: text("type", { enum: ["A", "B"] }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// Views table for analytics
export const views = sqliteTable("views", {
  id: text("id").primaryKey().notNull(),
  experimentId: text("experiment_id")
    .notNull()
    .references(() => experiments.id, { onDelete: "cascade" }),
  variationId: text("variation_id")
    .notNull()
    .references(() => variations.id, { onDelete: "cascade" }),
  userAgent: text("user_agent"),
  country: text("country"),
  timestamp: text("timestamp")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// Define relations
export const experimentsRelations = relations(experiments, ({ many }) => ({
  variations: many(variations),
}));

export const variationsRelations = relations(variations, ({ one }) => ({
  experiment: one(experiments, {
    fields: [variations.experimentId],
    references: [experiments.id],
  }),
}));

// Types for our schema
export type Experiment = typeof experiments.$inferSelect;
export type NewExperiment = typeof experiments.$inferInsert;

export type Variation = typeof variations.$inferSelect;
export type NewVariation = typeof variations.$inferInsert;

export type View = typeof views.$inferSelect;
export type NewView = typeof views.$inferInsert; 