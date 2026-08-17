import { runQuery } from "../../lib/neo4j";

export default async function handler(req, res) {
  const q = (req.query.q || "").trim();

  try {
    const records = await runQuery(
      `MATCH (c:Course)
       WHERE toLower(c.title) CONTAINS toLower($q) OR toLower(c.code) CONTAINS toLower($q)
       OPTIONAL MATCH (c)-[:TEACHES]->(sk:Skill)
       RETURN c.code AS code, c.title AS title, c.credits AS credits,
              collect(DISTINCT sk.name) AS skills
       ORDER BY c.code
       LIMIT 20`,
      { q }
    );
    res.status(200).json({ results: records });
  } catch (err) {
    console.error(err);
    res.status(503).json({ error: "Database unreachable. Please try again shortly." });
  }
}
