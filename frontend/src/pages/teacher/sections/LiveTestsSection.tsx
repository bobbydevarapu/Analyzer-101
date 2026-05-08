import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  FileText,
  Monitor,
  Play,
  Users,
  Wrench,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useAuth } from "../../../context/AuthContext";

const LiveTestsSection = () => {
  const { user } = useAuth();

  const teacherEmail = user?.email ?? "";

  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [questionFile, setQuestionFile] =
    useState<File | null>(null);

  const [answerFile, setAnswerFile] =
    useState<File | null>(null);

  const [uploadStatus, setUploadStatus] =
    useState<string>("");

  const [maintenanceVisible, setMaintenanceVisible] =
    useState(false);

  const [testEnabled, setTestEnabled] =
    useState(false);

  const [uploadResult, setUploadResult] =
    useState<any | null>(null);

  const [publishTitle, setPublishTitle] =
    useState<string>("");

  const activeCount = liveTests.filter(
    (test) => test.status === "LIVE"
  ).length;

  const upcomingCount = liveTests.filter(
    (test) => test.status === "UPCOMING"
  ).length;

  const studentsCount = liveTests.reduce(
    (sum, item) => sum + (item.students || 0),
    0
  );

  const handleUpload = async () => {
    setMaintenanceVisible(true);

    setTimeout(() => {
      setMaintenanceVisible(false);
    }, 4000);
  };

  return (
    <div className="relative space-y-5">

      {/* FLOATING MAINTENANCE POPUP */}
      <AnimatePresence>
        {maintenanceVisible && (
          <motion.div
            initial={{
              opacity: 0,
              y: -20,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.95,
            }}
            transition={{
              duration: 0.25,
            }}
            className="
              fixed
              right-4
              top-24
              z-[100]
              w-[340px]
              overflow-hidden
              rounded-2xl
              border
              border-orange-400/20
              bg-[#081120]/95
              p-4
              shadow-[0_10px_40px_rgba(0,0,0,0.45)]
              backdrop-blur-2xl
            "
          >
            {/* GLOW */}
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="
                  absolute
                  -right-10
                  -top-10
                  h-28
                  w-28
                  rounded-full
                  bg-orange-500/10
                  blur-3xl
                "
              />
            </div>

            <div className="relative z-10 flex gap-3">

              {/* ICON */}
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-orange-400/20
                  bg-orange-500/10
                "
              >
                <Wrench className="h-5 w-5 text-orange-300" />
              </div>

              {/* CONTENT */}
              <div className="min-w-0 flex-1">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  Under Maintenance
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-relaxed
                    text-slate-400
                  "
                >
                  Live Tests feature is currently
                  under maintenance and will be
                  available soon.
                </p>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{
                duration: 4,
                ease: "linear",
              }}
              className="
                absolute
                bottom-0
                left-0
                h-[2px]
                bg-orange-400
              "
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-orange-300">
          LIVE EXAMINATION
        </p>

        <h1 className="text-2xl font-black leading-none sm:text-3xl md:text-4xl">
          Live{" "}
          <span className="ml-2 text-orange-400">
            Tests
          </span>
        </h1>
      </div>

      {/* UPLOAD PANEL */}
      <div className="rounded-[22px] border border-white/10 bg-[#08111f]/90 p-4 backdrop-blur-xl">
        <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_auto] md:items-end">

          {/* QUESTION PAPER */}
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
              Upload question paper
            </span>

            <input
              type="file"
              onChange={(e) =>
                setQuestionFile(
                  e.target.files
                    ? e.target.files[0]
                    : null
                )
              }
              className="
                block
                w-full
                rounded-xl
                border
                border-white/10
                bg-[#0b1525]
                px-3
                py-2
                text-sm
                text-slate-300
                file:mr-3
                file:rounded-lg
                file:border-0
                file:bg-orange-400
                file:px-3
                file:py-1
                file:text-sm
                file:font-semibold
                file:text-black
                hover:file:bg-orange-300
              "
            />
          </label>

          {/* ANSWER KEY */}
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
              Upload answer key
            </span>

            <input
              type="file"
              onChange={(e) =>
                setAnswerFile(
                  e.target.files
                    ? e.target.files[0]
                    : null
                )
              }
              className="
                block
                w-full
                rounded-xl
                border
                border-white/10
                bg-[#0b1525]
                px-3
                py-2
                text-sm
                text-slate-300
                file:mr-3
                file:rounded-lg
                file:border-0
                file:bg-cyan-400
                file:px-3
                file:py-1
                file:text-sm
                file:font-semibold
                file:text-black
                hover:file:bg-cyan-300
              "
            />
          </label>

          {/* GENERATE BUTTON */}
          <button
            onClick={handleUpload}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-orange-400
              px-4
              py-3
              text-sm
              font-semibold
              text-black
              transition-all
              hover:bg-orange-300
            "
          >
            Generate
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">

        {/* ACTIVE */}
        <div className="rounded-[22px] border border-emerald-400/10 bg-[#08111f]/90 p-4 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Active
              </p>

              <h2 className="mt-2 text-3xl font-black text-white">
                {activeCount}
              </h2>
            </div>

            <div className="rounded-xl bg-emerald-400/10 p-3">
              <FileText className="h-5 w-5 text-emerald-300" />
            </div>
          </div>
        </div>

        {/* UPCOMING */}
        <div className="rounded-[22px] border border-cyan-400/10 bg-[#08111f]/90 p-4 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Upcoming
              </p>

              <h2 className="mt-2 text-3xl font-black text-white">
                {upcomingCount}
              </h2>
            </div>

            <div className="rounded-xl bg-cyan-400/10 p-3">
              <ClipboardList className="h-5 w-5 text-cyan-300" />
            </div>
          </div>
        </div>

        {/* STUDENTS */}
        <div className="rounded-[22px] border border-orange-400/10 bg-[#08111f]/90 p-4 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Students
              </p>

              <h2 className="mt-2 text-3xl font-black text-white">
                {studentsCount}
              </h2>
            </div>

            <div className="rounded-xl bg-orange-400/10 p-3">
              <Users className="h-5 w-5 text-orange-300" />
            </div>
          </div>
        </div>

        {/* MONITORING */}
        <div className="rounded-[22px] border border-violet-400/10 bg-[#08111f]/90 p-4 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Monitoring
              </p>

              <h2 className="mt-2 text-3xl font-black text-white">
                24/7
              </h2>
            </div>

            <div className="rounded-xl bg-violet-400/10 p-3">
              <Monitor className="h-5 w-5 text-violet-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTestsSection;