
import { useEffect, useState } from "react";

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
    YAxis,
} from "recharts";

const API_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8000");

type DashboardStats = {
  assignments: number;
  students: number;
  violations: number;
  live_tests: number;
};

const DashboardSection = () => {

  const [stats, setStats] =
    useState<DashboardStats>({
      assignments: 0,
      students: 0,
      violations: 0,
      live_tests: 0,
    });

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const fetchDashboard =
      async () => {

        try {

          const token =
            localStorage.getItem(
              "teacherToken"
            );

          const response = await fetch(`${API_BASE}/teacher/dashboard`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          let data: any = null;
          try {
            const ct = response.headers.get("content-type") || "";
            if (ct.includes("application/json")) {
              data = await response.json();
            } else {
              const text = await response.text();
              try {
                data = text ? JSON.parse(text) : null;
              } catch (e) {
                data = null;
              }
            }
          } catch (e) {
            data = null;
          }

          setStats({
            assignments: (data && data.assignments) || 0,
            students: (data && data.students) || 0,
            violations: (data && data.violations) || 0,
            live_tests: (data && data.live_tests) || 0,
          });

        } catch (error) {

          console.error(error);

        } finally {

          setLoading(false);
        }
      };

    fetchDashboard();

  }, []);

  // =========================
  // CHART DATA
  // =========================

  const overviewData = [
    {
      name: "Assignments",
      value: stats.assignments,
    },

    {
      name: "Students",
      value: stats.students,
    },

    {
      name: "Violations",
      value: stats.violations,
    },

    {
      name: "Live Tests",
      value: stats.live_tests,
    },
  ];

  const pieData = [
    {
      name: "Safe",
      value:
        Math.max(
          stats.students -
          stats.violations,
          0
        ),
    },

    {
      name: "Violations",
      value: stats.violations,
    },
  ];

  const cards = [
    {
      label: "Assignments",
      value: stats.assignments,
    },
    {
      label: "Students",
      value: stats.students,
    },
    {
      label: "Violations",
      value: stats.violations,
    },
    {
      label: "Live Tests",
      value: stats.live_tests,
    },
  ];

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-orange-300">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold">Teacher Dashboard</h1>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-white/10 bg-[#081120]/85 p-3 backdrop-blur-xl sm:p-4">
            <p className="text-xs text-slate-400 sm:text-sm">{card.label}</p>
            <p className="mt-2 text-lg font-semibold sm:text-xl">{loading ? "--" : card.value}</p>
          </article>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        
        {/* AREA CHART */}
        <article className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Platform Overview</h2>
          <p className="mt-1 text-sm text-slate-400">Assignment and integrity statistics</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overviewData}>
                <defs>
                  <linearGradient id="colorData" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0b1627", border: "1px solid #ffffff22" }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#f97316"
                  fillOpacity={1}
                  fill="url(#colorData)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* PIE CHART */}
        <article className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Integrity Status</h2>
          <p className="mt-1 text-sm text-slate-400">Safe vs Violations</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#16a34a" : "#f59e0b"}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0b1627", border: "1px solid #ffffff22" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  );
};

export default DashboardSection;