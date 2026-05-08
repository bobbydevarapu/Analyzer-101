export type StudentTab =
  | "dashboard"
  | "assignments"
  | "livetests"
  | "results"
  | "violations"
  | "profile"
  | "settings";

export type StudentMetric = {
  assignments: number;
  submitted: number;
  pending: number;
  averageScore: number;
  violations: number;
  liveTests: number;
};

export type SubmissionTrendItem = {
  assignment: string;
  score: number;
};

export type PerformancePieItem = {
  name: "Completed" | "Pending" | "Flagged";
  value: number;
};

export type ActivityItem = {
  type: string;
  description: string;
  created_at: string;
};

export type UpcomingTestItem = {
  test_id: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  expires_at?: string;
};

export type StudentDashboardData = {
  metrics: StudentMetric;
  submissionTrend: SubmissionTrendItem[];
  performancePie: PerformancePieItem[];
  recentActivity: ActivityItem[];
  upcomingTests: UpcomingTestItem[];
};

export type AssignmentCard = {
  assignment_id: string;
  subject: string;
  deadline?: string;
  status: "Pending" | "Submitted" | "Late" | "Analyzed" | "Flagged";
  can_upload: boolean;
  submitted_at?: string;
};

export type StudentResultCard = {
  id: string;
  subject: string;
  name: string;
  marks: number;
  percentage: number;
  grade: string;
  status: string;
  date: string;
  source: "assignment" | "test";
  details: {
    correct: number;
    wrong: number;
    timeTaken: number;
    violations: number;
  };
};

export type ViolationLevel = "Low" | "Medium" | "High" | "Critical";

export type StudentViolation = {
  id: string;
  violationType: string;
  date: string;
  status: ViolationLevel;
  teacherRemark: string;
  penalty: string;
};

export type StudentProfile = {
  name: string;
  rollNumber: string;
  branch: string;
  section: string;
  semester: string;
  email: string;
  phone: string;
  photo?: string;
};

export type StudentSettings = {
  darkMode: boolean;
  notifications: boolean;
  language: string;
};

export type LiveTestQuestion = {
  question_id: number;
  question: string;
  options: string[];
};

export type JoinedLiveTest = {
  test_id: string;
  subject: string;
  duration: number;
  questions: LiveTestQuestion[];
};

export type StudentTestAnswer = {
  question_id: number;
  selected: string;
};

export type TestSubmitResult = {
  score: number;
  percentage: number;
  pass: boolean;
};
