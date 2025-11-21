"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import api from "@/lib/api";
import FileUploadButton from "@/components/FileUploadButton";
import { exportToCsv, exportToXlsx } from "@/lib/exportUtils";
import Pagination from "@/components/Pagination";

export default function ManageDepartment() {
  const {
    data: rows,
    mutate,
    error,
    isLoading,
  } = useSWR("departments", api.listDepartments);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [filterCode, setFilterCode] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [form, setForm] = useState({ deptName: "", deptCode: "" });
  const resetForm = () => setForm({ deptName: "", deptCode: "" });

  const openCreate = () => {
    setIsEditing(false);
    setSelected(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (d) => {
    setSelected(d);
    setIsEditing(true);
    setForm({ deptName: d.deptName || "", deptCode: d.deptCode || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        deptName: form.deptName.trim(),
        deptCode: form.deptCode.trim().toUpperCase(),
      };
      if (isEditing && selected)
        await api.updateDepartment(selected.id, payload);
      else await api.createDepartment(payload);
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
    if (!confirm("Delete department?")) return;
    try {
      await api.deleteDepartment(id);
      await mutate();
    } catch (err) {
      alert("Delete failed: " + err?.message);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await api.uploadDepartments(file);
      await mutate();
      alert("Upload successful");
    } catch (err) {
      console.error(err);
      setUploadError("Upload failed — check console for details.");
    } finally {
      setUploading(false);
    }
  };

  // FILTER + PAGINATION
  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return filterCode
      ? rows.filter(
          (r) => r.deptCode.toLowerCase() === filterCode.toLowerCase()
        )
      : rows;
  }, [rows, filterCode]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const uniqueDeptCodes = useMemo(() => {
    if (!rows) return [];
    return Array.from(new Set(rows.map((r) => r.deptCode))).sort();
  }, [rows]);

  return (
    <div className="p-6">
      {" "}
      <div className="flex justify-between items-center mb-4">
        {" "}
        <h2 className="text-2xl font-semibold">Departments</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="bg-sky-600 text-white px-4 py-2 rounded"
          >
            + Add Department
          </button>

          <FileUploadButton
            label={uploading ? "Uploading..." : "Upload CSV/XLSX"}
            onUpload={handleFileUpload}
            disabled={uploading}
          />

          <button
            onClick={() => exportToCsv(rows ?? [], "departments.csv")}
            className="px-3 py-2 border rounded text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={() => exportToXlsx(rows ?? [], "departments.xlsx")}
            className="px-3 py-2 border rounded text-sm"
          >
            Export XLSX
          </button>
        </div>
      </div>
      {/* FILTER */}
      <div className="mb-4">
        <label className="mr-2">Filter by Code:</label>
        <select
          value={filterCode}
          onChange={(e) => {
            setPage(1);
            setFilterCode(e.target.value);
          }}
          className="border rounded px-2 py-1"
        >
          <option value="">All</option>
          {uniqueDeptCodes.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
      {/* TABLE */}
      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-red-500">Failed to load departments.</p>
        ) : paginatedRows.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-center">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Department Name</th>
                <th className="p-2">Code</th>
                <th className="p-2">Created Date</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((d) => (
                <tr
                  key={d.id}
                  className="text-center border-b hover:bg-gray-50"
                >
                  <td className="p-3">{d.id}</td>
                  <td className="p-3 font-medium">{d.deptName}</td>
                  <td className="p-3">{d.deptCode}</td>
                  <td className="p-3">
                    {d.createdDate
                      ? new Date(d.createdDate).toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => handleEdit(d)}
                        className="text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
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
          <p className="text-gray-500">No departments found.</p>
        )}
      </div>
      {/* PAGINATION */}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={filteredRows.length}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => {
          setPage(1);
          setPageSize(s);
        }}
      />
      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded shadow p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isEditing ? "Edit Department" : "Create Department"}
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
                <label className="text-sm mb-1 block">Department Name</label>
                <input
                  required
                  value={form.deptName}
                  onChange={(e) =>
                    setForm({ ...form, deptName: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm mb-1 block">Department Code</label>
                <input
                  required
                  value={form.deptCode}
                  onChange={(e) =>
                    setForm({ ...form, deptCode: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 uppercase"
                />
              </div>

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
                  ? "Update Department"
                  : "Create Department"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
