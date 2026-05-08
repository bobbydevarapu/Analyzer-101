import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { studentApi } from "../studentApi";
import { JoinedLiveTest, StudentTestAnswer } from "../types";

type Props = {
  email: string;
};

const warningTone: Record<number, string> = {
  1: "text-yellow-300",
  2: "text-orange-300",
  3: "text-red-400",
};

const LiveTestsSection = ({ email }: Props) => {
  const [testCode, setTestCode] = useState("");
  const [joinedTest, setJoinedTest] = useState<JoinedLiveTest | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [joining, setJoining] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const autoSubmit = async () => {
    if (!joinedTest || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      const payload: StudentTestAnswer[] = Object.entries(answers).map(([key, value]) => ({
        question_id: Number(key),
        selected: value,
      }));

      const result = await studentApi.submitLiveTest(email, joinedTest.test_id, payload, violationCount);
      toast.success(`Submitted: ${result.score} (${Math.round(result.percentage)}%)`);
      setJoinedTest(null);
      setAnswers({});
      setRemainingSeconds(0);
      setViolationCount(0);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!joinedTest || remainingSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          autoSubmit();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [joinedTest, remainingSeconds]);

  useEffect(() => {
    if (!joinedTest) {
      return;
    }

    const onVisibility = () => {
      if (document.hidden) {
        setViolationCount((old) => {
          const next = old + 1;
          if (next >= 3) {
            toast.error("3rd warning reached. Auto submit triggered.");
            autoSubmit();
          } else {
            toast.warning(`Warning ${next}: Tab switch detected`);
          }
          return next;
        });
      }
    };

    const onContext = (event: MouseEvent) => {
      event.preventDefault();
      setViolationCount((old) => old + 1);
      toast.warning("Right click detected");
    };

    const onCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      setViolationCount((old) => old + 1);
      toast.warning("Copy/Paste blocked");
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onCopy);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onCopy);
    };
  }, [joinedTest]);

  const join = async () => {
    if (!testCode.trim()) {
      toast.error("Enter test code");
      return;
    }

    setJoining(true);
    try {
      const test = await studentApi.joinLiveTest(email, testCode.trim().toUpperCase());
      setJoinedTest(test);
      setRemainingSeconds(test.duration * 60);
      setAnswers({});
      setViolationCount(0);
    } catch (error: any) {
      toast.error(error?.message || "Unable to join test");
    } finally {
      setJoining(false);
    }
  };

  const formattedTimer = useMemo(() => {
    const min = Math.floor(remainingSeconds / 60)
      .toString()
      .padStart(2, "0");
    const sec = (remainingSeconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  }, [remainingSeconds]);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-orange-300">Live Tests</p>
        <h1 className="mt-2 text-3xl font-semibold">Join and Attempt Test</h1>
      </div>

      {!joinedTest ? (
        <article className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Join Test</h2>
          <p className="mt-1 text-sm text-slate-400">Enter test code from your teacher.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="flex-1 rounded-xl border border-white/10 bg-[#0b1627] px-3 py-2 text-sm"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder="Example: AWS-01"
            />
            <button
              type="button"
              disabled={joining}
              onClick={join}
              className="rounded-xl bg-orange-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-orange-300"
            >
              {joining ? "Joining..." : "Join Test"}
            </button>
          </div>
        </article>
      ) : (
        <>
          <article className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm">Test ID: {joinedTest.test_id}</p>
              <p className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm">Timer: {formattedTimer}</p>
              <p className={`rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm ${warningTone[Math.min(3, violationCount)] || "text-green-300"}`}>
                Warnings: {violationCount}
              </p>
            </div>
            <p className="mt-3 text-sm text-slate-400">1st warning yellow, 2nd orange, 3rd auto submit.</p>
          </article>

          <div className="space-y-3">
            {joinedTest.questions.map((question) => (
              <article key={question.question_id} className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
                <h2 className="text-xl font-semibold">Q{question.question_id}. {question.question}</h2>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {question.options.map((option) => (
                    <label key={option} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm">
                      <input
                        type="radio"
                        name={`q-${question.question_id}`}
                        checked={answers[question.question_id] === option}
                        onChange={() => setAnswers((old) => ({ ...old, [question.question_id]: option }))}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={autoSubmit}
            className="rounded-xl bg-orange-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-orange-300"
          >
            {submitting ? "Submitting..." : "Submit Test"}
          </button>
        </>
      )}
    </section>
  );
};

export default LiveTestsSection;
