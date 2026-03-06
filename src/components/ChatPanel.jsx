/**
 * ChatPanel - Displays conversation messages and handles chat input
 */

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PlanDiff } from './PlanDiff';
import './ChatInterface.css';

// Clean monochrome bot avatar – no pixel art, no color
const BotAvatar = () => (
  <div className="bot-avatar">
    <svg width="42" height="42" viewBox="20 5 80 80" xmlns="http://www.w3.org/2000/svg">
      <g>
        <g fill="currentColor">
          <rect x="40" y="10" width="40" height="10" />
          <rect x="30" y="20" width="10" height="20" />
          <rect x="80" y="20" width="10" height="20" />
          <rect x="40" y="40" width="40" height="10" />
          <rect x="28" y="50" width="14" height="25" />
          <rect x="78" y="50" width="14" height="25" />
          <rect x="50" y="25" width="5" height="10" />
          <rect x="65" y="25" width="5" height="10" />
        </g>
      </g>
    </svg>
  </div>
);

const UserAvatar = () => (
  <div className="user-avatar-pill">
    <span style={{ fontSize: '18px', fontWeight: 600 }}>U</span>
  </div>
);

export const ChatPanel = ({
  messages = [],
  isLoading = false,
  planId,
  onSendMessage,
  chatEnabled = false,
  planData,
  onBack
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea on input change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  // Detect if user has scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending || !onSendMessage) return;

    setIsSending(true);
    try {
      await onSendMessage(inputValue);
      setInputValue('');
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages: attach execution log steps to the subsequent agent message
  const grouped = [];
  let pendingSteps = [];

  messages.forEach((msg) => {
    const isTerminal = ['complete', 'plan_completed', 'plan_failed', 'response'].includes(msg.type);
    const isChatMessage = msg.type === 'response' || msg.type === 'user_message';
    
    // Status, discovery, and progress messages go into Analysis section (pendingSteps)
    const isAnalysisMessage = ['status', 'discovery', 'progress', 'action_started', 'thinking'].includes(msg.type);

    if (msg.sender === 'user' || msg.type === 'user_message') {
      // User messages always show as message bubbles
      grouped.push({ type: 'single', msg, steps: [], changes: null });
    } else if (isTerminal || isChatMessage) {
      // Terminal and chat messages show as bubbles with attached Analysis section
      const msgChanges = msg.changes || null;
      grouped.push({ type: 'single', msg, steps: pendingSteps, changes: msgChanges });
      pendingSteps = [];
    } else if (isAnalysisMessage) {
      // All analysis messages go into the Analysis section (never as standalone bubbles)
      pendingSteps.push(msg);
    }
    // Any other message types are silently dropped
  });

  if (pendingSteps.length > 0) {
    grouped.push({ type: 'single', msg: null, steps: pendingSteps, changes: null });
  }

  // Minimal SVG dot – NO outline, completely solid
  const DotIcon = ({ type }) => {
    if (type === 'error') {
      return (
        <svg className="step-dot step-dot-error" width="6" height="6" viewBox="0 0 10 10" fill="currentColor">
          <circle cx="5" cy="5" r="5" />
        </svg>
      );
    }
    return (
      <svg className="step-dot step-dot-default" width="6" height="6" viewBox="0 0 10 10" fill="currentColor">
        <circle cx="5" cy="5" r="5" />
      </svg>
    );
  };

  // Parse a feature area name from a step message
  const extractFeatureArea = (content) => {
    // Safety check: ensure content is a string
    if (!content || typeof content !== 'string') return null;
    
    // Match "I've identified X as a critical/important/supporting feature area"
    const identifyMatch = content.match(/I['']ve identified ([^.]+?) as an? (?:critical|important|supporting)/i);
    if (identifyMatch) return identifyMatch[1].trim();
    
    // Match "Starting deep analysis of X"
    const analysisMatch = content.match(/Starting deep analysis of ([^.!]+)/i);
    if (analysisMatch) return analysisMatch[1].trim();
    
    // Match "Exploring [Feature Name]" or "Analyzing [Feature Name]"
    const exploreMatch = content.match(/(?:Exploring|Analyzing)\s+(.+?)(?:\s*[-–—]\s*|$)/i);
    if (exploreMatch) return exploreMatch[1].trim();
    
    // Match messages about creating scenarios for a feature area
    const scenarioMatch = content.match(/(?:Creating scenarios for|Generating test cases for)\s+(.+?)(?:\s*[-–—]\s*|\.\.\.|\.|$)/i);
    if (scenarioMatch) return scenarioMatch[1].trim();
    
    return null;
  };

  // Group steps into { general, featureAreas: { name -> [{step}] } }
  const groupStepsByArea = (steps) => {
    const general = [];
    const areaOrder = []; // preserve insertion order
    const featureAreas = {}; // name -> steps[]

    steps.forEach(step => {
      const area = extractFeatureArea(step.content);
      if (!area) {
        general.push(step);
      } else {
        // Find best matching existing area (fuzzy – handle minor wording diff)
        const key = areaOrder.find(k =>
          k.toLowerCase() === area.toLowerCase() ||
          area.toLowerCase().startsWith(k.toLowerCase()) ||
          k.toLowerCase().startsWith(area.toLowerCase())
        ) || area;
        if (!featureAreas[key]) {
          featureAreas[key] = [];
          areaOrder.push(key);
        }
        featureAreas[key].push(step);
      }
    });

    return { general, areaOrder, featureAreas };
  };

  const FeatureAreaGroup = ({ name, steps: areaSteps }) => {
    const [open, setOpen] = useState(false);

    // Determine priority badge from the step content
    let priority = null;
    const firstStep = areaSteps[0]?.content || '';
    if (/critical/i.test(firstStep)) priority = 'critical';
    else if (/important/i.test(firstStep)) priority = 'important';
    else if (/supporting/i.test(firstStep)) priority = 'supporting';

    const priorityColor = {
      critical: '#dc2626',
      important: '#d97706',
      supporting: '#6b7280',
    }[priority] || '#6b7280';

    return (
      <div className="fa-group">
        <button className="fa-toggle" onClick={() => setOpen(v => !v)}>
          <svg
            className="fa-chevron"
            style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
            width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="fa-name">{name}</span>
          {priority && (
            <span className="fa-badge" style={{ color: priorityColor }}>
              {priority}
            </span>
          )}
        </button>
        {open && (
          <div className="fa-steps">
            {areaSteps.map((step, i) => (
              <div key={i} className={`exec-log-step${step.type === 'error' ? ' exec-log-step--error' : ''}`}>
                <div className="exec-log-step-line">
                  <svg className={`step-dot ${step.type === 'error' ? 'step-dot-error' : 'step-dot-default'}`} width="5" height="5" viewBox="0 0 10 10" fill="currentColor">
                    <circle cx="5" cy="5" r="5" />
                  </svg>
                </div>
                <div className="exec-log-step-body">
                  <span className="exec-log-step-text">{step.content}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const AgentExecutionLog = ({ steps, isGenerating }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const lastStep = steps[steps.length - 1];
    const { general, areaOrder, featureAreas } = groupStepsByArea(steps);
    const hasFeatureAreas = areaOrder.length > 0;

    return (
      <div className="exec-log">
        {/* Toggle row */}
        <button className="exec-log-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          <svg
            className="exec-log-chevron"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="exec-log-label">Analysis</span>
          {hasFeatureAreas && (
            <span className="exec-log-area-count">{areaOrder.length} areas</span>
          )}
        </button>

        {isExpanded && (
          <div className="exec-log-body">
            {/* General steps before any feature area */}
            {general.length > 0 && (
              <div className="exec-log-timeline exec-log-general">
                {general.map((item, idx) => (
                  <div key={idx} className={`exec-log-step${item.type === 'error' ? ' exec-log-step--error' : ''}`}>
                    <div className="exec-log-step-line"><DotIcon type={item.type} /></div>
                    <div className="exec-log-step-body">
                      <span className="exec-log-step-text">{item.content}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Feature area groups */}
            {hasFeatureAreas && (
              <div className="fa-group-list">
                {areaOrder.map(area => (
                  <FeatureAreaGroup key={area} name={area} steps={featureAreas[area]} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live spinner while generating */}
        {isGenerating && lastStep && (
          <div className="exec-log-live">
            <div className="typing-spinner" />
            <span className="exec-log-live-text">{lastStep.content}</span>
          </div>
        )}
      </div>
    );
  };


  const renderGroup = (item, index) => {
    const { msg, steps, changes } = item;
    const isUser = msg?.sender === 'user' || msg?.type === 'user_message';
    const isLast = index === grouped.length - 1;

    if (!msg) {
      return (
        <div key={`pending-${index}`} className="message-row">
          <div className="message-wrapper assistant">
            <div className="message-avatar-container">
              <BotAvatar />
            </div>
            <div className="message-content">
              <AgentExecutionLog steps={steps} isGenerating={isLoading && isLast} />
            </div>
          </div>
        </div>
      );
    }

    const isTerminalMessage = ['complete', 'plan_completed', 'plan_failed', 'response'].includes(msg.type);

    return (
      <div key={`msg-${index}`} className="message-row">
        <div className={`message-wrapper ${isUser ? 'user' : 'assistant'}`}>
          <div className="message-avatar-container">
            {isUser ? <UserAvatar /> : <BotAvatar />}
          </div>
          <div className="message-content">
            {!isUser && steps && steps.length > 0 && (
              <AgentExecutionLog steps={steps} isGenerating={isLoading && isLast && !msg} />
            )}

            {isTerminalMessage ? (
              <>
                <div className="message-bubble assistant-bubble">
                  <Message content={msg.content} data={msg.data} changes={changes} />
                </div>
                {changes && Array.isArray(changes) && changes.length > 0 && (
                  <PlanDiff changes={changes} />
                )}
              </>
            ) : (
              <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
                {msg.content}
                {isUser && msg.attachments && msg.attachments.length > 0 && (
                  <div className="message-attachments">
                    {msg.attachments.map((att, i) => {
                      if (att.type === 'image') {
                        const raw = att.base64Data ?? att.file;
                        const src = !raw ? null : (typeof raw === 'string' && raw.startsWith('data:') ? raw : `data:${att.mimeType || 'image/png'};base64,${raw}`);
                        if (!src) return null;
                        return (
                          <div key={i} className="attachment-image-wrapper">
                            <img src={src} alt={att.name || 'Attachment'} className="attachment-image" />
                          </div>
                        );
                      }
                      if (att.type === 'file') {
                        return (
                          <div key={i} className="attachment-file-wrapper">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="attachment-filename">{att.name || 'Document.pdf'}</span>
                          </div>
                        );
                      }
                      if (att.type === 'azure' || att.type === 'figma') {
                        const icon = att.type === 'azure' ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#0078D4"><path d="M5.4 17.5l-4.5-5.2 2.6-3.8 6.5-1.9-4.6 10.9zm7.2-12.3l6.5-1.9 2.6 3.8-4.5 5.2-4.6-7.1zM11.6 14l-2.4 7-6-6.9 2.8 1.5 5.6-1.6zm.8 0l5.6 1.6 2.8-1.5-6 6.9-2.4-7z"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#F24E1E"><path d="M12 12A3.5 3.5 0 108.5 8.5V12H12z"/><path d="M8.5 15.5A3.5 3.5 0 1012 12H8.5v3.5z"/><path d="M12 5A3.5 3.5 0 108.5 8.5 3.5 3.5 0 0012 5z"/><path d="M15.5 5A3.5 3.5 0 1012 8.5 3.5 3.5 0 0015.5 5z"/><path d="M12 15.5a3.5 3.5 0 103.5-3.5H12v3.5z"/></svg>
                        );
                        return (
                          <a key={i} href={att.link} target="_blank" rel="noopener noreferrer" className="attachment-link-wrapper">
                            {icon}
                            <span className="attachment-link-text">{att.link}</span>
                          </a>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages" ref={messagesContainerRef}>
        {grouped.map(renderGroup)}
        {isLoading && grouped.length === 0 && (
          <div className="message-row">
            <div className="message-wrapper assistant">
              <div className="message-avatar-container">
                <BotAvatar />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Show thinking indicator only when waiting for response AND no analysis steps exist */}
        {isLoading && grouped.length > 0 && (() => {
          // Check if the last group has steps (analysis section)
          const lastGroup = grouped[grouped.length - 1];
          const hasSteps = lastGroup && lastGroup.steps && lastGroup.steps.length > 0;
          
          // Only show "Thinking..." if there are no analysis steps
          if (hasSteps) return null;
          
          return (
            <div className="message-row">
              <div className="message-wrapper assistant">
                <div className="message-avatar-container">
                  <BotAvatar />
                </div>
                <div className="message-content">
                  <div className="message-bubble assistant-bubble thinking-bubble">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span style={{ marginLeft: '12px', color: '#6b7280', fontSize: '14px' }}>Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button
          className="scroll-to-bottom-button"
          onClick={scrollToBottom}
          title="Scroll to bottom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        </button>
      )}

      {chatEnabled && (
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about the test plan..."
              disabled={isSending || isLoading}
            />
            <button
              className="chat-send-button"
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending || isLoading}
              title={isSending ? 'Sending...' : 'Send message'}
            >
              {isSending ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeDasharray="4 2" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Markdown renderer for completion reports and chat responses
const Message = ({ content, data, changes }) => {
  // Safety check for undefined content
  if (!content) {
    return <div className="completion-report">No content available</div>;
  }

  return (
    <div className="completion-report">
      {/* Show changes badge if modifications were made */}
      {changes && Array.isArray(changes) && changes.length > 0 && (
        <>
          <div className={`changes-badge changes-badge-${getChangeType(changes)}`}>
            {changes.length} change{changes.length > 1 ? 's' : ''} made
          </div>
          <div className="changes-list">
            {changes.map((change, idx) => (
              <div key={idx} className="changes-list-item">
                {change.action === 'delete_scenario' && `Deleted scenario: ${change.scenario}`}
                {change.action === 'delete_test_case' && `Deleted test case: ${change.test_case} from ${change.scenario}`}
                {change.action === 'modify_scenario' && `Modified scenario: ${change.scenario}`}
                {change.action === 'modify_test_case' && `Modified test case: ${change.test_case}`}
                {change.action === 'modify_test_steps' && `Modified test steps: ${change.test_case} in ${change.scenario}`}
                {change.action === 'replan_scenario' && `Replanned scenario: ${change.scenario} (${change.new_test_cases} test cases)`}
                {change.action === 'replan_test_case' && `Replanned test case: ${change.test_case}`}
                {change.action === 'add_scenario' && `Added scenario: ${change.scenario} (${change.test_cases} test cases)`}
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Use ReactMarkdown for proper markdown rendering */}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};

// Helper function to determine the change type for styling
const getChangeType = (changes) => {
  if (!changes || changes.length === 0) return 'default';
  
  const firstAction = changes[0].action;
  
  if (firstAction === 'delete_scenario' || firstAction === 'delete_test_case') {
    return 'delete';
  }
  if (firstAction === 'modify_scenario' || firstAction === 'modify_test_case' || firstAction === 'modify_test_steps') {
    return 'modify';
  }
  if (firstAction === 'replan_scenario' || firstAction === 'replan_test_case') {
    return 'replan';
  }
  if (firstAction === 'add_scenario') {
    return 'add';
  }
  return 'default';
};
