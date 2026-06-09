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
            ? 'border-cyan bg-cyan/10 scale-[1.01]'
            : fileName
            ? 'border-lime bg-lime/10'
            : 'border-border bg-white/[0.02] hover:border-cyan/40'
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
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-10 h-10 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm font-medium">Parsing CSV list...</p>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-3 py-4 animate-fade-in">
            <FileText className="w-6 h-6 text-lime animate-pulse" />
            <span className="text-lime font-display font-semibold">{fileName}</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="ml-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition border border-border"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime/20 to-cyan/20 flex items-center justify-center border border-border group-hover:scale-105 transition-transform duration-300">
              <Upload className="w-6 h-6 text-cyan" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground text-base">Drop your recipient CSV here</p>
              <p className="text-muted-foreground text-xs mt-1">or click to browse local files • Max 5MB</p>
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
        className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-cyan transition-colors bg-transparent border-none cursor-pointer p-0"
      >
        <Download className="w-4 h-4" />
        <span>Download sample CSV file</span>
      </button>
    </div>
  );
}
