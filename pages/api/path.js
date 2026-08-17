import { runQuery } from "../../lib/neo4j";

export default async function handler(req, res) {
  const from = (req.query.from || "").trim().toUpperCase();
  const to = (req.query.to || "").trim().toUpperCase();

  if (!from || !to) {
    return res.status(400).json({ error: "Both 'from' and 'to' course codes are required." });
  }

  try {
    // Variable-length shortest path across REQUIRES edges, in either
    // direction. Answers "how are these two courses related through
    // prerequisites?" without knowing the depth in advance — a query
    // that's simple in Cypher and needs a recursive CTE (or app-side BFS)
    // in a relational database.
    const records = await runQuery(
      `MATCH (a:Course {code: $from}), (b:Course {code: $to})
       MATCH path = shortestPath((a)-[:REQUIRES*..8]-(b))
       RETURN [n IN nodes(path) | n.title] AS steps, length(path) AS hops`,
      { from, to }
    );

    if (!records.length) {
      return res.status(200).json({ found: false });
    }

    res.status(200).json({ found: true, steps: records[0].steps, hops: records[0].hops });
  } catch (err) {
    console.error(err);
    res.status(503).json({ error: "Database unreachable. Please try again shortly." });
  }
}
