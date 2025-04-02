import { Hono } from "hono";
import { createDb } from "../db";
import { experiments, variations } from "../db/schema";
import { eq } from "drizzle-orm";
import { Bindings } from "../db/schema";
import type { Variation } from "../db/schema";

const app = new Hono<{ Bindings: Bindings }>();

// Serve the embed script
app.get("/:experimentId", async (c) => {
  const experimentId = c.req.param("experimentId");
  
  const script = `
(function(experimentId) {
  // Fetch content from API
  fetch('https://ab-testing-api.irsale.fr/content/' + experimentId)
    .then(res => res.json())
    .then(data => {
      // Insert content into specified element
      document.getElementById('ab-test-' + experimentId).innerHTML = data.content;
      // Track view
      fetch('https://ab-testing-api.irsale.fr/api/track-view/' + experimentId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variationId: data.variationId,
          userAgent: navigator.userAgent,
          country: navigator.language.split('-')[1] || 'unknown'
        })
      });
    })
    .catch(error => console.error('A/B test error:', error));
})('${experimentId}');
`;

  return c.text(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
    },
  });
});

// Serve the content (randomly selected variation)
app.get("/content/:experimentId", async (c) => {
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

  // Calculate total weight
  const totalWeight = experiment.variations.reduce((sum: number, v: Variation) => sum + v.weight, 0);
  
  // Generate random number between 0 and total weight
  const random = Math.random() * totalWeight;
  
  // Select variation based on weights
  let currentSum = 0;
  let selectedVariation: Variation | null = null;
  
  for (const variation of experiment.variations) {
    currentSum += variation.weight;
    if (random <= currentSum) {
      selectedVariation = variation;
      break;
    }
  }

  // Fallback to first variation if something went wrong
  if (!selectedVariation) {
    selectedVariation = experiment.variations[0];
  }

  return c.json({
    content: selectedVariation.content,
    variationId: selectedVariation.id,
  });
});

export default app; 