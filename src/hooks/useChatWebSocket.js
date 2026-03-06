/**
 * Dummy WebSocket hook for Vercel demo — no real connection.
 * Chat UI still renders; send is a no-op and connection stays false so chat is disabled.
 */

import { useState, useCallback } from 'react';

export const useChatWebSocket = (planId, enabled = false, mode = 'planner') => {
  const [isConnected] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = useCallback(async (message) => {
    setIsProcessing(true);
    
    setTimeout(() => {
      let replyContent = "I've noted that. In production I'd update the test plan accordingly. This is a demo with dummy data.";
      let changes = null;
      const lowerMsg = message.toLowerCase();
      
      if (lowerMsg.includes('add') && lowerMsg.includes('scenario')) {
        replyContent = "Done! I've added a new scenario **\"Form Validation\"** with 3 test cases covering required fields, email format, and boundary values.";
        changes = [{ action: 'add_scenario', scenario: 'Form Validation', test_cases: 3 }];
      } else if (lowerMsg.includes('add') && lowerMsg.includes('test')) {
        replyContent = "Added a new edge-case test case **\"Empty cart checkout attempt\"** to the Checkout flow scenario.";
        changes = [{ action: 'add_test_case', scenario: 'Checkout flow', test_case: 'Empty cart checkout attempt' }];
      } else if (lowerMsg.includes('delete') || lowerMsg.includes('remove')) {
        replyContent = "Removed the test case as requested. The scenario has been updated.";
        changes = [{ action: 'delete_test_case', scenario: 'User login and authentication', test_case: 'Invalid password shows error' }];
      } else if (lowerMsg.includes('modify') || lowerMsg.includes('update') || lowerMsg.includes('change')) {
        replyContent = "Updated the test case priority and description as requested.";
        changes = [{ action: 'modify_test_case', scenario: 'Checkout flow', test_case: 'Complete purchase with valid payment', updates: { priority: 'P1 → P2', description: 'Updated to include coupon code flow' } }];
      } else if (lowerMsg.includes('priority') || lowerMsg.includes('filter')) {
        replyContent = "You can use the Priority and Test Type filters above the list to narrow down test cases. Try clicking 'P1' or 'Positive' to see them in action.";
      } else if (lowerMsg.includes('add') || lowerMsg.includes('scenario')) {
        replyContent = "I've simulated adding a new scenario to the plan. In this demo, the data in the right panel uses static dummy data, but a real deployment would update it dynamically.";
        changes = [{ action: 'add_scenario', scenario: 'New Scenario', test_cases: 2 }];
      }

      const msg = {
        type: 'response',
        content: replyContent,
        timestamp: new Date().toISOString()
      };
      if (changes) msg.changes = changes;

      setChatMessages(prev => [...prev, msg]);
      setIsProcessing(false);
    }, 1000);
  }, []);
  const connect = useCallback(() => {}, []);
  const disconnect = useCallback(() => {}, []);

  return {
    isConnected,
    chatMessages,
    isProcessing,
    sendMessage,
    connect,
    disconnect,
  };
};
