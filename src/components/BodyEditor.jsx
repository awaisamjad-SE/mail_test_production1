/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { FileText, Code, Palette } from 'lucide-react';
import { isHtml, plainTextToHtml, buildVisualEmail } from '../utils/emailFormatter';

export default function BodyEditor({ value, onChange }) {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'html' | 'visual'

  // Plain Text tab state
  const [textVal, setTextVal] = useState('');
  
  // HTML tab state
  const [htmlVal, setHtmlVal] = useState('');

  // Visual Builder tab state
  const [visualVal, setVisualVal] = useState({
    headerBg: '#2563eb',
    headerTitle: '',
    headerSubtitle: '',
    bodyText: '',
    buttonText: '',
    buttonUrl: '',
    buttonBg: '#2563eb',
    footerText: 'Sent via MailFlow',
  });

  // Helper to get output based on active tab
  const getActiveOutput = (tab) => {
    if (tab === 'text') {
      return textVal;
    } else if (tab === 'html') {
      return htmlVal;
    } else if (tab === 'visual') {
      return buildVisualEmail(visualVal);
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
      // If active tab is text, maybe switch or just leave it
      // Let's assume if the parent forces an HTML value, they want HTML mode
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
      // Convert plain text to HTML as a starting point
      const converted = plainTextToHtml(textVal);
      setHtmlVal(converted);
      onChange(converted);
    } else if (newTab === 'html' && activeTab === 'visual') {
      const generated = buildVisualEmail(visualVal);
      setHtmlVal(generated);
      onChange(generated);
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

  const handleVisualChange = (field, val) => {
    const updated = { ...visualVal, [field]: val };
    setVisualVal(updated);
    if (activeTab === 'visual') {
      onChange(buildVisualEmail(updated));
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor Tab Switcher */}
      <div className="flex border-b border-theme pb-2 gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('text')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'text'
              ? 'bg-[var(--accent-bg)] border border-[var(--accent-border)] accent-text'
              : 't3 hover:t1 hover:bg-[var(--surface-2)]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Plain Text</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('html')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'html'
              ? 'bg-[var(--accent-bg)] border border-[var(--accent-border)] accent-text'
              : 't3 hover:t1 hover:bg-[var(--surface-2)]'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Raw HTML</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('visual')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'visual'
              ? 'bg-[var(--accent-bg)] border border-[var(--accent-border)] accent-text'
              : 't3 hover:t1 hover:bg-[var(--surface-2)]'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Visual Builder</span>
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="animate-fade-in">
        {activeTab === 'text' && (
          <div className="space-y-1">
            <span className="text-xs t3 block mb-1">
              Supports <code>{"{{Name}}"}</code> placeholders. Will be auto-wrapped in a styled email shell on send.
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
            <span className="text-xs t3 block mb-1">
              Write custom HTML email code. Use online CSS inline tools for best email client compatibility.
            </span>
            <textarea
              value={htmlVal}
              onChange={(e) => handleHtmlChange(e.target.value)}
              placeholder="<div style='font-family: Arial; padding: 20px;'>Dear {{Name}}, ...</div>"
              rows={12}
              className="code-field min-h-[300px]"
            />
          </div>
        )}

        {activeTab === 'visual' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Header Configuration */}
            <div className="card p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider t3">Header Settings</h4>
              
              <div>
                <label className="field-label">Header Title</label>
                <input
                  type="text"
                  value={visualVal.headerTitle}
                  onChange={(e) => handleVisualChange('headerTitle', e.target.value)}
                  placeholder="Welcome to MailFlow"
                  className="input-field"
                />
              </div>

              <div>
                <label className="field-label">Header Subtitle</label>
                <input
                  type="text"
                  value={visualVal.headerSubtitle}
                  onChange={(e) => handleVisualChange('headerSubtitle', e.target.value)}
                  placeholder="Your visual email automation tool"
                  className="input-field"
                />
              </div>

              <div>
                <label className="field-label">Header Color Theme</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={visualVal.headerBg}
                    onChange={(e) => handleVisualChange('headerBg', e.target.value)}
                    className="w-10 h-10 border border-theme rounded cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={visualVal.headerBg}
                    onChange={(e) => handleVisualChange('headerBg', e.target.value)}
                    className="input-field max-w-[120px]"
                  />
                </div>
              </div>
            </div>

            {/* CTA Button & Footer Configuration */}
            <div className="card p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider t3">Action & Footer Settings</h4>

              <div>
                <label className="field-label">Button Text (CTA)</label>
                <input
                  type="text"
                  value={visualVal.buttonText}
                  onChange={(e) => handleVisualChange('buttonText', e.target.value)}
                  placeholder="Click Here"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="field-label">Button Link</label>
                  <input
                    type="text"
                    value={visualVal.buttonUrl}
                    onChange={(e) => handleVisualChange('buttonUrl', e.target.value)}
                    placeholder="https://example.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="field-label">Button Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={visualVal.buttonBg}
                      onChange={(e) => handleVisualChange('buttonBg', e.target.value)}
                      className="w-10 h-10 border border-theme rounded cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={visualVal.buttonBg}
                      onChange={(e) => handleVisualChange('buttonBg', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="field-label">Footer Text</label>
                <input
                  type="text"
                  value={visualVal.footerText}
                  onChange={(e) => handleVisualChange('footerText', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Email Body text - stretches full width */}
            <div className="md:col-span-2 space-y-1">
              <label className="field-label">Visual Email Main Body Content</label>
              <textarea
                value={visualVal.bodyText}
                onChange={(e) => handleVisualChange('bodyText', e.target.value)}
                placeholder="Dear {{Name}},&#10;&#10;Enter the main text here. Use markdown-like newlines to separate paragraphs."
                rows={6}
                className="textarea-field min-h-[150px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
