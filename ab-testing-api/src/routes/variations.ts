import { Hono } from "hono";
import { createDb, generateId, getCurrentTimestamp } from "../db";
import { experiments, variations } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { Bindings } from "../db/schema";

const app = new Hono<{ Bindings: Bindings }>();

// Get variations for an experiment
app.get("/:experimentId", async (c) => {
  const db = createDb(c.env.DB);
  const experimentId = c.req.param("experimentId");
  
  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, experimentId),
  });

  if (!experiment) {
    return c.json({ error: "Experiment not found" }, 404);
  }

  const experimentVariations = await db
    .select()
    .from(variations)
    .where(eq(variations.experimentId, experimentId));

  return c.json(experimentVariations);
});

// Add a new variation to an experiment
app.post("/:experimentId", async (c) => {
  const db = createDb(c.env.DB);
  const experimentId = c.req.param("experimentId");
  const body = await c.req.json();
  
  const { content, weight, type } = body;
  
  if (!content || typeof weight !== "number" || !["A", "B"].includes(type)) {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, experimentId),
  });

  if (!experiment) {
    return c.json({ error: "Experiment not found" }, 404);
  }

  // Check if variation type already exists
  const existingVariation = await db.query.variations.findFirst({
    where: and(
      eq(variations.experimentId, experimentId),
      eq(variations.type, type)
    ),
  });

  if (existingVariation) {
    return c.json({ error: `Variation type ${type} already exists` }, 400);
  }

  const timestamp = getCurrentTimestamp();
  const variation = await db.insert(variations).values({
    id: generateId(),
    experimentId,
    content,
    weight,
    type,
    createdAt: timestamp,
    updatedAt: timestamp,
  }).returning();

  return c.json(variation[0], 201);
});

// Update a variation
app.put("/:experimentId/:variationId", async (c) => {
  const db = createDb(c.env.DB);
  const experimentId = c.req.param("experimentId");
  const variationId = c.req.param("variationId");
  const body = await c.req.json();
  
  const { content, weight, type } = body;
  
  if (!content || typeof weight !== "number" || !["A", "B"].includes(type)) {
    return c.json({ error: "Invalid request body" }, 400);
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
  const updatedVariation = await db
    .update(variations)
    .set({
      content,
      weight,
      type,
      updatedAt: timestamp,
    })
    .where(and(
      eq(variations.id, variationId),
      eq(variations.experimentId, experimentId)
    ))
    .returning();

  return c.json(updatedVariation[0]);
});

export default app; 