import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { studentApi } from "../studentApi";
import { AssignmentCard } from "../types";

type Props = {
  email: string;
};

const allowedExt = ["pdf", "docx", "txt"];
const maxBytes = 10 * 1024 * 1024;

const AssignmentsSection = ({ email }: Props) => {
  const [items, setItems] = useState<AssignmentCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    assignmentId: "",
    dept: "",
    roll: "",
    file: null as File | null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await studentApi.getAssignments(email, page, 8);
      setItems(response.items);
      setTotal(response.total);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [email, page]);

  useEffect(() => {
    if (email) {
      load();
    }
  }, [email, load]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / 8)), [total]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.file) {
      toast.error("Please select a file");
      return;
    }

    const ext = form.file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExt.includes(ext)) {
      toast.error("Only PDF, DOCX, TXT are allowed");
      return;
    }

    if (form.file.size > maxBytes) {
      toast.error("Max file size is 10MB");
      return;
    }

    setUploading(true);
    try {
      const payload = new FormData();
      payload.append("assignment_id", form.assignmentId);
      payload.append("dept", form.dept);
      payload.append("roll", form.roll);
      payload.append("email", email);
      payload.append("file", form.file);

      await studentApi.uploadAssignment(payload);
      toast.success("Assignment submitted");
      setForm({ assignmentId: "", dept: "", roll: "", file: null });
      load();
    } catch (error: any) {
      toast.error(error?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-orange-300">Assignments</p>
        <h1 className="mt-2 text-3xl font-semibold">Submit Work</h1>
      </div>

      <article className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
        <h2 className="text-xl font-semibold">Upload Assignment</h2>
        <p className="mt-1 text-sm text-slate-400">Allowed files: PDF, DOCX, TXT • Max size: 10MB</p>

        <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={submit}>
          <input
            className="rounded-xl border border-white/10 bg-[#0b1627] px-3 py-2 text-sm"
            placeholder="Assignment ID"
            value={form.assignmentId}
            onChange={(e) => setForm((old) => ({ ...old, assignmentId: e.target.value }))}
            required
          />
          <input
            className="rounded-xl border border-white/10 bg-[#0b1627] px-3 py-2 text-sm"
            placeholder="Department"
            value={form.dept}
            onChange={(e) => setForm((old) => ({ ...old, dept: e.target.value }))}
            required
          />
          <input
            className="rounded-xl border border-white/10 bg-[#0b1627] px-3 py-2 text-sm"
            placeholder="Roll Number"
            value={form.roll}
            onChange={(e) => setForm((old) => ({ ...old, roll: e.target.value }))}
            required
          />
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            title="Upload assignment file"
            className="rounded-xl border border-white/10 bg-[#0b1627] px-3 py-2 text-sm"
            onChange={(e) => setForm((old) => ({ ...old, file: e.target.files?.[0] || null }))}
            required
          />

          <div className="md:col-span-2 flex">
            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-full bg-orange-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-orange-300 disabled:opacity-60 md:ml-auto md:w-48"
            >
              {uploading ? "Submitting..." : "Upload"}
            </button>
          </div>
        </form>
      </article>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-slate-400">Loading assignments...</p>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 text-sm text-slate-400">
            No assignment records found.
          </p>
        ) : (
          items.map((item) => (
            <article key={item.assignment_id} className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
              <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                <p><span className="text-slate-400">Subject:</span> {item.subject}</p>
                <p><span className="text-slate-400">Assignment ID:</span> {item.assignment_id}</p>
                <p><span className="text-slate-400">Deadline:</span> {item.deadline || "-"}</p>
                <p><span className="text-slate-400">Status:</span> {item.status}</p>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#081120]/85 p-3">
        <p className="text-sm text-slate-400">Page {page} of {pageCount}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-white/10 px-3 py-1 text-sm"
            disabled={page <= 1}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="rounded-lg border border-white/10 px-3 py-1 text-sm"
            disabled={page >= pageCount}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default AssignmentsSection;
