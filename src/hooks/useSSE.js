/**
 * Dummy SSE hook for Vercel demo — simulates stream with fake events, no network.
 * Orchestrates like a real backend: status/progress events then plan_completed.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { __dummyCompletePlan } from '../api/client';

const DELAY_MS = 400;

function simulateStream(planData, onMessage, onComplete) {
  const planId = planData?.id;
  const mode = planData?.mode || 'planner';
  const prompt = planData?.prompt || 'Create test plan';

  const events = [
    { eventType: 'scouting_started', message: 'Analyzing application structure...', data: {} },
    { eventType: 'feature_area_found', message: 'Exploring feature areas', data: { scenario_count: 1 } },
    { eventType: 'worker_started', message: 'Starting test generation workers', data: {} },
    { eventType: 'scenario_saved', message: 'Scenario saved: User login and authentication', data: { scenario_count: 1, test_case_count: 2 } },
    { eventType: 'scenario_saved', message: 'Scenario saved: Checkout flow', data: { scenario_count: 2, test_case_count: 4 } },
    { eventType: 'progress_update', message: 'Generating test cases...', data: { test_case_count: 4 } },
    {
      eventType: 'plan_completed',
      message: 'Plan completed: 2 workers succeeded, 0 failed, 2 feature areas explored. All generated scenarios and test cases are now available.',
      data: { total_scenarios: 2, total_test_cases: 4 },
    },
  ];

  let step = 0;
  const run = () => {
    if (step >= events.length) {
      const last = events[events.length - 1];
      const now = new Date();
      const past = new Date(now.getTime() - 2.5 * 60 * 60 * 1000); // 2.5 hours ago
      
      const planDoc = {
        id: planId,
        url: planData?.url || (mode === 'manual' ? 'Manual Context' : 'https://example.com'),
        prompt,
        user_prompt: prompt,
        status: 'completed',
        mode,
        total_scenarios: 2,
        total_test_cases: 4,
        created_at: past.toISOString(),
        updated_at: now.toISOString(),
        scenarios: [
          {
            id: 'sc-1',
            title: 'User login and authentication',
            feature_area: 'Authentication',
            test_cases: [
              { title: 'Valid login with email and password', type: 'Positive', priority: 'P1', source: 'ai', is_automated: false, steps: [{ step_number: 1, action: 'Navigate to login page', expected_outcome: 'Login form is displayed' }], description: 'Verify successful login', preconditions: 'User has an account' },
              { title: 'Invalid password shows error', type: 'Negative', priority: 'P2', source: 'ai', is_automated: false, steps: [{ step_number: 1, action: 'Enter wrong password', expected_outcome: 'Error message is shown' }], description: 'Verify error handling', preconditions: '' },
            ],
          },
          {
            id: 'sc-2',
            title: 'Checkout flow',
            feature_area: 'E-commerce',
            test_cases: [
              { title: 'Complete purchase with valid payment', type: 'Positive', priority: 'P1', source: 'manual', is_automated: false, steps: [{ step_number: 1, action: 'Add item to cart', expected_outcome: 'Cart updates' }], description: 'End-to-end purchase', preconditions: 'User is logged in' },
              { title: 'Cart persists on refresh', type: 'UI Validation', priority: 'P3', source: 'ai', is_automated: false, steps: [{ step_number: 1, action: 'Refresh page', expected_outcome: 'Cart contents remain' }], description: 'Session persistence', preconditions: '' },
            ],
          },
        ],
      };
      __dummyCompletePlan(planId, mode, planDoc);
      onComplete({
        type: 'complete',
        message: last.message,
        timestamp: new Date().toISOString(),
        data: last.data,
        eventType: last.eventType,
      });
      return;
    }
    const ev = events[step++];
    onMessage({
      type: ev.eventType === 'plan_completed' ? 'complete' : ev.eventType === 'scenario_saved' || ev.eventType === 'test_case_saved' ? 'progress' : 'status',
      message: ev.message,
      timestamp: new Date().toISOString(),
      data: ev.data || {},
      eventType: ev.eventType,
    });
    setTimeout(run, DELAY_MS);
  };
  setTimeout(run, DELAY_MS);
}

export const useSSE = (planData, onMessage, onError, onComplete) => {
  const startedRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const onMessageRef = useRef(onMessage);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const disconnect = useCallback(() => {}, []);

  const planId = planData?.id;
  const planIsExisting = planData?.isExisting;
  const planMode = planData?.mode;

  useEffect(() => {
    if (!planData?.id || planIsExisting) return;
    if (startedRef.current) return;
    startedRef.current = true;
    setIsConnected(true);
    setError(null);
    simulateStream(
      planData,
      (msg) => onMessageRef.current?.(msg),
      (msg) => onCompleteRef.current?.(msg),
    );
    return () => { startedRef.current = false; };
  }, [planId, planIsExisting, planMode]);

  return { isConnected, error, disconnect };
};
