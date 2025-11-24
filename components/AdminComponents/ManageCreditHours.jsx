"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import api from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";
import Pagination from "@/components/Pagination";
import UploadReportModal from "@/components/UploadReportModal";

export default function ManageCreditHours() {
  const {
    data: creditHours,
    mutate,
    error,
    isLoading,
  } = useSWR("credit_hours", api.listCreditHours);

  const [isOpen, setIsOpen] = useState(false);
  const [uploadReport, setUploadReport] = useState(null);

  // FILTER
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    if (!creditHours) return [];
    return creditHours;
  }, [creditHours]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  if (error)
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg border border-red-100">
        Error loading credit hours.
      </div>
    );

  if (isLoading || !creditHours)
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-700"></div>
      </div>
    );

  return (
    <>
      {uploadReport && (
        <UploadReportModal
          report={uploadReport}
          onClose={() => setUploadReport(null)}
        />
      )}

      <Toaster position="top-center" />

      <EmbeddedAddCreditHoursModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSaved={() => mutate()}
      />

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Credit Hours
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure minimum and maximum credit units per academic session.
            </p>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition shadow-sm text-sm font-medium"
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
            Add Credit Rule
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Session
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Semester
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Min Hours
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Max Hours
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      #{r.id}
                    </td>
                    <td className="px-6 py-4 text-sm">{r.sessionName}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded">
                        {r.semester}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{r.minHours}</td>
                    <td className="px-6 py-4 text-sm">{r.maxHours}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(r.createdDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}

                {!paginated.length && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No credit rules found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------
   ✨ Embedded Modal Below (Same File)
--------------------------------------------------------- */

function EmbeddedAddCreditHoursModal({ open, onClose, onSaved }) {
  const [sessionId, setSessionId] = useState("");
  const [semester, setSemester] = useState("FIRST");
  const [minHours, setMinHours] = useState("");
  const [maxHours, setMaxHours] = useState("");
  const [loading, setLoading] = useState(false);

  // 👉 Fetch academic sessions dynamically
  const {
    data: sessions,
    error: sessionError,
    isLoading: sessionsLoading,
  } = useSWR("academic_sessions", api.listSessions);

  if (!open) return null;

  const handleSave = async () => {
    if (!sessionId || !semester || !minHours || !maxHours) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);

    try {
      await api.createCreditHours({
        sessionId,
        semester,
        minHours,
        maxHours,
      });

      toast.success("Credit hours rule saved");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Add Credit Hours Rule
          </h3>

          <div className="space-y-4">

            {/* SESSION DROPDOWN (FETCHED FROM API) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Academic Session
              </label>

              {sessionsLoading ? (
                <p className="text-sm text-gray-500">Loading sessions...</p>
              ) : sessionError ? (
                <p className="text-sm text-red-500">Failed to load sessions</p>
              ) : (
                <select
                  className="w-full border px-3 py-2 rounded-lg"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                >
                  <option value="">Select academic session</option>

                  {sessions?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.intakeSession || s.sessionName || s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* SEMESTER */}
            <div>
              <label className="block text-sm font-medium mb-1">Semester</label>
              <select
                className="w-full border px-3 py-2 rounded-lg"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="FIRST">FIRST</option>
                <option value="SECOND">SECOND</option>
              </select>
            </div>

            {/* Min Hours */}
            <div>
              <label className="block text-sm font-medium mb-1">Min Hours</label>
              <input
                type="number"
                className="w-full border px-3 py-2 rounded-lg"
                value={minHours}
                onChange={(e) => setMinHours(e.target.value)}
              />
            </div>

            {/* Max Hours */}
            <div>
              <label className="block text-sm font-medium mb-1">Max Hours</label>
              <input
                type="number"
                className="w-full border px-3 py-2 rounded-lg"
                value={maxHours}
                onChange={(e) => setMaxHours(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

