import { Hono } from "hono";
import { createDb, generateId, getCurrentTimestamp } from "../db";
import { experiments, variations, views } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Bindings } from "../db/schema";

const app = new Hono<{ Bindings: Bindings }>();

// Get analytics for an experiment
app.get("/:experimentId", async (c) => {
  const db = createDb(c.env.DB);
  const experimentId = c.req.param("experimentId");
  
  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, experimentId),
    with: {
      variations: true,
    },
  });

  if (!experiment) {
    return c.json({ error: "Experiment not found" }, 404);
  }

  // Get view counts per variation
  const viewCounts = await db
    .select({
      variationId: views.variationId,
      count: sql<number>`count(*)`,
    })
    .from(views)
    .where(eq(views.experimentId, experimentId))
    .groupBy(views.variationId);

  // Get total views
  const totalViews = viewCounts.reduce((sum, v) => sum + v.count, 0);

  // Get views by country
  const viewsByCountry = await db
    .select({
      country: views.country,
      count: sql<number>`count(*)`,
    })
    .from(views)
    .where(eq(views.experimentId, experimentId))
    .groupBy(views.country);

  return c.json({
    experiment,
    analytics: {
      totalViews,
      viewCounts,
      viewsByCountry,
    },
  });
});

// Track a view
app.post("/track-view/:experimentId", async (c) => {
  const db = createDb(c.env.DB);
  const experimentId = c.req.param("experimentId");
  const body = await c.req.json();
  
  const { variationId, userAgent, country } = body;
  
  if (!variationId) {
    return c.json({ error: "Variation ID is required" }, 400);
  }

  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, experimentId),
  });

  if (!experiment) {
    return c.json({ error: "Experiment not found" }, 404);
  }

  const variation = await db.query.variations.findFirst({
    where: and(
      eq(variations.id, variationId),
      eq(variations.experimentId, experimentId)
    ),
  });

  if (!variation) {
    return c.json({ error: "Variation not found" }, 404);
  }

  const timestamp = getCurrentTimestamp();
  const view = await db.insert(views).values({
    id: generateId(),
    experimentId,
    variationId,
    userAgent,
    country,
    timestamp,
  }).returning();

  return c.json(view[0], 201);
});

export default app; 