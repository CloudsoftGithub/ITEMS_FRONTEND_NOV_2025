// components/AdminComponents/ManageSession.jsx
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { exportToCsv, exportToXlsx } from '@/lib/exportUtils';

export default function ManageSession() {
  const {
    data: rows,
    mutate,
    error,
    isLoading
  } = useSWR('sessions', api.listSessions);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const thisYear = new Date().getFullYear();

  const [form, setForm] = useState({
    intakeSession: '',
    intakeYear: thisYear,
    isCurrent: false
  });

  const resetForm = () =>
    setForm({
      intakeSession: '',
      intakeYear: thisYear,
      isCurrent: false
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
      intakeSession: s.intakeSession ?? '',
      intakeYear: s.intakeYear ?? thisYear,
      isCurrent: Boolean(s.isCurrent)
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
        isCurrent: Boolean(form.isCurrent)
      };

      if (isEditing && selected) {
        await api.updateSession(selected.id, payload);
      } else {
        await api.createSession(payload);
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
    if (!confirm('Delete this session?')) return;

    try {
      await api.deleteSession(id);
      await mutate();
    } catch (err) {
      alert('Delete failed: ' + (err?.response?.data || err.message));
    }
  };

  const exportCsv = () =>
    exportToCsv(Array.isArray(rows) ? rows : [], 'sessions.csv');

  const exportXlsx = () =>
    exportToXlsx(Array.isArray(rows) ? rows : [], 'sessions.xlsx');

  return (
    <div className="p-6">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Academic Sessions</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="bg-sky-600 text-white px-4 py-2 rounded"
          >
            + Add Session
          </button>

          <button onClick={exportCsv} className="px-3 py-2 border rounded text-sm">
            Export CSV
          </button>

          <button onClick={exportXlsx} className="px-3 py-2 border rounded text-sm">
            Export XLSX
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        {isLoading ? (
          <p className="text-gray-600">Loading sessions...</p>
        ) : error ? (
          <p className="text-red-500">Failed to load sessions.</p>
        ) : Array.isArray(rows) && rows.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-center">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Session</th>
                <th className="p-2">Year</th>
                <th className="p-2">Current</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b hover:bg-gray-50 text-center"
                >
                  <td className="p-3">{s.id}</td>
                  <td className="p-3 font-medium">{s.intakeSession}</td>
                  <td className="p-3">{s.intakeYear}</td>
                  <td className="p-3">{s.isCurrent ? 'Yes' : 'No'}</td>

                  <td className="p-3">
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-blue-600"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(s.id)}
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
          <p className="text-gray-500">No sessions found.</p>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded shadow p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isEditing ? 'Edit Session' : 'Create Session'}
              </h3>

              <button
                onClick={() => setShowModal(false)}
                className="text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* SESSION */}
              <div>
                <label className="block text-sm mb-1">
                  Intake Session (e.g. 2025/2026)
                </label>
                <input
                  required
                  value={form.intakeSession}
                  onChange={(e) =>
                    setForm({ ...form, intakeSession: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              {/* YEAR */}
              <div>
                <label className="block text-sm mb-1">Intake Year</label>
                <input
                  required
                  type="number"
                  value={form.intakeYear}
                  onChange={(e) =>
                    setForm({ ...form, intakeYear: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              {/* CURRENT CHECKBOX */}
              <div className="flex items-center gap-3">
                <input
                  id="isCurrent"
                  type="checkbox"
                  checked={form.isCurrent}
                  onChange={(e) =>
                    setForm({ ...form, isCurrent: e.target.checked })
                  }
                />
                <label htmlFor="isCurrent" className="text-sm">
                  Mark as current session
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2 rounded text-white ${
                  submitting ? 'bg-gray-400' : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                {submitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Session'
                  : 'Create Session'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
