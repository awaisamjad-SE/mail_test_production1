import { useState, useRef } from 'react';
import { Upload, FileText, X, Download, AlertCircle } from 'lucide-react';
import { parseCSV, generateSampleCSV } from '../utils/csvParser';

export default function CSVUploader({ onDataParsed, requiredColumns = 'bulk', className = '' }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return;
    }

    setIsLoading(true);
    setError('');
    setFileName(file.name);

    try {
      const data = await parseCSV(file);

      if (requiredColumns === 'personalized' && (!data.hasSubject || !data.hasBody)) {
        setError('CSV must include Subject and Body columns for personalized mode. Found: ' + data.headers.join(', '));
        setIsLoading(false);
        return;
      }

      onDataParsed(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); };

  const handleDownloadSample = () => {
    const type = requiredColumns === 'personalized' ? 'personalized' : 'bulk';
    const csv = generateSampleCSV(type);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setFileName('');
    setError('');
    onDataParsed(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-[var(--accent)] bg-[var(--accent-bg)] scale-[1.02]'
            : fileName
            ? 'border-[var(--success-border)] bg-[var(--success-bg)]'
            : 'border-theme surface-2 hover:border-[var(--accent)] hover:bg-[var(--surface-3)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[var(--accent-border)] border-t-[var(--accent)] rounded-full animate-spin" />
            <p className="t2 text-sm">Parsing CSV...</p>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-6 h-6 text-[var(--success-text)]" />
            <span className="text-[var(--success-text)] font-semibold">{fileName}</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="ml-2 p-1.5 rounded-lg surface-2 hover:bg-[var(--surface-3)] transition-colors border border-theme"
            >
              <X className="w-4 h-4 t3 hover:t1" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-bg)] flex items-center justify-center border border-[var(--accent-border)]">
              <Upload className="w-7 h-7 accent-text" />
            </div>
            <div>
              <p className="t1 font-semibold">Drop your CSV file here</p>
              <p className="t3 text-sm mt-1">or click to browse • Max 5MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-xl alert-error">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <button
        onClick={handleDownloadSample}
        className="mt-3 flex items-center gap-2 text-sm t3 hover:accent-text transition-colors bg-transparent border-none cursor-pointer p-0"
      >
        <Download className="w-4 h-4" />
        <span>Download sample CSV</span>
      </button>
    </div>
  );
}
