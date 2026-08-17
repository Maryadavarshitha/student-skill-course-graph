import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function CourseDetail() {
  const router = useRouter();
  const { code } = router.query;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) return;
    setData(null);
    setError(null);
    fetch(`/api/course/${encodeURIComponent(code)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setData(json);
      })
      .catch((err) => setError(err.message));
  }, [code]);

  if (error) {
    return <p className="text-accent bg-accent/10 rounded-md px-4 py-3">{error}</p>;
  }

  if (!data) {
    return <p className="text-ink/50">Loading course…</p>;
  }

  const { course, fullPrereqChain } = data;

  return (
    <div className="space-y-8">
      <Link href="/" className="text-sm text-ink/50 hover:text-accent">← Back to search</Link>

      <div>
        <h1 className="font-display text-4xl mb-1">{course.code} — {course.title}</h1>
        <p className="text-ink/50 mb-4">{course.credits} credits</p>
        <p className="mb-1"><span className="text-ink/50">Skills taught:</span> {course.skills.join(", ") || "None listed"}</p>
        <p><span className="text-ink/50">Direct prerequisites:</span> {course.directPrereqs.join(", ") || "None"}</p>
      </div>

      <div>
        <h2 className="font-display text-2xl mb-3">Full prerequisite chain</h2>
        <p className="text-sm text-ink/50 mb-4">
          Every course required before this one, found with a variable-length traversal — however many hops deep the chain goes.
        </p>
        {fullPrereqChain.length === 0 ? (
          <p className="text-ink/50">No prerequisites — you can take this course right away.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {fullPrereqChain.map((c) => (
              <li key={c.code} className="border border-ink/10 rounded-md p-4 bg-white">
                <Link href={`/course/${encodeURIComponent(c.code)}`}>
                  <p className="font-medium">{c.code} — {c.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
