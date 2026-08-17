import { verifyConnection } from "../../lib/neo4j";

export default async function handler(req, res) {
  const connected = await verifyConnection();
  res.status(connected ? 200 : 503).json({ database: connected ? "up" : "unreachable" });
}
