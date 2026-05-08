import { useCallback, useEffect, useMemo, useState } from "react";

import { studentApi } from "../studentApi";
import { StudentViolation } from "../types";

type Props = {
  email: string;
};

const levelColor: Record<string, string> = {
  Low: "text-green-300",
  Medium: "text-yellow-300",
  High: "text-orange-300",
  Critical: "text-red-400",
};

const ViolationsSection = ({ email }: Props) => {
  const [items, setItems] = useState<StudentViolation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const response = await studentApi.getViolations(email, page, 8);
    setItems(response.items);
    setTotal(response.total);
  }, [email, page]);

  useEffect(() => {
    if (email) {
      load();
    }
  }, [email, load]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / 8)), [total]);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-orange-300">Violations</p>
        <h1 className="mt-2 text-3xl font-semibold">Warnings and Penalties</h1>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 text-sm text-slate-400">
            No violations recorded.
          </p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
              <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                <p><span className="text-slate-400">Violation Type:</span> {item.violationType}</p>
                <p><span className="text-slate-400">Date:</span> {item.date}</p>
                <p><span className="text-slate-400">Status:</span> <span className={levelColor[item.status]}>{item.status}</span></p>
                <p><span className="text-slate-400">Penalty:</span> {item.penalty}</p>
              </div>
              <p className="mt-2 text-sm text-slate-300">Teacher Remark: {item.teacherRemark}</p>
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
    </section>
  );
};

export default ViolationsSection;
