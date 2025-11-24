"use client";

import React from 'react';

export default function UploadReportModal({ report, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg mx-4 rounded-lg shadow-lg p-6">
        
        {/* Title */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Upload Summary</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Processed</p>
            <p className="text-lg font-semibold">{report.processed}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Saved</p>
            <p className="text-lg font-semibold">{report.saved}</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Skipped</p>
            <p className="text-lg font-semibold">{report.skipped}</p>
          </div>
          <div className="bg-red-100 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-lg font-semibold">{report.failed}</p>
          </div>
        </div>

        {/* Row errors */}
        <h3 className="text-lg font-semibold mb-2">Row Issues</h3>
        
        {report.errors?.length === 0 ? (
          <p className="text-gray-500 text-sm">No errors or duplicates.</p>
        ) : (
          <div className="max-h-48 overflow-y-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-3 py-2 text-left">Row</th>
                  <th className="px-3 py-2 text-left">Message</th>
                </tr>
              </thead>
              <tbody>
                {report.errors.map((e, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-3 py-1 font-semibold">{e.rowNumber}</td>
                    <td className="px-3 py-1">{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Close */}
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
