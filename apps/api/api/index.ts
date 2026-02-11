import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { v4 as uuid } from "uuid";

// Use shared crypto package (production safe)
import { encryptEnvelope, decryptEnvelope } from "@repo/crypto";

const app = Fastify({
  logger: true
});

// Enable CORS for frontend + preflight
app.register(cors, {
  origin: true, // In production, replace 'true' with your actual frontend domain
  methods: ["GET", "POST", "OPTIONS"]
});

// In-memory store (Note: Data will be lost when the Vercel function sleeps)
const db = new Map<string, any>();

// Encrypt & store
app.post("/tx/encrypt", async (req) => {
  const { partyId, payload } = req.body as any;

  if (!partyId || !payload) {
    return { error: "partyId and payload required" };
  }

  const enc = encryptEnvelope(payload);

  const record = {
    id: uuid(),
    partyId,
    createdAt: new Date().toISOString(),
    ...enc
  };

  db.set(record.id, record);
  return record;
});

// Fetch encrypted only
app.get("/tx/:id", async (req) => {
  return db.get((req.params as any).id) ?? { error: "Not found" };
});

// Decrypt
app.post("/tx/:id/decrypt", async (req) => {
  const rec = db.get((req.params as any).id);
  if (!rec) return { error: "Not found" };

  return decryptEnvelope(rec);
});


// ================================
// Vercel serverless handler
// ================================
export default async function handler(req: any, res: any) {
  await app.ready();

  // FIX: Strip the '/api' prefix so Fastify routes match correctly
  // Vercel sends: /api/tx/encrypt -> Fastify expects: /tx/encrypt
  if (req.url && req.url.startsWith("/api")) {
    req.url = req.url.replace("/api", "");
  }

  app.server.emit("request", req, res);
}


// ================================
// Local dev server
// ================================
if (process.env.NODE_ENV !== "production") {
  app.listen({ port: 3002 }).then(() => {
    console.log("🚀 API running at http://localhost:3002");
  });
}