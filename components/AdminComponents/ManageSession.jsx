// components/AdminComponents/ManageSession.jsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import api from "@/lib/api";
import { exportToCsv, exportToXlsx } from "@/lib/exportUtils";
import toast, { Toaster } from "react-hot-toast";

export default function ManageSession() {
  // ------------------------------------------------------
  // Data Fetching
  // ------------------------------------------------------
  const {
    data: rows,
    mutate,
    error,
    isLoading,
  } = useSWR("sessions", api.listSessions);

  // ------------------------------------------------------
  // UI State
  // ------------------------------------------------------
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const thisYear = new Date().getFullYear();

  const [form, setForm] = useState({
    intakeSession: "",
    intakeYear: thisYear,
    isCurrent: false,
  });

  // ------------------------------------------------------
  // Actions & Handlers
  // ------------------------------------------------------
  const resetForm = () =>
    setForm({
      intakeSession: "",
      intakeYear: thisYear,
      isCurrent: false,
    });

  const openCreate = () => {
    resetForm();
    setSelected(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (s) => {
    setSelected(s);
    setIsEditing(true);
    setForm({
      intakeSession: s.intakeSession ?? "",
      intakeYear: s.intakeYear ?? thisYear,
      isCurrent: Boolean(s.isCurrent),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        intakeSession: form.intakeSession.trim(),
        intakeYear: Number(form.intakeYear),
        isCurrent: Boolean(form.isCurrent),
      };

      if (isEditing && selected) {
        await api.updateSession(selected.id, payload);
        toast.success("Academic Session updated successfully");
      } else {
        await api.createSession(payload);
        toast.success("Academic Session created successfully");
      }

      await mutate();
      resetForm();
      setShowModal(false);
    } catch (err) {
      alert(err?.response?.data || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      await api.deleteSession(id);
      await mutate();
    } catch (err) {
      alert("Delete failed: " + (err?.response?.data || err.message));
    }
  };

  const exportCsv = () =>
    exportToCsv(Array.isArray(rows) ? rows : [], "sessions.csv");

  const exportXlsx = () =>
    exportToXlsx(Array.isArray(rows) ? rows : [], "sessions.xlsx");

  // ------------------------------------------------------
  // Render
  // ------------------------------------------------------

  if (error)
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg border border-red-100">
        Error loading sessions. Please try refreshing.
      </div>
    );

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-700"></div>
      </div>
    );

  return (
    <div className="space-y-6">

      <Toaster position="top-center" />
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Academic Sessions
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage intake years and set the current active academic session.
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
            Add Session
          </button>

          <div className="h-8 w-px bg-gray-300 mx-1 hidden sm:block"></div>

          <div className="flex gap-2">
            <button
              onClick={exportCsv}
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
              onClick={exportXlsx}
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

      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Session Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Intake Year
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {Array.isArray(rows) && rows.length > 0 ? (
                rows.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                      #{s.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {s.intakeSession}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {s.intakeYear}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {s.isCurrent ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-green-600"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          Past
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleEdit(s)}
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
                          onClick={() => handleDelete(s.id)}
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                      <p>No academic sessions found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {isEditing
                          ? "Edit Session Details"
                          : "Create New Session"}
                      </h3>
                      <div className="mt-4 space-y-4">
                        {/* Intake Session */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Intake Session
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2025/2026"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 border px-3 py-2 sm:text-sm"
                            value={form.intakeSession}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                intakeSession: e.target.value,
                              })
                            }
                          />
                        </div>

                        {/* Intake Year */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Intake Year
                          </label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 2025"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 border px-3 py-2 sm:text-sm"
                            value={form.intakeYear}
                            onChange={(e) =>
                              setForm({ ...form, intakeYear: e.target.value })
                            }
                          />
                        </div>

                        {/* Current Toggle */}
                        <div className="relative flex items-start py-2">
                          <div className="flex items-center h-5">
                            <input
                              id="isCurrent"
                              type="checkbox"
                              className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-gray-300 rounded"
                              checked={form.isCurrent}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  isCurrent: e.target.checked,
                                })
                              }
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="isCurrent"
                              className="font-medium text-gray-700"
                            >
                              Set as Current Session
                            </label>
                            <p className="text-gray-500">
                              Enabling this will make this the active session
                              for the system.
                            </p>
                          </div>
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
                      "Update Session"
                    ) : (
                      "Create Session"
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
  );
}
