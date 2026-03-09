// app/component/ui/BulkUpload.tsx
"use client";

import { useState } from "react";
import Button from "./Button";

interface BulkUploadProps {
  title: string;
  description?: string;
  sampleData: string[][];
  onDownloadSample: () => void;
  bulkData: string;
  onBulkDataChange: (value: string) => void;
  file: File | null;
  fileName: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  loading: boolean;
  itemName: string;
  hideSampleButton?: boolean; // ✅ Add this optional prop
}

export default function BulkUpload({
  title,
  description,
  sampleData,
  onDownloadSample,
  bulkData,
  onBulkDataChange,
  file,
  fileName,
  onFileChange,
  onClearFile,
  onSubmit,
  onClear,
  loading,
  itemName,
  hideSampleButton = false, // ✅ Default value false
}: BulkUploadProps) {
  const [showSample, setShowSample] = useState(false);

  // Define headers based on sample data
  const headers = ['name', 'levelId', 'categoryId', 'fullForm', 'displayOrder', 'status'];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      {title && <h2 className="text-lg font-medium">{title}</h2>}
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}

      {/* Download Sample Button - Only show if not hidden */}
      {!hideSampleButton && (
        <div className="flex gap-3">
          <button
            onClick={onDownloadSample}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Sample CSV
          </button>
          
          <button
            type="button"
            onClick={() => setShowSample(!showSample)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {showSample ? "Hide Sample" : "Show Sample"}
          </button>
        </div>
      )}

      {/* Sample Table */}
      {showSample && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Sample Format
          </h3>
          
          <div className="overflow-x-auto bg-white rounded-lg border border-blue-200">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-100">
                <tr>
                  {headers.map((header, idx) => (
                    <th key={idx} className="px-4 py-2 text-left text-blue-800 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {sampleData.slice(0, 5).map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-blue-50">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-2">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload CSV File
          </label>
          
          {!file ? (
            <div className="text-center">
              <input
                type="file"
                accept=".csv"
                onChange={onFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Choose CSV File
              </label>
              <p className="text-xs text-gray-500 mt-2">Supported format: .csv only</p>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">{fileName}</span>
              </div>
              <button
                type="button"
                onClick={onClearFile}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        {/* Manual Data Entry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manual Data Entry
          </label>
          <textarea
            value={bulkData}
            onChange={(e) => onBulkDataChange(e.target.value)}
            placeholder={`Enter data in CSV format:\nBS,1,1,Bachelor of Science,1,true\nBA,1,4,Bachelor of Arts,2,true`}
            rows={6}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: name, levelId, categoryId, fullForm, displayOrder, status
          </p>
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Uploading..." : `Upload ${itemName}`}
          </Button>
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}