import { Hono } from "hono";
import { createDb, generateId, getCurrentTimestamp } from "../db";
import { experiments, variations } from "../db/schema";
import { eq } from "drizzle-orm";
import { Bindings } from "../db/schema";

const app = new Hono<{ Bindings: Bindings }>();

// List all experiments
app.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const allExperiments = await db.select().from(experiments);
  return c.json(allExperiments);
});

// Create new experiment
app.post("/", async (c) => {
  const db = createDb(c.env.DB);
  const body = await c.req.json();
  
  const { name, description, variations: variationsData } = body;
  
  if (!name || !variationsData || !Array.isArray(variationsData) || variationsData.length !== 2) {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const experimentId = generateId();
  const timestamp = getCurrentTimestamp();

  // Create experiment
  await db.insert(experiments).values({
    id: experimentId,
    name,
    description,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // Create variations
  await db.insert(variations).values(
    variationsData.map((v: { content: string; weight: number; type: "A" | "B" }) => ({
      id: generateId(),
      experimentId,
      content: v.content,
      weight: v.weight,
      type: v.type,
      createdAt: timestamp,
      updatedAt: timestamp,
    }))
  );

  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, experimentId),
    with: {
      variations: true,
    },
  });

  return c.json(experiment, 201);
});

// Get experiment by ID
app.get("/:id", async (c) => {
  const db = createDb(c.env.DB);
  const id = c.req.param("id");
  
  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, id),
    with: {
      variations: true,
    },
  });

  if (!experiment) {
    return c.json({ error: "Experiment not found" }, 404);
  }

  return c.json(experiment);
});

// Delete experiment
app.delete("/:id", async (c) => {
  const db = createDb(c.env.DB);
  const id = c.req.param("id");
  
  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, id),
  });

  if (!experiment) {
    return c.json({ error: "Experiment not found" }, 404);
  }

  // Delete experiment (variations will be deleted due to cascade)
  await db.delete(experiments).where(eq(experiments.id, id));

  return c.json({ message: "Experiment deleted successfully" });
});

export default app; 