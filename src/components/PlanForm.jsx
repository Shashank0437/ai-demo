/**
 * PlanForm - KaneAI-style "What is your objective today?" prompt layout
 */

import { useState } from 'react';
import { generatePlanId } from '../api/client';
import './PlanForm.css';

// Bot Icon
const BotIcon = () => (
  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="20" width="40" height="32" rx="8" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" />
    <circle cx="32" cy="14" r="4" fill="#9CA3AF" />
    <line x1="32" y1="18" x2="32" y2="20" stroke="#9CA3AF" strokeWidth="2" />
    <rect x="6" y="30" width="6" height="14" rx="3" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.5" />
    <rect x="52" y="30" width="6" height="14" rx="3" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.5" />
    <circle cx="24" cy="34" r="4" fill="#9CA3AF" />
    <circle cx="40" cy="34" r="4" fill="#9CA3AF" />
    <path d="M26 44 C28 47 36 47 38 44" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
  </svg>
);

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
  </svg>
);

const AttachIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const MicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const BrowserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

const AppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
    <line x1="12" y1="18" x2="12.01" y2="18"></line>
  </svg>
);

export const PlanForm = ({ onSubmit, recentPlans = [], initialPrompt = '' }) => {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim() && !url.trim()) {
      alert('Please enter a description or URL');
      return;
    }

    setIsSubmitting(true);

    const planId = generatePlanId();
    const planData = {
      id: planId,
      url: url.trim() || 'https://example.com',
      prompt: prompt.trim() || 'Generate a comprehensive test plan for this website.',
      user_id: 'demo-user',
    };

    onSubmit(planData);
  };

  return (
    <div className="pf-centered-layout">
      <div className="pf-center-content">
        {/* Bot Icon */}
        <div className="pf-bot-icon">
          <BotIcon />
        </div>

        {/* Main Heading */}
        <h1 className="pf-main-question">What is your objective today?</h1>

        {/* Input Card */}
        <div className="pf-input-card">
          <form className="pf-input-form" onSubmit={handleSubmit}>
            {/* URL Row */}
            <div className="pf-url-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <input
                type="url"
                className="pf-url-input"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            {/* Textarea */}
            <div className="pf-textarea-wrap">
              <ImageIcon />
              <textarea
                className="pf-textarea"
                placeholder="Upload a screenshot or short video of the flow and state the goal"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isSubmitting) {
                      const form = e.target.closest('form');
                      if (form) form.requestSubmit();
                    }
                  }
                }}
                rows={2}
              />
            </div>

            {/* Toolbar */}
            <div className="pf-input-toolbar">
              <div className="pf-toolbar-left">
                <SparkleIcon />
                <button type="submit" className="pf-generate-pill" disabled={isSubmitting}>
                  <ImageIcon />
                  <span>{isSubmitting ? 'Generating...' : 'Generate scenarios'}</span>
                </button>
              </div>
              <div className="pf-toolbar-right">
                <button type="button" className="pf-toolbar-icon-btn" title="Settings">
                  <SettingsIcon />
                </button>
                <button type="button" className="pf-toolbar-icon-btn" title="Attach file">
                  <AttachIcon />
                </button>
                <button type="button" className="pf-toolbar-icon-btn" title="Voice input">
                  <MicIcon />
                </button>
                <button type="submit" className="pf-send-btn" disabled={isSubmitting}>
                  <SendIcon />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Bottom Action Pills */}
        <div className="pf-action-pills">
          <button className="pf-action-pill" onClick={handleSubmit}>
            <SparkleIcon />
            <span>Author Browser Test</span>
          </button>
          <button className="pf-action-pill" onClick={() => alert('Coming Soon')}>
            <AppIcon />
            <span>Author App Test</span>
          </button>
        </div>

        {/* Recent Plans */}
        {recentPlans.length > 0 && (() => {
          const totalPages = Math.ceil(recentPlans.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const currentPlans = recentPlans.slice(startIndex, startIndex + itemsPerPage);

          return (
            <div className="pf-recent-plans">
              <div className="pf-recent-header">
                <h3 className="pf-recent-title">Recent Plans</h3>
                {totalPages > 1 && (
                  <div className="pf-pagination">
                    <button
                      className="pf-page-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >←</button>
                    <span className="pf-page-info">{currentPage} / {totalPages}</span>
                    <button
                      className="pf-page-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >→</button>
                  </div>
                )}
              </div>

              <div className="pf-plan-grid">
                {currentPlans.map((plan) => (
                  <button
                    key={plan.id}
                    className="pf-plan-card"
                    onClick={() => onSubmit({ ...plan, isExisting: true })}
                  >
                    <div className="pf-plan-icon">📄</div>
                    <div className="pf-plan-content">
                      <div className="pf-plan-url" title={plan.url}>{plan.url}</div>
                      <div className="pf-plan-meta">{plan.status}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
