/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { FileText, Code } from 'lucide-react';
import { isHtml, plainTextToHtml } from '../utils/emailFormatter';

export default function BodyEditor({ value, onChange }) {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'html'

  // Plain Text tab state
  const [textVal, setTextVal] = useState('');
  
  // HTML tab state
  const [htmlVal, setHtmlVal] = useState('');

  // Helper to get output based on active tab
  const getActiveOutput = (tab) => {
    if (tab === 'text') {
      return textVal;
    } else if (tab === 'html') {
      return htmlVal;
    }
    return '';
  };

  // Sync external value changes into local state
  useEffect(() => {
    if (value === undefined || value === null) return;
    
    // Check if the value matches what we currently output to avoid infinite loops
    const currentOutput = getActiveOutput(activeTab);
    if (value === currentOutput) return;

    if (isHtml(value)) {
      setHtmlVal(value);
      if (activeTab === 'text') {
        setActiveTab('html');
      }
    } else {
      setTextVal(value);
      if (activeTab === 'html') {
        setActiveTab('text');
      }
    }
  }, [value]);

  // Whenever a tab value or the active tab changes, notify the parent
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    
    // Sync states when switching tabs to help user
    if (newTab === 'html' && activeTab === 'text') {
      const converted = plainTextToHtml(textVal);
      setHtmlVal(converted);
      onChange(converted);
    } else {
      onChange(getActiveOutput(newTab));
    }
  };

  const handleTextChange = (val) => {
    setTextVal(val);
    if (activeTab === 'text') {
      onChange(val);
    }
  };

  const handleHtmlChange = (val) => {
    setHtmlVal(val);
    if (activeTab === 'html') {
      onChange(val);
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor Tab Switcher */}
      <div className="flex border-b border-border pb-2 gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('text')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'text'
              ? 'bg-gradient-to-r from-lime/15 to-cyan/10 border border-cyan/25 text-cyan'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Plain Text</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('html')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'html'
              ? 'bg-gradient-to-r from-lime/15 to-cyan/10 border border-cyan/25 text-cyan'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Raw HTML</span>
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="animate-fade-in">
        {activeTab === 'text' && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block mb-1">
              Supports <code className="font-mono text-cyan bg-cyan/10 px-1 py-0.5 rounded">{"{{Name}}"}</code> placeholders. Will be auto-wrapped in a styled email shell on send.
            </span>
            <textarea
              value={textVal}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Dear {{Name}},&#10;&#10;Type your email body here..."
              rows={12}
              className="textarea-field min-h-[300px]"
            />
          </div>
        )}

        {activeTab === 'html' && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block mb-1">
              Write custom HTML email code. Use inline CSS styles for best email client compatibility.
            </span>
            <textarea
              value={htmlVal}
              onChange={(e) => handleHtmlChange(e.target.value)}
              placeholder="<div style='font-family: Arial, sans-serif; padding: 20px;'>Dear {{Name}}, ...</div>"
              rows={12}
              className="code-field min-h-[300px] w-full p-3 rounded-xl bg-white/[0.02] border border-border text-foreground font-mono text-xs focus:border-cyan/50 focus:ring-2 focus:ring-cyan/20 outline-none resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
