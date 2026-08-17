/**
 * Seed script for the Student–Skill–Course Graph app.
 * Loads a small realistic curriculum (courses, prerequisites, skills taught,
 * and student completion history) into CognoDB using parameterized Cypher.
 *
 * Run with: npm run seed
 */
require("dotenv").config({ path: ".env.local" });
const neo4j = require("neo4j-driver");

const { COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD } = process.env;

if (!COGNODB_URI || !COGNODB_USER || !COGNODB_PASSWORD) {
  console.error(
    "Missing COGNODB_URI / COGNODB_USER / COGNODB_PASSWORD in .env.local"
  );
  process.exit(1);
}

const driver = neo4j.driver(
  COGNODB_URI,
  neo4j.auth.basic(COGNODB_USER, COGNODB_PASSWORD)
);

// --- Sample data -----------------------------------------------------

// requires: direct prerequisite course codes only (chain is derived, not listed exhaustively)
const courses = [
  { code: "CS101", title: "Intro to Programming", credits: 4, requires: [], skills: ["Programming Basics"] },
  { code: "CS210", title: "Discrete Mathematics", credits: 3, requires: [], skills: ["Mathematical Reasoning"] },
  { code: "CS102", title: "Data Structures", credits: 4, requires: ["CS101"], skills: ["Data Structures"] },
  { code: "CS220", title: "Web Development", credits: 3, requires: ["CS101"], skills: ["HTML/CSS", "JavaScript"] },
  { code: "CS201", title: "Algorithms", credits: 4, requires: ["CS102"], skills: ["Algorithm Design"] },
  { code: "CS230", title: "Operating Systems", credits: 4, requires: ["CS102"], skills: ["OS Concepts"] },
  { code: "CS250", title: "Software Engineering", credits: 3, requires: ["CS102"], skills: ["SE Practices"] },
  { code: "CS301", title: "Databases", credits: 4, requires: ["CS102"], skills: ["SQL", "Data Modeling"] },
  { code: "CS310", title: "Graph Databases", credits: 3, requires: ["CS301", "CS201"], skills: ["Graph Modeling"] },
  { code: "CS320", title: "Full-Stack Development", credits: 4, requires: ["CS220", "CS301"], skills: ["React", "API Design"] },
  { code: "CS330", title: "Machine Learning", credits: 4, requires: ["CS201", "CS210"], skills: ["ML Fundamentals"] },
  { code: "CS340", title: "Distributed Systems", credits: 4, requires: ["CS230", "CS201"], skills: ["Distributed Systems"] },
  { code: "CS350", title: "Cloud Computing", credits: 3, requires: ["CS250", "CS230"], skills: ["Cloud Architecture"] },
];

const students = [
  { name: "Aditi", completed: [
      { code: "CS101", grade: "A" },
      { code: "CS102", grade: "A-" },
      { code: "CS210", grade: "B+" },
      { code: "CS201", grade: "A" },
  ]},
  { name: "Rohan", completed: [
      { code: "CS101", grade: "B" },
      { code: "CS220", grade: "A" },
  ]},
  { name: "Priya", completed: [
      { code: "CS101", grade: "A" },
      { code: "CS102", grade: "A" },
      { code: "CS201", grade: "B+" },
      { code: "CS301", grade: "A-" },
      { code: "CS230", grade: "B" },
  ]},
];

// --- Loader ------------------------------------------------------------

async function run() {
  const session = driver.session();
  try {
    console.log("Clearing existing data...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Creating constraints...");
    await session.run(
      "CREATE CONSTRAINT course_code IF NOT EXISTS FOR (c:Course) REQUIRE c.code IS UNIQUE"
    );
    await session.run(
      "CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE"
    );
    await session.run(
      "CREATE CONSTRAINT student_name IF NOT EXISTS FOR (st:Student) REQUIRE st.name IS UNIQUE"
    );

    console.log("Loading courses...");
    for (const c of courses) {
      await session.run(
        `MERGE (c:Course {code: $code})
         SET c.title = $title, c.credits = $credits`,
        { code: c.code, title: c.title, credits: c.credits }
      );
    }

    console.log("Loading prerequisites...");
    for (const c of courses) {
      for (const reqCode of c.requires) {
        await session.run(
          `MATCH (c:Course {code: $code})
           MATCH (req:Course {code: $reqCode})
           MERGE (c)-[:REQUIRES]->(req)`,
          { code: c.code, reqCode }
        );
      }
    }

    console.log("Loading skills and TEACHES relationships...");
    for (const c of courses) {
      for (const skill of c.skills) {
        await session.run(
          `MERGE (sk:Skill {name: $skill})
           WITH sk
           MATCH (c:Course {code: $code})
           MERGE (c)-[:TEACHES]->(sk)`,
          { skill, code: c.code }
        );
      }
    }

    console.log("Loading students and completed courses...");
    for (const st of students) {
      await session.run("MERGE (s:Student {name: $name})", { name: st.name });
      for (const rec of st.completed) {
        await session.run(
          `MATCH (s:Student {name: $name})
           MATCH (c:Course {code: $code})
           MERGE (s)-[rel:COMPLETED]->(c)
           SET rel.grade = $grade`,
          { name: st.name, code: rec.code, grade: rec.grade }
        );
      }
    }

    console.log("Seed complete.");
  } finally {
    await session.close();
    await driver.close();
  }
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
