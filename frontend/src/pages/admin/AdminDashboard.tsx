import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  CheckCircle2,
  FileText,
  Lock,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  UserCheck,
  UserCog,
  UserX
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { toast } from "sonner";

import { AdminProvider, useAdmin } from "./AdminContext";

import { Sidebar } from "./Sidebar";
import Topbar from "./Topbar";

import CanvasCursor from "../../components/landing/CanvasCursor";
import { Panel } from "./Panel";

type Assignment = {
  assignment_id: string;
  student_count: number;
  flagged_count: number;
};

type AssignmentDetail = {
  assignment_id: string;
  students: any[];
  results: any[];
};

type TeacherRequest = {
  name: string;
  email: string;
  department?: string;
};

type TeacherRecord = {
  name: string;
  email: string;
  department?: string;
  approved: boolean;
};

const API_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8000");

const AdminDashboard = () => (
  <AdminProvider>
    <AdminDashboardContent />
  </AdminProvider>
);

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-[#0b1627]
        p-4
        backdrop-blur-xl
      "
    >
      <p
        className="
          mb-1
          text-[10px]
          uppercase
          tracking-[0.18em]
          text-slate-500
        "
      >
        {label}
      </p>

      <p
        className="
          break-words
          text-sm
          font-semibold
          text-white
        "
      >
        {value}
      </p>
    </div>
  );
}

function AlertRow({ title, subtitle, tone }: { title: string; subtitle: string; tone: "orange" | "red" }) {
  const toneClass = tone === "red" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-orange-500/30 bg-orange-500/10 text-cyan-300";
  return (
    <div className={`rounded-xl border px-3 py-3 ${toneClass}`}>
      <p className="font-medium">{title}</p>
      <p className="break-words text-xs opacity-80">{subtitle}</p>
    </div>
  );
}

function SettingField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-xl border border-white/15 bg-[#0b1627] px-3 py-2 text-white outline-none placeholder:text-slate-400 focus:border-orange-400/40"
      />
    </label>
  );
}

function UserDeleteRow({ label, placeholder, role, onDelete }: { label: string; placeholder: string; role: "teacher" | "student"; onDelete: (email: string, role: "teacher" | "student") => Promise<void> }) {
  const [email, setEmail] = useState("");

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-[#0b1627]/20 p-4">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={placeholder} className="flex-1 rounded-xl border border-white/10 bg-[#081120] px-3 py-2 text-sm outline-none focus:border-brand-cyan/50" />
        <button onClick={() => void onDelete(email, role)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10">
          <Trash2 className="h-4 w-4" /> Remove
        </button>
      </div>
    </div>
  );
}

type StudentRecord = {
  name: string;
  email: string;
  department: string;
  violations: number;
  blocked: boolean;
  status: string;
  cooldown_remaining: number;
  submissions: number;
};

type StudentProfile = {
  name: string;
  email: string;
  dept: string;
  total: number;
  copied: number;
  violations_count: number;
  history: Array<{ assignment_id: string; dept?: string; roll?: string; submitted_at?: string }>;
  violations: Array<{ assignment_id: string; status?: string; score?: number; against_roll?: string }>;
  blocked: boolean;
  remaining_before_block: number;
  blocked_submissions_remaining: number;
  cooldown_assignments: number;
  max_violations: number;
};

type AdminSettings = {
  similarity_threshold: number;
  max_violations: number;
  cooldown_assignments: number;
};

const defaultSettings: AdminSettings = {
  similarity_threshold: 0.75,
  max_violations: 10,
  cooldown_assignments: 5,
};

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #52525b; }
  `;
  if (document.head && !document.head.querySelector("style[data-admin-scrollbar]")) {
    style.setAttribute("data-admin-scrollbar", "true");
    document.head.appendChild(style);
  }
}

const statusTone = (violations: number) => {
  if (violations >= 10) return "text-red-400 border-red-500/40 bg-red-500/10";
  if (violations >= 8) return "text-orange-400 border-orange-500/40 bg-orange-500/10";
  if (violations >= 4) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
  return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
};

const AdminDashboardContent = () => {
  const navigate = useNavigate();
  const { activePage, collapsed } = useAdmin();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDetail | null>(null);
  const [teacherRequests, setTeacherRequests] = useState<TeacherRequest[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [settingsDraft, setSettingsDraft] = useState<AdminSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [archivedAssignments, setArchivedAssignments] = useState<string[]>([]);
  const token = localStorage.getItem("adminToken");

  const totalAssignments = assignments.length;
  // Count unique students from the students array instead of summing per-assignment counts
  const totalStudents = students.length;
  const totalFlags = assignments.reduce((sum, item) => sum + item.flagged_count, 0);
  const approvedTeachers = teachers.filter((teacher) => teacher.approved).length;
  const pendingTeachers = teacherRequests.length;
  const flagRate = totalStudents > 0 ? Math.round((totalFlags / totalStudents) * 100) : 0;

  const chartData = assignments.map((item) => ({ name: item.assignment_id, submissions: item.student_count, flags: item.flagged_count }));
  const pieData = [
    { name: "Flagged", value: totalFlags },
    { name: "Safe", value: Math.max(0, totalStudents - totalFlags) },
  ];
  // Theme colors: orange for flagged, green for safe
  const PIE_COLORS = ["#ff6b35", "#10b981"];

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/assignments`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch {
      toast.error("Failed to load assignments");
    }
  }, [token]);

  const fetchTeacherRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/teacher-requests`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTeacherRequests(data.requests || []);
    } catch {
      toast.error("Failed to load teacher requests");
    }
  }, [token]);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/teachers`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTeachers(data.teachers || []);
    } catch {
      toast.error("Failed to load teachers");
    }
  }, [token]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/students`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = data.students || [];
      setStudents(items);
    } catch {
      toast.error("Failed to load students");
    }
  }, [token]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSettings(data);
      setSettingsDraft(data);
    } catch {
      toast.error("Failed to load settings");
    }
  }, [token]);

  const fetchStudentProfile = useCallback(async (email: string) => {
  if (!email.trim()) {
    toast.error("Enter student email");
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/get-student/${encodeURIComponent(email)}`
    );

    if (res.status === 404) {
      setStudentProfile(null);
      toast.error("Student not found");
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data || Object.keys(data).length === 0) {
      setStudentProfile(null);
      toast.error("No student data available");
      return;
    }

    setStudentProfile({
      ...data,
      name: data.name || email.split("@")[0],
      email,
      dept: data.dept || "Unknown",
    });

  } catch {
    setStudentProfile(null);
    toast.error("Failed to load student profile");
  }
}, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchAssignments(), fetchTeacherRequests(), fetchTeachers(), fetchStudents(), fetchSettings()]);
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments, fetchSettings, fetchStudents, fetchTeacherRequests, fetchTeachers]);

  useEffect(() => {
    if (!token) {
      navigate("/login?role=admin");
      return;
    }
    refreshAll();
  }, [navigate, refreshAll, token]);

  const handleViewDetails = async (assignmentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/assignment/${assignmentId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSelectedAssignment({
        assignment_id: assignmentId,
        students: data.students || [],
        results: data.results || [],
      });
    } catch {
      toast.error("Failed to load assignment details");
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm(`Delete assignment ${assignmentId}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/delete/${assignmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Assignment deleted successfully");
      setAssignments((current) => current.filter((item) => item.assignment_id !== assignmentId));
      if (selectedAssignment?.assignment_id === assignmentId) setSelectedAssignment(null);
    } catch {
      toast.error("Failed to delete assignment");
    }
  };

  const handleArchiveAssignment = async (assignmentId: string) => {
    setArchivedAssignments((current) => Array.from(new Set([...current, assignmentId])));
    toast.success(`Archived ${assignmentId}`);
  };

  const handleApproveTeacher = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/teacher-requests/${encodeURIComponent(email)}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Teacher approved successfully");
      await fetchTeacherRequests();
      await fetchTeachers();
    } catch {
      toast.error("Failed to approve teacher");
    }
  };

  const handleRejectTeacher = async (email: string) => {
    if (!window.confirm(`Reject teacher request for ${email}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/teacher-requests/${encodeURIComponent(email)}/reject`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Teacher rejected successfully");
      await fetchTeacherRequests();
    } catch {
      toast.error("Failed to reject teacher");
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const formData = new FormData();
      formData.append("similarity_threshold", String(settingsDraft.similarity_threshold));
      formData.append("max_violations", String(settingsDraft.max_violations));
      formData.append("cooldown_assignments", String(settingsDraft.cooldown_assignments));
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSettings(data);
      setSettingsDraft(data);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRemoveUser = async (email: string, role: "teacher" | "student") => {
    if (!window.confirm(`Remove ${role} ${email}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(email)}?role=${role}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`${role === "teacher" ? "Teacher" : "Student"} removed`);
      if (role === "teacher") await fetchTeachers();
      if (role === "student") await fetchStudents();
    } catch {
      toast.error(`Failed to remove ${role}`);
    }
  };

  const handleResetStudent = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/students/${encodeURIComponent(email)}/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Violations reset");
      await fetchStudents();
      await fetchStudentProfile(email);
    } catch {
      toast.error("Failed to reset violations");
    }
  };

  const handleUnblockStudent = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/students/${encodeURIComponent(email)}/unblock`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Student unblocked");
      await fetchStudents();
      await fetchStudentProfile(email);
    } catch {
      toast.error("Failed to unblock student");
    }
  };

  const visibleAssignments = useMemo(
    () => assignments.filter((item) => !archivedAssignments.includes(item.assignment_id)),
    [assignments, archivedAssignments],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
          Loading dashboard...
        </motion.div>
      </div>
    );
  }

  const dashboardCards = [
    { label: "Assignments", value: totalAssignments },
    { label: "Students", value: totalStudents },
    { label: "Flags", value: totalFlags },
    { label: "Approved Teachers", value: approvedTeachers },
    { label: "Pending Approvals", value: pendingTeachers },
    { label: "Flag Rate", value: `${flagRate}%` },
  ];

  const dashboardSection = (
    <motion.section key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => (
          <article key={card.label} className="
  relative
  overflow-hidden
  rounded-3xl
  border
  border-white/10
  bg-[#081120]/88
  p-5
  backdrop-blur-2xl
  shadow-[0_10px_35px_rgba(0,0,0,0.35)]
">
            <p className="text-xs text-slate-400 sm:text-sm">{card.label}</p>
            <p className="mt-2 text-lg font-semibold sm:text-xl">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-[#081120]/88 p-4 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Submission Trend</h2>
          <p className="mt-1 text-sm text-slate-400">X-axis: assignments, Y-axis: volume</p>

          {chartData.length === 0 ? (
            <div className="mt-4 h-[260px] flex items-center justify-center text-slate-400">
              <p className="text-xs md:text-sm">No chart data available yet.</p>
            </div>
          ) : (
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.08} />
                    </linearGradient>
                    <linearGradient id="colorFlag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ffffff1a" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#0b1627", border: "1px solid #ffffff22" }} />
                  <Area type="monotone" dataKey="submissions" stroke="#06b6d4" strokeWidth={2.2} fill="url(#colorSub)" />
                  <Area type="monotone" dataKey="flags" stroke="#f97316" strokeWidth={2.2} fill="url(#colorFlag)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#081120]/88 p-4 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Performance Pie</h2>
          <p className="mt-1 text-sm text-slate-400">Flagged vs safe submissions</p>

          {chartData.length === 0 ? (
            <div className="mt-4 h-[260px] flex items-center justify-center text-slate-400">
              <p className="text-xs md:text-sm">No chart data available yet.</p>
            </div>
          ) : (
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0b1627", border: "1px solid #ffffff22" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </div>
    </motion.section>
  );

  const assignmentsSection = (
    <motion.div key="assignments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="
grid
grid-cols-1
xl:grid-cols-[300px_minmax(0,1fr)]
gap-4
items-start
min-w-0
">
      <Panel title="Assignments" subtitle="Manage uploads and reports" action={<button onClick={fetchAssignments} className="p-2 hover:bg-[#0b1627] rounded-lg transition" title="Refresh"><RefreshCw className="h-4 w-4" /></button>}>
        <div className="space-y-2 max-h-[calc(100vh-290px)] overflow-y-auto pr-1">
          {visibleAssignments.length === 0 ? (
            <p className="text-sm text-slate-400">No assignments yet</p>
          ) : (
            visibleAssignments.map((item) => {
              const isActive = selectedAssignment?.assignment_id === item.assignment_id;
              const archived = archivedAssignments.includes(item.assignment_id);
              return (
                <button
                  key={item.assignment_id}
                  onClick={() => {
  if (selectedAssignment?.assignment_id === item.assignment_id) {
    setSelectedAssignment(null);
  } else {
    void handleViewDetails(item.assignment_id);
  }
}}
                  className={`w-full text-left rounded-xl p-3 transition-all ${isActive ? "bg-cyan-500/10 border border-cyan-400/30" : "bg-[#0b1627]/40 hover:bg-[#0b1627]/70 border border-transparent"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{item.assignment_id}</p>
                    {archived && <span className="text-[10px] uppercase tracking-[0.15em] text-slate-400">Archived</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{item.student_count} students</p>
                  <p className="text-xs text-slate-400">{item.flagged_count} flagged</p>
                </button>
              );
            })
          )}
        </div>
      </Panel>

      <Panel title={selectedAssignment ? "Assignment Details" : "Select an assignment"} subtitle={selectedAssignment ? `${selectedAssignment.students.length} submissions` : "Choose from the list"}>
        {!selectedAssignment ? (
          <div className="flex min-h-72 items-center justify-center text-slate-400">Select an assignment to view reports</div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void handleArchiveAssignment(selectedAssignment.assignment_id)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-[#0b1627]/40 transition"><Archive className="h-4 w-4" />Archive</button>
              <button onClick={() => void handleDeleteAssignment(selectedAssignment.assignment_id)} className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"><Trash2 className="h-4 w-4" />Delete</button>
              <button onClick={() => toast.info("Reports are shown below in the copied pairs list.")} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-[#0b1627]/40 transition"><FileText className="h-4 w-4" />View reports</button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SummaryTile label="Assignment ID" value={selectedAssignment.assignment_id} />
              <SummaryTile label="Submissions" value={String(selectedAssignment.students.length)} />
              <SummaryTile label="Flagged students" value={String(selectedAssignment.results.length)} />
              <SummaryTile label="Copied pairs" value={String(selectedAssignment.results.length)} />
            </div>

            <div>
              <h4 className="mb-3 font-semibold">Copied pairs</h4>
              {selectedAssignment.results.length === 0 ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> No flagged submissions.
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {selectedAssignment.results.map((pair, index) => (
                    <div key={index} className="glass rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="rounded bg-[#0b1627] p-3"><p className="text-xs uppercase tracking-[0.12em] text-slate-400 mb-1">Student 1</p><p className="font-medium">{pair.student1}</p><p className="truncate text-xs text-slate-400">{pair.email1}</p></div>
                        <div className="rounded bg-[#0b1627] p-3"><p className="text-xs uppercase tracking-[0.12em] text-slate-400 mb-1">Student 2</p><p className="font-medium">{pair.student2}</p><p className="truncate text-xs text-slate-400">{pair.email2}</p></div>
                      </div>
                      <div className="flex items-center justify-between rounded bg-[#0b1627] px-3 py-2"><p className="text-xs text-slate-400">Status: {pair.status}</p><p className="text-sm font-bold text-orange-400">{Math.round(pair.score)}%</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Panel>
    </motion.div>
  );

  const teachersSection = (
    <motion.div key="teachers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-6">
      <Panel title="Pending Approvals" subtitle="Review and approve new instructors" action={<button onClick={fetchTeacherRequests} className="p-2 hover:bg-[#0b1627] rounded-lg transition" title="Refresh"><RefreshCw className="h-4 w-4" /></button>}>
        {teacherRequests.length === 0 ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 flex-shrink-0" />No pending teacher requests.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teacherRequests.map((teacher) => (
              <div key={teacher.email} className="glass rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400 mb-1">Pending Teacher</p>
                  <p className="font-semibold">{teacher.name}</p>
                  <p className="text-sm text-slate-400 break-words">{teacher.email}</p>
                  <p className="text-xs text-slate-400 mt-1">{teacher.department || "Department not set"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => void handleApproveTeacher(teacher.email)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition text-sm"><UserCheck className="h-4 w-4" />Approve</button>
                  <button onClick={() => void handleRejectTeacher(teacher.email)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition text-sm"><UserX className="h-4 w-4" />Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Approved Teachers" subtitle="Current instructor roster">
        {teachers.filter((teacher) => teacher.approved).length === 0 ? (
          <p className="text-sm text-slate-400">Approved teachers will appear here after approvals.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.filter((teacher) => teacher.approved).map((teacher) => (
              <div key={teacher.email} className="glass rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{teacher.name}</p>
                  <p className="text-sm text-slate-400 break-words">{teacher.email}</p>
                  <p className="text-xs text-slate-400">{teacher.department}</p>
                </div>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">Approved</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </motion.div>
  );

  const studentsSection = (
    <motion.div key="students" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="
grid
grid-cols-1
xl:grid-cols-[300px_minmax(0,1fr)]
gap-4
items-start
min-w-0
">
      <Panel title="Student Monitoring" subtitle="Violations and block status" action={<button onClick={fetchStudents} className="p-2 hover:bg-[#0b1627] rounded-lg transition" title="Refresh"><RefreshCw className="h-4 w-4" /></button>}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1627]/30 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
  name="student-search"
  value={studentSearch}
  onChange={(event) => setStudentSearch(event.target.value)}
  placeholder="Search student email"
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="none"
  spellCheck={false}
  className="
    min-w-0
    w-full
    bg-transparent
    text-sm
    text-white
    outline-none
    placeholder:text-slate-400
  "
/>
            <button onClick={() => void fetchStudentProfile(studentSearch)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-[#0b1627]/40 transition">Open</button>
          </div>

          <div
  className="
    min-w-0
    space-y-2
    max-h-[70vh]
    overflow-y-auto
    overflow-x-hidden
    pr-1
  "
>
            {students.length === 0 ? (
              <p className="text-sm text-slate-400">No student records yet.</p>
            ) : (
              students.map((student) => (
                <button
                  key={student.email}
                  onClick={() => void fetchStudentProfile(student.email)}
                  className={`
w-full
min-w-0
overflow-hidden
rounded-xl
border
p-3
text-left
transition ${studentProfile?.email === student.email ? "border-brand-cyan/40 bg-brand-cyan/10" : "border-white/10 bg-[#0b1627]/20 hover:bg-[#0b1627]/40"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="truncate text-xs text-slate-400">{student.email}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${statusTone(student.violations)}`}>{student.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{student.violations} violations</span>
                    <span>{student.submissions} submissions</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Panel>

      <Panel title={studentProfile ? studentProfile.name : "Student details"} subtitle={studentProfile ? studentProfile.email : "Search or select a student"}>
        {!studentProfile ? (
          <div className="flex min-h-72 items-center justify-center text-slate-400">Open a student to inspect violations and block status</div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryTile label="Violations" value={String(studentProfile.violations_count)} />
              <SummaryTile label="Copied total" value={String(studentProfile.copied)} />
              <SummaryTile label="Blocked" value={studentProfile.blocked ? "Yes" : "No"} />
              <SummaryTile label="Submissions" value={String(studentProfile.total)} />
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0b1627]/20 p-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Current status</p>
              <p className="font-medium">{studentProfile.blocked ? `Blocked for next ${settings.cooldown_assignments} assignments` : studentProfile.remaining_before_block <= 3 ? "Getting close to the block threshold" : "Safe for now"}</p>
              <p className="text-sm text-slate-400">Department: {studentProfile.dept}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => void handleUnblockStudent(studentProfile.email)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-[#0b1627]/40 transition"><Lock className="h-4 w-4" />Unblock manually</button>
              <button onClick={() => void handleResetStudent(studentProfile.email)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-[#0b1627]/40 transition"><UserCog className="h-4 w-4" />Reset violations</button>
              <button onClick={() => void handleRemoveUser(studentProfile.email, "student")} className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"><Trash2 className="h-4 w-4" />Remove student</button>
            </div>

            <div>
              <h4 className="mb-3 font-semibold">Violation history</h4>
              {studentProfile.violations.length === 0 ? (
                <p className="text-sm text-slate-400">No violations found for this student.</p>
              ) : (
                <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                  {studentProfile.violations.map((item, index) => (
                    <div key={index} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.assignment_id}</p>
                        <p className="text-xs text-slate-400">Against {item.against_roll || "another student"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-orange-400">{Math.round(item.score || 0)}%</p>
                        <p className="text-xs text-slate-400">
  {item.status || "Violation detected"}
</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Panel>
    </motion.div>
  );

  const alertsSection = (
    <motion.div key="alerts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-6">
      <Panel title="System Notifications" subtitle="Teacher requests, risk spikes, and live test status">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Teacher requests</p>
            {teacherRequests.length === 0 ? <p className="text-sm text-slate-400">No pending approvals.</p> : teacherRequests.map((teacher) => <AlertRow key={teacher.email} title={teacher.name} subtitle={teacher.email} tone="orange" />)}
          </div>
          <div className="glass rounded-xl p-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">High plagiarism alerts</p>
            {assignments.filter((item) => item.flagged_count > 0).length === 0 ? <p className="text-sm text-slate-400">No flagged assignments right now.</p> : assignments.filter((item) => item.flagged_count > 0).map((item) => <AlertRow key={item.assignment_id} title={item.assignment_id} subtitle={`${item.flagged_count} flagged pairs`} tone="red" />)}
          </div>
          <div className="glass rounded-xl p-4 space-y-3 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Blocked students</p>
            {students.filter((student) => student.blocked).length === 0 ? <p className="text-sm text-slate-400">No blocked students.</p> : students.filter((student) => student.blocked).map((student) => <AlertRow key={student.email} title={student.name} subtitle={`${student.email} • ${student.violations} violations`} tone="orange" />)}
          </div>
        </div>
      </Panel>
    </motion.div>
  );

  const settingsSection = (
    <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <Panel title="System Settings" subtitle="Similarity threshold, violation limit, cooldown window">
        <div className="space-y-4">
          <SettingField label="Similarity threshold" value={settingsDraft.similarity_threshold} step={0.01} min={0} max={1} onChange={(value) => setSettingsDraft((current) => ({ ...current, similarity_threshold: value }))} />
          <SettingField label="Max violations" value={settingsDraft.max_violations} step={1} min={1} max={50} onChange={(value) => setSettingsDraft((current) => ({ ...current, max_violations: value }))} />
          <SettingField label="Cooldown assignments" value={settingsDraft.cooldown_assignments} step={1} min={1} max={20} onChange={(value) => setSettingsDraft((current) => ({ ...current, cooldown_assignments: value }))} />
          <button onClick={handleSaveSettings} disabled={savingSettings} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-[#0b1627]/40 transition disabled:opacity-50">
            <Settings2 className="h-4 w-4" />
            {savingSettings ? "Saving..." : "Save settings"}
          </button>
        </div>
      </Panel>

      <Panel title="User Management" subtitle="Remove teachers or students from the platform">
        <div className="space-y-5">
          <UserDeleteRow label="Remove teacher" placeholder="teacher@email.com" role="teacher" onDelete={handleRemoveUser} />
          <UserDeleteRow label="Remove student" placeholder="student@email.com" role="student" onDelete={handleRemoveUser} />
          <div className="rounded-xl border border-white/10 bg-[#0b1627]/20 p-4 text-sm text-slate-400">
            Threshold preview: {settings.similarity_threshold} • Max violations: {settings.max_violations} • Cooldown window: {settings.cooldown_assignments}
          </div>
        </div>
      </Panel>
    </motion.div>
  );

  const pageContent =
    activePage === "dashboard"
      ? dashboardSection
      : activePage === "assignments"
        ? assignmentsSection
        : activePage === "teachers"
          ? teachersSection
          : activePage === "students"
            ? studentsSection
            : activePage === "alerts"
              ? alertsSection
              : settingsSection;

  return (
    <div className="landing-page relative flex min-h-screen w-full overflow-hidden bg-[#050816] text-white admin-scrollbar">
      <CanvasCursor />
      <Sidebar />

      <div className={`min-h-screen w-full min-w-0 transition-all duration-300 ${collapsed ? "lg:ml-[100px]" : "lg:ml-[280px]"}`}>
        <div className="flex-1 min-w-0 flex flex-col admin-scrollbar">
          <Topbar />
          <main
  className="
    flex-1
    overflow-x-hidden
    overflow-y-auto
    space-y-6
    px-3
    py-3
    sm:px-4
    md:px-6
    lg:px-8
  "
>
            <div className="mx-auto w-full min-w-0 max-w-[1500px]">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-1 md:space-y-2">
                <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Overview</p>
                <h1 className="mt-2 text-3xl font-semibold">Admin Dashboard</h1>
              </motion.div>
              <AnimatePresence mode="wait">{pageContent}</AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;