import { Clock, Monitor } from 'lucide-react';
import { prepareBodyForSend } from '../utils/emailFormatter';

export default function EmailPreview({ to, subject, body, from = 'you@mailflow.app' }) {
  const htmlContent = prepareBodyForSend(body);

  if (!subject && !body) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[350px] card p-6 text-center">
        <div className="w-16 h-16 rounded-2xl surface-2 flex items-center justify-center mb-4 border border-theme">
          <Monitor className="w-8 h-8 t3" />
        </div>
        <p className="font-semibold t1 text-lg">Live Preview</p>
        <p className="text-sm t3 mt-1 max-w-[280px]">
          Enter a subject or write some email content on the left to see the live rendering here.
        </p>
      </div>
    );
  }

  return (
    <div className="card-solid overflow-hidden flex flex-col h-full border border-theme shadow-lg min-h-[500px]">
      {/* Email client header */}
      <div className="p-4 border-b border-theme surface-3 space-y-2 flex-shrink-0">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
            {from.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm truncate t1">{from}</p>
              <div className="flex items-center gap-1 t3 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Now</span>
              </div>
            </div>
            <p className="text-xs truncate t2">
              <span className="t3">To:</span> {to || 'recipient@email.com'}
            </p>
          </div>
        </div>
        <div className="pt-2 pl-[52px]">
          <span className="t3 text-xs uppercase tracking-wider font-semibold">Subject:</span>
          <h3 className="font-bold text-base t1 mt-0.5">{subject || 'No subject'}</h3>
        </div>
      </div>

      {/* Email body (rendered in sandboxed iframe for security and proper HTML styling scoping) */}
      <div className="flex-1 bg-neutral-100 p-2 min-h-[400px] flex">
        {htmlContent ? (
          <iframe
            srcDoc={htmlContent}
            title="Email Preview"
            sandbox="allow-same-origin"
            className="w-full h-full border-none rounded-lg bg-white shadow-sm flex-1 min-h-[380px]"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm bg-white rounded-lg">
            No content to preview
          </div>
        )}
      </div>
    </div>
  );
}
