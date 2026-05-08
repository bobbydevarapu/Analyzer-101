import { useCallback, useEffect, useMemo, useState } from "react";

import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { studentApi } from "../studentApi";
import { StudentResultCard } from "../types";

type Props = {
  email: string;
};

const ResultsSection = ({ email }: Props) => {
  const [items, setItems] = useState<StudentResultCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StudentResultCard | null>(null);

  const load = useCallback(async () => {
    const response = await studentApi.getResults(email, page, 8);
    setItems(response.items);
    setTotal(response.total);
  }, [email, page]);

  useEffect(() => {
    if (email) {
      load();
    }
  }, [email, load]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / 8)), [total]);

  const perfData = useMemo(
    () => items.map((item) => ({ name: item.name, score: item.percentage })),
    [items],
  );

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-orange-300">Results</p>
        <h1 className="mt-2 text-3xl font-semibold">Scores and Performance</h1>
      </div>

      <article className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
        <h2 className="text-xl font-semibold">Performance Graph</h2>
        <p className="mt-1 text-sm text-slate-400">Assignment/Test vs score</p>
        <div className="mt-4 h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={perfData}>
              <CartesianGrid stroke="#ffffff1a" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0b1627", border: "1px solid #ffffff22" }} />
              <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 text-sm text-slate-400">No results yet.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
              <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                <p><span className="text-slate-400">Subject:</span> {item.subject}</p>
                <p><span className="text-slate-400">Name:</span> {item.name}</p>
                <p><span className="text-slate-400">Marks:</span> {item.marks}</p>
                <p><span className="text-slate-400">Percentage:</span> {Math.round(item.percentage)}%</p>
                <p><span className="text-slate-400">Grade:</span> {item.grade}</p>
                <p><span className="text-slate-400">Status:</span> {item.status}</p>
              </div>

              <button
                type="button"
                className="mt-3 rounded-lg border border-white/10 px-3 py-1 text-sm"
                onClick={() => setSelected(item)}
              >
                View details
              </button>
            </article>
          ))
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#081120]/85 p-3">
        <p className="text-sm text-slate-400">Page {page} of {pageCount}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-white/10 px-3 py-1 text-sm">Prev</button>
          <button type="button" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page >= pageCount} className="rounded-lg border border-white/10 px-3 py-1 text-sm">Next</button>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <article className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#081120] p-4">
            <h2 className="text-xl font-semibold">Result Details</h2>
            <div className="mt-3 space-y-2 text-sm">
              <p>Correct answers: {selected.details.correct}</p>
              <p>Wrong answers: {selected.details.wrong}</p>
              <p>Time taken: {selected.details.timeTaken} min</p>
              <p>Violations: {selected.details.violations}</p>
            </div>
            <button type="button" className="mt-4 rounded-lg bg-orange-400 px-4 py-2 text-sm font-semibold text-black" onClick={() => setSelected(null)}>
              Close
            </button>
          </article>
        </div>
      )}
    </section>
  );
};

export default ResultsSection;
