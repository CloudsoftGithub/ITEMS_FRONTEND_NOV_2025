"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import api from "@/lib/api";
import FileUploadButton from "@/components/FileUploadButton";
import { exportToCsv, exportToXlsx } from "@/lib/exportUtils";
import Pagination from "@/components/Pagination";
import toast, { Toaster } from "react-hot-toast";
import UploadReportModal from "@/components/UploadReportModal";

export default function ManageProgram() {
  // ------------------------------------------------------
  // Data Fetching
  // ------------------------------------------------------
  const {
    data: programs,
    mutate,
    error,
    isLoading,
  } = useSWR("programs", api.listPrograms);

  const { data: depts } = useSWR("depts", api.listDepartments);

  // ------------------------------------------------------
  // UI State
  // ------------------------------------------------------
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadReport, setUploadReport] = useState(null);

  // Filter & Pagination State
  const [filterDept, setFilterDept] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form State
  const [form, setForm] = useState({
    programName: "",
    durationYears: 3,
    departmentId: "",
  });

  // ------------------------------------------------------
  // Handlers
  // ------------------------------------------------------
  const resetForm = () =>
    setForm({ programName: "", durationYears: 3, departmentId: "" });

  const openCreate = () => {
    resetForm();
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (p) => {
    setSelected(p);
    setForm({
      programName: p.programName || "",
      durationYears: p.durationYears || 3,
      departmentId: p.department?.id || "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        programName: form.programName,
        durationYears: Number(form.durationYears),
        department: { id: Number(form.departmentId) },
      };

      if (isEditing && selected) {
        await api.updateProgram(selected.id, payload);
        toast.success("Program updated successfully");
      } else {
        await api.createProgram(payload);
        toast.success("Program created successfully");
      }

      await mutate();
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error(err?.response?.data || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this program?")) return;
    try {
      await api.deleteProgram(id);
      await mutate();
    } catch {
      alert("Delete failed");
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const result = await api.uploadPrograms(file); // ✅ capture backend response
      await mutate();

      setUploadReport(result); // ✅ pass to modal
      console.log("UPLOAD REPORT:", result);

      toast.success("Upload completed");
    } catch (err) {
      console.error(err);
      setUploadError("Upload failed — check console for details.");
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleExportCsv = () =>
    exportToCsv(Array.isArray(programs) ? programs : [], "programs.csv");

  const handleExportXlsx = () =>
    exportToXlsx(Array.isArray(programs) ? programs : [], "programs.xlsx");

  // ------------------------------------------------------
  // Filtering & Pagination Logic
  // ------------------------------------------------------
  const filteredPrograms = useMemo(() => {
    if (!programs) return [];
    return filterDept
      ? programs.filter((p) => p.department?.id === Number(filterDept))
      : programs;
  }, [programs, filterDept]);

  const paginatedPrograms = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPrograms.slice(start, start + pageSize);
  }, [filteredPrograms, page, pageSize]);

  // ------------------------------------------------------
  // Render
  // ------------------------------------------------------
  if (error)
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg border border-red-100">
        Error loading programs. Please try refreshing.
      </div>
    );

  if (isLoading || !programs || !depts)
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
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Programs
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Define academic programs, duration, and department affiliations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCreate}
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
              Add Program
            </button>

            <div className="h-8 w-px bg-gray-300 mx-1 hidden sm:block"></div>

            <FileUploadButton
              onUpload={handleFileUpload}
              uploadUrl="/api/programs/upload" // Optional if using internal handler
              label={uploading ? "Uploading..." : "Import CSV"}
            />

            <div className="flex gap-2">
              <button
                onClick={handleExportCsv}
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
                onClick={handleExportXlsx}
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

        {/* --- FILTER BAR --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-sky-50 text-sky-700 rounded-lg">
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              ></path>
            </svg>
          </div>
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Filter by Department
            </label>
            <select
              value={filterDept}
              onChange={(e) => {
                setPage(1);
                setFilterDept(e.target.value);
              }}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md bg-gray-50 border"
            >
              <option value="">All Departments</option>
              {(Array.isArray(depts) ? depts : []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.deptName}
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
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Program Name
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Duration
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
                {paginatedPrograms.length ? (
                  paginatedPrograms.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                        #{r.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {r.programName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {r.durationYears} Years
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {r.department?.deptName || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleEdit(r)}
                            className="text-sky-600 hover:text-sky-900 hover:bg-sky-50 p-1 rounded transition-colors"
                            title="Edit"
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
                            onClick={() => handleDelete(r.id)}
                            className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                            title="Delete"
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
                      colSpan="5"
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
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          ></path>
                        </svg>
                        <p>No programs found.</p>
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
              page={page}
              pageSize={pageSize}
              total={filteredPrograms.length}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setPage(1);
                setPageSize(s);
              }}
            />
          </div>
        </div>

        {/* --- MODAL --- */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
                onClick={() => setShowModal(false)}
                aria-hidden="true"
              ></div>

              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">
                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-sky-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg
                          className="h-6 w-6 text-sky-600"
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
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          {isEditing ? "Edit Program" : "Create New Program"}
                        </h3>
                        <div className="mt-4 space-y-4">
                          {/* Program Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Program Name
                            </label>
                            <input
                              required
                              placeholder="e.g. B.Sc. Computer Science"
                              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 border px-3 py-2 sm:text-sm"
                              value={form.programName}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  programName: e.target.value,
                                })
                              }
                            />
                          </div>

                          {/* Duration */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Duration (Years)
                            </label>
                            <input
                              required
                              type="number"
                              placeholder="e.g. 4"
                              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 border px-3 py-2 sm:text-sm"
                              value={form.durationYears}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  durationYears: e.target.value,
                                })
                              }
                            />
                          </div>

                          {/* Department */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Department
                            </label>
                            <select
                              required
                              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 border px-3 py-2 bg-white sm:text-sm"
                              value={form.departmentId}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  departmentId: e.target.value,
                                })
                              }
                            >
                              <option value="">Select Department</option>
                              {(Array.isArray(depts) ? depts : []).map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.deptName}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-sky-700 text-base font-medium text-white hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm ${
                        submitting ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                    >
                      {submitting ? (
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
                        "Update Program"
                      ) : (
                        "Create Program"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
