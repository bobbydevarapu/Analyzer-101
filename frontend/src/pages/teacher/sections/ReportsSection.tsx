import { useEffect, useState } from "react";

import {
  CalendarDays,
  Eye,
  FileJson,
  FileSpreadsheet,
  FileText,
  Mail,
  Trash2,
} from "lucide-react";

import GlassToast from "@/components/ui/GlassToast";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

type ResultPair = {
  student1: string;
  student2: string;
  score: number;
  status: string;
  email1?: string;
  email2?: string;
};

type Report = {
  assignment_id: string;
  created_at?: string;
  results: ResultPair[];
  total_students?: number;
};

const ReportsSection = ({ analysis }: { analysis: any }) => {
  const { user } = useAuth();
  const [storedReports, setStoredReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const fetchReports = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      console.log("Fetching reports for:", user.email);
      const data = await api.teacherReports(user.email);
      console.log("Reports data:", data);
      setStoredReports(data?.reports || []);
    } catch (error) {
      console.error("Failed to fetch reports", error);
      showToast("Failed to load reports", "error");
      setStoredReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Add new analysis result to reports
  useEffect(() => {
    if (analysis && analysis.assignment_id) {
      console.log("New analysis received:", analysis);
      setStoredReports((prev) => {
        const exists = prev.find((r) => r.assignment_id === analysis.assignment_id);
        if (!exists) {
          return [
            {
              ...analysis,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ];
        }
        return prev;
      });
    }
  }, [analysis]);

  const deleteReport = async (assignmentId: string) => {
    try {
      await api.deleteTeacherReport(assignmentId);
      setStoredReports((prev) => prev.filter((item) => item.assignment_id !== assignmentId));
      showToast("Report deleted", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to delete report", "error");
    }
  };

  const sendEmails = async (assignmentId: string) => {

  try {

    const result = await api.teacherSendEmails(
      assignmentId,
      user?.email || ""
    );

    console.log("📧 EMAIL RESPONSE:", result);

    const sentCount =
      Number(result?.sent_count ?? result?.sentCount ?? 0);

    const failedCount =
      Number(result?.failed_count ?? result?.failedCount ?? 0);

    const message =
      String(result?.message || "");

    const lowerMessage =
      message.toLowerCase();

    // =========================
    // SUCCESS
    // =========================

    if (sentCount > 0 || lowerMessage.includes("sent successfully")) {

      showToast(
        sentCount > 0
          ? `Successfully sent ${sentCount} email(s)`
          : "Emails sent successfully",
        "success"
      );

      return;
    }

    // =========================
    // FAILURE
    // =========================

    if (failedCount > 0 || lowerMessage.includes("failed")) {

      showToast(
        failedCount > 0
          ? `Failed to send ${failedCount} email(s)`
          : "Failed to send emails",
        "error"
      );

      return;
    }

    // =========================
    // NO EMAILS / NO VIOLATIONS
    // =========================

    if (
      lowerMessage.includes("no copied") ||
      lowerMessage.includes("no emails") ||
      lowerMessage.includes("not found")
    ) {

      showToast(
        message,
        "error"
      );

      return;
    }

    // =========================
    // DEFAULT
    // =========================

    showToast(
      message || "Email process completed",
      "success"
    );

  } catch (error: any) {

    console.error(
      "❌ SEND EMAIL ERROR:",
      error
    );

    showToast(
      error?.message || "Failed to send emails",
      "error"
    );
  }
};

  const exportJSON = (report: any) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.assignment_id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = (report: any) => {
    const header = ["Student 1", "Student 2", "Similarity", "Status"];
    const resultRows =
      Array.isArray(report.results) && report.results.length > 0
        ? report.results.map((item: any) => [item.student1, item.student2, `${item.score}%`, item.status])
        : [["Unique assignment", "", "", "No flagged pairs"]];

    const rows = [header, ...resultRows];
    const csv = rows.map((row: any) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.assignment_id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = (report: any) => {
    const newWindow = window.open("", "_blank");
    if (!newWindow) return;

    const rows =
      Array.isArray(report.results) && report.results.length > 0
        ? report.results
            .map(
              (item: any) => `
              <tr>
                <td>${item.student1}</td>
                <td>${item.student2}</td>
                <td>${item.score}%</td>
                <td>${item.status}</td>
              </tr>
            `
            )
            .join("")
        : `
            <tr>
              <td colspan="4">No violations found</td>
            </tr>
          `;

    newWindow.document.write(`
      <html>
        <head>
          <title>Report</title>
          <style>
            body { font-family: Arial; padding: 40px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 12px; }
            th { background: #f97316; color: white; }
          </style>
        </head>
        <body>
          <h1>${report.assignment_id}</h1>
          <table>
            <thead>
              <tr>
                <th>Student 1</th>
                <th>Student 2</th>
                <th>Similarity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);

    newWindow.document.close();
    newWindow.print();
  };

  return (
    <>
      <GlassToast show={toast.show} message={toast.message} type={toast.type} />

      <div className="space-y-4 overflow-x-hidden md:space-y-8">
        <div className="min-w-0">
          <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-orange-300 sm:mb-4 sm:text-xs">
            REPORTS
          </p>
          <h1 className="text-2xl font-black leading-tight sm:text-4xl md:text-5xl">
            Analysis <span className="ml-2 text-orange-400 sm:ml-3">Reports</span>
          </h1>
        </div>

        {!loading && storedReports.length === 0 && (
          <div className="rounded-[26px] border border-white/10 bg-[#07101d]/90 p-6 text-center sm:p-10">
            <h2 className="text-lg font-bold sm:text-2xl">No Reports Available</h2>
            <p className="mt-2 text-sm text-slate-400 sm:mt-3">Go to Analysis section to analyze assignments</p>
          </div>
        )}

        <div className="grid min-w-0 gap-4 md:gap-6">
          {storedReports.map((report: any, index: number) => (
            <div
              key={index}
              className="min-w-0 overflow-hidden rounded-[20px] border border-white/10 bg-[#07101d]/90 p-3 backdrop-blur-xl sm:rounded-[24px] sm:p-4 md:p-6 lg:p-7"
            >
              <div className="flex min-w-0 flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-black sm:text-2xl md:text-3xl">{report.assignment_id}</h2>

                  <div className="mt-2 flex flex-col gap-2 text-xs text-slate-400 sm:mt-3 sm:flex-row sm:gap-3">
                    <div className="flex min-w-0 items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 sm:rounded-xl sm:px-3 sm:py-2">
                      <CalendarDays className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
                      <span className="truncate text-[11px] sm:text-xs">{report.created_at?.split("T")[0]}</span>
                    </div>

                    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-[11px] sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
                      Students: {report.total_students || 0}
                    </div>

                    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-[11px] sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
                      Violations: {report.results?.length || 0}
                    </div>
                  </div>
                </div>

                <div className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-slate-200 sm:w-fit sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm lg:w-fit">
                  {report.results?.length > 0 ? `${report.results.length} flagged` : "Unique"}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-2.5 lg:mt-5 lg:grid-cols-4">
                <button
                  onClick={() =>
                    setSelectedReportId(selectedReportId === report.assignment_id ? null : report.assignment_id)
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-2.5 text-xs font-semibold text-white transition-all duration-300 hover:bg-white/10 sm:rounded-xl sm:px-3 sm:py-3 lg:rounded-2xl lg:px-4 lg:py-3.5 lg:text-sm"
                >
                  <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">{selectedReportId === report.assignment_id ? "Hide" : "View"}</span>
                    <span className="sm:hidden">{selectedReportId === report.assignment_id ? "Hide" : "View"}</span>
                </button>

                <button
                  onClick={() => deleteReport(report.assignment_id)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-2.5 text-xs font-semibold text-rose-200 transition-all duration-300 hover:bg-rose-500/20 sm:rounded-xl sm:px-3 sm:py-3 lg:rounded-2xl lg:px-4 lg:py-3.5 lg:text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                    <span className="sm:hidden">Delete</span>
                </button>
              </div>

              {selectedReportId === report.assignment_id && (
                <div className="mt-3 rounded-[16px] border border-white/10 bg-black/20 p-2.5 sm:mt-4 sm:rounded-[22px] sm:p-4 lg:mt-5 lg:rounded-[28px] lg:p-5">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-4 lg:gap-3">
                    <button
                      onClick={() => exportPDF(report)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-2.5 text-xs font-semibold text-white hover:bg-white/10 sm:rounded-xl sm:gap-2 sm:px-3 sm:py-3 lg:rounded-2xl lg:px-4 lg:py-3.5 lg:text-sm"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Export PDF</span>
                      <span className="sm:hidden">PDF</span>
                    </button>

                    <button
                      onClick={() => exportCSV(report)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-2.5 text-xs font-semibold text-white hover:bg-white/10 sm:rounded-xl sm:gap-2 sm:px-3 sm:py-3 lg:rounded-2xl lg:px-4 lg:py-3.5 lg:text-sm"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="hidden sm:inline">Export Excel</span>
                      <span className="sm:hidden">CSV</span>
                    </button>

                    <button
                      onClick={() => exportJSON(report)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-2.5 text-xs font-semibold text-white hover:bg-white/10 sm:rounded-xl sm:gap-2 sm:px-3 sm:py-3 lg:rounded-2xl lg:px-4 lg:py-3.5 lg:text-sm"
                    >
                      <FileJson className="h-4 w-4" />
                      <span className="hidden sm:inline">Export JSON</span>
                      <span className="sm:hidden">JSON</span>
                    </button>

                    <button
                      onClick={() => sendEmails(report.assignment_id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2 py-2.5 text-xs font-semibold text-orange-200 hover:bg-orange-500/20 sm:rounded-xl sm:gap-2 sm:px-3 sm:py-3 lg:rounded-2xl lg:px-4 lg:py-3.5 lg:text-sm"
                    >
                      <Mail className="h-4 w-4" />
                      <span className="hidden sm:inline">Send Emails</span>
                      <span className="sm:hidden">Email</span>
                    </button>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-lg border border-white/5 sm:mt-4 lg:mt-5">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] lg:min-w-[0]">
                        <thead>
                          <tr className="bg-white/5">
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-white whitespace-nowrap sm:px-4 sm:py-3.5 lg:text-sm">
                              Student 1
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-white whitespace-nowrap sm:px-4 sm:py-3.5 lg:text-sm">
                              Student 2
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-white whitespace-nowrap sm:px-4 sm:py-3.5 lg:text-sm">
                              Similarity
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-white whitespace-nowrap sm:px-4 sm:py-3.5 lg:text-sm">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(report.results) && report.results.length > 0 ? (
                            report.results.map((item: any, i: number) => (
                              <tr key={i} className="border-t border-white/5">
                                <td className="px-3 py-2 text-xs text-slate-200 whitespace-nowrap sm:px-4 sm:py-3 lg:text-sm">
                                  {item.student1}
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-200 whitespace-nowrap sm:px-4 sm:py-3 lg:text-sm">
                                  {item.student2}
                                </td>
                                <td
                                  className={`px-3 py-2 text-xs font-bold whitespace-nowrap sm:px-4 sm:py-3 lg:text-sm ${
                                    item.score >= 80 ? "text-rose-300" : "text-emerald-300"
                                  }`}
                                >
                                  {item.score}%
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-300 whitespace-nowrap sm:px-4 sm:py-3 lg:text-sm">
                                  {item.status}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-xs text-slate-400 sm:p-6 sm:text-sm">
                                No copied pairs found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ReportsSection;