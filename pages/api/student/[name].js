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

    const skills = await runQuery(
      `MATCH (s:Student {name: $name})-[:COMPLETED]->(:Course)-[:TEACHES]->(sk:Skill)
       RETURN DISTINCT sk.name AS name
       ORDER BY sk.name`,
      { name }
    );

    const allCourses = await runQuery(
      `MATCH (c:Course)
       OPTIONAL MATCH (c)-[:REQUIRES]->(req:Course)
       RETURN c.code AS code, c.title AS title, c.credits AS credits,
              collect(req.code) AS prereqCodes`,
      {}
    );

    const completedCodes = new Set(completed.map((c) => c.code));
    const eligible = allCourses
      .filter((c) => !completedCodes.has(c.code))
      .filter((c) => c.prereqCodes.every((p) => p == null || completedCodes.has(p)))
      .map(({ code, title, credits }) => ({ code, title, credits }))
      .sort((a, b) => a.code.localeCompare(b.code));

    res.status(200).json({ student: studentRows[0], completed, skills, eligible });
  } catch (err) {
    console.error(err);
    res.status(503).json({ error: "Database unreachable. Please try again shortly." });
  }
}
