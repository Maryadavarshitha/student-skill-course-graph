import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [student, setStudent] = useState("Aditi");
  const [studentData, setStudentData] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
     const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { cache: "no-store" }); 
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results);
    } catch (err) {
      setError(err.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadStudent(name) {
    setStudent(name);
    setStudentLoading(true);
    setStudentError(null);
    try {
      const res = await fetch(`/api/student/${encodeURIComponent(name)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load student");
      setStudentData(data);
    } catch (err) {
      setStudentError(err.message);
      setStudentData(null);
    } finally {
      setStudentLoading(false);
    }
  }

  return (
    <div className="space-y-12">
      <section>
        <h1 className="font-display text-4xl mb-2">Find a course</h1>
        <p className="text-ink/60 mb-6">
          Search the catalog, then open a course to see its full prerequisite chain and the skills it teaches.
        </p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try 'Databases' or 'CS201'"
            className="flex-1 border border-ink/20 rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="bg-ink text-paper px-5 py-2 rounded-md hover:bg-accent transition-colors"
          >
            Search
          </button>
        </form>

        <div className="mt-6">
          {loading && <p className="text-ink/50">Searching…</p>}
          {error && <p className="text-accent bg-accent/10 rounded-md px-4 py-3">{error}</p>}
          {results && results.length === 0 && !loading && (
            <p className="text-ink/50">No courses matched "{query}".</p>
          )}
          {results && results.length > 0 && (
            <ul className="divide-y divide-ink/10 border border-ink/10 rounded-md overflow-hidden">
              {results.map((c) => (
                <li key={c.code} className="p-4 hover:bg-ink/5 transition-colors">
                  <Link href={`/course/${encodeURIComponent(c.code)}`} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{c.code} — {c.title}</p>
                      <p className="text-sm text-ink/50">{c.skills.join(", ")}</p>
                    </div>
                    <span className="text-sm bg-ink text-paper px-2 py-1 rounded">{c.credits} cr</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-2">Student eligibility</h2>
        <p className="text-ink/60 mb-4">
          Pick a seeded student to see which courses they're eligible for — every direct prerequisite must already be completed.
        </p>
        <div className="flex gap-2 mb-4">
          {["Aditi", "Rohan", "Priya"].map((name) => (
            <button
              key={name}
              onClick={() => loadStudent(name)}
              className={`px-4 py-2 rounded-md border ${
                student === name ? "bg-ink text-paper border-ink" : "border-ink/20 hover:bg-ink/5"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {studentLoading && <p className="text-ink/50">Loading student…</p>}
        {studentError && <p className="text-accent bg-accent/10 rounded-md px-4 py-3">{studentError}</p>}

        {studentData && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Completed courses</h3>
              {studentData.completed.length === 0 ? (
                <p className="text-ink/50 text-sm">None yet.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {studentData.completed.map((c) => (
                    <li key={c.code} className="text-ink/70">{c.code} — {c.title} <span className="text-ink/40">({c.grade})</span></li>
                  ))}
                </ul>
              )}
              <h3 className="font-medium mt-4 mb-2">Skills acquired</h3>
              <div className="flex flex-wrap gap-2">
                {studentData.skills.map((s) => (
                  <span key={s.name} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">{s.name}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Eligible next courses</h3>
              {studentData.eligible.length === 0 ? (
                <p className="text-ink/50 text-sm">No new eligible courses right now.</p>
              ) : (
                <ul className="space-y-2">
                  {studentData.eligible.map((c) => (
                    <li key={c.code} className="border border-ink/10 rounded-md p-3 bg-white">
                      <Link href={`/course/${encodeURIComponent(c.code)}`}>
                        <p className="font-medium text-sm">{c.code} — {c.title}</p>
                        <p className="text-xs text-ink/50">{c.credits} credits</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
