// components/FileUploadButton.jsx
'use client';

import { useRef, useState } from 'react';

export default function FileUploadButton({ onUpload, accept = '.csv,.xlsx,.xls', label = 'Upload CSV/XLSX' }) {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      await onUpload(file);
    } finally {
      setLoading(false);
      // clear input
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="hidden"
        id="file-upload-button"
      />
      <label
        htmlFor="file-upload-button"
        className={`inline-flex items-center px-3 py-2 rounded cursor-pointer border bg-white text-sm ${loading ? 'opacity-60' : 'hover:bg-gray-50'}`}
        aria-disabled={loading}
      >
        {loading ? 'Uploading...' : label}
      </label>
    </div>
  );
}
