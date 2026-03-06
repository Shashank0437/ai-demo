/**
 * HomePage - KaneAI-style single page
 * Mode toggle is inside the input card toolbar (bottom-left)
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPlans, generatePlanId, listManualPlans, deletePlan, deleteManualPlan } from '../api/client';
import '../pages/AgentHomePage.css';

// Robot/Bot Icon
const BotIcon = () => (
  <svg width="72" height="72" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="20" width="40" height="32" rx="8" fill="#CBD5E1" stroke="#475569" strokeWidth="2" />
    <circle cx="32" cy="14" r="4" fill="#475569" />
    <line x1="32" y1="18" x2="32" y2="20" stroke="#475569" strokeWidth="2" />
    <rect x="6" y="30" width="6" height="14" rx="3" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
    <rect x="52" y="30" width="6" height="14" rx="3" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
    <circle cx="24" cy="34" r="4" fill="#475569" />
    <circle cx="40" cy="34" r="4" fill="#475569" />
    <path d="M26 44 C28 47 36 47 38 44" stroke="#475569" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const PlannerIcon = () => (
  <svg width="20" height="20" viewBox="4 10 92 74" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M39.3,32.1H60.7a2,2,0,0,0,2-2v-4a6,6,0,0,0-5.8-6H43.3a5.91,5.91,0,0,0-5.8,6v4A1.74,1.74,0,0,0,39.3,32.1Z" />
    <path d="M71.4,25.2h-2a.94.94,0,0,0-1,1v4a7.9,7.9,0,0,1-7.8,7.9H39.3a7.9,7.9,0,0,1-7.8-7.9v-4a.94.94,0,0,0-1-1h-2a5.91,5.91,0,0,0-5.8,6V73.8a6,6,0,0,0,5.8,6H71.4a5.91,5.91,0,0,0,5.8-6V31.2A5.79,5.79,0,0,0,71.4,25.2ZM68.7,73a1.49,1.49,0,0,1-1.2,1.2H56.3c-.7,0-1-.8-.3-1.3l3.6-3.8-7-7H32.4a1.07,1.07,0,0,1-1-1V56.6a1.08,1.08,0,0,1,1-1H52.6l6.9-7L55.9,45c-.5-.6-.3-1.4.4-1.4H67.4a1.49,1.49,0,0,1,1.2,1.2V55.9c0,.7-.8,1-1.3.3l-3.6-3.5-6.2,6.2L63.7,65l3.6-3.6c.6-.5,1.4-.3,1.4.4Z" />
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

const ChecklistIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

// Manual mode icons
const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const CameraIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const AzureDevOpsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path fill="url(#azure-devops-color-16__paint0_linear_707_116)" d="M15 3.622v8.512L11.5 15l-5.425-1.975v1.958L3.004 10.97l8.951.7V4.005L15 3.622zm-2.984.428L6.994 1v2.001L2.382 4.356 1 6.13v4.029l1.978.873V5.869l9.038-1.818z" />
    <defs>
      <linearGradient id="azure-devops-color-16__paint0_linear_707_116" x1="8" x2="8" y1="14.956" y2="1.026" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0078D4" />
        <stop offset=".16" stopColor="#1380DA" />
        <stop offset=".53" stopColor="#3C91E5" />
        <stop offset=".82" stopColor="#559CEC" />
        <stop offset="1" stopColor="#5EA0EF" />
      </linearGradient>
    </defs>
  </svg>
);

const FigmaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path fill="#1ABCFE" d="M8.55 8c0-1.289 1.019-2.333 2.275-2.333C12.082 5.667 13.1 6.71 13.1 8c0 1.289-1.018 2.333-2.275 2.333C9.57 10.333 8.55 9.29 8.55 8z" />
    <path fill="#0ACF83" d="M4 12.667c0-1.289 1.019-2.334 2.275-2.334H8.55v2.334C8.55 13.955 7.531 15 6.275 15S4 13.955 4 12.667z" />
    <path fill="#FF7262" d="M8.55 1v4.667h2.275c1.257 0 2.275-1.045 2.275-2.334C13.1 2.045 12.082 1 10.825 1H8.55z" />
    <path fill="#F24E1E" d="M4 3.333c0 1.289 1.019 2.334 2.275 2.334H8.55V1H6.275C5.019 1 4 2.045 4 3.333z" />
    <path fill="#A259FF" d="M4 8c0 1.289 1.019 2.333 2.275 2.333H8.55V5.667H6.275C5.019 5.667 4 6.71 4 8z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

// Mode configs
const MODES = {
  planner: {
    heading: 'Agentic UI Testcases Planner',
    subtitle: 'Ready to transform your requirements into test specifications.\nEnter a website URL and describe the feature to begin generating scenarios.',
    placeholder: 'Describe the feature or paste a URL to start planning test cases...',
    label: 'Plan Test Cases',
    icon: <PlannerIcon />,
    color: 'planner',
    showUrl: true,
  },
  author: {
    heading: 'Quick Author',
    subtitle: 'Quickly author browser-based test cases with AI assistance.',
    placeholder: 'Describe the test flow you want to automate...',
    label: 'Quick Author',
    icon: <ImageIcon />,
    color: 'author',
    showUrl: false,
  },
  manual: {
    heading: 'Manual Test Case Generator',
    subtitle: 'Generate comprehensive manual test cases from your requirements.\nAttach context like files, images, or link tickets for better results.',
    placeholder: 'Describe the feature or requirement for manual test cases...',
    label: 'Manual TestCases',
    icon: <ChecklistIcon />,
    color: 'manual',
    showUrl: false,
  },
};

export const HomePage = () => {
  const navigate = useNavigate();
  const [recentPlans, setRecentPlans] = useState([]);
  const [activeMode, setActiveMode] = useState('planner');
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('Create a comprehensive test plan for this website.');

  // Update prompt when mode changes
  useEffect(() => {
    if (activeMode === 'manual') {
      setPrompt('Generate comprehensive manual test cases covering functional, UI, and relevant non-functional scenarios, including positive and negative flows, with detailed and feasible steps.');
    } else if (activeMode === 'planner') {
      setPrompt('Create a comprehensive test plan for this website.');
    } else if (activeMode === 'author') {
      setPrompt('Describe the test flow you want to automate...');
    }
    setCurrentPage(1);
  }, [activeMode]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recentPlansOpen, setRecentPlansOpen] = useState(false);
  // Manual mode state
  const [manualContext, setManualContext] = useState('browser');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [azureLink, setAzureLink] = useState('');
  const [figmaLink, setFigmaLink] = useState('');
  const [showAzureInput, setShowAzureInput] = useState(false);
  const [showFigmaInput, setShowFigmaInput] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const itemsPerPage = 10;

  const mode = MODES[activeMode];

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [plans, manualPlans] = await Promise.all([listPlans(), listManualPlans()]);
        // Combine and sort them by date descending
        const combined = [...plans, ...manualPlans].sort((a, b) => {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
        if (mounted) setRecentPlans(combined);
      } catch (error) {
        console.error('Error loading recent plans:', error);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleMode = () => {
    setActiveMode(prev => prev === 'planner' ? 'author' : 'planner');
  };

  const handleFileAttach = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const f of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result.split(',')[1];
        setAttachedFiles(prev => [...prev, { 
          name: f.name, 
          type: 'file', 
          size: f.size, 
          mimeType: f.type,
          base64Data 
        }]);
      };
      reader.readAsDataURL(f);
    }
    e.target.value = '';
  };

  const handleImageAttach = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const f of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result.split(',')[1];
        setAttachedFiles(prev => [...prev, { 
          name: f.name, 
          type: 'image', 
          size: f.size, 
          mimeType: f.type,
          base64Data 
        }]);
      };
      reader.readAsDataURL(f);
    }
    e.target.value = '';
  };

  const handleAddAzureLink = () => {
    if (azureLink.trim()) {
      setAttachedFiles(prev => [...prev, { name: azureLink.trim(), type: 'azure' }]);
      setAzureLink('');
      setShowAzureInput(false);
    }
  };

  const handleAddFigmaLink = () => {
    if (figmaLink.trim()) {
      setAttachedFiles(prev => [...prev, { name: figmaLink.trim(), type: 'figma' }]);
      setFigmaLink('');
      setShowFigmaInput(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  /** Prevents double submit (e.g. double-click or form + button). Set synchronously so second invocation is no-op. */
  const submitGuardRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitGuardRef.current) return;
    submitGuardRef.current = true;

    if (!prompt.trim() && !url.trim() && activeMode !== 'manual') {
      alert('Please enter a description or URL');
      submitGuardRef.current = false;
      return;
    }
    if (!prompt.trim() && activeMode === 'manual') {
      alert('Please enter a description');
      submitGuardRef.current = false;
      return;
    }

    setIsSubmitting(true);
    const planId = generatePlanId();

    const state = {
      isNew: true,
      prompt: prompt.trim() || 'Generate a comprehensive test plan for this website.',
      user_id: 'demo-user',
      mode: activeMode,
    };

    if (activeMode === 'manual') {
      state.url = '';
      state.manualContext = manualContext;
      state.attachments = attachedFiles.map((f) => {
        if (f.type === 'azure' || f.type === 'figma') {
          return { type: f.type, link: f.name };
        }
        return {
          type: f.type,
          name: f.name,
          mimeType: f.mimeType,
          base64Data: f.base64Data
        };
      });
    } else {
      state.url = url.trim() || 'https://example.com';
    }

    navigate(`/plans/${planId}`, { state });
  };

  const handleExistingPlan = (plan) => {
    navigate(`/plans/${plan.id}`, { state: { mode: plan.url === 'Manual Context' ? 'manual' : 'planner' } });
  };

  const filteredPlans = recentPlans.filter(p =>
    activeMode === 'manual'
      ? p.url === 'Manual Context'
      : p.url !== 'Manual Context'
  );
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPlans = filteredPlans.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="ah-centered-layout">
      {/* Main centered prompt area */}
      <div className="ah-center-content">
        {/* Bot Icon */}
        <div className="ah-bot-icon">
          <BotIcon />
        </div>

        {/* Heading + Subtitle */}
        <h1 className="ah-main-question bold">{mode.heading}</h1>
        <p className="ah-subtitle">{mode.subtitle}</p>

        {/* Input Card */}
        <div className="ah-input-card">
          <form onSubmit={handleSubmit} className="ah-input-form">
            {/* URL Row — only in planner mode */}
            {mode.showUrl && (
              <div className="ah-url-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <input
                  type="url"
                  className="ah-url-input"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            )}

            {/* Manual Mode: Context Toggle */}
            {activeMode === 'manual' && (
              <div className="ah-context-row">
                <div className="ah-context-toggle">
                  <button
                    type="button"
                    className={`ah-ctx-btn ${manualContext === 'browser' ? 'active' : ''}`}
                    onClick={() => setManualContext('browser')}
                  >
                    <GlobeIcon />
                    <span>Browser</span>
                  </button>
                  <button
                    type="button"
                    className={`ah-ctx-btn ${manualContext === 'app' ? 'active' : ''}`}
                    onClick={() => setManualContext('app')}
                  >
                    <PhoneIcon />
                    <span>App</span>
                  </button>
                </div>
              </div>
            )}

            {/* Main Input */}
            <div className="ah-input-row">
              <textarea
                className="ah-prompt-input"
                placeholder={mode.placeholder}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
            </div>

            {/* Manual Mode: Attachments Bar */}
            {activeMode === 'manual' && (
              <>
                <div className="ah-attachments-bar">
                  <button type="button" className="ah-attach-chip" onClick={() => fileInputRef.current?.click()}>
                    <AttachIcon />
                    <span>Attach Files</span>
                  </button>
                  <button type="button" className="ah-attach-chip" onClick={() => imageInputRef.current?.click()}>
                    <CameraIcon />
                    <span>Images</span>
                  </button>
                  <button
                    type="button"
                    className={`ah-attach-chip azure ${showAzureInput ? 'active' : ''}`}
                    onClick={() => { setShowAzureInput(!showAzureInput); setShowFigmaInput(false); }}
                  >
                    <AzureDevOpsIcon />
                    <span>Azure DevOps</span>
                  </button>
                  <button
                    type="button"
                    className={`ah-attach-chip figma ${showFigmaInput ? 'active' : ''}`}
                    onClick={() => { setShowFigmaInput(!showFigmaInput); setShowAzureInput(false); }}
                  >
                    <FigmaIcon />
                    <span>Figma</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.md,.doc,.xlsx,.csv"
                    style={{ display: 'none' }}
                    onChange={handleFileAttach}
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageAttach}
                  />
                </div>

                {/* Inline link inputs */}
                {showAzureInput && (
                  <div className="ah-inline-link-input azure">
                    <AzureDevOpsIcon />
                    <input
                      type="text"
                      placeholder="Paste Azure DevOps ticket URL..."
                      value={azureLink}
                      onChange={(e) => setAzureLink(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAzureLink())}
                      autoFocus
                    />
                    <button type="button" className="ah-link-add-btn azure" onClick={handleAddAzureLink}>Add</button>
                  </div>
                )}
                {showFigmaInput && (
                  <div className="ah-inline-link-input figma">
                    <FigmaIcon />
                    <input
                      type="text"
                      placeholder="Paste Figma design URL..."
                      value={figmaLink}
                      onChange={(e) => setFigmaLink(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFigmaLink())}
                      autoFocus
                    />
                    <button type="button" className="ah-link-add-btn figma" onClick={handleAddFigmaLink}>Add</button>
                  </div>
                )}

                {/* Attached items */}
                {attachedFiles.length > 0 && (
                  <div className="ah-attached-items">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className={`ah-attached-pill ${file.type}`}>
                        <span className="ah-pill-icon">
                          {file.type === 'file' && <AttachIcon />}
                          {file.type === 'image' && <CameraIcon />}
                          {file.type === 'azure' && <AzureDevOpsIcon />}
                          {file.type === 'figma' && <FigmaIcon />}
                        </span>
                        <span className="ah-pill-name" title={file.name}>{file.name}</span>
                        <button type="button" className="ah-pill-remove" onClick={() => removeAttachment(index)}>
                          <CloseIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Toolbar — toggle is on the left, icons on the right */}
            <div className="ah-input-toolbar">
              <div className="ah-toolbar-left">
                {/* Composite toggle capsule */}
                <div className="ah-mode-toggle">
                  {Object.entries(MODES).map(([key, m]) => (
                    activeMode === key ? (
                      <button key={key} type="button" className={`ah-toggle-active ${m.color}`}>
                        {m.icon}
                        <span>{m.label}</span>
                      </button>
                    ) : (
                      <button key={key} type="button" className="ah-toggle-inactive" onClick={() => setActiveMode(key)}>
                        {m.icon}
                      </button>
                    )
                  ))}
                </div>
              </div>
              <div className="ah-toolbar-right">
                <button type="submit" className="ah-send-btn" disabled={isSubmitting || (!prompt.trim() && !url.trim() && activeMode !== 'manual') || (!prompt.trim() && activeMode === 'manual')}>
                  <SendIcon />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Recent Plans — collapsible, directly inside center content to respect width */}
        {(activeMode === 'planner' || activeMode === 'manual') && filteredPlans.length > 0 && (
          <div className={`ah-recent-plans ${recentPlansOpen ? 'open' : 'collapsed'}`}>
            <button
              className="ah-recent-toggle-bar"
              onClick={() => setRecentPlansOpen(prev => !prev)}
              type="button"
            >
              <div className="ah-recent-toggle-left">
                <svg
                  className={`ah-chevron ${recentPlansOpen ? 'rotate' : ''}`}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                <h3 className="ah-recent-title">{activeMode === 'manual' ? 'Recent Manual Test Cases' : 'Recent Plans'}</h3>
                <span className="ah-recent-count">{filteredPlans.length}</span>
              </div>
              {totalPages > 1 && recentPlansOpen && (
                <div className="ah-pagination" onClick={(e) => e.stopPropagation()}>
                  <button className="ah-page-btn" disabled={currentPage === 1} onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p - 1); }}>←</button>
                  <span className="ah-page-info">{currentPage} / {totalPages}</span>
                  <button className="ah-page-btn" disabled={currentPage === totalPages} onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }}>→</button>
                </div>
              )}
            </button>
            {recentPlansOpen && (
              <div className="ah-plan-grid">
                {currentPlans.map((plan) => {
                  // Determine best title: explicitly 'title' OR try to use URL/prompt if valid
                  let displayTitle = plan.title;
                  if (!displayTitle) {
                    if (plan.url === 'Manual Context') {
                      displayTitle = plan.user_prompt || plan.prompt || 'Manual Test Cases';
                    } else if (plan.url && plan.url.startsWith('http')) {
                      displayTitle = plan.url;
                    } else {
                      displayTitle = plan.prompt || plan.url || `Plan ${plan.id}`;
                    }
                  }
                  const isManual = plan.url === 'Manual Context';

                  return (
                    <div key={plan.id} className="ah-plan-card-wrapper">
                      <button className="ah-plan-card" onClick={() => handleExistingPlan(plan)}>
                        <div className="ah-plan-icon">{isManual ? '🧪' : '📄'}</div>
                        <div className="ah-plan-content">
                          <div className="ah-plan-url" title={displayTitle}>{displayTitle}</div>
                          <div className="ah-plan-meta">{isManual ? 'Manual' : ''} {plan.status}</div>
                        </div>
                      </button>
                      <button 
                        className="ah-plan-delete-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this plan?')) {
                            const deleteFn = isManual ? deleteManualPlan : deletePlan;
                            deleteFn(plan.id)
                              .then(() => {
                                // Refresh list
                                const listFn = activeMode === 'manual' ? listManualPlans : listPlans;
                                listFn().then(setRecentPlans);
                              })
                              .catch(err => console.error('Delete failed', err));
                          }
                        }}
                        title="Delete Plan"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
