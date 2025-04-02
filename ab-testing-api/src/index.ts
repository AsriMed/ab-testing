/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { Bindings } from "./db/schema";

// Import routes
import experiments from "./routes/experiments";
import variations from "./routes/variations";
import analytics from "./routes/analytics";
import embed from "./routes/embed";

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS
app.use("/*", cors());

// Mount routes
app.route("/api/experiments", experiments);
app.route("/api/experiments/:experimentId/variations", variations);
app.route("/api/experiments/:experimentId/analytics", analytics);
app.route("/api/track-view", analytics);
app.route("/embed", embed);

export default app;
