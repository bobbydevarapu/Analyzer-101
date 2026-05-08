import {
  AlertTriangle,
  Mail,
  ShieldAlert,
  User,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

type Props = {
  analysis: any;
};

const ViolationsSection = ({
  analysis,
}: Props) => {

  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user || !user.email) return;
      try {
        const data = await api.teacherReports(user.email);
        const fetched = data?.reports || [];
        setReports(fetched);
      } catch (err) {
        console.error("Failed to fetch teacher reports for violations", err);
        setReports([]);
      }
    };

    fetchReports();
  }, [user]);

  const violations =
    reports.flatMap(
      (report: any) =>

        report.results.map(
          (item: any) => ({

            assignment_id:
              report.assignment_id,

            created_at:
              report.created_at,

            ...item,
          })
        )
    );

  const totalViolations =
    violations.length;

  const highRisk =
    violations.filter(
      (item: any) =>
        item.score >= 80
    ).length;

  const mediumRisk =
    violations.filter(
      (item: any) =>
        item.score >= 50 &&
        item.score < 80
    ).length;

  // =========================
  // BETTER COLORS
  // =========================

  const getRiskStyle =
    (score: number) => {

      if (score >= 80) {

        return {

          text:
            "text-white",

          border:
            "border-white/10",

          card:
            "from-[#0b1220] to-[#111827]",

          icon:
            "bg-white/10 text-white",

          badge:
            "bg-white/10 text-white border border-white/10",

          label:
            "High Risk",
        };
      }

      if (score >= 50) {

        return {

          text:
            "text-white",

          border:
            "border-white/10",

          card:
            "from-[#0b1220] to-[#111827]",

          icon:
            "bg-white/10 text-white",

          badge:
            "bg-white/10 text-white border border-white/10",

          label:
            "Medium Risk",
        };
      }

      return {

        text:
          "text-white",

        border:
          "border-white/10",

        card:
          "from-[#0b1220] to-[#111827]",

        icon:
          "bg-white/10 text-white",

        badge:
          "bg-white/10 text-white border border-white/10",

        label:
          "Low Risk",
      };
    };

  return (

    <div className="space-y-7">

      {/* HEADER */}

      <div>

        <p
          className="
            uppercase
            tracking-[0.24em]
            text-orange-300
            text-[10px]
            mb-2
          "
        >
          VIOLATIONS
        </p>

        <h1
          className="
            text-2xl
            sm:text-3xl
            md:text-4xl
            font-black
            leading-none
          "
        >

          Academic
          <span className="ml-3 text-orange-400">
            Integrity
          </span>

        </h1>

      </div>

      {/* STATS */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-3
          gap-5
        "
      >

        {/* CARD */}

        {[
          {
            title: "TOTAL VIOLATIONS",
            value: totalViolations,
            icon: ShieldAlert,
            color: "text-white",
            iconBg: "bg-white/10",
            cardBg: "bg-[#0f172a]/90",
            border: "border-white/10",
          },

          {
            title: "HIGH RISK",
            value: highRisk,
            icon: AlertTriangle,
            color: "text-rose-200",
            iconBg: "bg-rose-500/10",
            cardBg: "bg-rose-500/5",
            border: "border-rose-500/20",
          },

          {
            title: "MEDIUM RISK",
            value: mediumRisk,
            icon: ShieldAlert,
            color: "text-amber-200",
            iconBg: "bg-amber-500/10",
            cardBg: "bg-amber-500/5",
            border: "border-amber-500/20",
          },
        ].map((card, index) => {

          const Icon =
            card.icon;

          return (

            <div
              key={index}
              className={`
                rounded-[24px]
                border
                ${card.border}
                ${card.cardBg}
                p-4 md:p-5
                backdrop-blur-xl
                shadow-[0_8px_24px_rgba(0,0,0,0.22)]
              `}
            >

              <div className="flex items-start justify-between">

                <div>

                  <p
                    className="
                      text-[10px]
                      uppercase
                      tracking-[0.28em]
                      text-slate-300
                    "
                  >
                    {card.title}
                  </p>

                  <h2
                    className={`
                      mt-3
                      text-3xl
                      sm:text-4xl
                      font-black
                      ${card.color}
                    `}
                  >
                    {card.value}
                  </h2>

                </div>

                <div
                  className={`
                    rounded-xl
                    p-3
                    ${card.iconBg}
                  `}
                >

                  <Icon
                    className={`
                      h-5
                      w-5
                      ${card.color}
                    `}
                  />

                </div>

              </div>

            </div>
          );
        })}

      </div>

      {/* EMPTY */}

      {violations.length === 0 && (

        <div
          className="
            rounded-[24px]
            border
            border-white/10
            bg-[#0f172a]/90
            p-8 md:p-10
            text-center
          "
        >

          <ShieldAlert className="mx-auto h-10 w-10 text-emerald-300" />

          <h2 className="mt-4 text-2xl md:text-3xl font-bold">
            No Violations Found
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            No suspicious assignment activity detected.
          </p>

        </div>
      )}

      {/* VIOLATION CARDS */}

      <div className="space-y-6">

        {violations.map(
          (
            item: any,
            index: number
          ) => {

            const risk =
              getRiskStyle(
                item.score
              );

            return (

              <div
                key={index}
                className={`
                    rounded-[24px]
                  border
                  ${risk.border}
                  bg-gradient-to-br
                  ${risk.card}
                  overflow-hidden
                  backdrop-blur-xl
                    shadow-[0_10px_26px_rgba(0,0,0,0.28)]
                `}
              >

                {/* CONTENT */}

                <div
                  className="
                    flex
                    flex-col
                    xl:flex-row
                    xl:items-center
                    xl:justify-between
                    gap-6
                    p-4 md:p-6
                  "
                >

                  {/* LEFT */}

                  <div className="space-y-6 flex-1">

                    {/* TITLE */}

                    <div>

                      <p
                        className="
                          text-[10px]
                          uppercase
                          tracking-[0.24em]
                          text-slate-300
                          mb-2
                        "
                      >
                        ASSIGNMENT
                      </p>

                      <h2
                        className="
                          text-2xl
                          md:text-3xl
                          font-black
                        "
                      >
                        {item.assignment_id}
                      </h2>

                    </div>

                    {/* STUDENTS */}

                    <div
                      className="
                        flex
                        flex-col
                        lg:flex-row
                        gap-3
                      "
                    >

                      {[

                        {
                          label: "Student 1",
                          name: item.student1,
                          email: item.email1,
                        },

                        {
                          label: "Student 2",
                          name: item.student2,
                          email: item.email2,
                        },
                      ].map((student, i) => (

                        <div
                          key={i}
                          className="
                            flex-1
                            rounded-2xl
                            border
                            border-white/6
                            bg-black/20
                            p-4
                          "
                        >

                          <div className="flex items-center gap-4">

                            <div
                              className={`
                                rounded-xl
                                p-2.5
                                ${risk.icon}
                              `}
                            >

                              <User className="h-4 w-4" />

                            </div>

                            <div>

                              <p className="text-xs text-slate-300 mb-1">
                                {student.label}
                              </p>

                              <h3 className="text-base font-bold text-white">
                                {student.name}
                              </h3>

                            </div>

                          </div>

                          <div
                            className="
                              mt-4
                              flex
                              items-center
                              gap-2
                              rounded-xl
                              border
                              border-white/5
                              bg-white/[0.03]
                              px-3
                              py-2.5
                              text-xs
                              text-slate-200
                              break-all
                            "
                          >

                            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                            {student.email}

                          </div>

                        </div>
                      ))}

                    </div>

                  </div>

                  {/* RIGHT */}

                  <div
                    className="
                      flex
                      flex-row
                      xl:flex-col
                      items-center
                      xl:items-end
                      gap-3
                    "
                  >

                    {/* SCORE */}

                    <div
                      className="
                        rounded-xl
                        border
                        border-white/10
                        bg-black/20
                        backdrop-blur-xl
                        px-4
                        py-4
                        min-w-[120px]
                        text-center
                      "
                    >

                      <p
                        className="
                          text-[9px]
                          uppercase
                          tracking-[0.22em]
                          text-slate-300
                          mb-1.5
                        "
                      >
                        SIMILARITY
                      </p>

                      <h2
                        className={`
                          text-2xl
                          sm:text-3xl
                          font-black
                          ${risk.text}
                        `}
                      >
                        {item.score}%
                      </h2>

                    </div>

                    {/* BADGE */}

                    <div
                      className={`
                        rounded-lg
                        px-3
                        py-1.5
                        text-[11px]
                        font-semibold
                        ${risk.badge}
                      `}
                    >

                      {risk.label}

                    </div>

                  </div>

                </div>

                {/* FOOTER */}

                <div
                  className="
                    border-t
                    border-white/5
                    bg-black/10
                    px-6
                    py-4
                    flex
                    flex-col
                    md:flex-row
                    md:items-center
                    md:justify-between
                    gap-3
                    text-sm
                    text-slate-400
                  "
                >

                  <p>
                    Status:
                    {" "}
                    {item.status}
                  </p>

                  <p>
                    Generated:
                    {" "}
                    {item.created_at}
                  </p>

                </div>

              </div>
            );
          }
        )}

      </div>

    </div>
  );
};

export default ViolationsSection;