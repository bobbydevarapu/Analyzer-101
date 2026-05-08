import {
    FileJson,
    FileSpreadsheet,
    FileText,
    Loader2,
    Mail,
    Search,
} from "lucide-react";

import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";

const API_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8000");

type Props = {
  analysis: any;
  setAnalysis: (value: any) => void;
  assignmentId: string;
  setAssignmentId: (value: string) => void;
};

const AnalysisSection = ({
  analysis,
  setAnalysis,
  assignmentId,
  setAssignmentId,
}: Props) => {

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);
  const { user } = useAuth();

  const getTeacherEmail = () => {
    if (user?.email) return user.email;

    try {
      const savedUser = localStorage.getItem("user");
      if (!savedUser) return "";
      const parsed = JSON.parse(savedUser);
      return parsed?.email || "";
    } catch {
      return "";
    }
  };

  // =========================
  // ANALYZE
  // =========================

  const analyzeAssignment =
    async () => {

      const normalizedAssignmentId =
        assignmentId.trim().toUpperCase();

      if (!normalizedAssignmentId) {

        setError(
          "Enter assignment ID"
        );

        return;
      }

      try {
        setLoading(true);
        setError("");
        setToast({ message: "Analysis started — processing...", type: "info" });

        const token = localStorage.getItem("teacherToken");
        const formData = new FormData();
        formData.append("assignment_id", normalizedAssignmentId);
        const teacherEmail = getTeacherEmail();
        if (teacherEmail) formData.append("teacher_email", teacherEmail);

        const response = await fetch(`${API_BASE}/teacher/analyze`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        });

        let data: any = null;
        try {
          data = await response.json();
        } catch (err) {
          // Non-JSON response
          data = null;
        }

        if (!response.ok) {
          const msg = data?.detail || data?.message || response.statusText || "Analysis failed";
          setError(msg);
          setToast({ message: msg, type: "error" });
          return;
        }

        setAnalysis(data);
        const flagged = Array.isArray(data?.results) ? data.results.length : 0;
        if (flagged === 0) {
          setToast({ message: "Analysis complete — no flagged pairs (unique assignment)", type: "success" });
        } else {
          setToast({ message: `Analysis complete — ${flagged} flagged pair(s)`, type: "success" });
        }
      } catch (err) {
        console.error(err);
        setError("Server error");
        setToast({ message: "Server error", type: "error" });
      } finally {
        setLoading(false);
        // auto-hide toast after a short time
        setTimeout(() => setToast(null), 4000);
      }
    };

  // =========================
  // EXPORT JSON
  // =========================

  const exportJSON = () => {

    if (!analysis) return;

    const exportData = {

      assignment_id:
        analysis.assignment_id,

      total_students:
        analysis.total_students,

      students:
        analysis.students,

      matrix:
        analysis.matrix,

      flagged_pairs:
        analysis.results,

      generated_at:
        new Date().toISOString(),
    };

    const blob =
      new Blob(
        [
          JSON.stringify(
            exportData,
            null,
            2
          ),
        ],
        {
          type:
            "application/json",
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
          `${analysis.assignment_id}_report.json`;

    link.click();

    URL.revokeObjectURL(url);
  };

  // =========================
  // EXPORT CSV
  // =========================

  const exportCSV = () => {

    if (!analysis) return;
    const header = ["Student 1", "Student 2", "Similarity", "Status"];

    const body = (analysis.results && analysis.results.length > 0)
      ? analysis.results.map((item: any) => [
          item.student1,
          item.student2,
          `${item.score}%`,
          item.status,
        ])
      : (Array.isArray(analysis.students) && analysis.students.length > 0)
        ? analysis.students.map((s: string) => [s, "", "", "Unique"])
        : [["No flagged pairs found", "", "", ""]];

    const rows = [header, ...body];

    const csv = rows.map((row: any) => row.join(",")).join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type: "text/csv",
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `${analysis.assignment_id}.csv`;

    link.click();

    URL.revokeObjectURL(url);
  };

  // =========================
  // EXPORT PDF
  // =========================

  const exportPDF = () => {

    if (!analysis) return;

    const generatedAt = new Date();
    const generatedOn = generatedAt.toLocaleString();
    const totalStudents = Number(analysis.total_students || 0);
    const flaggedPairs = Array.isArray(analysis.results) ? analysis.results : [];
    const flaggedPairCount = flaggedPairs.length;
    const copiedRolls = new Set<string>();

    flaggedPairs.forEach((item: any) => {
      if (item.student1) copiedRolls.add(String(item.student1));
      if (item.student2) copiedRolls.add(String(item.student2));
    });

    const uniqueDocuments = Math.max(totalStudents - copiedRolls.size, 0);
    const uniquePercentage = totalStudents > 0
      ? ((uniqueDocuments / totalStudents) * 100).toFixed(2)
      : "100.00";

    const overallVerdict = flaggedPairCount > 0
      ? `Copied Documents Detected (${uniquePercentage}%)`
      : `Unique Documents (${uniquePercentage}%)`;

    const showMatrix = Array.isArray(analysis.matrix)
      && Array.isArray(analysis.students)
      && analysis.students.length <= 12;

    const matrixRows = showMatrix
      ? analysis.matrix
          .map((row: number[], i: number) => {
            const cells = row
              .map((value: number) => {
                const bg = value >= 80
                  ? "#dc2626"
                  : value >= 60
                  ? "#f97316"
                  : "#10b981";

                return `<td style="background:${bg};color:#fff;font-weight:700;text-align:center;padding:10px 8px;border:1px solid rgba(15,23,42,0.08)">${value.toFixed(2)}%</td>`;
              })
              .join("");

            return `
              <tr>
                <th style="text-align:left;padding:10px 12px;background:#e2e8f0;border:1px solid rgba(15,23,42,0.08)">${analysis.students[i]}</th>
                ${cells}
              </tr>
            `;
          })
          .join("")
      : "";

    const matrixHeader = showMatrix
      ? `
        <div class="section">
          <h2>Similarity Matrix Preview</h2>
          <p class="muted">Shown only for smaller classes to keep the report readable.</p>
          <div style="overflow:auto;border-radius:16px;border:1px solid #dbe2ea">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  ${analysis.students.map((student: string) => `<th>${student}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${matrixRows}
              </tbody>
            </table>
          </div>
        </div>
      `
      : `
        <div class="section">
          <h2>Similarity Matrix Preview</h2>
          <p class="muted">Matrix preview omitted for ${totalStudents} students to keep the PDF compact. Use the web dashboard for the full matrix.</p>
        </div>
      `;

    const newWindow =
      window.open(
        "",
        "_blank"
      );

    if (!newWindow) return;

    const rows = flaggedPairCount > 0
      ? flaggedPairs.map((item: any) => {
          const color = item.score >= 80 ? "#dc2626" : "#10b981";
          return `
            <tr>
              <td>${item.student1}</td>
              <td>${item.student2}</td>
              <td style="color:${color};font-weight:700">${item.score}%</td>
              <td style="color:${color};font-weight:700">${item.status}</td>
            </tr>
          `;
        }).join("")
      : `<tr><td colspan="4" style="text-align:center;padding:18px">No flagged pairs found</td></tr>`;

    newWindow.document.write(`
      <html>

        <head>

          <title>
            Analysis Report
          </title>

          <style>

            @page {
              size: A4 landscape;
              margin: 14mm;
            }

            body {
              font-family: Inter, Arial, sans-serif;
              margin: 0;
              background: #f3f6fb;
              color: #111827;
            }

            h1 {
              font-size: 32px;
              margin: 0 0 8px;
              line-height: 1.1;
            }

            .subtle {
              color: #64748b;
              font-size: 13px;
            }

            .page {
              padding: 0;
            }

            .hero {
              background: white;
              border-radius: 20px;
              padding: 24px;
              box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
              margin-bottom: 18px;
            }

            .meta-row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              align-items: center;
              flex-wrap: wrap;
            }

            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
              margin-top: 18px;
            }

            .stat,
            .verdict {
              flex: 1;
              background: #f8fafc;
              border-radius: 14px;
              padding: 18px;
              border: 1px solid #e5e7eb;
            }

            .verdict {
              margin-top: 14px;
              background: #fff7ed;
              border-color: #fed7aa;
              font-weight: 700;
            }

            .section {
              background: white;
              border-radius: 20px;
              padding: 22px;
              margin-top: 18px;
              box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
              page-break-inside: avoid;
            }

            .section h2 {
              margin: 0 0 6px;
              font-size: 22px;
            }

            .muted {
              margin: 0 0 14px;
              color: #64748b;
              font-size: 13px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              background: white;
              border-radius: 18px;
              overflow: hidden;
            }

            .matrix-table {
              min-width: 100%;
            }

            th {
              background: #e2e8f0;
              color: #0f172a;
              padding: 12px;
              text-align: left;
              border: 1px solid rgba(15,23,42,0.08);
              font-size: 13px;
            }

            td {
              border: 1px solid #e5e7eb;
              padding: 12px;
              font-size: 13px;
            }

            .flagged-table th {
              background: #f97316;
              color: white;
            }

            .flagged-table td {
              background: #fff;
            }

            .flagged-table tr:nth-child(even) td {
              background: #fafafa;
            }

            .badge {
              display: inline-block;
              padding: 6px 10px;
              border-radius: 999px;
              font-size: 12px;
              font-weight: 700;
              background: #fee2e2;
              color: #991b1b;
            }

          </style>

        </head>

        <body>

          <div class="page">

            <div class="hero">
              <div class="meta-row">
                <div>
                  <h1>Assignment ${analysis.assignment_id} Analysis</h1>
                  <div class="subtle">Generated on ${generatedOn}</div>
                </div>
                <div class="badge">${flaggedPairCount} copied pair(s)</div>
              </div>

              <div class="summary-grid">
                <div class="stat"><strong>Total Submissions</strong><div style="font-size:24px;margin-top:6px">${totalStudents}</div></div>
                <div class="stat"><strong>Flagged Pairs</strong><div style="font-size:24px;margin-top:6px">${flaggedPairCount}</div></div>
                <div class="stat"><strong>Unique Documents</strong><div style="font-size:24px;margin-top:6px">${uniqueDocuments}</div></div>
                <div class="stat"><strong>Unique %</strong><div style="font-size:24px;margin-top:6px">${uniquePercentage}%</div></div>
              </div>

              <div class="verdict">Overall Verdict: ${overallVerdict}</div>
            </div>

            ${matrixHeader}

            <div class="section">
              <h2>Flagged Pairs</h2>
              <p class="muted">Pairs at or above the review threshold.</p>

              <table class="flagged-table">
                <thead>
                  <tr>
                    <th>Student 1</th>
                    <th>Student 2</th>
                    <th>Similarity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>

          </div>

        </body>

      </html>
    `);

    newWindow.document.close();

    newWindow.print();
  };

  // =========================
  // SEND EMAILS
  // =========================

  const sendEmails =
    async () => {
      if (!analysis) return;
      const teacherEmail = getTeacherEmail();
      if (!teacherEmail) {
        setToast({ message: "Teacher email not found — please sign in again", type: "error" });
        setTimeout(() => setToast(null), 3500);
        return;
      }

      const flagged = Array.isArray(analysis.results) ? analysis.results.length : 0;
      if (flagged === 0) {
        setToast({ message: "No flagged pairs — no emails sent (unique assignment)", type: "info" });
        setTimeout(() => setToast(null), 3500);
        return;
      }

      try {
        setToast({ message: "Sending emails...", type: "info" });
        const body = new URLSearchParams({ teacher_email: teacherEmail });
        const resp = await fetch(`${API_BASE}/teacher/send/${analysis.assignment_id}`, { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        let data: any = null;
        try { data = await resp.json(); } catch { data = null; }
        if (!resp.ok) {
          const msg = data?.detail || data?.message || resp.statusText || "Failed to send emails";
          setToast({ message: msg, type: "error" });
        } else {
          const sentCount = typeof data?.sent_count === "number" ? data.sent_count : 0;
          const failedCount = typeof data?.failed_count === "number" ? data.failed_count : 0;
          if (failedCount > 0) {
            setToast({ message: `Sent ${sentCount} email(s), ${failedCount} failed`, type: "error" });
          } else {
            setToast({ message: data?.message || `Sent ${sentCount} email(s) successfully`, type: "success" });
          }
        }
      } catch (err) {
        console.error(err);
        setToast({ message: "Failed to send emails", type: "error" });
      } finally {
        setTimeout(() => setToast(null), 3500);
      }
    };

  // Simple toast render
  const Toast = () => {
    if (!toast) return null;
    const variantClass =
      toast.type === "success"
        ? "border border-emerald-500/20 bg-emerald-500/20 text-emerald-200"
        : toast.type === "error"
        ? "border border-red-500/20 bg-red-500/20 text-red-200"
        : "border border-sky-500/20 bg-sky-500/20 text-sky-200";

    return (
      <div className={`fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl ${variantClass}`}>
        {toast.message}
      </div>
    );
  };

  return (

    <div className="space-y-6">

      <Toast />

      {/* SEARCH */}

      <div
        className="
          rounded-[28px]
          border
          border-white/10
          bg-[#07101d]/90
          p-3 sm:p-4 md:p-6
          backdrop-blur-xl
        "
      >


      {!analysis && !loading && (
        <div className="rounded-[24px] border border-white/10 bg-[#07101d]/95 p-4 sm:p-5 md:p-8 backdrop-blur-xl">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.28em] text-orange-300 mb-2">
              ANALYSIS READY
            </p>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black leading-tight">
              Enter Assignment ID
            </h2>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-semibold text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Enter ID</span>
              <span className="text-slate-500 hidden sm:inline">→</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Analyze</span>
              <span className="text-slate-500 hidden sm:inline">→</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">View results</span>
            </div>
          </div>
        </div>
      )}
        <div
          className="
            flex
            flex-col
            xl:flex-row
            gap-3
            mt-4
            md:mt-6
          "
        >

          <input
            type="text"
            placeholder="Enter Assignment ID"
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value)}
            className="flex-1 rounded-2xl border border-white/10 bg-[#050816] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-400 sm:px-5 sm:py-4"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
          />

          <button
            onClick={analyzeAssignment}
            disabled={loading}
            className="
              flex
              items-center
              justify-center
              gap-3
              rounded-2xl
              border
              border-white/10
              bg-white/5
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition-all
              hover:bg-white/10
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >

            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
            ) : (
              <Search className="h-4 w-4 text-orange-400" />
            )}

            Analyze

          </button>

        </div>

        {error && (

          <p className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}

      </div>

      {/* RESULTS */}

      {analysis && (

        <div
          className="
            rounded-[28px]
            border
            border-white/10
            bg-[#07101d]/95
            p-3 md:p-6
            backdrop-blur-xl
          "
        >

          {/* HEADER */}

          <div
            className="
              flex
              flex-col
              lg:flex-row
              lg:items-start
              lg:justify-between
              gap-5
            "
          >

            <div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black break-words">
                Assignment
                <span className="ml-3 text-orange-400">{analysis.assignment_id}</span>
              </h1>

              <p className="mt-4 text-sm text-slate-400">
                Total Students:
                <span className="ml-2 text-white">{analysis.total_students}</span>
              </p>

            </div>

            <div
              className="
                rounded-2xl
                border
                border-red-500/20
                bg-red-500/10
                px-5
                py-3
                text-sm
                font-semibold
                text-red-300
                w-fit
              "
            >

              {analysis.results.length}
              {" "}
              copied pair(s)

            </div>

          </div>

          {/* MATRIX */}

          <div className="mt-8">

            <h2
              className="
                text-lg
                md:text-xl
                font-black
                mb-4
              "
            >
              Similarity Matrix
            </h2>

            <div className="overflow-x-auto">

              <table
                className="
                  min-w-[700px]
                  w-full
                  overflow-hidden
                  rounded-3xl
                "
              >

                <thead>

                  <tr className="bg-white/5">

                    <th className="p-3 md:p-4 text-xs md:text-sm text-left font-semibold">
                      Roll No
                    </th>

                    {analysis.students.map(
                      (student: string) => (

                        <th
                          key={student}
                          className="p-3 md:p-4 text-xs md:text-sm text-left font-semibold"
                        >
                          {student}
                        </th>
                      )
                    )}

                  </tr>

                </thead>

                <tbody>

                  {analysis.matrix.map(
                    (
                      row: number[],
                      i: number
                    ) => (

                      <tr
                        key={i}
                        className="border-t border-white/5"
                      >

                        <td className="p-3 md:p-4 text-xs md:text-sm font-semibold">
                          {analysis.students[i]}
                        </td>

                        {row.map(
                          (
                            value: number,
                            j: number
                          ) => (

                            <td
                              key={j}
                              className={`
                                p-3 md:p-4
                                text-xs md:text-sm
                                text-center
                                font-bold
                                ${
                                  value >= 80
                                    ? "bg-red-500 text-white"
                                    : value >= 60
                                    ? "bg-orange-500 text-black"
                                    : "bg-emerald-500 text-black"
                                }
                              `}
                            >

                              {value.toFixed(2)}%

                            </td>
                          )
                        )}

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

          {/* FLAGGED PAIRS */}

          <div className="mt-8">

            <div
              className="
                flex
                flex-col
                md:flex-row
                md:items-center
                md:justify-between
                gap-5
                mb-6
              "
            >

              <h2 className="text-lg md:text-xl font-black">Flagged Pairs</h2>

              <button
                onClick={sendEmails}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/5
                  px-6
                  py-4
                  text-sm
                  font-semibold
                  text-white
                  transition-all
                  hover:bg-white/10
                "
              >

                <Mail className="h-4 w-4 text-orange-400" />

                Send Emails

              </button>

            </div>

            <div className="space-y-4">

              {analysis.results.map(
                (
                  item: any,
                  index: number
                ) => (

                  <div
                    key={index}
                    className="
                      rounded-2xl
                      border
                      border-red-500/20
                      bg-red-500/10
                      p-4 md:p-5
                    "
                  >

                    <div
                      className="
                        flex
                        flex-col
                        lg:flex-row
                        lg:items-center
                        lg:justify-between
                        gap-6
                      "
                    >

                      <div>

                        <h3 className="text-base md:text-lg font-black break-all">
                          {item.student1}
                          <span className="mx-3 text-orange-400">↔</span>
                          {item.student2}
                        </h3>

                        <p
                          className="
                            mt-3
                            text-sm
                            md:text-base
                            text-slate-400
                          "
                        >
                          Potential copied content detected
                        </p>

                      </div>

                      <div className="text-2xl md:text-3xl font-black text-red-400">{item.score}%</div>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

          {/* EXPORTS */}

          <div
            className="
              mt-8
              grid
              grid-cols-1
              md:grid-cols-3
              gap-3
            "
          >

            <button
              onClick={exportJSON}
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                border
                border-white/10
                bg-white/5
                px-5
                py-4
                text-sm
                font-semibold
                hover:bg-white/10
              "
            >

              <FileJson className="h-4 w-4" />

              Export JSON

            </button>

            <button
              onClick={exportCSV}
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                border
                border-white/10
                bg-white/5
                px-5
                py-4
                text-sm
                font-semibold
                hover:bg-white/10
              "
            >

              <FileSpreadsheet className="h-4 w-4" />

              Export CSV

            </button>

            <button
              onClick={exportPDF}
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-orange-500
                px-5
                py-4
                text-sm
                font-semibold
                text-black
                hover:bg-orange-400
              "
            >

              <FileText className="h-4 w-4" />

              Export PDF

            </button>

          </div>

        </div>
      )}

    </div>
  );
};

export default AnalysisSection;