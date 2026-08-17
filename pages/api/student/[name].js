import { runQuery } from "../../../lib/neo4j";

export default async function handler(req, res) {
  const { name } = req.query;

  try {
    const studentRows = await runQuery(
      `MATCH (s:Student {name: $name})
       RETURN s.name AS name`,
      { name }
    );

    if (!studentRows.length) {
      return res.status(404).json({ error: "Student not found" });
    }

    const completed = await runQuery(
      `MATCH (s:Student {name: $name})-[r:COMPLETED]->(c:Course)
       RETURN c.code AS code, c.title AS title, r.grade AS grade
       ORDER BY c.code`,
      { name }
    );

    // Skills acquired: 2-hop traversal from student through completed
    // courses to the skills those courses teach.
    const skills = await runQuery(
      `MATCH (s:Student {name: $name})-[:COMPLETED]->(:Course)-[:TEACHES]->(sk:Skill)
       RETURN DISTINCT sk.name AS name
       ORDER BY sk.name`,
      { name }
    );

    // Eligible courses: not yet completed, AND every direct prerequisite
    // has been completed. This "all of these related nodes must satisfy a
    // condition" check is a pattern comprehension in Cypher — in SQL it
    // would need a NOT EXISTS subquery counting unmet prerequisites per
    // candidate course, which gets unwieldy as prerequisite counts vary.
    const eligible = await runQuery(
      `MATCH (s:Student {name: $name})
       MATCH (c:Course)
       WHERE NOT EXISTS { MATCH (s)-[:COMPLETED]->(c) }
         AND ALL(req IN [(c)-[:REQUIRES]->(r) | r] WHERE EXISTS { MATCH (s)-[:COMPLETED]->(req) })
       RETURN c.code AS code, c.title AS title, c.credits AS credits
       ORDER BY c.code`,
      { name }
    );

    res.status(200).json({ student: studentRows[0], completed, skills, eligible });
  } catch (err) {
    console.error(err);
    res.status(503).json({ error: "Database unreachable. Please try again shortly." });
  }
}
