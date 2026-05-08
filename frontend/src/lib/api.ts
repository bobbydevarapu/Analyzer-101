const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (
    typeof window !== "undefined"
      ? window.location.origin
      : "http://127.0.0.1:8000"
  );

// ========================================
// HANDLE RESPONSE
// ========================================

const handleResponse = async (
  response: Response
) => {

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let data: any = null;

  try {

    if (
      contentType.includes(
        "application/json"
      )
    ) {

      data =
        await response.json();

    } else {

      const text =
        await response.text();

      try {

        data = text
          ? JSON.parse(text)
          : null;

      } catch {

        data =
          text || null;
      }
    }

  } catch {

    data = null;
  }

  if (!response.ok) {

    const message =

      data?.detail ||

      data?.error ||

      response.statusText ||

      "API Error";

    throw new Error(
      message
    );
  }

  return data;
};

// ========================================
// COMMON TOKEN
// ========================================

const getTeacherHeaders = () => {

  const token =
    localStorage.getItem(
      "teacherToken"
    );

  return {

    Authorization:
      token
        ? `Bearer ${token}`
        : "",
  };
};

// ========================================
// API
// ========================================

export const api = {

  // ========================================
  // AUTH
  // ========================================

  login: (
    data: any
  ) =>

    fetch(
      `${BASE_URL}/login`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body:
          new URLSearchParams(
            data
          ),
      }
    ).then(
      handleResponse
    ),

  signup: (
    data: any
  ) =>

    fetch(
      `${BASE_URL}/signup`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body:
          new URLSearchParams(
            data
          ),
      }
    ).then(
      handleResponse
    ),

  // ========================================
  // STUDENT
  // ========================================

  submit: (
    formData: FormData
  ) =>

    fetch(
      `${BASE_URL}/submit`,
      {
        method: "POST",
        body: formData,
      }
    ).then(
      handleResponse
    ),

  // ========================================
  // TEACHER ANALYSIS
  // ========================================

  teacherAnalyze: (
    assignment_id: string,
    teacher_email: string
  ) =>

    fetch(
      `${BASE_URL}/teacher/analyze`,
      {
        method: "POST",

        headers: {
          ...getTeacherHeaders(),

          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body:
          new URLSearchParams({

            assignment_id,

            teacher_email,
          }),
      }
    ).then(
      handleResponse
    ),

  // ========================================
  // REPORTS
  // ========================================

  teacherReports: (
    teacher_email: string
  ) =>

    fetch(

      `${BASE_URL}/teacher/reports?teacher_email=${encodeURIComponent(
        teacher_email
      )}`,

      {
        headers:
          getTeacherHeaders(),
      }

    ).then(
      handleResponse
    ),

  // ========================================
  // VIOLATIONS
  // ========================================

  teacherViolations: (
    teacher_email: string
  ) =>

    fetch(

      `${BASE_URL}/teacher/violations?teacher_email=${encodeURIComponent(
        teacher_email
      )}`,

      {
        headers:
          getTeacherHeaders(),
      }

    ).then(
      handleResponse
    ),

  // ========================================
  // SEND EMAILS
  // ========================================

  teacherSendEmails: async (

    assignmentId: string,

    teacherEmail: string

  ) => {

    const formData =
      new FormData();

    formData.append(
      "teacher_email",
      teacherEmail
    );

    const response =
      await fetch(

        `${BASE_URL}/teacher/send/${assignmentId}`,

        {
          method: "POST",

          headers:
            getTeacherHeaders(),

          body:
            formData,
        }
      );

    return handleResponse(
      response
    );
  },

  // ========================================
  // DELETE REPORT
  // ========================================

  deleteTeacherReport: (
    assignmentId: string
  ) =>

    fetch(

      `${BASE_URL}/teacher/report/${assignmentId}`,

      {
        method: "DELETE",

        headers:
          getTeacherHeaders(),
      }

    ).then(
      handleResponse
    ),

  // ========================================
  // BAN STUDENT
  // ========================================

  teacherBan: (

    student_email: string,

    teacher_email: string,

    count: number

  ) =>

    fetch(
      `${BASE_URL}/teacher/ban`,
      {
        method: "POST",

        headers: {

          ...getTeacherHeaders(),

          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body:
          new URLSearchParams({

            student_email,

            teacher_email,

            count:
              String(count),
          }),
      }
    ).then(
      handleResponse
    ),

  // ========================================
  // SECRET KEY
  // ========================================

  generateSecretKey: (

    teacher_email: string,

    expires_in_minutes = 15

  ) =>

    fetch(
      `${BASE_URL}/teacher/secret-key`,
      {
        method: "POST",

        headers: {

          ...getTeacherHeaders(),

          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body:
          new URLSearchParams({

            teacher_email,

            expires_in_minutes:
              String(
                expires_in_minutes
              ),
          }),
      }
    ).then(
      handleResponse
    ),

  // ========================================
  // DIAGNOSTIC
  // ========================================

  checkTeacherDiagnostic: () =>

    fetch(
      `${BASE_URL}/teacher/diagnostic`,
      {
        method: "GET",

        headers:
          getTeacherHeaders(),
      }
    ).then(
      handleResponse
    ),
};