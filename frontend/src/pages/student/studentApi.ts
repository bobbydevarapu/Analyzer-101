import {
  AssignmentCard,
  JoinedLiveTest,
  StudentDashboardData,
  StudentProfile,
  StudentResultCard,
  StudentSettings,
  StudentTestAnswer,
  StudentViolation,
  TestSubmitResult,
} from "./types";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8000");

function getAuthHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = localStorage.getItem("authToken");

  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const ct = response.headers.get("content-type") || "";
  let data: any = null;

  try {
    if (ct.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = text || null;
      }
    }
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || response.statusText || "Request failed");
  }

  return data as T;
}

export const studentApi = {
  getDashboard(email: string) {
    return fetch(
      `${BASE_URL}/student/dashboard?email=${encodeURIComponent(email)}`,
      { headers: getAuthHeaders() },
    ).then((res) => parseResponse<StudentDashboardData>(res));
  },

  getAssignments(email: string, page = 1, pageSize = 10) {
    return fetch(
      `${BASE_URL}/student/assignments?email=${encodeURIComponent(email)}&page=${page}&page_size=${pageSize}`,
      { headers: getAuthHeaders() },
    ).then((res) => parseResponse<{ items: AssignmentCard[]; total: number }>(res));
  },

  uploadAssignment(payload: FormData) {
    return fetch(`${BASE_URL}/student/upload`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: payload,
    }).then((res) => parseResponse<{ message: string }>(res));
  },

  getResults(email: string, page = 1, pageSize = 10) {
    return fetch(
      `${BASE_URL}/student/results?email=${encodeURIComponent(email)}&page=${page}&page_size=${pageSize}`,
      { headers: getAuthHeaders() },
    ).then((res) => parseResponse<{ items: StudentResultCard[]; total: number }>(res));
  },

  getViolations(email: string, page = 1, pageSize = 10) {
    return fetch(
      `${BASE_URL}/student/violations?email=${encodeURIComponent(email)}&page=${page}&page_size=${pageSize}`,
      { headers: getAuthHeaders() },
    ).then((res) => parseResponse<{ items: StudentViolation[]; total: number }>(res));
  },

  joinLiveTest(email: string, testCode: string) {
    return fetch(`${BASE_URL}/student/join-test`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email, test_id: testCode }),
    }).then((res) => parseResponse<JoinedLiveTest>(res));
  },

  submitLiveTest(email: string, testId: string, answers: StudentTestAnswer[], violations: number) {
    return fetch(`${BASE_URL}/student/submit-test`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        email,
        test_id: testId,
        answers,
        violations,
      }),
    }).then((res) => parseResponse<TestSubmitResult>(res));
  },

  getProfile(email: string) {
    return fetch(
      `${BASE_URL}/student/profile?email=${encodeURIComponent(email)}`,
      { headers: getAuthHeaders() },
    ).then((res) => parseResponse<StudentProfile>(res));
  },

  updateProfile(payload: {
    email: string;
    phone?: string;
    photo?: string;
    password?: string;
  }) {
    return fetch(`${BASE_URL}/student/profile`, {
      method: "PATCH",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    }).then((res) => parseResponse<StudentProfile>(res));
  },

  getSettings(email: string) {
    return fetch(
      `${BASE_URL}/student/settings?email=${encodeURIComponent(email)}`,
      { headers: getAuthHeaders() },
    ).then((res) => parseResponse<StudentSettings>(res));
  },

  updateSettings(payload: {
    email: string;
    darkMode?: boolean;
    notifications?: boolean;
    language?: string;
  }) {
    return fetch(`${BASE_URL}/student/settings`, {
      method: "PATCH",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    }).then((res) => parseResponse<StudentSettings>(res));
  },
};
