import { useState } from "react";

export default function PathFinder() {
  const [from, setFrom] = useState("CS101");
  const [to, setTo] = useState("CS340");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl mb-2">Connect two courses</h1>
        <p className="text-ink/60">
          Finds the shortest path between two courses through the prerequisite
          graph — a variable-length, multi-hop traversal that's simple in
          Cypher and would need a recursive query in SQL.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3">
        <input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="Course code A (e.g. CS101)"
          className="border border-ink/20 rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Course code B (e.g. CS340)"
          className="border border-ink/20 rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          className="sm:col-span-2 bg-ink text-paper px-5 py-2 rounded-md hover:bg-accent transition-colors"
        >
          Find connection
        </button>
      </form>

      {loading && <p className="text-ink/50">Searching the graph…</p>}
      {error && <p className="text-accent bg-accent/10 rounded-md px-4 py-3">{error}</p>}

      {result && !result.found && (
        <p className="text-ink/50">No connection found between "{from}" and "{to}" in the catalog.</p>
      )}

      {result && result.found && (
        <div className="border border-ink/10 rounded-md p-6 bg-white">
          <p className="text-sm text-ink/50 mb-3">{result.hops} hop{result.hops !== 1 ? "s" : ""}</p>
          <div className="flex flex-wrap items-center gap-2">
            {result.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    i % 2 === 0 ? "bg-ink text-paper" : "bg-accent/10 text-accent"
                  }`}
                >
                  {step}
                </span>
                {i < result.steps.length - 1 && <span className="text-ink/30">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
