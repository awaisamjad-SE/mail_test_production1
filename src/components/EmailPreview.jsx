import { useState, useRef, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { prepareBodyForSend } from '../utils/emailFormatter';

export default function EmailPreview({ to, subject, body, from = 'you@mailflow.app' }) {
  const htmlContent = prepareBodyForSend(body);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width || 400);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Mobile layout dimensions (screen + bezel)
  const screenWidth = 360;
  const bezelPadding = 14; // Left + Right bezel is 28px total
  const totalWidth = screenWidth + bezelPadding * 2; // 388px
  const screenHeight = 640;
  const totalHeight = screenHeight + bezelPadding * 2; // 668px

  // Scale factor to fit inside the parent container
  const scale = containerWidth < totalWidth ? containerWidth / totalWidth : 1;
  const scaledHeight = totalHeight * scale;

  return (
    <div ref={containerRef} className="w-full flex justify-center items-start overflow-hidden">
      {/* Smartphone Bezel Wrapper */}
      <div 
        style={{
          width: `${totalWidth}px`,
          height: `${totalHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          margin: '0 auto',
        }}
        className="relative bg-zinc-950 rounded-[48px] p-[14px] shadow-2xl border border-white/10 ring-1 ring-black/40 flex-shrink-0"
      >
        {/* Dynamic Island */}
        <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-center">
          <span className="size-1.5 rounded-full bg-zinc-800/80 mr-2" />
          <span className="w-8 h-1 bg-zinc-800/50 rounded-full" />
        </div>

        {/* Smartphone Screen Grid */}
        <div className="w-full h-full bg-white rounded-[34px] overflow-hidden flex flex-col relative font-sans text-zinc-800 select-none shadow-inner border border-zinc-200">
          
          {/* iOS-Style Status Bar */}
          <div className="h-11 bg-white flex items-end justify-between px-6 pb-2 text-[11px] font-semibold text-zinc-900 select-none z-20 flex-shrink-0">
            <div>9:41</div>
            <div className="flex items-center gap-1.5">
              {/* Cellular Signal Strength */}
              <svg className="w-4 h-2.5 text-zinc-900" viewBox="0 0 24 12" fill="currentColor">
                <rect x="2" y="9" width="3.5" height="3" rx="0.5" />
                <rect x="7" y="6" width="3.5" height="6" rx="0.5" />
                <rect x="12" y="3" width="3.5" height="9" rx="0.5" />
                <rect x="17" y="0" width="3.5" height="12" rx="0.5" />
              </svg>
              {/* Wi-Fi Icon */}
              <svg className="w-4 h-3 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12a10 10 0 0 1 14 0" />
                <path d="M8.5 15.5a5 5 0 0 1 7 0" />
                <path d="M12 18.5a1 1 0 0 1 0 0" />
              </svg>
              {/* Battery Icon */}
              <svg className="w-5.5 h-3 text-zinc-900" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="18" height="10" rx="2" />
                <rect x="3" y="3" width="14" height="6" rx="1" fill="currentColor" />
                <path d="M20 4v4" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Mail Client Navigation Bar */}
          <div className="px-4 py-2.5 bg-white border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-0.5 text-blue-500 hover:opacity-80 transition cursor-pointer">
              <ChevronLeft className="w-5 h-5 -ml-1" />
              <span className="text-sm font-medium">Inbox</span>
            </div>
            <div className="text-xs font-semibold text-zinc-400">
              Mobile Preview
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Email Subject Area */}
          <div className="px-4 pt-3.5 pb-2 flex-shrink-0">
            <h1 className="text-lg font-bold text-zinc-900 leading-snug break-words">
              {subject || 'No Subject'}
            </h1>
          </div>

          {/* Email Metadata Area */}
          <div className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between flex-shrink-0 bg-zinc-50/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                {from.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs text-zinc-800 truncate">{from.split('@')[0]}</span>
                  <span className="text-[10px] text-zinc-400 truncate hidden xs:inline">&lt;{from}&gt;</span>
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                  To: <span className="text-zinc-600 font-medium">{to || 'recipient@email.com'}</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-zinc-400 whitespace-nowrap ml-2">
              9:41 AM
            </div>
          </div>

          {/* Sandboxed Body Rendering Viewport */}
          <div className="flex-1 bg-white relative overflow-hidden">
            {htmlContent ? (
              <iframe
                srcDoc={htmlContent}
                title="Email Preview Sandbox"
                sandbox="allow-same-origin"
                className="absolute top-0 left-0 border-none bg-white"
                style={{
                  width: '600px',
                  height: '166.67%',
                  transform: 'scale(0.6)',
                  transformOrigin: 'top left',
                }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-xs text-center p-6">
                <p className="font-medium text-zinc-500">No message content</p>
                <p className="text-[10px] text-zinc-400 mt-1 max-w-[180px]">
                  Draft subject & body or select a record to populate this view.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

