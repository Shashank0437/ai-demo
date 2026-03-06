/**
 * Dummy WebSocket hook for Vercel demo — simulates realistic AI chat
 * with thinking steps, action execution, and rich markdown responses.
 * Mirrors the real backend's agentic tool-use flow.
 */

import { useState, useCallback, useRef } from 'react';

const THINKING_RESPONSES = {
  add_scenario: [
    { type: 'thinking', content: 'Processing your request...', delay: 400 },
    { type: 'action_started', content: 'Adding new scenario to test plan', delay: 800 },
    { type: 'thinking', content: 'Generating test cases for the new scenario...', delay: 1200 },
    { type: 'action_started', content: 'Saving scenario with test cases', delay: 600 },
  ],
  add_test: [
    { type: 'thinking', content: 'Processing your request...', delay: 400 },
    { type: 'action_started', content: 'Analyzing existing scenarios for best fit', delay: 700 },
    { type: 'action_started', content: 'Adding test case to scenario', delay: 800 },
  ],
  delete: [
    { type: 'thinking', content: 'Processing your request...', delay: 400 },
    { type: 'action_started', content: 'Locating test case in plan', delay: 600 },
    { type: 'action_started', content: 'Removing test case from scenario', delay: 500 },
  ],
  modify: [
    { type: 'thinking', content: 'Processing your request...', delay: 400 },
    { type: 'action_started', content: 'Locating test case to modify', delay: 600 },
    { type: 'action_started', content: 'Updating test case details', delay: 800 },
  ],
  replan: [
    { type: 'thinking', content: 'Processing your request...', delay: 400 },
    { type: 'action_started', content: 'Analyzing current scenario coverage', delay: 800 },
    { type: 'thinking', content: 'Regenerating test cases with improved coverage...', delay: 1000 },
    { type: 'action_started', content: 'Replacing scenario test cases', delay: 700 },
  ],
  general: [
    { type: 'thinking', content: 'Processing your request...', delay: 400 },
    { type: 'thinking', content: 'Analyzing the test plan context...', delay: 800 },
  ],
};

function classifyMessage(text) {
  const lower = text.toLowerCase();
  if ((lower.includes('add') || lower.includes('create') || lower.includes('new')) && (lower.includes('scenario') || lower.includes('feature'))) return 'add_scenario';
  if ((lower.includes('add') || lower.includes('create') || lower.includes('new') || lower.includes('include')) && (lower.includes('test') || lower.includes('case'))) return 'add_test';
  if (lower.includes('delete') || lower.includes('remove') || lower.includes('drop')) return 'delete';
  if (lower.includes('modify') || lower.includes('update') || lower.includes('change') || lower.includes('edit') || lower.includes('rename') || lower.includes('set priority')) return 'modify';
  if (lower.includes('replan') || lower.includes('regenerate') || lower.includes('redo') || lower.includes('improve') || lower.includes('enhance')) return 'replan';
  return 'general';
}

function generateResponse(text, category) {
  const lower = text.toLowerCase();

  if (category === 'add_scenario') {
    if (lower.includes('api') || lower.includes('endpoint')) {
      return {
        content: `Done! I've added a new scenario **"API Integration & Error Handling"** to the test plan with 5 test cases:\n\n1. **Successful GET request returns correct data** (Positive, P1)\n2. **POST request with invalid payload returns 400** (Negative, P1)\n3. **API timeout handling after 30 seconds** (Edge, P2)\n4. **Rate limiting returns 429 with retry header** (Negative, P2)\n5. **Concurrent API requests are handled correctly** (Edge, P3)\n\nEach test case includes detailed steps covering request construction, response validation, and error handling scenarios. You can expand the new scenario in the table on the right to review all steps.`,
        changes: [{ action: 'add_scenario', scenario: 'API Integration & Error Handling', test_cases: 5 }],
      };
    }
    if (lower.includes('notification') || lower.includes('alert') || lower.includes('email')) {
      return {
        content: `I've created a new scenario **"Notification & Alert System"** with 5 comprehensive test cases:\n\n1. **Email notification sent on order confirmation** (Positive, P1)\n2. **Push notification appears for new messages** (Positive, P2)\n3. **Notification preferences are respected** (Positive, P2)\n4. **Bulk notifications don't cause performance degradation** (Edge, P2)\n5. **Notification with invalid recipient fails gracefully** (Negative, P3)\n\nAll test cases include 5+ detailed steps with expected outcomes. The scenario is now visible in the results panel.`,
        changes: [{ action: 'add_scenario', scenario: 'Notification & Alert System', test_cases: 5 }],
      };
    }
    if (lower.includes('payment') || lower.includes('billing')) {
      return {
        content: `Added a new scenario **"Payment Processing & Billing"** with 5 test cases:\n\n1. **Successful payment with credit card** (Positive, P1)\n2. **Payment declined with insufficient funds** (Negative, P1)\n3. **Partial refund processes correctly** (Positive, P2)\n4. **Currency conversion displays accurate amounts** (Edge, P2)\n5. **Payment retry after network timeout** (Edge, P2)\n\nEach test case has detailed step-by-step instructions with preconditions and expected outcomes.`,
        changes: [{ action: 'add_scenario', scenario: 'Payment Processing & Billing', test_cases: 5 }],
      };
    }
    return {
      content: `I've added a new scenario **"Form Validation & Data Integrity"** to the test plan with 5 test cases:\n\n1. **Required field validation shows inline errors** (Negative, P1)\n2. **Email format validation accepts valid patterns** (Positive, P2)\n3. **Form submission with all valid data succeeds** (Positive, P1)\n4. **Maximum character limit is enforced on text fields** (Edge, P2)\n5. **Form state persists on browser back navigation** (Edge, P3)\n\nAll test cases include detailed steps with preconditions, actions, and expected outcomes. You can review them in the expanded scenario view on the right panel.`,
      changes: [{ action: 'add_scenario', scenario: 'Form Validation & Data Integrity', test_cases: 5 }],
    };
  }

  if (category === 'add_test') {
    if (lower.includes('auth') || lower.includes('login') || lower.includes('password')) {
      return {
        content: `Added a new test case **"Two-factor authentication via SMS code"** to the **User Authentication & Session Management** scenario.\n\n**Test Case Details:**\n- **Type:** Positive\n- **Priority:** P1\n- **Steps:**\n  1. Log in with valid credentials that have 2FA enabled\n  2. Verify SMS code input screen appears\n  3. Enter the correct 6-digit code\n  4. Verify successful authentication and redirect to dashboard\n  5. Verify session token includes 2FA verification flag\n\nThe test case has been added to the scenario and is visible in the results panel.`,
        changes: [{ action: 'add_test_case', scenario: 'User Authentication & Session Management', test_case: 'Two-factor authentication via SMS code' }],
      };
    }
    if (lower.includes('cart') || lower.includes('checkout') || lower.includes('order')) {
      return {
        content: `Added a new edge-case test **"Cart quantity exceeds available stock"** to the **Shopping Cart & Checkout** scenario.\n\n**Test Case Details:**\n- **Type:** Edge\n- **Priority:** P2\n- **Steps:**\n  1. Add a product with only 3 items in stock to the cart\n  2. Increase quantity to 5 using the quantity selector\n  3. Verify error message: "Only 3 items available"\n  4. Verify quantity is automatically adjusted to maximum available\n  5. Proceed to checkout and verify the corrected quantity\n\nThis covers an important inventory boundary condition.`,
        changes: [{ action: 'add_test_case', scenario: 'Shopping Cart & Checkout', test_case: 'Cart quantity exceeds available stock' }],
      };
    }
    return {
      content: `Added a new test case **"Search results pagination loads correctly"** to the **Product Search & Filtering** scenario.\n\n**Test Case Details:**\n- **Type:** Positive\n- **Priority:** P2\n- **Steps:**\n  1. Perform a search that returns 50+ results\n  2. Verify first page shows 20 results with pagination controls\n  3. Click "Next Page" or page 2\n  4. Verify next 20 results load without duplicates\n  5. Click "Previous Page" and verify original results are shown\n\nThe test case is now available in the results panel.`,
      changes: [{ action: 'add_test_case', scenario: 'Product Search & Filtering', test_case: 'Search results pagination loads correctly' }],
    };
  }

  if (category === 'delete') {
    if (lower.includes('session') || lower.includes('timeout')) {
      return {
        content: `Removed the test case **"Session timeout after inactivity period"** from the **User Authentication & Session Management** scenario.\n\nThe scenario now has 4 remaining test cases. The results panel has been updated to reflect this change.`,
        changes: [{ action: 'delete_test_case', scenario: 'User Authentication & Session Management', test_case: 'Session timeout after inactivity period' }],
      };
    }
    if (lower.includes('dark') || lower.includes('theme')) {
      return {
        content: `Removed the test case **"Dark mode toggle applies theme consistently"** from the **Responsive UI & Cross-Browser Compatibility** scenario.\n\nThe scenario now has 4 remaining test cases.`,
        changes: [{ action: 'delete_test_case', scenario: 'Responsive UI & Cross-Browser Compatibility', test_case: 'Dark mode toggle applies theme consistently' }],
      };
    }
    return {
      content: `Removed the test case **"Password visibility toggle functionality"** from the **User Authentication & Session Management** scenario as requested.\n\nThe scenario has been updated and now contains 4 test cases. You can verify the change in the results panel on the right.`,
      changes: [{ action: 'delete_test_case', scenario: 'User Authentication & Session Management', test_case: 'Password visibility toggle functionality' }],
    };
  }

  if (category === 'modify') {
    if (lower.includes('priority')) {
      return {
        content: `Updated the test case priority as requested.\n\n**Changes made:**\n- **Test Case:** "Complete checkout with credit card payment"\n- **Scenario:** Shopping Cart & Checkout\n- **Priority:** P1 → P2\n- **Reason:** Adjusted based on your input to reflect the relative importance within the current sprint.\n\nThe priority badge has been updated in the results panel.`,
        changes: [{ action: 'modify_test_case', scenario: 'Shopping Cart & Checkout', test_case: 'Complete checkout with credit card payment', updates: { priority: 'P1 → P2' } }],
      };
    }
    if (lower.includes('step') || lower.includes('action') || lower.includes('expected')) {
      return {
        content: `Updated the test steps for **"Successful login with valid email and password"** in the **User Authentication & Session Management** scenario.\n\n**Changes:**\n- Added step: "Verify 'Remember me' checkbox is unchecked by default"\n- Modified step 5: Updated expected outcome to include "JWT token is stored in httpOnly cookie"\n- Added step 7: "Verify audit log entry is created for the login event"\n\nThe test case now has 8 detailed steps covering the complete login flow.`,
        changes: [{ action: 'modify_test_case', scenario: 'User Authentication & Session Management', test_case: 'Successful login with valid email and password', updates: { steps: 'Added 2 new steps, modified 1 existing step (6 → 8 total steps)' } }],
      };
    }
    return {
      content: `Updated the test case **"Search returns relevant results for keyword query"** in the **Product Search & Filtering** scenario.\n\n**Changes made:**\n- **Description:** Updated to include fuzzy matching and typo tolerance verification\n- **Preconditions:** Added "Search index includes products with misspelled entries for testing"\n\nThe test case details have been refreshed in the results panel.`,
      changes: [{ action: 'modify_test_case', scenario: 'Product Search & Filtering', test_case: 'Search returns relevant results for keyword query', updates: { description: 'Updated to include fuzzy matching and typo tolerance', preconditions: 'Added search index requirement' } }],
    };
  }

  if (category === 'replan') {
    if (lower.includes('auth') || lower.includes('login')) {
      return {
        content: `Regenerated the **User Authentication & Session Management** scenario with improved coverage.\n\n**What changed:**\n- Expanded from 5 to 6 test cases\n- Added **"Multi-device session management"** test case\n- Enhanced step details for all existing test cases\n- Added OAuth/SSO login flow coverage\n- Improved edge case coverage for concurrent session handling\n\nThe scenario now provides comprehensive coverage of authentication flows including traditional login, social auth, session management, and security measures.`,
        changes: [{ action: 'replan_scenario', scenario: 'User Authentication & Session Management', new_test_cases: 6 }],
      };
    }
    return {
      content: `Regenerated the **Shopping Cart & Checkout** scenario with enhanced test coverage.\n\n**Improvements:**\n- Expanded from 5 to 7 test cases\n- Added **"Guest checkout without account"** (Positive, P1)\n- Added **"Cart recovery after session expiry"** (Edge, P2)\n- Enhanced existing test steps with more detailed expected outcomes\n- Improved negative test coverage for payment failures\n\nAll test cases now include 5+ detailed steps with comprehensive preconditions and expected outcomes.`,
      changes: [{ action: 'replan_scenario', scenario: 'Shopping Cart & Checkout', new_test_cases: 7 }],
    };
  }

  // General / conversational responses
  if (lower.includes('coverage') || lower.includes('summary') || lower.includes('overview')) {
    return {
      content: `Here's the current test plan coverage summary:\n\n**Scenarios:** 5 total\n| Scenario | Test Cases | P1 | P2 | P3 |\n|----------|-----------|----|----|----|\n| User Authentication & Session Management | 5 | 2 | 1 | 2 |\n| Product Search & Filtering | 5 | 1 | 3 | 1 |\n| Shopping Cart & Checkout | 5 | 2 | 2 | 1 |\n| User Profile & Account Settings | 5 | 2 | 2 | 1 |\n| Responsive UI & Cross-Browser | 5 | 0 | 2 | 3 |\n\n**Total:** 25 test cases across 5 scenarios\n- **P1 (Critical):** 7 test cases\n- **P2 (Important):** 10 test cases\n- **P3 (Standard):** 8 test cases\n\n**By Type:** Positive (10), Negative (5), Edge (5), UI Validation (5)\n\nThe plan provides good coverage across functional, negative, edge case, and UI validation testing. Would you like me to add more test cases for any specific area?`,
      changes: null,
    };
  }

  if (lower.includes('help') || lower.includes('what can')) {
    return {
      content: `I can help you refine this test plan in several ways:\n\n**Add content:**\n- "Add a new scenario for API testing"\n- "Add a test case for two-factor authentication"\n- "Create a scenario for notification system"\n\n**Modify existing:**\n- "Change the priority of the checkout test to P2"\n- "Update the steps for the login test case"\n- "Modify the search test description"\n\n**Remove content:**\n- "Remove the dark mode test case"\n- "Delete the session timeout test"\n\n**Regenerate:**\n- "Replan the authentication scenario with better coverage"\n- "Regenerate the checkout scenario"\n\n**Review:**\n- "Show me the coverage summary"\n- "What areas need more test cases?"\n\nJust tell me what you'd like to do and I'll make the changes to the test plan.`,
      changes: null,
    };
  }

  if (lower.includes('good') || lower.includes('great') || lower.includes('thanks') || lower.includes('perfect') || lower.includes('looks good') || lower.includes('nice')) {
    return {
      content: `Thank you! The test plan is looking solid with 25 test cases across 5 scenarios. Here are a few suggestions if you want to further strengthen it:\n\n1. **Performance testing** — Consider adding a scenario for load times, API response times, and concurrent user handling\n2. **Accessibility** — The current keyboard navigation test is good, but you could add screen reader compatibility and ARIA label verification\n3. **Data migration** — If applicable, test cases for data import/export and backward compatibility\n\nWould you like me to add any of these scenarios, or is there anything else you'd like to adjust?`,
      changes: null,
    };
  }

  if (lower.includes('security') || lower.includes('xss') || lower.includes('injection') || lower.includes('vulnerability')) {
    return {
      content: `Great question about security coverage! The current plan includes some security-related tests:\n\n**Existing security coverage:**\n- XSS prevention in search (special characters test)\n- SQL injection prevention in search\n- Account lockout after failed attempts\n- Session timeout handling\n\n**Recommended additions:**\n- CSRF token validation on forms\n- Authorization checks (accessing other users' data)\n- File upload validation (malicious file types)\n- API authentication token expiry\n- Sensitive data exposure in browser storage\n\nWould you like me to add a dedicated **"Security & Vulnerability Testing"** scenario with comprehensive test cases for these areas?`,
      changes: null,
    };
  }

  if (lower.includes('export') || lower.includes('download') || lower.includes('share')) {
    return {
      content: `You can export this test plan using the **"Export to Test Manager"** button in the results panel on the right. This will:\n\n1. Transfer all 5 scenarios and 25 test cases to the Test Manager\n2. Preserve all test steps, priorities, and metadata\n3. Enable you to assign test cases to team members\n4. Allow execution tracking with the Automator AI Agents\n\nAfter exporting, you can access the test cases from the **Test Manager** page in the sidebar navigation.`,
      changes: null,
    };
  }

  // Default intelligent response
  return {
    content: `I understand your request. Based on the current test plan with **5 scenarios** and **25 test cases**, here's what I can suggest:\n\nThe plan currently covers:\n- **Authentication** — login flows, session management, account security\n- **Search** — keyword search, filters, sorting, edge cases\n- **E-commerce** — cart operations, checkout, payments, validation\n- **User Management** — profile updates, password changes, account settings\n- **UI/UX** — responsive design, accessibility, dark mode, content overflow\n\nI can help you:\n- **Add** new scenarios or test cases to expand coverage\n- **Modify** existing test cases (priority, steps, descriptions)\n- **Remove** test cases that aren't needed\n- **Regenerate** scenarios with improved coverage\n\nWhat would you like me to do?`,
    changes: null,
  };
}

export const useChatWebSocket = (planId, enabled = false, mode = 'planner') => {
  const [isConnected] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const timeoutsRef = useRef([]);

  const sendMessage = useCallback(async (message) => {
    setIsProcessing(true);

    // Clear any pending timeouts from previous messages
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const category = classifyMessage(message);
    const thinkingSteps = THINKING_RESPONSES[category] || THINKING_RESPONSES.general;
    const response = generateResponse(message, category);

    let totalDelay = 0;

    // Emit thinking/action_started steps progressively
    thinkingSteps.forEach((step) => {
      totalDelay += step.delay;
      const tid = setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            type: step.type,
            content: step.content,
            timestamp: new Date().toISOString(),
          },
        ]);
      }, totalDelay);
      timeoutsRef.current.push(tid);
    });

    // Emit the final response after all thinking steps
    totalDelay += 800;
    const finalTid = setTimeout(() => {
      const msg = {
        type: 'response',
        content: response.content,
        timestamp: new Date().toISOString(),
      };
      if (response.changes) msg.changes = response.changes;

      setChatMessages(prev => [...prev, msg]);
      setIsProcessing(false);
    }, totalDelay);
    timeoutsRef.current.push(finalTid);
  }, []);

  const connect = useCallback(() => {}, []);
  const disconnect = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  return {
    isConnected,
    chatMessages,
    isProcessing,
    sendMessage,
    connect,
    disconnect,
  };
};
