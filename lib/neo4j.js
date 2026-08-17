import neo4j from "neo4j-driver";

let driver;

/**
 * Returns a singleton Neo4j driver instance pointed at the CognoDB instance.
 * Throws a descriptive error if env vars are missing so failures are obvious
 * rather than silently hanging.
 */
export function getDriver() {
  if (driver) return driver;

  const { COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD } = process.env;

  if (!COGNODB_URI || !COGNODB_USER || !COGNODB_PASSWORD) {
    throw new Error(
      "Missing CognoDB connection env vars. Set COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD in .env.local"
    );
  }

  driver = neo4j.driver(
    COGNODB_URI,
    neo4j.auth.basic(COGNODB_USER, COGNODB_PASSWORD),
    { disableLosslessIntegers: true }
  );

  return driver;
}

/**
 * Runs a single Cypher query with parameters and returns plain JS records.
 */
export async function runQuery(cypher, params = {}) {
  const session = getDriver().session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map((r) => r.toObject());
  } finally {
    await session.close();
  }
}

/**
 * Quick connectivity check used by the health check API route.
 */
export async function verifyConnection() {
  try {
    await getDriver().verifyConnectivity();
    return true;
  } catch (err) {
    return false;
  }
}
