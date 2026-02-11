"use client";

import { useState } from "react";

export default function Home() {
  const [partyId, setPartyId] = useState("");
  const [payload, setPayload] = useState("{}");
  const [record, setRecord] = useState<any>(null);
  // const API = process.env.NEXT_PUBLIC_API_URL!;
  const API = "http://localhost:3002";
  async function encrypt() {
    const res = await fetch(`https://secure-tx-api-7qg4.vercel.app/api/tx/encrypt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partyId,
        payload: JSON.parse(payload)
      })
    });

    setRecord(await res.json());
  }

  async function decrypt() {
    const res = await fetch(
      `https://secure-tx-api-7qg4.vercel.app/api/tx/${record.id}/decrypt`,
      { method: "POST" }
    );

    alert(JSON.stringify(await res.json(), null, 2));
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Secure TX</h2>

      <input
        placeholder="partyId"
        value={partyId}
        onChange={e => setPartyId(e.target.value)}
      />

      <br /><br />

      <textarea
        rows={6}
        cols={40}
        value={payload}
        onChange={e => setPayload(e.target.value)}
      />

      <br /><br />

      <button onClick={encrypt}>Encrypt & Save</button>

      {record && (
        <>
          <pre>{JSON.stringify(record, null, 2)}</pre>
          <button onClick={decrypt}>Decrypt</button>
        </>
      )}
    </div>
  );
}
