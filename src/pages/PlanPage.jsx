/**
 * PlanPage - Chat interface for a specific plan
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChatInterface } from '../components/ChatInterface';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getPlan } from '../api/client';

export const PlanPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [planData, setPlanData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadPlan = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Only treat as "new" plan when we explicitly have isNew from navigation (e.g. form submit).
        // On refresh or direct URL, location.state is lost — always fetch and treat as existing.
        const isNewPlan = location.state?.isNew === true;

        if (isNewPlan) {
          // New plan - use data from navigation state
          const base = {
            id: planId,
            url: location.state.url,
            prompt: location.state.prompt,
            user_id: location.state.user_id || 'demo-user',
            isExisting: false,
          };
          if (location.state.mode) base.mode = location.state.mode;
          if (location.state.mode === 'manual') {
            if (location.state.manualContext) base.manualContext = location.state.manualContext;
            if (location.state.attachments) base.attachments = location.state.attachments;
          }
          setPlanData(base);
        } else {
          // Existing plan (e.g. after refresh) - fetch from backend. If mode unknown, try manual then planner.
          const mode = location.state?.mode;
          let planDoc = null;
          let resolvedMode = mode;

          const tryManual = async () => {
            const { getManualPlan } = await import('../api/client');
            return getManualPlan(planId);
          };
          const tryPlanner = () => getPlan(planId);

          if (mode === 'manual') {
            try { planDoc = await tryManual(); resolvedMode = 'manual'; } catch (_) {}
          }
          if (!planDoc && (mode === 'planner' || !mode)) {
            try { planDoc = await tryPlanner(); resolvedMode = planDoc?.mode || 'planner'; } catch (_) {}
          }
          if (!planDoc && !mode) {
            try { planDoc = await tryManual(); resolvedMode = planDoc?.mode || 'manual'; } catch (_) {
              try { planDoc = await tryPlanner(); resolvedMode = planDoc?.mode || 'planner'; } catch (__) {}
            }
          }
          if (planDoc?.mode) resolvedMode = planDoc.mode;

          if (mounted && planDoc) {
            setPlanData({
              id: planDoc.id || planId,
              url: planDoc.url,
              prompt: planDoc.user_prompt || planDoc.prompt,
              mode: resolvedMode || 'planner',
              isExisting: true,
            });
          } else if (mounted && !planDoc) {
            setError('Plan not found. It may still be creating.');
          }
        }
      } catch (err) {
        console.error('Error loading plan:', err);
        if (mounted) {
          setError(err.message || 'Failed to load plan');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadPlan();
    return () => { mounted = false; };
  }, [planId, location.state]);

  const handleBack = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui',
        color: '#6b7280'
      }}>
        Loading plan...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui',
        color: '#6b7280',
        gap: '16px'
      }}>
        <p style={{ color: '#ef4444' }}>Error: {error}</p>
        <button onClick={handleBack} style={{
          padding: '10px 20px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          Go Back Home
        </button>
      </div>
    );
  }

  if (!planData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui',
        color: '#6b7280'
      }}>
        No plan data available
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ChatInterface planData={planData} onBack={handleBack} />
    </ErrorBoundary>
  );
};
