/**
 * Dummy SSE hook for Vercel demo — simulates a realistic stream with
 * scouting, thinking, discovery, worker progress, and scenario saves.
 * Mirrors the real backend event flow.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { __dummyCompletePlan, getPlan, getManualPlan } from '../api/client';

const BASE_DELAY = 600;
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function simulateStream(planData, onMessage, onComplete) {
  const planId = planData?.id;
  const mode = planData?.mode || 'planner';
  const prompt = planData?.prompt || 'Create test plan';
  const url = planData?.url || (mode === 'manual' ? 'Manual Context' : 'https://example.com');

  const events = [
    { eventType: 'scouting_started', message: `Initiating scout agent to analyze ${url}...`, data: {}, delay: BASE_DELAY },
    { eventType: 'thinking', message: 'Crawling application pages and identifying navigation structure...', data: {}, delay: rand(800, 1200) },
    { eventType: 'thinking', message: 'Analyzing page components, forms, interactive elements, and API endpoints...', data: {}, delay: rand(1000, 1500) },
    { eventType: 'feature_area_found', message: 'Discovered feature area: **Authentication** — login forms, session management, password flows', data: { scenario_count: 1 }, delay: rand(600, 900) },
    { eventType: 'feature_area_found', message: 'Discovered feature area: **Search** — search bar, filters, auto-suggest, sorting', data: { scenario_count: 2 }, delay: rand(500, 800) },
    { eventType: 'feature_area_found', message: 'Discovered feature area: **E-commerce** — cart, checkout, payments, coupons', data: { scenario_count: 3 }, delay: rand(500, 800) },
    { eventType: 'feature_area_found', message: 'Discovered feature area: **User Management** — profile settings, account security', data: { scenario_count: 4 }, delay: rand(500, 700) },
    { eventType: 'feature_area_found', message: 'Discovered feature area: **UI/UX** — responsive layout, accessibility, dark mode', data: { scenario_count: 5 }, delay: rand(500, 700) },
    { eventType: 'thinking', message: 'Scout analysis complete. Identified **5 feature areas** across the application. Dispatching parallel worker agents...', data: {}, delay: rand(600, 900) },
    { eventType: 'worker_started', message: 'Worker 1/5 started — generating test cases for **Authentication**', data: {}, delay: rand(300, 500) },
    { eventType: 'worker_started', message: 'Worker 2/5 started — generating test cases for **Search**', data: {}, delay: rand(200, 400) },
    { eventType: 'worker_started', message: 'Worker 3/5 started — generating test cases for **E-commerce**', data: {}, delay: rand(200, 400) },
    { eventType: 'worker_started', message: 'Worker 4/5 started — generating test cases for **User Management**', data: {}, delay: rand(200, 400) },
    { eventType: 'worker_started', message: 'Worker 5/5 started — generating test cases for **UI/UX**', data: {}, delay: rand(200, 400) },
    { eventType: 'thinking', message: 'Worker agents are analyzing each feature area and generating comprehensive test scenarios with positive, negative, edge, and UI validation cases...', data: {}, delay: rand(1200, 1800) },
    { eventType: 'scenario_saved', message: 'Scenario saved: **User Authentication & Session Management** — 5 test cases (login, lockout, session timeout, password toggle, brute-force protection)', data: { scenario_count: 1, test_case_count: 5 }, delay: rand(800, 1200) },
    { eventType: 'progress_update', message: 'Worker 1 completed. Progress: 1/5 scenarios generated (5 test cases so far)', data: { test_case_count: 5 }, delay: rand(400, 600) },
    { eventType: 'scenario_saved', message: 'Scenario saved: **Product Search & Filtering** — 5 test cases (keyword search, empty query, price filter, special chars, sorting)', data: { scenario_count: 2, test_case_count: 10 }, delay: rand(1000, 1400) },
    { eventType: 'progress_update', message: 'Worker 2 completed. Progress: 2/5 scenarios generated (10 test cases so far)', data: { test_case_count: 10 }, delay: rand(400, 600) },
    { eventType: 'scenario_saved', message: 'Scenario saved: **Shopping Cart & Checkout** — 5 test cases (add to cart, checkout flow, coupon codes, out-of-stock, form validation)', data: { scenario_count: 3, test_case_count: 15 }, delay: rand(1000, 1400) },
    { eventType: 'progress_update', message: 'Worker 3 completed. Progress: 3/5 scenarios generated (15 test cases so far)', data: { test_case_count: 15 }, delay: rand(400, 600) },
    { eventType: 'scenario_saved', message: 'Scenario saved: **User Profile & Account Settings** — 5 test cases (profile update, password change, avatar upload, email verification, account deletion)', data: { scenario_count: 4, test_case_count: 20 }, delay: rand(1000, 1400) },
    { eventType: 'progress_update', message: 'Worker 4 completed. Progress: 4/5 scenarios generated (20 test cases so far)', data: { test_case_count: 20 }, delay: rand(400, 600) },
    { eventType: 'scenario_saved', message: 'Scenario saved: **Responsive UI & Cross-Browser Compatibility** — 5 test cases (hamburger menu, lazy loading, keyboard nav, dark mode, content overflow)', data: { scenario_count: 5, test_case_count: 25 }, delay: rand(1000, 1400) },
    { eventType: 'progress_update', message: 'Worker 5 completed. All 5/5 scenarios generated (25 test cases total)', data: { test_case_count: 25 }, delay: rand(400, 600) },
    { eventType: 'thinking', message: 'All worker agents completed. Compiling final test plan with coverage analysis...', data: {}, delay: rand(600, 900) },
  ];

  const completionEvent = {
    eventType: 'plan_completed',
    message: `**Test Plan Generation Complete**\n\nI have finished analyzing the application and generating the test plan. During the discovery phase, I successfully explored **5 feature areas**.\n\nThe worker agents generated test scenarios in parallel, and **5 workers completed successfully**.\n\n**Test Coverage Summary:**\n- Total Scenarios: **5**\n- Total Test Cases: **25**\n- Positive Tests: **10**\n- Negative Tests: **5**\n- Edge Case Tests: **5**\n- UI Validation Tests: **5**\n\nAll generated scenarios and test cases are now available in the table on the right. You can expand each section to review the specific steps, outcomes, and priorities.`,
    data: { total_scenarios: 5, total_test_cases: 25, coverage: { by_type: { Positive: 10, Negative: 5, Edge: 5, 'UI Validation': 5 }, by_priority: { P1: 8, P2: 10, P3: 7 } } },
  };

  let step = 0;
  let cancelled = false;

  const run = () => {
    if (cancelled) return;

    if (step >= events.length) {
      const fetchPlan = mode === 'manual' ? getManualPlan : getPlan;
      fetchPlan(planId).then(planDoc => {
        if (cancelled) return;
        __dummyCompletePlan(planId, mode, planDoc);
        onComplete({
          type: 'complete',
          message: completionEvent.message,
          timestamp: new Date().toISOString(),
          data: completionEvent.data,
          eventType: completionEvent.eventType,
        });
      });
      return;
    }

    const ev = events[step++];
    const msgType = ev.eventType === 'scenario_saved' || ev.eventType === 'test_case_saved' || ev.eventType === 'progress_update'
      ? 'progress'
      : ev.eventType === 'feature_area_found'
        ? 'discovery'
        : 'status';

    onMessage({
      type: msgType,
      message: ev.message,
      timestamp: new Date().toISOString(),
      data: ev.data || {},
      eventType: ev.eventType,
    });

    setTimeout(run, ev.delay || BASE_DELAY);
  };

  setTimeout(run, BASE_DELAY);

  return () => { cancelled = true; };
}

export const useSSE = (planData, onMessage, onError, onComplete) => {
  const startedRef = useRef(false);
  const cancelRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const onMessageRef = useRef(onMessage);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const planDataRef = useRef(planData);
  planDataRef.current = planData;
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const disconnect = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const planId = planData?.id;
  const planIsExisting = planData?.isExisting;
  const planMode = planData?.mode;

  useEffect(() => {
    if (!planData?.id || planIsExisting) return;
    if (startedRef.current) return;
    startedRef.current = true;
    setIsConnected(true);
    setError(null);

    cancelRef.current = simulateStream(
      planDataRef.current,
      (msg) => onMessageRef.current?.(msg),
      (msg) => onCompleteRef.current?.(msg),
    );

    return () => {
      if (cancelRef.current) cancelRef.current();
      startedRef.current = false;
    };
  }, [planId, planIsExisting, planMode]);

  return { isConnected, error, disconnect };
};
