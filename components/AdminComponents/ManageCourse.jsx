'use client';

import { useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import FileUploadButton from '@/components/FileUploadButton';
import CourseFilters from '@/components/CourseFilters';
import Pagination from '@/components/Pagination';
import { exportToCsv, exportToXlsx } from '@/lib/exportUtils';

export default function ManageCourse() {
  // ------------------------------------------------------
  // Fetchers
  // ------------------------------------------------------
  const { data: courses, error, mutate } = useSWR('courses', () =>
    api.listCourses()
  );
  const { data: departments } = useSWR('departments', () =>
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

  const [filters, setFilters] = useState({
    q: '',
    deptId: '',
    courseCode: '',
    level: '',
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form state
  const [form, setForm] = useState({
    courseCode: '',
    courseTitle: '',
    creditUnit: '',
    status: 'CORE',
    semester: 'FIRST',
    level: '',
    courseCategory: '',
    departmentId: '',
    prerequisiteIds: [],
  });

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

    const preferred = ['NCE I', 'NCE II', 'NCE III'];
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
  }, [safePage]); // hook-safe

  // ------------------------------------------------------
  // Modal Helpers
  // ------------------------------------------------------
  const resetForm = () =>
    setForm({
      courseCode: '',
      courseTitle: '',
      creditUnit: '',
      status: 'CORE',
      semester: 'FIRST',
      level: '',
      courseCategory: '',
      departmentId: '',
      prerequisiteIds: [],
    });

  const openModal = () => setIsOpen(true);

  const closeModal = () => {
    setIsOpen(false);
    setIsEditing(false);
    setSelectedCourse(null);
    resetForm();
  };

  // ------------------------------------------------------
  // CRUD Operations
  // ------------------------------------------------------
  const handleSubmit = async () => {
    if (!form.courseCode || !form.courseTitle || !form.departmentId) {
      alert('Course Code, Title & Department are required');
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
      department: { id: Number(form.departmentId) },
      prerequisites: form.prerequisiteIds.map((id) => ({ id })),
    };

    try {
      if (isEditing && selectedCourse) {
        await api.updateCourse(selectedCourse.id, payload);
      } else {
        await api.createCourse(payload);
      }

      await mutate();
      closeModal();
    } catch (err) {
      alert(err?.response?.data || 'Failed');
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
    if (!confirm('Delete this course?')) return;

    try {
      await api.deleteCourse(id);
      await mutate();
    } catch (err) {
      alert('Failed to delete');
      console.error(err);
    }
  };

  // ------------------------------------------------------
  // File Upload (MULTIPART-SAFE)
  // ------------------------------------------------------
  const handleFileUpload = async (file) => {
    setUploading(true);
    setUploadError(null);

    try {
      await api.uploadCourses(file);
      await mutate();
      alert('Upload successful');
    } catch (err) {
      setUploadError(err?.response?.data || 'Upload failed');
      alert('Upload error');
    } finally {
      setUploading(false);
    }
  };

  // ------------------------------------------------------
  // RENDER (after all hooks)
  // ------------------------------------------------------

  return (
    <div className="p-4">
      {/* LOADING/ERROR UI never before hooks */}
      {!courses && !error && (
        <div className="p-4 text-center text-gray-600">Loading courses...</div>
      )}

      {error && (
        <div className="p-4 text-center text-red-600">
          Failed to load courses.
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl font-bold">Courses</h2>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openModal}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Add Course
          </button>

          <FileUploadButton
            label={uploading ? 'Uploading…' : 'Upload CSV/XLSX'}
            onUpload={handleFileUpload}
          />

          <button
            onClick={() => exportToCsv(filtered, 'courses.csv')}
            className="px-3 py-2 border rounded"
          >
            Export CSV
          </button>

          <button
            onClick={() => exportToXlsx(filtered, 'courses.xlsx')}
            className="px-3 py-2 border rounded"
          >
            Export XLSX
          </button>
        </div>
      </div>

      {/* Filters */}
      <CourseFilters
        departments={depts}
        courseCodes={courseCodes}
        levels={levels}
        filters={filters}
        onChange={setFilters}
      />

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="table-auto w-full">
          <thead className="bg-gray-100">
            <tr className="text-center">
              <th className="border px-3 py-2">ID</th>
              <th className="border px-3 py-2">Code</th>
              <th className="border px-3 py-2">Title</th>
              <th className="border px-3 py-2">Unit</th>
              <th className="border px-3 py-2">Status</th>
              <th className="border px-3 py-2">Level</th>
              <th className="border px-3 py-2">Semester</th>
              <th className="border px-3 py-2">Department</th>
              <th className="border px-3 py-2">Created</th>
              <th className="border px-3 py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {visible.length > 0 ? (
              visible.map((c) => (
                <tr key={c.id} className="text-center">
                  <td className="border px-3 py-2">{c.id}</td>
                  <td className="border px-3 py-2">{c.courseCode}</td>
                  <td className="border px-3 py-2">{c.courseTitle}</td>
                  <td className="border px-3 py-2">{c.creditUnit}</td>
                  <td className="border px-3 py-2">{c.status}</td>
                  <td className="border px-3 py-2">{c.level}</td>
                  <td className="border px-3 py-2">{c.semester}</td>
                  <td className="border px-3 py-2">
                    {c.department?.deptName || '—'}
                  </td>
                  <td className="border px-3 py-2">
                    {c.createdDate
                      ? new Date(c.createdDate).toLocaleString()
                      : '—'}
                  </td>
                  <td className="border px-3 py-2">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="10"
                  className="text-center py-4 text-gray-500"
                >
                  No courses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-30"
            onClick={closeModal}
          ></div>

          <div className="bg-white p-6 rounded shadow-lg z-10 w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">
              {isEditing ? 'Edit Course' : 'Add Course'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Course Code"
                value={form.courseCode}
                onChange={(e) =>
                  setForm({ ...form, courseCode: e.target.value })
                }
                className="border px-3 py-2 rounded"
              />

              <input
                type="text"
                placeholder="Course Title"
                value={form.courseTitle}
                onChange={(e) =>
                  setForm({ ...form, courseTitle: e.target.value })
                }
                className="border px-3 py-2 rounded"
              />

              <input
                type="number"
                placeholder="Credit Unit"
                value={form.creditUnit}
                onChange={(e) =>
                  setForm({ ...form, creditUnit: e.target.value })
                }
                className="border px-3 py-2 rounded"
              />

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
                className="border px-3 py-2 rounded"
              >
                <option value="CORE">CORE</option>
                <option value="ELECTIVE">ELECTIVE</option>
              </select>

              <select
                value={form.semester}
                onChange={(e) =>
                  setForm({ ...form, semester: e.target.value })
                }
                className="border px-3 py-2 rounded"
              >
                <option value="FIRST">FIRST</option>
                <option value="SECOND">SECOND</option>
              </select>

              <input
                type="text"
                placeholder="Level (e.g. NCE I)"
                value={form.level}
                onChange={(e) =>
                  setForm({ ...form, level: e.target.value })
                }
                className="border px-3 py-2 rounded"
              />

              <input
                type="text"
                placeholder="Course Category"
                value={form.courseCategory}
                onChange={(e) =>
                  setForm({ ...form, courseCategory: e.target.value })
                }
                className="border px-3 py-2 rounded"
              />

              <select
                value={form.departmentId}
                onChange={(e) =>
                  setForm({ ...form, departmentId: e.target.value })
                }
                className="border px-3 py-2 rounded"
              >
                <option value="">Select Department</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deptName}
                  </option>
                ))}
              </select>

              {/* Prerequisites */}
              <div className="md:col-span-2">
                <label className="text-sm">Prerequisites</label>
                <select
                  multiple
                  className="border px-3 py-2 rounded w-full h-32"
                  value={form.prerequisiteIds}
                  onChange={(e) => {
                    const ids = Array.from(e.target.selectedOptions).map((o) =>
                      Number(o.value)
                    );
                    setForm({ ...form, prerequisiteIds: ids });
                  }}
                >
                  {(courses || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} — {c.courseTitle}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
              >
                {loading
                  ? 'Saving...'
                  : isEditing
                  ? 'Update'
                  : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
