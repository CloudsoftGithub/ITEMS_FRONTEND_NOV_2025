"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import api from "@/lib/api";
import FileUploadButton from "@/components/FileUploadButton";
import { exportToCsv, exportToXlsx } from "@/lib/exportUtils";
import Pagination from "@/components/Pagination";

export default function ManageProgram() {
  const {
    data: programs,
    mutate,
    error,
    isLoading,
  } = useSWR("programs", api.listPrograms);
  const { data: depts } = useSWR("depts", api.listDepartments);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    programName: "",
    durationYears: 3,
    departmentId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterDept, setFilterDept] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      if (isEditing && selected) await api.updateProgram(selected.id, payload);
      else await api.createProgram(payload);
      await mutate();
      setShowModal(false);
      resetForm();
    } catch (err) {
      alert(err?.response?.data || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete program?")) return;
    try {
      await api.deleteProgram(id);
      await mutate();
    } catch {
      alert("Delete failed");
    }
  };

  const handleExportCsv = () =>
    exportToCsv(Array.isArray(programs) ? programs : [], "programs.csv");

  const handleExportXlsx = () =>
    exportToXlsx(Array.isArray(programs) ? programs : [], "programs.xlsx");

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

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await api.uploadPrograms(file);
      await mutate();
      alert("Upload successful");
    } catch (err) {
      console.error(err);
      setUploadError("Upload failed — check console for details.");
    } finally {
      setUploading(false);
    }
  };

  if (error)
    return <div className="p-4 text-red-500">Error loading programs</div>;
  if (isLoading || !programs || !depts)
    return <div className="p-4 text-gray-500">Loading...</div>;

  return (
    <div className="p-6">
      {/* HEADER */}{" "}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        {" "}
        <h2 className="text-2xl font-semibold">Programs</h2>{" "}
        <div className="flex items-center gap-2 flex-wrap">
          {" "}
          <button
            onClick={openCreate}
            className="bg-sky-600 text-white px-4 py-2 rounded"
          >
            + Add Program{" "}
          </button>
          <FileUploadButton
            onUpload={handleFileUpload} // ✅ Fixed prop name
            uploadUrl="/api/programs/upload"
            label="Upload Programs"
          />{" "}
          <div className="inline-flex gap-2">
            {" "}
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 border rounded text-sm"
            >
              Export CSV{" "}
            </button>{" "}
            <button
              onClick={handleExportXlsx}
              className="px-3 py-2 border rounded text-sm"
            >
              Export XLSX{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>
      {/* FILTER */}
      <div className="flex justify-b mb-2">
        <select
          value={filterDept}
          onChange={(e) => {
            setPage(1);
            setFilterDept(e.target.value);
          }}
          className="border rounded px-2 py-1"
        >
          <option value="">All Departments</option>
          {(Array.isArray(depts) ? depts : []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.deptName}
            </option>
          ))}
        </select>
      </div>
      {/* TABLE */}
      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        {paginatedPrograms.length ? (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-center">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Duration (yrs)</th>
                <th className="p-2">Department</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPrograms.map((r) => (
                <tr
                  key={r.id}
                  className="border-b hover:bg-gray-50 text-center"
                >
                  <td className="p-3">{r.id}</td>
                  <td className="p-3 font-medium">{r.programName}</td>
                  <td className="p-3">{r.durationYears}</td>
                  <td className="p-3">{r.department?.deptName || "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => handleEdit(r)}
                        className="text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No programs found.</p>
        )}
      </div>
      {/* PAGINATION */}
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
      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded shadow p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isEditing ? "Edit Program" : "Create Program"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Program Name</label>
                <input
                  required
                  value={form.programName}
                  onChange={(e) =>
                    setForm({ ...form, programName: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Duration (years)</label>
                <input
                  required
                  type="number"
                  value={form.durationYears}
                  onChange={(e) =>
                    setForm({ ...form, durationYears: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Department</label>
                <select
                  required
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm({ ...form, departmentId: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Choose department</option>
                  {(Array.isArray(depts) ? depts : []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.deptName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-2 rounded text-white ${
                    submitting ? "bg-gray-400" : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  {submitting
                    ? "Saving..."
                    : isEditing
                    ? "Update Program"
                    : "Create Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
