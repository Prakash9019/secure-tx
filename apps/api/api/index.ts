import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { v4 as uuid } from "uuid";

import { encryptEnvelope, decryptEnvelope } from "@repo/crypto";

const app = Fastify({ logger: true });

app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "OPTIONS"]
});

// ================================
// 🔍 GLOBAL REQUEST LOGGER
// ================================
app.addHook("onRequest", async (req) => {
  console.log("➡️ METHOD:", req.method);
  console.log("➡️ URL:", req.url);
});

// ================================
// 🧪 HEALTH CHECK ROUTES
// ================================
app.get("/", async () => {
  return { status: "API running" };
});

app.get("/ping", async () => {
  return { pong: true };
});

// ================================
// DATA STORE
// ================================
const db = new Map<string, any>();

// ================================
// ROUTES
// ================================

app.post("/tx/encrypt", async (req) => {
  console.log("🔥 HIT encrypt route");

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

app.get("/tx/:id", async (req) => {
  console.log("📦 HIT fetch route");
  return db.get((req.params as any).id) ?? { error: "Not found" };
});

app.post("/tx/:id/decrypt", async (req) => {
  console.log("🔓 HIT decrypt route");

  const rec = db.get((req.params as any).id);
  if (!rec) return { error: "Not found" };

  return decryptEnvelope(rec);
});

// ================================
// VERCEL HANDLER
// ================================
export default async function handler(req: any, res: any) {
  await app.ready();

  console.log("🌐 RAW URL FROM VERCEL:", req.url);

  if (req.url?.startsWith("/api")) {
    req.url = req.url.replace("/api", "");
  }

  console.log("🔁 AFTER STRIP:", req.url);

  app.server.emit("request", req, res);
}

// ================================
// LOCAL DEV
// ================================
if (process.env.NODE_ENV !== "production") {
  app.listen({ port: 3002 }).then(() => {
    console.log("🚀 API running at http://localhost:3002");
  });
}
