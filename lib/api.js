// lib/api.js
"use client";
import axios from "axios";

/* ===============================================
 BASE CONFIG
 =============================================== */
const BASE = (
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"
).replace(/\/$/, "");
console.log("✅ API Base URL:", BASE);

/* ===============================================
 AUTH STORAGE HELPERS (roles as array)
 =============================================== */
let cachedUser = null;

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
};

export const getUser = () => {
  if (cachedUser) return cachedUser;
  if (typeof window === "undefined") return null;
  try {
    const userStr = localStorage.getItem("authUser");
    cachedUser = userStr ? JSON.parse(userStr) : null;
    return cachedUser;
  } catch {
    return null;
  }
};

export const saveAuth = (token, user) => {
  if (typeof window === "undefined") return;
  if (!token || !user) return;
  localStorage.setItem("authToken", token);
  // Ensure roles is an array on save
  const normalized = {
    ...user,
    roles: Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean),
  };
  localStorage.setItem("authUser", JSON.stringify(normalized));
  cachedUser = normalized;
};

export const logout = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  cachedUser = null;
  // Redirect to login page
  window.location.href = "/";
};

/* ===============================================
 AXIOS INSTANCE
 =============================================== */
export const axiosInstance = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach token for each request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: don't auto-logout on 401 to avoid redirection storms.
// Instead let UI handle auth failures.
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      console.warn(
        "⚠ 401 detected — returning error to caller (no automatic logout)."
      );
      // Optionally: we could emit an event or custom callback here
    }
    return Promise.reject(error);
  }
);

/* ===============================================
 ITEMS API OBJECT (role-aware)
 =============================================== */
const ITEMSApi = {
  // AUTH endpoints - backend returns AuthResponse { token, username, roles, identifier? }
  signup: async (data) =>
    (await axiosInstance.post("/api/auth/signup", data)).data,
  login: async (data) =>
    (await axiosInstance.post("/api/auth/login", data)).data,

  // HELPERS
  getCurrentUser: () => getUser(),
  getToken: () => getToken(),

  // Role checks use roles[] (Option B)
  isAdmin: () => (getUser()?.roles || []).includes("ADMIN"),
  isSuperAdmin: () => (getUser()?.roles || []).includes("SUPERADMIN"),
  isStaff: () => (getUser()?.roles || []).includes("STAFF"),

  // STAFF
  listStaff: async () => (await axiosInstance.get("/api/staff")).data || [],
  createStaff: async (data) =>
    (await axiosInstance.post("/api/staff/signup", data)).data,
  getStaffById: async (id) =>
    (await axiosInstance.get(`/api/staff/${id}`)).data,
  updateStaff: async (id, data) =>
    (await axiosInstance.put(`/api/staff/${id}`, data)).data,
  deleteStaff: async (id) =>
    (await axiosInstance.delete(`/api/staff/${id}`)).data,

  // ACADEMIC SESSIONS
  listSessions: async () =>
    (await axiosInstance.get("/api/sessions/all")).data || [],
  getSessionById: async (id) =>
    (await axiosInstance.get(`/api/sessions/${id}`)).data,
  createSession: async (data) =>
    (await axiosInstance.post("/api/sessions/create", data)).data,
  updateSession: async (id, data) =>
    (await axiosInstance.put(`/api/sessions/${id}`, data)).data,
  deleteSession: async (id) =>
    (await axiosInstance.delete(`/api/sessions/${id}`)).data,

  // FACULTIES
  listFaculties: async () =>
    (await axiosInstance.get("/api/faculties")).data || [],
  getFacultyById: async (id) =>
    (await axiosInstance.get(`/api/faculties/${id}`)).data,
  createFaculty: async (data) =>
    (await axiosInstance.post("/api/faculties/create", data)).data,
  updateFaculty: async (id, data) =>
    (await axiosInstance.put(`/api/faculties/${id}`, data)).data,
  deleteFaculty: async (id) =>
    (await axiosInstance.delete(`/api/faculties/${id}`)).data,

  // DEPARTMENTS
  listDepartments: async () =>
    (await axiosInstance.get("/api/departments/all")).data || [],
  getDepartmentById: async (id) =>
    (await axiosInstance.get(`/api/departments/${id}`)).data,
  createDepartment: async (data) =>
    (await axiosInstance.post("/api/departments/create", data)).data,
  updateDepartment: async (id, data) =>
    (await axiosInstance.put(`/api/departments/update/${id}`, data)).data,
  deleteDepartment: async (id) =>
    (await axiosInstance.delete(`/api/departments/delete/${id}`)).data,

  // COURSES
  listCourses: async () =>
    (await axiosInstance.get("/api/courses/all")).data || [],
  getCourseById: async (id) =>
    (await axiosInstance.get(`/api/courses/${id}`)).data,
  createCourse: async (data) =>
    (await axiosInstance.post("/api/courses/create", data)).data,
  updateCourse: async (id, data) =>
    (await axiosInstance.put(`/api/courses/update/${id}`, data)).data,
  deleteCourse: async (id) =>
    (await axiosInstance.delete(`/api/courses/delete/${id}`)).data,

  // PROGRAMS
  listPrograms: async () =>
    (await axiosInstance.get("/api/programs/all")).data || [],
  getProgramById: async (id) =>
    (await axiosInstance.get(`/api/programs/${id}`)).data,
  createProgram: async (data) =>
    (await axiosInstance.post("/api/programs/create", data)).data,
  updateProgram: async (id, data) =>
    (await axiosInstance.put(`/api/programs/update/${id}`, data)).data,
  deleteProgram: async (id) =>
    (await axiosInstance.delete(`/api/programs/delete/${id}`)).data,

  // FILE UPLOADS
  uploadCourses: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return (
      await axiosInstance.post("/api/upload/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data;
  },
  uploadFaculty: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return (
      await axiosInstance.post("/api/upload/faculty", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data;
  },

  uploadDepartments: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return (
      await axiosInstance.post("/api/upload/departments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data;
  },

  uploadPrograms: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return (
      await axiosInstance.post("/api/upload/programs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data;
  },



};

export default ITEMSApi;
