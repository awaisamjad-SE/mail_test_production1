import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const alertClasses = {
  success: 'alert-success border-strong shadow-lg',
  error: 'alert-error border-strong shadow-lg',
  warning: 'alert-warning border-strong shadow-lg',
  info: 'alert-info border-strong shadow-lg',
};

export default function StatusToast({ type = 'info', message, details, onClose, autoClose = 5000 }) {
  const Icon = icons[type];

  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`flex items-start gap-3 p-4 border backdrop-blur-xl ${alertClasses[type]} max-w-md`}>
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{message}</p>
          {details && <p className="text-xs opacity-80 mt-1">{details}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--surface-2)] transition-colors shrink-0 bg-transparent border-none cursor-pointer"
          >
            <X className="w-4 h-4 text-inherit" />
          </button>
        )}
      </div>
    </div>
  );
}
