/**
 * ChatInterface - Main conversation view with split-screen layout
 * Left: Chat messages (SSE events), Right: Results table (polling)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatPanel } from './ChatPanel';
import { ResultsPanel } from './ResultsPanel';
import { ManualResultsPanel } from './ManualResultsPanel';
import { getPlan, getPlanMessages } from '../api/client';
import { useSSE } from '../hooks/useSSE';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import './ChatInterface.css';

export const ChatInterface = ({ planData, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(false);
  const tablePollingRef = useRef(null);
  const initializedRef = useRef(false);

  // Safety check for planData
  if (!planData || !planData.id) {
    console.error('[ChatInterface] Invalid planData:', planData);
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <p style={{ color: '#6b7280' }}>No plan data available</p>
        {onBack && (
          <button onClick={onBack} style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '16px'
          }}>
            Go Back
          </button>
        )}
      </div>
    );
  }

  // Log planData on mount
  useEffect(() => {
    console.log('[ChatInterface] Initialized with planData:', {
      id: planData.id,
      url: planData.url,
      prompt: planData.prompt,
      isExisting: planData.isExisting
    });
  }, []); // Only run once on mount

  // Enable chat for completed plans
  useEffect(() => {
    if (plan && ['completed', 'completed_with_errors'].includes(plan.status)) {
      setChatEnabled(true);
    }
  }, [plan]);

  // Chat WebSocket hook - only enable when chatEnabled is true
  const {
    isConnected: chatConnected,
    chatMessages,
    isProcessing: chatProcessing,
    sendMessage: sendChatMessage,
  } = useChatWebSocket(planData.id, chatEnabled, planData?.mode);


  // ── Message counter for unique IDs ─────────────────────────────────
  const msgIdCounter = useRef(0);

  // ── Add message (with ID-based dedup) ─────────────────────────────
  const addMessage = useCallback((sender, content, timestamp, type = 'normal', count = null, data = null, changes = null, attachments = null) => {
    setMessages((prev) => {
      // Generate unique ID for each message
      const msgId = `${Date.now()}-${msgIdCounter.current++}`;
      return [...prev, { id: msgId, sender, content, timestamp, type, count, data, changes, attachments }];
    });
  }, []);

  // ── SSE callbacks ─────────────────────────────────────────────────
  const handleSSEMessage = useCallback((msg) => {
    const sender = 'agent';
    const count = msg.data?.scenario_count || msg.data?.test_case_count || null;
    addMessage(sender, msg.message, msg.timestamp, msg.type, count);
    
    // Immediately refresh plan data when scenarios or test cases are added
    // Check the original eventType field (before mapping to frontend type)
    if (msg.eventType === 'scenario_saved' || msg.eventType === 'test_case_saved' || msg.eventType === 'plan_completed') {
      console.log('[SSE] Scenario/test case update detected, refreshing plan data immediately');
      
      const mode = planData?.mode;
      const fetchPlanFn = mode === 'manual' 
        ? import('../api/client').then(m => m.getManualPlan)
        : import('../api/client').then(m => m.getPlan);
        
      fetchPlanFn.then(fn => fn(planData.id)).then(planDoc => {
        console.log('[SSE Refresh] Updated plan:', {
          total_scenarios: planDoc.total_scenarios,
          total_test_cases: planDoc.total_test_cases,
          scenarios_count: planDoc.scenarios?.length || 0
        });
        setPlan(planDoc);
      }).catch(err => 
        console.error('[SSE] Failed to refresh plan:', err)
      );
    }
  }, [addMessage, planData?.id, planData?.mode]);

  const handleSSEError = useCallback((errMsg) => {
    addMessage('agent', `Connection error: ${errMsg}`, new Date().toISOString(), 'error');
    setIsLoading(false);
  }, [addMessage]);

  const handleSSEComplete = useCallback((msg) => {
    // Stream rejected by server (already in progress, or plan already completed e.g. after refresh) — don't show error
    const msgLower = (msg.message || '').toLowerCase();
    const isRejection = msgLower.includes('already in progress') || msgLower.includes('already been generated') || msgLower.includes('already completed');
    if (isRejection) {
      setIsLoading(false);
      return;
    }
    // Dedupe: keep only one completion summary (avoids double summary when React Strict Mode or double-SSE runs)
    setMessages((prev) => {
      const withoutCompletion = prev.filter((m) => m.type !== 'complete' && m.type !== 'plan_completed');
      const newId = `${Date.now()}-${msgIdCounter.current++}`;
      return [...withoutCompletion, { id: newId, sender: 'agent', content: msg.message, timestamp: msg.timestamp, type: msg.type, count: null, data: msg.data, changes: null }];
    });
    setIsLoading(false);

    // Refresh plan data from DB after completion so the results panel shows data
    const mode = planData?.mode;
    const fetchFn = mode === 'manual'
      ? import('../api/client').then(m => m.getManualPlan)
      : import('../api/client').then(m => m.getPlan);

    fetchFn.then(fn => fn(planData.id)).then(planDoc => {
      console.log('[SSE Complete] Final plan refresh:', {
        total_scenarios: planDoc.total_scenarios,
        total_test_cases: planDoc.total_test_cases,
      });
      setPlan(planDoc);
    }).catch(err =>
      console.error('[SSE Complete] Failed to refresh plan:', err)
    );
  }, [addMessage, planData?.id, planData?.mode]);

  // Final table fetch (chatEnabled will be set by useEffect when plan loads)
  useEffect(() => {
    if (!planData?.id) return;
    const { mode } = planData;
    const fetchPlan = async () => {
      try {
        if (mode === 'manual') {
          const { getManualPlan } = await import('../api/client');
          const doc = await getManualPlan(planData.id);
          setPlan(doc);
        } else {
          const doc = await getPlan(planData.id);
          setPlan(doc);
        }
      } catch (err) {
        console.error('Error fetching final plan', err);
      }
    };
    fetchPlan();
  }, [addMessage, planData?.id, planData?.mode]);

  // ── Connect SSE for new plans ─────────────────────────────────────
  // Only pass planData when it's a new plan that needs streaming
  const ssePayload = (planData && !planData.isExisting) ? planData : null;
  
  // Debug logging
  useEffect(() => {
    if (planData) {
      console.log('[ChatInterface] planData updated:', {
        id: planData.id,
        isExisting: planData.isExisting,
        hasUrl: !!planData.url,
        hasPrompt: !!planData.prompt,
        hasUserId: !!planData.user_id,
        ssePayloadIsNull: ssePayload === null
      });
    }
  }, [planData, ssePayload]);
  
  const { disconnect } = useSSE(
    ssePayload,
    handleSSEMessage,
    handleSSEError,
    handleSSEComplete,
  );

  // ── Initialize ────────────────────────────────────────────────────
  useEffect(() => {
    if (!planData || initializedRef.current) return;
    initializedRef.current = true;

    if (planData.isExisting) {
      // ── Existing plan: always replay from MongoDB ──
      // This covers all plans regardless of their stored status
      setIsLoading(false);

      const mode = planData.mode;

      if (mode === 'manual') {
        import('../api/client').then(({ getManualPlan, getManualPlanMessages }) => {
          getManualPlan(planData.id).then(planDoc => {
            setPlan(planDoc);
            
            getManualPlanMessages(planData.id).then(messagesData => {
              const allMessages = messagesData.messages || [];
              if (allMessages.length > 0) {
                let firstUserMsgFound = false;
                allMessages.forEach((msg) => {
                  if (msg.method === 'conversation') {
                    const sender = msg.role === 'user' ? 'user' : 'agent';
                    const type = sender === 'user' ? 'user_message' : 'response';
                    
                    let msgAttachments = null;
                    if (sender === 'user' && !firstUserMsgFound) {
                      firstUserMsgFound = true;
                      msgAttachments = planDoc.attachments || null;
                    }
                    
                    addMessage(sender, msg.content, msg.timestamp, type, null, msg.data || null, msg.changes_made || msg.changes || null, msgAttachments);
                    return;
                  }
                  let content = msg.content;
                  let data = msg.data || null;
                  if (msg.type === 'plan_completed' && data && !data.coverage && planDoc) {
                    const scenarios = planDoc.scenarios || [];
                    const typeCount = { Positive: 0, Negative: 0, Edge: 0, 'UI Validation': 0 };
                    const priorityCount = { P1: 0, P2: 0, P3: 0, P4: 0 };
                    scenarios.forEach(scenario => {
                      (scenario.test_cases || []).forEach(tc => {
                        if (Object.hasOwn(typeCount, tc.type)) typeCount[tc.type]++;
                        if (Object.hasOwn(priorityCount, tc.priority)) priorityCount[tc.priority]++;
                      });
                    });
                    data = {
                      ...data,
                      total_scenarios: planDoc.total_scenarios || 0,
                      total_test_cases: planDoc.total_test_cases || 0,
                      coverage: { by_type: typeCount, by_priority: priorityCount },
                      url: planDoc.url || '',
                    };
                    const tcTotal = planDoc.total_test_cases || 0;
                    content = content.replace(
                      /All generated scenarios and test cases are now available/,
                      `**Test Coverage Summary:**\n- Total Scenarios: **${data.total_scenarios}**\n- Total Test Cases: **${tcTotal}**\n- Positive Tests: **${typeCount.Positive}**\n- Negative Tests: **${typeCount.Negative}**\n- Edge Case Tests: **${typeCount.Edge}**\n- UI Validation Tests: **${typeCount['UI Validation']}**\n\nAll generated scenarios and test cases are now available`
                    );
                  }
                  const msgType = msg.role === 'user' ? 'normal' : (msg.type || 'normal');
                  addMessage(msg.role === 'user' ? 'user' : 'agent', content, msg.timestamp, msgType, null, data);
                });
              } else {
                const summary = generateCompletionSummary(planDoc);
                addMessage('agent', summary, new Date().toISOString(), 'complete');
              }
            }).catch(_msgError => {
              console.warn('Could not load detailed plan messages, falling back to summary:', _msgError.message);
              let basePrompt = planDoc.user_prompt || planDoc.prompt || 'Create test plan';
              if (planDoc.url && planDoc.url !== 'Manual Context' && !basePrompt.toLowerCase().includes(planDoc.url.toLowerCase())) {
                basePrompt = `${basePrompt} (${planDoc.url})`;
              }
              addMessage('user', basePrompt, new Date().toISOString(), 'normal');
              const summary = generateCompletionSummary(planDoc);
              addMessage('agent', summary, new Date().toISOString(), 'complete');
            });
          }).catch(_error => {
            console.error('Error loading plan:', _error);
            addMessage('agent', 'Failed to load plan history.', new Date().toISOString(), 'error');
          });
        });
      } else {
        getPlan(planData.id).then(planDoc => {
          setPlan(planDoc);
          getPlanMessages(planData.id).then(messagesData => {
            const allMessages = messagesData.messages || [];
            if (allMessages.length > 0) {
              allMessages.forEach((msg) => {
                if (msg.method === 'conversation') {
                  const sender = msg.role === 'user' ? 'user' : 'agent';
                  const type = sender === 'user' ? 'user_message' : 'response';
                  addMessage(sender, msg.content, msg.timestamp, type, null, msg.data || null, msg.changes_made || msg.changes || null);
                  return;
                }
                let content = msg.content;
                let data = msg.data || null;
                if (msg.type === 'plan_completed' && data && !data.coverage && planDoc) {
                  const scenarios = planDoc.scenarios || [];
                  const typeCount = { Positive: 0, Negative: 0, Edge: 0, 'UI Validation': 0 };
                  const priorityCount = { P1: 0, P2: 0, P3: 0, P4: 0 };
                  scenarios.forEach(scenario => {
                    (scenario.test_cases || []).forEach(tc => {
                      if (Object.hasOwn(typeCount, tc.type)) typeCount[tc.type]++;
                      if (Object.hasOwn(priorityCount, tc.priority)) priorityCount[tc.priority]++;
                    });
                  });
                  data = {
                    ...data,
                    total_scenarios: planDoc.total_scenarios || 0,
                    total_test_cases: planDoc.total_test_cases || 0,
                    coverage: { by_type: typeCount, by_priority: priorityCount },
                    url: planDoc.url || '',
                  };
                  const tcTotal = planDoc.total_test_cases || 0;
                  content = content.replace(
                    /All generated scenarios and test cases are now available/,
                    `**Test Coverage Summary:**\n- Total Scenarios: **${data.total_scenarios}**\n- Total Test Cases: **${tcTotal}**\n- Positive Tests: **${typeCount.Positive}**\n- Negative Tests: **${typeCount.Negative}**\n- Edge Case Tests: **${typeCount.Edge}**\n- UI Validation Tests: **${typeCount['UI Validation']}**\n\nAll generated scenarios and test cases are now available`
                  );
                }
                if (msg.type === 'plan_completed' && content.startsWith('Plan completed:')) {
                  const match = content.match(/(\d+) workers succeeded, (\d+) failed, (\d+) feature areas explored/);
                  if (match) {
                    const [_, succeeded, _failed, areas] = match;
                    content = `**Test Plan Generation Complete**\n\nI have finished analyzing the application and generating the test plan. During the discovery phase, I successfully explored **${areas} feature areas**.\n\nThe worker agents generated test scenarios in parallel, and **${succeeded} workers completed successfully**.\n\nAll generated scenarios and test cases are now available in the table on the right. You can expand each section to review the specific steps, outcomes, and priorities.`;
                  }
                }
                addMessage(msg.role === 'user' ? 'user' : 'agent', content, msg.timestamp, msg.type || 'normal', null, data);
              });
            } else {
              const summary = generateCompletionSummary(planDoc);
              addMessage('agent', summary, new Date().toISOString(), 'complete');
            }
          }).catch(_msgError => {
            console.warn('Could not load detailed plan messages, falling back to summary:', _msgError.message);
            let basePrompt = planDoc.prompt || 'Create test plan';
            if (planDoc.url && !basePrompt.toLowerCase().includes(planDoc.url.toLowerCase())) {
              basePrompt = `${basePrompt} (${planDoc.url})`;
            }
            addMessage('user', basePrompt, new Date().toISOString(), 'normal');
            const summary = generateCompletionSummary(planDoc);
            addMessage('agent', summary, new Date().toISOString(), 'complete');
          });
        }).catch(_error => {
          console.error('Error loading plan:', _error);
          addMessage('agent', 'Failed to load plan history.', new Date().toISOString(), 'error');
        });
      }
      return;
    }

    // ── New plan: SSE is already connecting via useSSE hook ──
    let basePrompt = planData.prompt || 'Create test plan';

    // Make sure we handle manual context gracefully for prompt display
    if (planData.url && planData.url !== 'Manual Context' && basePrompt !== 'View test plan' && !basePrompt.toLowerCase().includes(planData.url.toLowerCase())) {
      basePrompt = `${basePrompt} (${planData.url})`;
    }

    addMessage('user', basePrompt, new Date().toISOString(), 'normal', null, null, null, planData.attachments || null);
    addMessage('agent', 'Starting plan generation...', new Date().toISOString(), 'status');
    
    // Initial fetch with retry logic for new plans
    // Wait a bit for SSE endpoint to create the plan document
    let retryAttempts = 0;
    const maxRetries = 5;
    const initialDelay = 500; // Start with 500ms delay
    
    const fetchInitialPlan = async () => {
      try {
        console.log(`[Init] Fetching initial plan state (attempt ${retryAttempts + 1})`);
        
        const mode = planData.mode;
        let initialPlan;
        
        if (mode === 'manual') {
          const { getManualPlan } = await import('../api/client');
          initialPlan = await getManualPlan(planData.id);
        } else {
          const { getPlan } = await import('../api/client');
          initialPlan = await getPlan(planData.id);
        }
        
        setPlan(initialPlan);
        console.log('[Init] Initial plan fetched successfully');
      } catch (e) {
        if (e.response?.status === 404 && retryAttempts < maxRetries) {
          retryAttempts++;
          const backoffDelay = initialDelay * Math.pow(1.5, retryAttempts - 1); // Exponential backoff
          console.warn(`[Init] Plan not found yet (404), retrying in ${backoffDelay}ms (attempt ${retryAttempts}/${maxRetries})`);
          setTimeout(fetchInitialPlan, backoffDelay);
        } else {
          console.warn('[Init] Plan not found, will retry via polling:', e.message);
        }
      }
    };
    
    // Start initial fetch after a small delay to give SSE time to create the plan
    setTimeout(fetchInitialPlan, 300);

    // Poll for table data while plan is running
    // Use 2 second interval for more responsive updates
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    
    tablePollingRef.current = setInterval(async () => {
      try {
        const mode = planData.mode;
        let planDoc;
        
        if (mode === 'manual') {
          const { getManualPlan } = await import('../api/client');
          planDoc = await getManualPlan(planData.id);
        } else {
          const { getPlan } = await import('../api/client');
          planDoc = await getPlan(planData.id);
        }
        consecutiveErrors = 0; // Reset error counter on success
        console.log('[Polling] Fetched plan:', {
          id: planDoc.id || planDoc._id,
          status: planDoc.status,
          total_scenarios: planDoc.total_scenarios,
          total_test_cases: planDoc.total_test_cases,
          scenarios_count: planDoc.scenarios?.length || 0
        });
        setPlan(planDoc);

        if (['completed', 'completed_with_errors', 'failed', 'stopped'].includes(planDoc.status)) {
          console.log('[Polling] Plan completed, stopping polling');
          if (tablePollingRef.current) {
            clearInterval(tablePollingRef.current);
            tablePollingRef.current = null;
          }
        }
      } catch (e) {
        // Plan might not exist yet or temporary network error
        if (e.response?.status === 404) {
          console.warn('[Polling] Plan not found yet (404), continuing to poll...');
        } else {
          consecutiveErrors++;
          console.warn(`[Polling] Error fetching plan (${consecutiveErrors}/${maxConsecutiveErrors}):`, e.message, e.response?.status);
          
          // Stop polling after too many consecutive errors
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error('[Polling] Too many consecutive errors, stopping polling');
            if (tablePollingRef.current) {
              clearInterval(tablePollingRef.current);
              tablePollingRef.current = null;
            }
            addMessage('agent', 'Lost connection to server. Please refresh the page.', new Date().toISOString(), 'error');
          }
        }
      }
    }, 2000); // Reduced to 2 seconds for faster updates
  }, [planData, addMessage]);

  // ── Cleanup ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      disconnect();
      if (tablePollingRef.current) {
        clearInterval(tablePollingRef.current);
        tablePollingRef.current = null;
      }
    };
  }, [disconnect]);

  // ── Generate summary for old plans that lack saved messages ───────
  const generateCompletionSummary = (planDoc) => {
    const scenarios = planDoc.scenarios || [];
    const totalScenarios = scenarios.length;
    const totalTestCases = planDoc.total_test_cases || 0;

    let p1Count = 0, p2Count = 0, p3Count = 0;
    scenarios.forEach((scenario) => {
      (scenario.test_cases || []).forEach((tc) => {
        if (tc.priority === 'P1') p1Count++;
        else if (tc.priority === 'P2') p2Count++;
        else if (tc.priority === 'P3') p3Count++;
      });
    });

    let report = `Test plan generation completed successfully.\n\n`;
    report += `**Summary:**\n`;
    report += `- Total Scenarios: ${totalScenarios}\n`;
    report += `- Total Test Cases: ${totalTestCases}\n\n`;

    if (p1Count > 0 || p2Count > 0 || p3Count > 0) {
      report += `**Priority Breakdown:**\n`;
      if (p1Count > 0) report += `- P1 (Critical): ${p1Count} test cases\n`;
      if (p2Count > 0) report += `- P2 (Important): ${p2Count} test cases\n`;
      if (p3Count > 0) report += `- P3 (Standard): ${p3Count} test cases\n`;
      report += `\n`;
    }

    const featureGroups = {};
    scenarios.forEach((scenario) => {
      const area = scenario.feature_area || 'General';
      if (!featureGroups[area]) featureGroups[area] = [];
      featureGroups[area].push(scenario);
    });

    if (Object.keys(featureGroups).length > 0) {
      report += `**Feature Coverage:**\n`;
      Object.keys(featureGroups).forEach((area) => {
        const count = featureGroups[area].length;
        report += `- ${area}: ${count} scenario${count > 1 ? 's' : ''}\n`;
      });
      report += `\n`;
    }

    report += `All test scenarios are now available in the table. Use filters to refine your view by priority or status.`;
    return report;
  };

  // Merge chat messages with regular messages
  const lastChatMsgCount = useRef(0);

  useEffect(() => {
    // Only process new messages (avoid reprocessing all messages)
    if (chatMessages.length > lastChatMsgCount.current && planData?.id) {
      const newMessages = chatMessages.slice(lastChatMsgCount.current);
      lastChatMsgCount.current = chatMessages.length;

      let hasChanges = false;
      newMessages.forEach((chatMsg) => {
        if (chatMsg.type === 'connected') return;
        const type = chatMsg.type === 'user_message' ? 'user_message' : (chatMsg.type || 'normal');
        const sender = chatMsg.type === 'user_message' ? 'user' : 'agent';
        const data = chatMsg.data || null;
        const changes = chatMsg.changes || null;

        addMessage(sender, chatMsg.content, chatMsg.timestamp, type, null, data, changes);

        if (changes && Array.isArray(changes) && changes.length > 0) {
          hasChanges = true;
        }
      });

      // Refresh plan data once if any changes were made
      if (hasChanges && planData?.id) {
        const mode = planData.mode;
        if (mode === 'manual') {
          import('../api/client').then(m => m.getManualPlan(planData.id)).then(setPlan).catch(console.error);
        } else {
          import('../api/client').then(m => m.getPlan(planData.id)).then(setPlan).catch(console.error);
        }
      }
    }
  }, [chatMessages, addMessage, planData?.id, planData?.mode]);

  const handleSendChatMessage = useCallback(async (message) => {
    const timestamp = new Date().toISOString();
    addMessage('user', message, timestamp, 'user_message');
    try {
      await sendChatMessage(message);
    } catch (error) {
      console.error('Error sending chat message:', error);
      addMessage('agent', 'Failed to send message. Please try again.', new Date().toISOString(), 'error');
    }
  }, [sendChatMessage, addMessage]);

  return (
    <div className="chat-interface">
      <ChatPanel
        messages={messages}
        isLoading={isLoading || chatProcessing}
        planData={planData}
        onBack={onBack}
        planId={planData?.id}
        onSendMessage={chatEnabled && chatConnected ? handleSendChatMessage : undefined}
        chatEnabled={chatEnabled && chatConnected}
      />
      {planData?.mode === 'manual' ? (
        <div className="results-panel">
          <ManualResultsPanel
            plan={plan}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <ResultsPanel
          plan={plan}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
