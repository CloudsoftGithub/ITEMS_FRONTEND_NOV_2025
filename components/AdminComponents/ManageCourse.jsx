"use client";

import { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import api from "@/lib/api";
import FileUploadButton from "@/components/FileUploadButton";
import Pagination from "@/components/Pagination";
import { exportToCsv, exportToXlsx } from "@/lib/exportUtils";
import toast, { Toaster } from "react-hot-toast";
import UploadReportModal from "@/components/UploadReportModal";

export default function ManageCourse() {
  // ------------------------------------------------------
  // Fetchers
  // ------------------------------------------------------
  const {
    data: courses,
    error,
    mutate,
  } = useSWR("courses", () => api.listCourses());
  const { data: departments } = useSWR("departments", () =>
    api.listDepartments()
  );

  // ------------------------------------------------------
  // UI State
  // ------------------------------------------------------
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [categoryEdited, setCategoryEdited] = useState(false);
  const [uploadReport, setUploadReport] = useState(null);

  const [filters, setFilters] = useState({
    q: "",
    deptId: "",
    courseCode: "",
    level: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form state
  const [form, setForm] = useState({
    courseCode: "",
    courseTitle: "",
    creditUnit: "",
    status: "CORE",
    semester: "FIRST",
    level: "",
    courseCategory: "",
    departmentId: "",
    prerequisiteIds: [],
  });
  const [searchTerm, setSearchTerm] = useState("");

  // 2️⃣ Now filteredCourses — AFTER form exists
  const filteredCourses = (courses || [])
    .filter((c) => Number(c.department?.id) === Number(form.departmentId))
    .filter(
      (c) =>
        c.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Reset page when filters change
  useEffect(() => setPage(1), [filters]);

  // ------------------------------------------------------
  // Memoized Dropdown Data
  // ------------------------------------------------------
  const courseCodes = useMemo(() => {
    const set = new Set();
    (Array.isArray(courses) ? courses : []).forEach((c) => {
      if (c?.courseCode) set.add(c.courseCode);
    });
    return Array.from(set).sort();
  }, [courses]);

  const levels = useMemo(() => {
    const set = new Set();
    (Array.isArray(courses) ? courses : []).forEach((c) => {
      if (c?.level) set.add(c.level);
    });

    const preferred = ["NCE I", "NCE II", "NCE III"];
    const rest = [...set].filter((x) => !preferred.includes(x));

    return preferred.filter((x) => set.has(x)).concat(rest.sort());
  }, [courses]);

  const depts = Array.isArray(departments) ? departments : [];

  // ------------------------------------------------------
  // Filter Logic — hook-safe
  // ------------------------------------------------------
  const filtered = useMemo(() => {
    if (!Array.isArray(courses)) return [];
    let list = courses;

    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter(
        (c) =>
          c.courseTitle?.toLowerCase().includes(q) ||
          c.courseCode?.toLowerCase().includes(q)
      );
    }

    if (filters.deptId) {
      list = list.filter(
        (c) => String(c.department?.id) === String(filters.deptId)
      );
    }

    if (filters.courseCode) {
      list = list.filter((c) => c.courseCode === filters.courseCode);
    }

    if (filters.level) {
      list = list.filter((c) => c.level === filters.level);
    }

    return list;
  }, [courses, filters]);

  // ------------------------------------------------------
  // Pagination Logic
  // ------------------------------------------------------
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [safePage]);

  // ------------------------------------------------------
  // Modal Helpers
  // ------------------------------------------------------
  const resetForm = () =>
    setForm({
      courseCode: "",
      courseTitle: "",
      creditUnit: "",
      status: "CORE",
      semester: "FIRST",
      level: "",
      courseCategory: "",
      departmentId: "",
      prerequisiteIds: [],
    });

  const openModal = () => {
    setCategoryEdited(false);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsEditing(false);
    setSelectedCourse(null);
    resetForm();
  };

  // ------------------------------------------------------
  // Validations For Course Registration
  // ------------------------------------------------------
  function validateCourseCode(code, level, semester) {
    if (!code) return "Course code is required";

    const pattern = /^[A-Za-z]{3,4}\s\d{3}$/;
    if (!pattern.test(code)) {
      return "Course code must look like ABC 111 (3–4 letters + space + 3 digits)";
    }

    const number = parseInt(code.split(" ")[1]);

    const map = {
      "NCE I": { FIRST: 110, SECOND: 120 },
      "NCE II": { FIRST: 210, SECOND: 220 },
      "NCE III": { FIRST: 310, SECOND: 320 },
    };

    const base = map[level]?.[semester];
    if (!base) return null; // unknown level/semester → skip validation

    // Example: FIRST semester NCE I must be 111–119
    if (number < base + 1 || number > base + 9) {
      return `Invalid code: For ${level} ${semester} semester, code must be between ${
        base + 1
      } and ${base + 9}`;
    }

    return null; // OK
  }

  // ------------------------------------------------------
  // CRUD Operations
  // ------------------------------------------------------
  const handleSubmit = async () => {
    const errorMessage = validateCourseCode(
      form.courseCode,
      form.level,
      form.semester
    );
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }

    if (!form.courseCode || !form.courseTitle || !form.departmentId) {
      toast.error("Course Code, Title & Department are required");
      return;
    }

    // 🔍  Check for duplicate course code
    const existing = (courses || []).find(
      (c) =>
        c.courseCode.trim().toLowerCase() ===
          form.courseCode.trim().toLowerCase() &&
        (!isEditing || c.id !== selectedCourse?.id)
    );

    if (existing) {
      toast.error("A course with this code already exists.");
      return;
    }

    setLoading(true);

    const payload = {
      courseCode: form.courseCode,
      courseTitle: form.courseTitle,
      creditUnit: Number(form.creditUnit),
      status: form.status,
      semester: form.semester,
      level: form.level,
      courseCategory: form.courseCategory,
      departmentId: Number(form.departmentId), // ✅ Correct
      prerequisiteIds: form.prerequisiteIds, // or whatever backend expects
    };

    try {
      if (isEditing && selectedCourse) {
        await api.updateCourse(selectedCourse.id, payload);
        toast.success("Course updated successfully");
      } else {
        await api.createCourse(payload);
        toast.success("Course created successfully");
      }

      await mutate();
      closeModal();
    } catch (err) {
      alert(err?.response?.data || "Failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setIsEditing(true);
    setSelectedCourse(course);

    setForm({
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      creditUnit: course.creditUnit,
      status: course.status,
      semester: course.semester,
      level: course.level,
      courseCategory: course.courseCategory,
      departmentId: course.department?.id,
      prerequisiteIds: (course.prerequisites || []).map((p) => p.id),
    });

    openModal();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this course?")) return;

    try {
      await api.deleteCourse(id);
      await mutate();
    } catch (err) {
      alert("Failed to delete");
      console.error(err);
    }
  };

  // ------------------------------------------------------
  // File Upload
  // ------------------------------------------------------
  const handleFileUpload = async (file) => {
    setUploading(true);
    setUploadError(null);

    try {
      const result = await api.uploadCourses(file); // <--- FIXED
      await mutate();

      setUploadReport(result); // <-- show modal
      console.log("UPLOAD REPORT:", result);

      alert("Upload successful");
    } catch (err) {
      setUploadError(err?.response?.data || "Upload failed");
      alert("Upload error");
    } finally {
      setUploading(false);
    }
  };

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------

  if (error)
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg border border-red-100">
        Error loading courses. Please try refreshing.
      </div>
    );

  if (!courses)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-700"></div>
      </div>
    );

  return (
    <>
      {/* page content */}

      {uploadReport && (
        <UploadReportModal
          report={uploadReport}
          onClose={() => setUploadReport(null)}
        />
      )}

      <div className="space-y-6">
        <Toaster position="top-center" />

        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Courses</h2>
            <p className="text-sm text-gray-500 mt-1">
              Create and modify curriculum, assign units, and set prerequisites.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors shadow-sm text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
              Add Course
            </button>

            <div className="h-8 w-px bg-gray-300 mx-1 hidden sm:block"></div>

            <FileUploadButton
              label={uploading ? "Uploading…" : "Import CSV"}
              onUpload={handleFileUpload}
              disabled={uploading}
            />

            <div className="flex gap-2">
              <button
                onClick={() => exportToCsv(filtered, "courses.csv")}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                title="Export CSV"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                CSV
              </button>
              <button
                onClick={() => exportToXlsx(filtered, "courses.xlsx")}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                title="Export Excel"
              >
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                XLSX
              </button>
            </div>
          </div>
        </div>

        {/* --- FILTERS (Integrated Card) --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search Title or Code..."
                className="pl-10 block w-full border-gray-300 rounded-lg border shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm py-2"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </div>

            {/* Department Filter */}
            <select
              className="block w-full border-gray-300 rounded-lg border shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm py-2 bg-gray-50"
              value={filters.deptId}
              onChange={(e) =>
                setFilters({ ...filters, deptId: e.target.value })
              }
            >
              <option value="">All Departments</option>
              {depts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.deptName}
                </option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              className="block w-full border-gray-300 rounded-lg border shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm py-2 bg-gray-50"
              value={filters.level}
              onChange={(e) =>
                setFilters({ ...filters, level: e.target.value })
              }
            >
              <option value="">All Levels</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            {/* Code Filter */}
            <select
              className="block w-full border-gray-300 rounded-lg border shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm py-2 bg-gray-50"
              value={filters.courseCode}
              onChange={(e) =>
                setFilters({ ...filters, courseCode: e.target.value })
              }
            >
              <option value="">All Course Codes</option>
              {courseCodes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- TABLE SECTION --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {visible.length > 0 ? (
                  visible.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {c.courseCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.courseTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {c.creditUnit}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            c.status === "CORE"
                              ? "bg-sky-100 text-sky-800 border border-sky-200"
                              : "bg-orange-100 text-orange-800 border border-orange-200"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {c.level}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            c.semester === "FIRST"
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {c.semester}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {c.department?.deptName || "—"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleEdit(c)}
                            className="text-sky-600 hover:text-sky-900 hover:bg-sky-50 p-1 rounded transition-colors"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              ></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-300 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          ></path>
                        </svg>
                        <p>No courses found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* --- MODAL --- */}
        {isOpen && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
                onClick={closeModal}
                aria-hidden="true"
              ></div>

              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-100">
                    <h3 className="text-lg leading-6 font-bold text-gray-900">
                      {isEditing ? "Edit Course Details" : "Add New Course"}
                    </h3>
                    <button
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <span className="sr-only">Close</span>
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Course Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CSC 101"
                        value={form.courseCode}
                        onChange={(e) =>
                          setForm({ ...form, courseCode: e.target.value })
                        }
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm border px-3 py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Course Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Intro to Programming"
                        value={form.courseTitle}
                        onChange={(e) =>
                          setForm({ ...form, courseTitle: e.target.value })
                        }
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm border px-3 py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Credit Unit
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 3"
                        value={form.creditUnit}
                        onChange={(e) =>
                          setForm({ ...form, creditUnit: e.target.value })
                        }
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm border px-3 py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Status
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value })
                        }
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm border px-3 py-2 bg-white"
                      >
                        <option value="CORE">CORE</option>
                        <option value="ELECTIVE">ELECTIVE</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Semester
                      </label>
                      <select
                        value={form.semester}
                        onChange={(e) =>
                          setForm({ ...form, semester: e.target.value })
                        }
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm border px-3 py-2 bg-white"
                      >
                        <option value="FIRST">FIRST</option>
                        <option value="SECOND">SECOND</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Level
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. NCE I"
                        value={form.level}
                        onChange={(e) =>
                          setForm({ ...form, level: e.target.value })
                        }
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm border px-3 py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Category
                      </label>
                      <input
                        type="text"
                        placeholder="Course Category"
                        value={form.courseCategory}
                        onChange={(e) => {
                          setCategoryEdited(true); // user typed manually
                          setForm({ ...form, courseCategory: e.target.value });
                        }}
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm border px-3 py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Department
                      </label>
                      <select
                        value={form.departmentId}
                        onChange={(e) => {
                          const deptId = e.target.value;
                          const dept = depts.find(
                            (d) => d.id === Number(deptId)
                          );

                          setForm({
                            ...form,
                            departmentId: deptId,

                            // Autofill IF user has NOT manually typed category
                            courseCategory: categoryEdited
                              ? form.courseCategory
                              : dept?.deptName || "",
                          });
                        }}
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm border px-3 py-2 bg-white"
                      >
                        <option value="">Select Department</option>
                        {depts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.deptName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Prerequisites - Improved UI */}
                    <div className="md:col-span-2 space-y-2 mt-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Prerequisites
                      </label>

                      {/* Search Input */}
                      <input
                        type="text"
                        placeholder="Search course..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm border px-3 py-2 bg-white"
                      />

                      {/* Filtered & Scrollable List */}
                      <div className="border border-gray-300 rounded-lg h-40 overflow-y-auto p-2 bg-gray-50">
                        {filteredCourses.length === 0 ? (
                          <p className="text-gray-400 text-sm italic text-center py-3">
                            No courses found
                          </p>
                        ) : (
                          filteredCourses.map((c) => (
                            <label
                              key={c.id}
                              className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={form.prerequisiteIds.includes(c.id)}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...form.prerequisiteIds, c.id]
                                    : form.prerequisiteIds.filter(
                                        (id) => id !== c.id
                                      );

                                  setForm({
                                    ...form,
                                    prerequisiteIds: updated,
                                  });
                                }}
                              />
                              <span className="text-sm">
                                <span className="font-semibold">
                                  {c.courseCode}
                                </span>{" "}
                                — {c.courseTitle}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-sky-700 text-base font-medium text-white hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm ${
                      loading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : isEditing ? (
                      "Update Course"
                    ) : (
                      "Create Course"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
