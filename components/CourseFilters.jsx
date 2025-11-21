'use client';

import React from 'react';

/**
 * CourseFilters
 *
 * Props:
 * - departments: array of department objects { id, deptName }
 * - courseCodes: array of unique course codes (strings)
 * - levels: array of level strings
 * - filters: { q, deptId, courseCode, level }
 * - onChange: fn(updatedFilters)
 */
export default function CourseFilters({
  departments = [],
  courseCodes = [],
  levels = [],
  filters,
  onChange,
}) {
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between mb-4">
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="search"
          placeholder="Search by title or code..."
          className="border rounded px-3 py-2 w-64"
          value={filters.q || ''}
          onChange={(e) => set({ q: e.target.value })}
        />

        <select
          value={filters.deptId || ''}
          onChange={(e) => set({ deptId: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.deptName}
            </option>
          ))}
        </select>

        <select
          value={filters.courseCode || ''}
          onChange={(e) => set({ courseCode: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">All Course Codes</option>
          {courseCodes.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>

        <select
          value={filters.level || ''}
          onChange={(e) => set({ level: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">All Levels</option>
          {levels.map((lv) => (
            <option key={lv} value={lv}>
              {lv}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 mt-2 md:mt-0">
        <button
          onClick={() =>
            onChange({ q: '', deptId: '', courseCode: '', level: '' })
          }
          className="px-3 py-2 border rounded bg-white hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
