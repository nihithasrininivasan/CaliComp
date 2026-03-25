import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button, Card } from '../ui/Common';
import { uploadTransactions } from '../../services/api';

interface UploadedFile {
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  message?: string;
}

export function UploadSection() {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming).filter((f) => f.name.endsWith('.csv'));
    if (arr.length === 0) return;

    const newEntries: UploadedFile[] = arr.map((f) => ({
      name: f.name,
      size: f.size,
      status: 'uploading',
    }));
    setFiles((prev) => [...prev, ...newEntries]);

    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      const idx = files.length + i;
      try {
        await uploadTransactions(file);
        setFiles((prev) =>
          prev.map((e, j) => j === idx ? { ...e, status: 'success', message: 'Uploaded successfully' } : e)
        );
      } catch {
        setFiles((prev) =>
          prev.map((e, j) => j === idx ? { ...e, status: 'error', message: 'Upload failed — check backend' } : e)
        );
      }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">Upload Data</h2>
        <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">Import CSV bank statements</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all',
          dragging
            ? 'border-blue-500 bg-blue-900/10'
            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/20'
        )}
      >
        <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
          <Upload className={clsx('w-6 h-6 transition-colors', dragging ? 'text-blue-400' : 'text-gray-500')} />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-200">Drop CSV files here</p>
          <p className="text-xs text-gray-500 mt-1">or click to browse · Only .csv files accepted</p>
        </div>
        <Button variant="outline" className="pointer-events-none">Browse Files</Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <Card title="Upload Queue">
          <div className="space-y-3">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/60 border border-gray-800">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-200 truncate">{f.name}</p>
                  <p className="text-[10px] text-gray-500">{(f.size / 1024).toFixed(1)} KB · {f.message ?? 'Uploading…'}</p>
                </div>
                {f.status === 'uploading' && (
                  <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                {f.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />}
                {f.status === 'error'   && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                  <X className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400 transition-colors" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Format guide */}
      <Card title="Expected CSV Format" subtitle="Make sure your file matches this structure">
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-[10px] text-gray-400 overflow-x-auto">
          <p className="text-gray-300 font-bold mb-1">date,description,amount,type</p>
          <p>2024-03-20,Client Payment – ABC Corp,150000,income</p>
          <p>2024-03-19,Office Rent,45000,expense</p>
          <p>2024-03-18,AWS Cloud Services,12500,expense</p>
        </div>
      </Card>
    </div>
  );
}
