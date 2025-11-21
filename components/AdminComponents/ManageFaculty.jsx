"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import api from "@/lib/api";
import FileUploadButton from "@/components/FileUploadButton";
import { exportToCsv, exportToXlsx } from "@/lib/exportUtils";
import Pagination from "@/components/Pagination";

export default function ManageFaculty() {
  const {
    data: faculties,
    mutate,
    error,
    isLoading,
  } = useSWR("faculties", api.listFaculties);

  // Modal & Form States
  const [isOpen, setIsOpen] = useState(false);
  const [facultyName, setFacultyName] = useState("");
  const [facultyCode, setFacultyCode] = useState("");
  const [institution, setInstitution] = useState("");
  const [loading, setLoading] = useState(false);

  // Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Filter & Pagination
  const [filterCode, setFilterCode] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    setFacultyName("");
    setFacultyCode("");
    setInstitution("");
  };

  const handleAddFaculty = async () => {
    if (!facultyName || !facultyCode || !institution) {
      alert("All fields are required");
      return;
    }
    setLoading(true);
    try {
      await api.createFaculty({ facultyName, facultyCode, institution });
      await mutate();
      closeModal();
    } catch (err) {
      alert(err?.response?.data || "Failed to add faculty");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await api.uploadFaculty(file);
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
  const filteredFaculties = useMemo(() => {
    if (!faculties) return [];
    return filterCode
      ? faculties.filter(
          (f) => f.facultyCode.toLowerCase() === filterCode.toLowerCase()
        )
      : faculties;
  }, [faculties, filterCode]);

  const paginatedFaculties = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFaculties.slice(start, start + pageSize);
  }, [filteredFaculties, page, pageSize]);

  const uniqueFacultyCodes = useMemo(() => {
    if (!faculties) return [];
    return Array.from(new Set(faculties.map((f) => f.facultyCode))).sort();
  }, [faculties]);

  if (error)
    return <div className="p-4 text-red-500">Error loading faculties</div>;
  if (isLoading || !faculties)
    return <div className="p-4 text-gray-500">Loading...</div>;

  return (
    <div className="p-4">
      {/* HEADER */}{" "}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        {" "}
        <h2 className="text-xl font-bold">Faculties</h2>{" "}
        <div className="flex items-center gap-2 flex-wrap">
          {" "}
          <button
            onClick={openModal}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Add Faculty{" "}
          </button>
          <FileUploadButton
            label={uploading ? "Uploading..." : "Upload CSV/XLSX"}
            onUpload={handleFileUpload}
            disabled={uploading}
          />
          <button
            onClick={() => exportToCsv(faculties ?? [], "faculties.csv")}
            className="px-3 py-2 border rounded text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={() => exportToXlsx(faculties ?? [], "faculties.xlsx")}
            className="px-3 py-2 border rounded text-sm"
          >
            Export XLSX
          </button>
        </div>
      </div>
      {/* FILTER */}
      <div className="mb-4">
        <label className="mr-2">Filter by Faculty Code:</label>
        <select
          value={filterCode}
          onChange={(e) => {
            setPage(1);
            setFilterCode(e.target.value);
          }}
          className="border rounded px-2 py-1"
        >
          <option value="">All</option>
          {uniqueFacultyCodes.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-300">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Code</th>
              <th className="px-4 py-2 border">Institution</th>
              <th className="px-4 py-2 border">Created</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFaculties.length ? (
              paginatedFaculties.map((f) => (
                <tr key={f.id} className="text-center">
                  <td className="px-4 py-2 border">{f.id}</td>
                  <td className="px-4 py-2 border">{f.facultyName}</td>
                  <td className="px-4 py-2 border">{f.facultyCode}</td>
                  <td className="px-4 py-2 border">{f.institution}</td>
                  <td className="px-4 py-2 border">
                    {f.createdDate
                      ? new Date(f.createdDate).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No faculties found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* PAGINATION */}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={filteredFaculties.length}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => {
          setPage(1);
          setPageSize(s);
        }}
      />
      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-30"
            onClick={closeModal}
          />
          <div className="bg-white p-6 rounded shadow-lg z-10 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Faculty</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Faculty Name"
                className="w-full border px-3 py-2 rounded"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Faculty Code"
                className="w-full border px-3 py-2 rounded"
                value={facultyCode}
                onChange={(e) => setFacultyCode(e.target.value)}
              />
              <input
                type="text"
                placeholder="Institution"
                className="w-full border px-3 py-2 rounded"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFaculty}
                disabled={loading}
                className={`px-4 py-2 bg-blue-600 text-white rounded${
                  loading ? " opacity-60" : ""
                }`}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
