import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { v4 as uuid } from "uuid";
import { encryptEnvelope, decryptEnvelope } from "@repo/crypto";

export default async function handler(req: any, res: any) {
  const app = Fastify();

  await app.register(cors, { origin: "*" });

  const db = new Map<string, any>();

  app.post("/tx/encrypt", async (req) => {
    const { partyId, payload } = req.body as any;

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
    return db.get((req.params as any).id);
  });

  app.post("/tx/:id/decrypt", async (req) => {
    const rec = db.get((req.params as any).id);
    if (!rec) return { error: "Not found" };
    return decryptEnvelope(rec);
  });

  await app.ready();
  app.server.emit("request", req, res);
}
