// @BACKEND-PROMPT:
// Read CLAUDE.md. Build POST /api/v1/ocr/process in backend/app/routers/ocr.py
// Accepts: multipart/form-data with file field (PDF, JPG, PNG)
// Step 1: Save file with UUID filename. Compute SHA-256 hash. Check for duplicate (same hash already processed).
// Step 2: Detect doc_type: if image → RECEIPT. If PDF → try pdfplumber text extraction. If <50 words extracted → treat as scanned → RECEIPT. Else → INVOICE or STATEMENT based on content.
// Step 3: Strip PII from any extracted text using strip_pii() from ingestion/invoice_parser.py before sending to GPT-4o.
// Step 4: For images and scanned PDFs: encode as base64 and call GPT-4o Vision with:
//   System: "Extract structured data from this Indian business document. Return JSON only."
//   Schema: {vendor_name, amount_inr (number), date (YYYY-MM-DD), doc_type: RECEIPT|INVOICE|STATEMENT, category: guess from context, is_expense: bool, gst_amount: number or 0, confidence: 0.0-1.0}
// Step 5: Return extracted fields + confidence. If confidence < 0.7, flag needs_review: true.
// Step 6: Create SourceDocument record. Do NOT auto-create Transaction — wait for user confirmation from frontend.
// Also build: POST /api/v1/ocr/confirm/{doc_id} — user has confirmed/edited the extracted fields, now create the Transaction record.

// @ML-PROMPT:
// Read CLAUDE.md. Build an OCR post-processing validation layer for CaliComp.
// Problem: GPT-4o Vision sometimes misreads amounts on low-quality receipt images.
// Build a validation model in backend/app/ml/ocr_validator.py:
// 1. Amount sanity check: compare extracted amount against historical transaction amounts for the same vendor. If > 3 std deviations, flag needs_review: true.
// 2. Category classifier: TfidfVectorizer + LogisticRegression on description → category. Retrain weekly.
// 3. Vendor name normaliser: use thefuzz to match extracted vendor names against known vendors. If similarity > 85%, replace with canonical name.

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Camera, Upload, X, CheckCircle, Loader, FileText, Image, RotateCcw,
} from 'lucide-react';
import { Button } from '../components/ui/Common';
import { ManualEntryForm } from '../components/transactions/ManualEntryForm';
import { useToast } from '../context/ToastContext';
import { useTransactionStore } from '../store/transactionStore';

// ── OCR mock ─────────────────────────────────────────────────────────────────

interface OCRResult {
  vendor: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
  confidence: number;
}

async function processOCR(file: File | string): Promise<OCRResult> {
  const formData = new FormData();
  if (typeof file === 'string') {
    const res = await fetch(file);
    const blob = await res.blob();
    formData.append('file', blob, 'capture.jpg');
  } else {
    formData.append('file', file);
  }

  const response = await fetch('http://localhost:8000/api/ocr/process', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('OCR processing failed');
  }

  return response.json();
}

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = 'capture' | 'manual';

// ── Camera capture ─────────────────────────────────────────────────────────────
function CameraCapture({ onCapture }: { onCapture: (base64: string) => void }) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error,     setError]     = useState('');

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
      }
    } catch {
      setError('Camera access denied. Please use file upload instead.');
    }
  }

  function capture() {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width  = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0);
    const base64 = canvasRef.current.toDataURL('image/jpeg');
    // Stop camera tracks
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setStreaming(false);
    onCapture(base64);
  }

  return (
    <div className="space-y-4">
      {!streaming && !error && (
        <button
          onClick={startCamera}
          className="w-full h-48 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-600 hover:bg-blue-900/5 transition-all cursor-pointer"
        >
          <Camera className="w-10 h-10 text-gray-600" />
          <p className="text-sm font-bold text-gray-400">Open Camera</p>
          <p className="text-xs text-gray-600">Point at receipt or invoice</p>
        </button>
      )}
      {error && <p className="text-xs text-red-400 text-center py-4">{error}</p>}
      {streaming && (
        <div className="relative rounded-2xl overflow-hidden">
          <video ref={videoRef} className="w-full rounded-2xl" playsInline />
          <button
            onClick={capture}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full border-4 border-gray-300 shadow-xl hover:scale-105 active:scale-95 transition-all"
          />
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ── File drop zone ─────────────────────────────────────────────────────────────
function FileDropZone({ onFile }: { onFile: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={clsx(
        'w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all',
        dragging ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 hover:border-blue-600 hover:bg-blue-900/5'
      )}
    >
      <Upload className="w-10 h-10 text-gray-600" />
      <p className="text-sm font-bold text-gray-400">Drop file here or click to browse</p>
      <p className="text-xs text-gray-600">PDF, JPG, PNG supported</p>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
    </div>
  );
}

// ── OCR Result form ────────────────────────────────────────────────────────────
function OCRResultForm({ result, onConfirm }: { result: OCRResult; onConfirm: (r: OCRResult) => void }) {
  const [r, setR] = useState(result);
  const inputCls = 'w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-600 transition-colors';
  const labelCls = 'block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-900/40 rounded-xl">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-xs font-bold text-green-300">OCR Extracted</span>
        </div>
        <span className="text-xs font-black text-green-400">{Math.round(result.confidence * 100)}% confidence</span>
      </div>

      <p className="text-xs text-gray-500">Review and correct any fields before saving.</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Vendor / Description</label>
          <input value={r.vendor} onChange={e => setR(p => ({ ...p, vendor: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Amount (₹)</label>
          <input type="number" value={r.amount} onChange={e => setR(p => ({ ...p, amount: Number(e.target.value) }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Date</label>
          <input type="date" value={r.date} onChange={e => setR(p => ({ ...p, date: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <input value={r.category} onChange={e => setR(p => ({ ...p, category: e.target.value }))} className={inputCls} />
        </div>
      </div>

      <div className="flex gap-2">
        {(['expense', 'income'] as const).map(t => (
          <button
            key={t}
            onClick={() => setR(p => ({ ...p, type: t }))}
            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              r.type === t
                ? t === 'expense' ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-green-900/30 text-green-300 border border-green-800'
                : 'bg-gray-900 border border-gray-800 text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Button variant="primary" className="w-full py-3" onClick={() => onConfirm(r)}>
        Confirm & Save Transaction
      </Button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AddTransaction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { addTransaction } = useTransactionStore();

  const initialTab: Tab = searchParams.get('tab') === 'manual' ? 'manual' : 'capture';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Capture state
  type CaptureMode = 'idle' | 'camera' | 'file';
  const [captureMode, setCaptureMode] = useState<CaptureMode>('idle');
  const [preview,     setPreview]     = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [ocring,      setOcring]      = useState(false);
  const [ocrResult,   setOcrResult]   = useState<OCRResult | null>(null);

  const handleCapture = useCallback((base64: string) => {
    setPreview(base64);
    setCaptureMode('idle');
  }, []);

  const handleFile = useCallback((file: File) => {
    setPreviewFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }, []);

  async function handleOCR() {
    setOcring(true);
    const source = previewFile ?? preview ?? '';
    const result = await processOCR(source as unknown as File);
    setOcrResult(result);
    setOcring(false);
  }

  function handleConfirm(r: OCRResult) {
    addTransaction({
      date:        r.date,
      description: r.vendor,
      amount:      r.amount,
      type:        r.type,
      status:      'pending',
      category:    r.category,
      source:      'ocr',
    });
    showToast('Transaction saved from OCR.');
    navigate('/transactions');
  }

  function resetCapture() {
    setPreview(null);
    setPreviewFile(null);
    setOcrResult(null);
    setCaptureMode('idle');
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'capture', label: '📷 Capture / Upload' },
    { id: 'manual',  label: '✏️ Manual Entry'     },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">Add Transaction</h2>
        <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">Capture or enter manually</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'px-5 py-2 rounded-lg text-xs font-bold transition-all',
              activeTab === id ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8">
        {activeTab === 'capture' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-black text-white mb-1">Capture Receipt or Invoice</h3>
              <p className="text-xs text-gray-500">Use your camera or upload a file — GPT-4o will extract the details.</p>
            </div>

            {/* Mode selector */}
            {!preview && captureMode === 'idle' && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCaptureMode('camera')}
                  className="p-6 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center gap-3 hover:border-blue-600 hover:bg-blue-900/5 transition-all"
                >
                  <Camera className="w-8 h-8 text-gray-500" />
                  <div>
                    <p className="text-sm font-bold text-gray-300">Take a Photo</p>
                    <p className="text-xs text-gray-600 mt-0.5">Use device camera</p>
                  </div>
                </button>
                <button
                  onClick={() => setCaptureMode('file')}
                  className="p-6 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center gap-3 hover:border-blue-600 hover:bg-blue-900/5 transition-all"
                >
                  <Upload className="w-8 h-8 text-gray-500" />
                  <div>
                    <p className="text-sm font-bold text-gray-300">Upload File</p>
                    <p className="text-xs text-gray-600 mt-0.5">PDF, JPG, PNG</p>
                  </div>
                </button>
              </div>
            )}

            {captureMode === 'camera' && !preview && (
              <CameraCapture onCapture={handleCapture} />
            )}
            {captureMode === 'file' && !preview && (
              <FileDropZone onFile={handleFile} />
            )}

            {/* Preview */}
            {preview && !ocrResult && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-gray-800">
                  {previewFile?.type === 'application/pdf' ? (
                    <div className="h-40 flex items-center justify-center gap-3 bg-gray-900">
                      <FileText className="w-10 h-10 text-gray-500" />
                      <div>
                        <p className="text-sm font-bold text-gray-300">{previewFile.name}</p>
                        <p className="text-xs text-gray-500">{(previewFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <img src={preview} alt="Preview" className="w-full max-h-64 object-contain bg-gray-900" />
                  )}
                  <button
                    onClick={resetCapture}
                    className="absolute top-2 right-2 w-7 h-7 bg-gray-900/80 rounded-lg flex items-center justify-center text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Button variant="primary" className="w-full py-3 flex items-center justify-center gap-2" onClick={handleOCR} disabled={ocring}>
                  {ocring ? <><Loader className="w-4 h-4 animate-spin" /> Extracting transaction details…</> : <><Image className="w-4 h-4" /> Process with OCR</>}
                </Button>
                <button onClick={resetCapture} className="w-full text-xs text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Use a different file
                </button>
              </div>
            )}

            {/* OCR result */}
            {ocrResult && <OCRResultForm result={ocrResult} onConfirm={handleConfirm} />}
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-black text-white mb-1">Manual Entry</h3>
              <p className="text-xs text-gray-500">Enter transaction details directly.</p>
            </div>
            <ManualEntryForm onSuccess={() => navigate('/transactions')} />
          </div>
        )}
      </div>
    </div>
  );
}
