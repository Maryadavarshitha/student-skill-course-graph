import { runQuery } from "../../../lib/neo4j";

export default async function handler(req, res) {
  const { code } = req.query;

  try {
    const courseRows = await runQuery(
      `MATCH (c:Course {code: $code})
       OPTIONAL MATCH (c)-[:TEACHES]->(sk:Skill)
       OPTIONAL MATCH (c)-[:REQUIRES]->(direct:Course)
       RETURN c.code AS code, c.title AS title, c.credits AS credits,
              collect(DISTINCT sk.name) AS skills,
              collect(DISTINCT direct.code) AS directPrereqs`,
      { code }
    );

    if (!courseRows.length || !courseRows[0].code) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Multi-hop, variable-length traversal: every prerequisite required to
    // eventually take this course, however many hops deep the chain goes.
    // A relational schema would need a recursive CTE for this; here it's
    // a single pattern with an unbounded-depth relationship.
    const chain = await runQuery(
      `MATCH (c:Course {code: $code})-[:REQUIRES*1..8]->(prereq:Course)
       RETURN DISTINCT prereq.code AS code, prereq.title AS title
       ORDER BY prereq.code`,
      { code }
    );

    res.status(200).json({ course: courseRows[0], fullPrereqChain: chain });
  } catch (err) {
    console.error(err);
    res.status(503).json({ error: "Database unreachable. Please try again shortly." });
  }
}
