# PathGraph — a student/skill/course planner backed by CognoDB

A full-stack app for exploring a curriculum as a graph: courses, the skills
they teach, prerequisite chains, and per-student eligibility. Built for the
Wexa AI take-home assignment.

## Use case

PathGraph lets a user:
- Search the course catalog
- Open a course and see its **full transitive prerequisite chain** (not
  just direct prereqs, but everything required to eventually take it)
- Pick a student and see their completed courses, the **skills they've
  acquired**, and which courses they're now **eligible for**
- Find the **shortest connecting path** between any two courses through the
  prerequisite graph

## Why a graph database?

The interesting questions here are about chains and dependencies, not
isolated rows:

- "What do I need to take before this course?" is a variable-length
  traversal — some courses are 1 hop away, others are 4+ hops through a
  chain of prerequisites. SQL has no native way to express "however many
  hops it takes"; you'd need a recursive CTE, and it gets harder to reason
  about as the chain deepens.
- "Which courses is this student eligible for?" requires checking, for
  every candidate course, that *all* of its prerequisites appear in that
  student's completed list — a relationship-shaped condition. In SQL this
  means counting required vs. completed prerequisites per course and
  comparing, which multiplies complexity as prerequisite counts vary
  course to course. In Cypher it's a single pattern condition.
- "How are these two courses connected?" (the path finder) is a shortest-path
  problem with unknown depth — exactly what graph traversal is built for.

None of this needs a rigid schema — courses, skills, and students are
naturally nodes, and prerequisites/teaching/completion are naturally
relationships that stay fast to traverse no matter how deep the curriculum
graph gets.

## Data model

```
(:Course {code, title, credits})
(:Skill {name})
(:Student {name})

(:Course)-[:REQUIRES]->(:Course)        // prerequisite chain
(:Course)-[:TEACHES]->(:Skill)
(:Student)-[:COMPLETED {grade}]->(:Course)
```

```
                REQUIRES (chain)
   (Course) ---------------------> (Course)
      |
      | TEACHES
      v
   (Skill)              (Student) --COMPLETED {grade}--> (Course)
```

## Key queries

**1. Full prerequisite chain (variable-length traversal)** — `pages/api/course/[code].js`
```cypher
MATCH (c:Course {code: $code})-[:REQUIRES*1..8]->(prereq:Course)
RETURN DISTINCT prereq.code AS code, prereq.title AS title
ORDER BY prereq.code
```
Walks the REQUIRES chain to any depth, so a course 4 prerequisites deep
returns just as easily as one with none.

**2. Eligible courses for a student (multi-hop condition check)** — `pages/api/student/[name].js`
```cypher
MATCH (s:Student {name: $name})
MATCH (c:Course)
WHERE NOT EXISTS { MATCH (s)-[:COMPLETED]->(c) }
  AND ALL(req IN [(c)-[:REQUIRES]->(r) | r] WHERE EXISTS { MATCH (s)-[:COMPLETED]->(req) })
RETURN c.code AS code, c.title AS title, c.credits AS credits
ORDER BY c.code
```
For every course the student hasn't completed, checks that every one of
its direct prerequisites has been completed — the kind of query a
relational schema would find awkward, since prerequisite counts differ per
course.

**3. Shortest path between two courses (variable-length, multi-hop)** — `pages/api/path.js`
```cypher
MATCH (a:Course {code: $from}), (b:Course {code: $to})
MATCH path = shortestPath((a)-[:REQUIRES*..8]-(b))
RETURN [n IN nodes(path) | n.title] AS steps, length(path) AS hops
```

All queries run through the official `neo4j-driver` with parameters
(`$code`, `$name`, `$from`, etc.) — no string-concatenated Cypher anywhere
in the app.

## Tech stack

- **Frontend + API**: Next.js (React), Tailwind CSS
- **Database**: CognoDB (openCypher over Bolt), accessed via the official
  `neo4j-driver` npm package
- **Hosting**: Vercel (free tier)

## Setup

### 1. Create your CognoDB instance
1. Sign up at [console.cognodb.com/signup](https://console.cognodb.com/signup) (no credit card required).
2. Create a free (c0) instance and pick a region.
3. Copy the `bolt+s://...` URI and the generated password for user `cognodb`
   — the password is shown once.

### 2. Configure environment variables
```bash
cp .env.example .env.local
```
Fill in:
```
COGNODB_URI=bolt+s://<instance-id>.databases.cognodb.cloud
COGNODB_USER=cognodb
COGNODB_PASSWORD=<your-generated-password>
```

### 3. Install dependencies
```bash
npm install
```

### 4. Seed the database
```bash
npm run seed
```
Loads a 13-course curriculum with prerequisites, skills, and 3 sample
students with completion history.

### 5. Run the app
```bash
npm run dev
```
Visit `http://localhost:3000`.

## Error handling

If CognoDB is unreachable, API routes return a `503` with a plain-language
message instead of crashing, and the UI surfaces that message inline.
`pages/api/health.js` exposes a simple connectivity check.

## Screenshots

_Add screenshots of the course search page, a course detail page, the
student eligibility panel, and the course path-finder here before
submitting._

## Demo

- Hosted app: `<add your Vercel URL here>`
- Screen recording: `<add link here>`
