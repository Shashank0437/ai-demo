import React, { useState, useMemo } from 'react';
import { exportToTestManager } from '../api/client';
import './ManualResultsPanel.css';

export const ManualResultsPanel = ({ plan, isLoading }) => {
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [selectedTestCases, setSelectedTestCases] = useState(new Set()); // IDs of selected test cases
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [expandedScenarios, setExpandedScenarios] = useState(new Set());

  const scenarioGroups = useMemo(() => {
    if (!plan || !plan.scenarios) return [];
    
    return plan.scenarios.map((sc, sIdx) => {
      const tcList = (sc.test_cases || []).map((tc, tIdx) => ({
        id: `#TC-${sIdx + 1}-${tIdx + 1}`,
        scenarioId: sc.id || `SC-${sIdx + 1}`,
        title: tc.title || 'Untitled Test Case',
        tags: tc.tags || [],
        type: tc.type || 'Functional',
        priority: tc.priority_label || tc.priority || 'Med',
        description: tc.scenario_description || sc.scenario_description || '',
        preconditions: typeof tc.preconditions === 'string' ? tc.preconditions : (Array.isArray(tc.preconditions) ? tc.preconditions.map(p => `- ${p}`).join('\n') : ''),
        steps: tc.steps || [],
        source: 'manual',
        is_automated: false
      }));

      // if old plan structure (no test_cases, just flat scenario), wrap it
      if (tcList.length === 0 && sc.steps) {
        tcList.push({
          id: `#TC-${sIdx + 1}-1`,
          scenarioId: sc.id || `SC-${sIdx + 1}`,
          title: sc.title || 'Untitled Test Case',
          tags: sc.tags || [],
          type: sc.type || 'Functional',
          priority: sc.priority_label || sc.priority || 'Med',
          description: sc.scenario_description || '',
          preconditions: typeof sc.preconditions === 'string' ? sc.preconditions : (Array.isArray(sc.preconditions) ? sc.preconditions.map(p => `- ${p}`).join('\n') : ''),
          steps: sc.steps || [],
          source: 'manual',
          is_automated: false
        });
      }

      return {
        id: sc.id || `SC-${sIdx + 1}`,
        title: sc.title || sc.scenario_title || 'Untitled Scenario',
        description: sc.scenario_description || '',
        testCases: tcList
      };
    });
  }, [plan]);

  const allTestCases = useMemo(() => {
    return scenarioGroups.flatMap(sg => sg.testCases);
  }, [scenarioGroups]);

  // Expand first scenario by default when data loads
  React.useEffect(() => {
    if (scenarioGroups.length > 0 && expandedScenarios.size === 0) {
      setExpandedScenarios(new Set([scenarioGroups[0].id]));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioGroups]);

  const toggleScenarioExpand = (scId) => {
    setExpandedScenarios(prev => {
      const next = new Set(prev);
      if (next.has(scId)) next.delete(scId);
      else next.add(scId);
      return next;
    });
  };

  const getPriorityInfo = (priority) => {
    const p = String(priority || '').toLowerCase();
    if (p.includes('high') || p.includes('1')) return { label: 'High', color: '#ef4444', bg: '#fef2f2' };
    if (p.includes('med') || p.includes('2')) return { label: 'Med', color: '#f59e0b', bg: '#fffbeb' };
    return { label: 'Low', color: '#6b7280', bg: '#f3f4f6' };
  };

  const toggleTestCaseSelection = (tcId, e) => {
    e?.stopPropagation?.();
    setSelectedTestCases((prev) => {
      const next = new Set(prev);
      if (next.has(tcId)) next.delete(tcId);
      else next.add(tcId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTestCases.size === allTestCases.length) {
      setSelectedTestCases(new Set());
    } else {
      setSelectedTestCases(new Set(allTestCases.map((tc) => tc.id)));
    }
  };

  const toggleScenarioSelection = (scId, testCases, e) => {
    e?.stopPropagation?.();
    const allScTcIds = testCases.map(tc => tc.id);
    const allSelected = allScTcIds.length > 0 && allScTcIds.every(id => selectedTestCases.has(id));
    
    setSelectedTestCases(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allScTcIds.forEach(id => next.delete(id));
      } else {
        allScTcIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleExportToTestManager = async () => {
    if (selectedTestCases.size === 0 || !plan) return;
    setIsExporting(true);
    setExportComplete(false);
    try {
      const exportedScenarios = scenarioGroups.map(sg => {
        const selectedTcs = sg.testCases.filter(tc => selectedTestCases.has(tc.id));
        if (selectedTcs.length === 0) return null;
        
        return {
          title: sg.title,
          description: sg.description,
                        test_cases: selectedTcs.map(tc => ({
                            title: tc.title,
                            description: tc.description,
                            preconditions: tc.preconditions,
                            steps: tc.steps.map((st, i) => ({
                                step_number: i + 1,
                                action: st.action,
                                expected_outcome: st.expected_result || st.expected_outcome || ''
                            })),
                            type: tc.type,
                            priority: tc.priority,
                            source: tc.source,
                            is_automated: tc.is_automated
                        }))
        };
      }).filter(Boolean);

      const rootName = plan.title || plan.user_prompt || plan.prompt || 'Manual Test Cases';
      // os: 'browser' for browser-context manual cases, 'app' for exported app manual cases (from plan created with manualContext: 'app')
      const os = (plan.os === 'app' || plan.os === 'browser') ? plan.os : 'browser';
      await exportToTestManager({
        plan_id: plan.id || plan._id,
        root_folder_name: rootName,
        scenarios: exportedScenarios,
        os,
      });
      setSelectedTestCases(new Set());
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export to Test Manager: ' + (err.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading || (!plan && !scenarioGroups.length)) {
    return (
      <div className="manual-results-panel">
        <div className="premium-empty-state">
          <div className="discovery-header">
            <div className="pulse-dot"></div>
            <h2>Agents are generating manual test cases</h2>
            <p>Analyzing requirements and structuring comprehensive test scenarios...</p>
          </div>
          <div className="empty-state-skeleton">
            <div className="skeleton-line short"></div>
            <div className="skeleton-line long"></div>
            <div className="skeleton-line medium"></div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedTestCase) {
    // Detail View
    const { id, title, tags, type, priority, description, preconditions, steps } = selectedTestCase;
    const priorityInfo = getPriorityInfo(priority);

    return (
      <div className="manual-results-panel">
        <div className="mr-detail-header">
          <button className="mr-back-btn" onClick={() => setSelectedTestCase(null)}>
            ← Back to List
          </button>
        </div>

        <div className="mr-detail-title-section">
          <h2><span className="mr-id">{id}</span> {title}</h2>
          <div className="mr-tags-row">
            {type && (
              <div className="mr-tag-group">
                <span className="mr-tag-label">TYPE:</span>
                <span className="mr-tag-pill">{type}</span>
              </div>
            )}
            
            <div className="mr-tag-group">
              <span className="mr-tag-label">PRIORITY:</span>
              <span className="mr-tag-outline" style={{ color: priorityInfo.color, borderColor: priorityInfo.color, backgroundColor: `${priorityInfo.color}15` }}>
                {priorityInfo.label}
              </span>
            </div>

            {tags && tags.length > 0 && (
              <div className="mr-tag-group">
                <span className="mr-tag-label">TAGS:</span>
                {tags.map((tag, i) => <span key={i} className="mr-tag-pill">{tag}</span>)}
              </div>
            )}
          </div>
        </div>

        <div className="mr-detail-content">
          <div className="mr-content-main">
            {description && (
              <div className="mr-section">
                <h3>DESCRIPTION</h3>
                <p>{description}</p>
              </div>
            )}

            {preconditions && preconditions.length > 0 && (
              <div className="mr-section">
                <h3>PRECONDITIONS</h3>
                <div className="mr-preconditions-text">
                  {preconditions}
                </div>
              </div>
            )}

            <div className="mr-section">
              <table className="mr-steps-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th style={{ width: '50%' }}>ACTION</th>
                    <th style={{ width: '50%' }}>EXPECTED RESULT</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step, idx) => (
                    <tr key={idx}>
                      <td className="mr-step-num">{String(idx + 1).padStart(2, '0')}</td>
                      <td>{step.action}</td>
                      <td>{step.expected_result}</td>
                    </tr>
                  ))}
                  {steps.length === 0 && (
                    <tr>
                      <td colSpan="3" className="mr-empty-steps">No steps defined.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="manual-results-panel">
      {plan?.title && (
        <h2 className="mr-plan-title">{plan.title}</h2>
      )}
      <div className="mr-list-header">
        <div className="mr-list-stats">
          <span className="mr-stat-pill active">{allTestCases.length} Test Cases</span>
          {selectedTestCases.size > 0 && (
            <span className="mr-stat-pill selected">{selectedTestCases.size} Selected</span>
          )}
        </div>
        <div className="mr-list-actions">
          {selectedTestCases.size > 0 && (
            <button
              type="button"
              className="mr-export-btn"
              onClick={handleExportToTestManager}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : exportComplete ? 'Exported!' : `Export ${selectedTestCases.size} to Test Manager`}
            </button>
          )}
          {allTestCases.length > 0 && (
            <button type="button" className="mr-select-all-btn" onClick={toggleSelectAll}>
              {selectedTestCases.size === allTestCases.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
      </div>

      <div className="mr-table-container">
        <table className="mr-main-table">
          <thead>
            <tr>
              <th className="mr-th-checkbox" style={{ width: '44px' }}>
                <input
                  type="checkbox"
                  checked={allTestCases.length > 0 && selectedTestCases.size === allTestCases.length}
                  ref={(el) => { if (el) el.indeterminate = selectedTestCases.size > 0 && selectedTestCases.size < allTestCases.length; }}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th style={{ width: '100px' }}>ID</th>
              <th style={{ width: 'auto' }}>TITLE</th>
              <th style={{ width: '140px' }}>TYPE</th>
              <th style={{ width: '120px' }}>PRIORITY</th>
              <th style={{ width: '100px' }}>STEPS</th>
            </tr>
          </thead>
          <tbody>
            {scenarioGroups.length === 0 ? (
              <tr>
                <td colSpan="6" className="mr-empty-table">No manual test cases generated yet.</td>
              </tr>
            ) : (
              scenarioGroups.map((sg) => {
                const isExpanded = expandedScenarios.has(sg.id);
                const allScTcIds = sg.testCases.map(tc => tc.id);
                const someSelected = allScTcIds.some(id => selectedTestCases.has(id));
                const allSelected = allScTcIds.length > 0 && allScTcIds.every(id => selectedTestCases.has(id));

                return (
                  <React.Fragment key={sg.id}>
                    {/* Scenario Header Row */}
                    <tr className="mr-scenario-group-row" onClick={() => toggleScenarioExpand(sg.id)}>
                      <td className="mr-td-checkbox" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={(e) => toggleScenarioSelection(sg.id, sg.testCases, e)}
                        />
                      </td>
                      <td colSpan="5">
                        <div className="mr-scenario-group-content">
                          <span className="mr-expander-icon">
                            {isExpanded ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            )}
                          </span>
                          <span className="mr-scenario-title-text">{sg.title}</span>
                          <span className="mr-scenario-count">({sg.testCases.length} Test Cases)</span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Test Case Rows for this Scenario */}
                    {isExpanded && sg.testCases.map((tc) => {
                      const priorityInfo = getPriorityInfo(tc.priority);
                      const checked = selectedTestCases.has(tc.id);
                      return (
                        <tr
                          key={tc.id}
                          onClick={() => setSelectedTestCase(tc)}
                          className={`mr-clickable-row mr-testcase-row ${checked ? 'mr-row-selected' : ''}`}
                        >
                          <td className="mr-td-checkbox" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => toggleTestCaseSelection(tc.id, e)}
                            />
                          </td>
                          <td className="mr-id-cell">{tc.id}</td>
                          <td>
                            <div className="mr-title-cell">
                              <span className="mr-title-text">{tc.title}</span>
                              <div className="mr-tags">
                                {tc.tags.slice(0, 2).map((t, i) => (
                                  <span key={i} className="mr-tag-small">{t}</span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td>
                            {tc.type ? <span className="mr-type-cell">{tc.type}</span> : <span className="mr-type-empty">-</span>}
                          </td>
                          <td>
                            <span className="mr-priority-badge" style={{ color: priorityInfo.color, backgroundColor: priorityInfo.bg }}>
                              <span className="mr-dot" style={{ backgroundColor: priorityInfo.color }}></span>
                              {priorityInfo.label}
                            </span>
                          </td>
                          <td className="mr-steps-count">{tc.steps.length}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
