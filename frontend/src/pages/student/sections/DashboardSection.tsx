import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { studentApi } from "../studentApi";
import { StudentDashboardData } from "../types";

type Props = {
  email: string;
};

const pieColors = ["#16a34a", "#f59e0b", "#f97316"];

const emptyData: StudentDashboardData = {
  metrics: {
    assignments: 0,
    submitted: 0,
    pending: 0,
    averageScore: 0,
    violations: 0,
    liveTests: 0,
  },
  submissionTrend: [],
  performancePie: [
    { name: "Completed", value: 0 },
    { name: "Pending", value: 0 },
    { name: "Flagged", value: 0 },
  ],
  recentActivity: [],
  upcomingTests: [],
};

const DashboardSection = ({ email }: Props) => {
  const [data, setData] = useState<StudentDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await studentApi.getDashboard(email);
        if (mounted) {
          setData(response);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (email) {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [email]);

  const cards = useMemo(
    () => [
      { label: "Assignments", value: data.metrics.assignments },
      { label: "Submitted", value: data.metrics.submitted },
      { label: "Pending", value: data.metrics.pending },
      { label: "Average Score", value: `${Math.round(data.metrics.averageScore)}%` },
      { label: "Violations", value: data.metrics.violations },
      { label: "Live Tests", value: data.metrics.liveTests },
    ],
    [data.metrics],
  );

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-orange-300">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold">Student Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-white/10 bg-[#081120]/85 p-3 backdrop-blur-xl sm:p-4">
            <p className="text-xs text-slate-400 sm:text-sm">{card.label}</p>
            <p className="mt-2 text-lg font-semibold sm:text-xl">{loading ? "--" : card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Submission Trend</h2>
          <p className="mt-1 text-sm text-slate-400">X-axis: assignments, Y-axis: score</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.submissionTrend}>
                <CartesianGrid stroke="#ffffff1a" strokeDasharray="3 3" />
                <XAxis dataKey="assignment" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0b1627", border: "1px solid #ffffff22" }} />
                <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Performance Pie</h2>
          <p className="mt-1 text-sm text-slate-400">Completed, pending, flagged</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.performancePie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90}>
                  {data.performancePie.map((_, index) => (
                    <Cell key={`slice-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0b1627", border: "1px solid #ffffff22" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <div className="mt-3 space-y-2">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet.</p>
            ) : (
              data.recentActivity.slice(0, 6).map((item, index) => (
                <div key={`${item.type}-${index}`} className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm">
                  <p className="font-medium">{item.type}</p>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Upcoming Tests</h2>
          <div className="mt-3 space-y-2">
            {data.upcomingTests.length === 0 ? (
              <p className="text-sm text-slate-400">No upcoming tests.</p>
            ) : (
              data.upcomingTests.map((test) => (
                <div key={test.test_id} className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm">
                  <p className="font-medium">{test.subject}</p>
                  <p className="text-slate-400">
                    {test.date} at {test.time} • {test.duration} min
                  </p>
                  <p className="text-xs text-orange-300">Use code: {test.test_id}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
};

export default DashboardSection;
