/**
 * ResultsPanel - Scenario-based collapsible view
 */

import { useState, useMemo, useEffect } from 'react';
import './ResultsPanel.css';
import { formatDuration } from '../utils/format';

// Donut Chart Component with better styling
const DonutChart = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) return null;

  const size = 180;
  const center = size / 2;
  const radius = 65;
  const strokeWidth = 24;
  const innerRadius = radius - strokeWidth;

  let currentAngle = -90;
  const segments = [];
  data.forEach((item) => {
    if (item.count <= 0) return;
    const percentage = (item.count / total) * 100;
    const angle = (item.count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const x3 = center + innerRadius * Math.cos(endRad);
    const y3 = center + innerRadius * Math.sin(endRad);
    const x4 = center + innerRadius * Math.cos(startRad);
    const y4 = center + innerRadius * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');

    segments.push({ ...item, path, percentage });
  });

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #E5E7EB',
      minWidth: '350px',
      flex: 1,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        {title}
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {/* Donut Chart */}
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {segments.map((segment, idx) => (
              <path
                key={idx}
                d={segment.path}
                fill={segment.color}
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </svg>
          {/* Center label */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
              {total}
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '-2px' }}>
              Total
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1 }}>
          {data.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '6px 0',
              borderBottom: idx < data.length - 1 ? '1px solid #F3F4F6' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  background: item.color,
                  flexShrink: 0
                }} />
                <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                  {item.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {item.count}
                </span>
                <span style={{ fontSize: '12px', color: '#9CA3AF', minWidth: '45px', textAlign: 'right' }}>
                  ({item.count > 0 ? Math.round((item.count / total) * 100) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import { exportToTestManager } from '../api/client';

// ... (existing helper functions)

export const ResultsPanel = ({ plan }) => {
  const [expandedScenarios, setExpandedScenarios] = useState(new Set());
  const [expandedTestCases, setExpandedTestCases] = useState(new Set());

  const [selectedPriorities, setSelectedPriorities] = useState(new Set());
  const [selectedTypes, setSelectedTypes] = useState(new Set());

  const togglePriorityFilter = (priority) => {
    setSelectedPriorities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(priority)) newSet.delete(priority);
      else newSet.add(priority);
      return newSet;
    });
  };

  const toggleTypeFilter = (type) => {
    setSelectedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) newSet.delete(type);
      else newSet.add(type);
      return newSet;
    });
  };

  // Test Manager Selection State
  const [selectedTestCases, setSelectedTestCases] = useState(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const scenarioGroups = useMemo(() => {
    if (!plan || !plan.scenarios) return [];

    return plan.scenarios.map(s => {
      // Get all test cases for this scenario
      const allTestCases = s.test_cases || s.testCases || [];

      // Filter test cases based on selected filters
      const filteredTestCases = allTestCases.filter(tc => {
        // Check priority filter
        if (selectedPriorities.size > 0 && !selectedPriorities.has(tc.priority)) {
          return false;
        }

        // Check type filter
        if (selectedTypes.size > 0) {
          const tcType = tc.type || 'Positive';
          // Case insensitive match
          const hasMatch = Array.from(selectedTypes).some(
            t => t.toLowerCase() === tcType.toLowerCase()
          );
          if (!hasMatch) return false;
        }

        return true;
      });

      return {
        ...s,
        testCases: filteredTestCases,
        totalCases: filteredTestCases.length
      };
    }).filter(s => s.totalCases > 0); // Only keep scenarios that have > 0 test cases after filtering
  }, [plan, selectedPriorities, selectedTypes]);

  const toggleTestCaseSelection = (testCaseId) => {
    setSelectedTestCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testCaseId)) newSet.delete(testCaseId);
      else newSet.add(testCaseId);
      return newSet;
    });
  };

  const toggleScenario = (scenarioId) => {
    setExpandedScenarios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scenarioId)) newSet.delete(scenarioId);
      else newSet.add(scenarioId);
      return newSet;
    });
  };

  const toggleTestCase = (testCaseId) => {
    setExpandedTestCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testCaseId)) newSet.delete(testCaseId);
      else newSet.add(testCaseId);
      return newSet;
    });
  };

  const toggleAllScenarios = () => {
    if (expandedScenarios.size === scenarioGroups.length) {
      // Collapse all
      setExpandedScenarios(new Set());
    } else {
      // Expand all
      const allIds = new Set(scenarioGroups.map(s => s._id || s.title));
      setExpandedScenarios(allIds);
    }
  };

  const toggleScenarioSelection = (scenario, isSelected) => {
    const scenarioTcIds = scenario.testCases.map((tc, tcIdx) => `${scenario._id || 's'}-${tc._id || tcIdx}`);
    setSelectedTestCases(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        // add all
        scenarioTcIds.forEach(id => newSet.add(id));
      } else {
        // remove all
        scenarioTcIds.forEach(id => newSet.delete(id));
      }
      return newSet;
    });
  };

  const isScenarioFullySelected = (scenario) => {
    if (!scenario || !scenario.testCases || scenario.testCases.length === 0) return false;
    const scenarioTcIds = scenario.testCases.map((tc, tcIdx) => `${scenario._id || 's'}-${tc._id || tcIdx}`);
    return scenarioTcIds.every(id => selectedTestCases.has(id));
  };

  const isScenarioPartiallySelected = (scenario) => {
    if (!scenario || !scenario.testCases || scenario.testCases.length === 0) return false;
    const scenarioTcIds = scenario.testCases.map((tc, tcIdx) => `${scenario._id || 's'}-${tc._id || tcIdx}`);
    const selectedCount = scenarioTcIds.filter(id => selectedTestCases.has(id)).length;
    return selectedCount > 0 && selectedCount < scenarioTcIds.length;
  };

  const handleExport = async () => {
    if (selectedTestCases.size === 0) return;

    setIsExporting(true);
    setExportComplete(false);

    try {
      // Build export payload exactly matching DB schema expectation
      const exportedScenarios = [];

      scenarioGroups.forEach((scenario, sIdx) => {
        const scenarioId = scenario._id || 's';

        // Find which test cases are selected in this scenario
        const selectedTcs = scenario.testCases.filter((tc, tcIdx) => {
          return selectedTestCases.has(`${scenarioId}-${tc._id || tcIdx}`);
        });

        if (selectedTcs.length > 0) {
          exportedScenarios.push({
            title: scenario.title,
            description: scenario.description,
            feature_area: scenario.feature_area,
            test_cases: selectedTcs
          });
        }
      });

        const payload = {
        plan_id: plan.id || plan._id,
        root_folder_name: plan.title || (plan.url && plan.url.startsWith('http') ? plan.url : plan.prompt) || `Plan ${plan.id || plan._id}`,
        scenarios: exportedScenarios
      };

      await exportToTestManager(payload);

      // Clear selection and show success
      setSelectedTestCases(new Set());
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);

    } catch (err) {
      console.error("Export Failed", err);
      alert("Failed to export to Test Manager: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Get feature areas directly from the plan document (real-time discovery)
  const featureAreas = useMemo(() => {
    if (!plan) return [];
    const areas = new Set();

    // 1. Pull directly from scout's discovered areas (shows up instantly)
    if (plan.feature_areas && Array.isArray(plan.feature_areas)) {
      plan.feature_areas.forEach(fa => areas.add(fa.name));
    }

    // 2. Fallback to extracting from scenarios
    if (plan.scenarios) {
      plan.scenarios.forEach(s => {
        if (s.feature_area) areas.add(s.feature_area);
      });
    }

    return Array.from(areas);
  }, [plan]);

  const getPriorityBadge = (priority) => {
    const classes = {
      P1: 'priority-high',
      P2: 'priority-med',
      P3: 'priority-low',
    };
    return classes[priority] || 'priority-low';
  };

  const getTypeInfo = (type) => {
    const typeMap = {
      'Positive': { letter: 'P', class: 'type-positive' },
      'Negative': { letter: 'N', class: 'type-negative' },
      'Edge': { letter: 'E', class: 'type-edge' },
      'UI Validation': { letter: 'U', class: 'type-ui' },
      'UI': { letter: 'U', class: 'type-ui' },
    };
    return typeMap[type] || { letter: '?', class: 'type-default' };
  };

  // Calculate coverage data for pie charts
  const coverageData = useMemo(() => {
    if (!plan || !plan.scenarios) return null;

    const typeCount = { Positive: 0, Negative: 0, Edge: 0, 'UI': 0 };
    const priorityCount = { P1: 0, P2: 0, P3: 0, P4: 0 };

    plan.scenarios.forEach(scenario => {
      (scenario.test_cases || []).forEach(tc => {
        const tcType = tc.type === 'UI Validation' ? 'UI' : tc.type;
        if (Object.hasOwn(typeCount, tcType)) typeCount[tcType]++;
        if (Object.hasOwn(priorityCount, tc.priority)) priorityCount[tc.priority]++;
      });
    });

    return {
      byType: [
        { label: 'Positive', count: typeCount.Positive, color: '#10B981' },
        { label: 'Negative', count: typeCount.Negative, color: '#EF4444' },
        { label: 'Edge', count: typeCount.Edge, color: '#3B82F6' },
        { label: 'UI', count: typeCount['UI'], color: '#EAB308' },
      ],
      byPriority: [
        { label: 'P1', count: priorityCount.P1, color: '#EF4444' },
        { label: 'P2', count: priorityCount.P2, color: '#F59E0B' },
        { label: 'P3', count: priorityCount.P3, color: '#3B82F6' },
        { label: 'P4', count: priorityCount.P4, color: '#6B7280' },
      ]
    };
  }, [plan]);

  // Format duration for display
  const durationDisplay = useMemo(() => {
    if (!plan) return null;

    // Check if plan is completed
    const isFinished = ['completed', 'completed_with_errors', 'failed', 'stopped'].includes(plan.status);
    if (!isFinished) return null;

    // Use duration_seconds if available, otherwise calculate from timestamps
    if (plan.duration_seconds) {
      const seconds = Math.floor(plan.duration_seconds);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        const remainingMins = minutes % 60;
        return `${hours}h ${remainingMins}m`;
      } else if (minutes > 0) {
        const remainingSecs = seconds % 60;
        return `${minutes}m ${remainingSecs}s`;
      } else {
        return `${seconds}s`;
      }
    }

    // Fallback to formatDuration
    return formatDuration(plan.created_at, plan.updated_at, plan.status);
  }, [plan]);

  return (
    <div className="results-panel">
      <div className="results-header">
        <div className="results-title">Test Scenarios</div>
        <div className="results-stats">
          <div className="stat-badge stat-feature">
            <span className="stat-value">{featureAreas.length}</span>
            <span className="stat-label">Feature Areas</span>
          </div>
          <div className="stat-badge stat-scenario">
            <span className="stat-value">{plan?.total_scenarios || 0}</span>
            <span className="stat-label">Scenarios</span>
          </div>
          <div className="stat-badge stat-testcase">
            <span className="stat-value">{plan?.total_test_cases || 0}</span>
            <span className="stat-label">Test Cases</span>
          </div>
          {durationDisplay && (
            <div className="stat-badge stat-duration">
              <span className="stat-value">{durationDisplay}</span>
              <span className="stat-label">Duration</span>
            </div>
          )}
        </div>
        <div className="results-actions">
          {selectedTestCases.size > 0 && (
            <button
              className="action-button primary"
              onClick={handleExport}
              disabled={isExporting}
              style={{
                background: exportComplete ? '#10B981' : '#3B82F6',
                color: 'white',
                border: 'none',
                marginRight: '8px'
              }}
            >
              {isExporting ? 'Exporting...' : exportComplete ? 'Exported!' : `Export ${selectedTestCases.size} to Test Manager`}
            </button>
          )}
          {scenarioGroups.length > 0 && (
            <button className="action-button" onClick={toggleAllScenarios}>
              {expandedScenarios.size === scenarioGroups.length ? 'Collapse All' : 'Expand All'}
            </button>
          )}
        </div>
      </div>

      {/* Feature Areas after Header */}
      {/* ... keeping existing down to scenarios-list ... */}

      {/* Feature Areas after Header */}
      {featureAreas.length > 0 && (
        <div className="feature-areas-bar">
          {featureAreas.map((area, idx) => (
            <span key={idx} className="feature-area-badge">
              {area}
            </span>
          ))}
        </div>
      )}

      {/* Coverage Overview Charts */}
      {coverageData && plan?.total_test_cases > 0 && (
        <div style={{
          display: 'flex',
          gap: '20px',
          padding: '24px 20px',
          background: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <DonutChart data={coverageData.byType} title="Test Type Distribution" />
          <DonutChart data={coverageData.byPriority} title="Priority Distribution" />
        </div>
      )}

      {/* Filter Section */}
      {plan?.total_test_cases > 0 && (
        <div className="filter-section">
          <div className="filter-group">
            <span className="filter-label">Priority Filters:</span>
            {['P1', 'P2', 'P3', 'P4'].map(p => (
              <button
                key={p}
                className={`filter-pill ${selectedPriorities.has(p) ? `active priority-${p.toLowerCase()}` : ''}`}
                onClick={() => togglePriorityFilter(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <span className="filter-label">Test Type Filters:</span>
            {['Positive', 'Negative', 'Edge', 'UI'].map(t => {
              const fullType = t === 'UI' ? 'UI Validation' : t;
              const typeClass = fullType.toLowerCase().replace(' ', '-');
              return (
                <button
                  key={fullType}
                  className={`filter-pill ${selectedTypes.has(fullType) ? `active type-${typeClass}` : ''}`}
                  onClick={() => toggleTypeFilter(fullType)}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="results-content">
        {!plan || scenarioGroups.length === 0 ? (
          <div className="premium-empty-state">
            <div className="discovery-header">
              <div className="pulse-dot"></div>
              <h2>Agents are mapping your application</h2>
              <p>The scout agent is traversing your website, while other agents are planning the test scenarios and test cases.</p>
              {plan && plan.status && (
                <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '8px' }}>
                  Status: {plan.status} | Scenarios: {plan.total_scenarios || 0} | Test Cases: {plan.total_test_cases || 0}
                </p>
              )}
            </div>

            {featureAreas.length > 0 ? (
              <div className="discovered-areas-list">
                <h3>Discovered Areas ({featureAreas.length})</h3>
                <div className="areas-grid">
                  {featureAreas.map((area, idx) => (
                    <div key={idx} className="discovering-area-card">
                      <span className="spinner-small"></span>
                      <span>Generating tests for <strong style={{ color: '#111827' }}>{area}</strong>...</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state-skeleton">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line long"></div>
                <div className="skeleton-line medium"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="scenarios-list">
            {scenarioGroups.map((scenario, scenarioIdx) => {
              const scenarioId = scenario._id || `scenario-${scenarioIdx}`;
              const isExpanded = expandedScenarios.has(scenarioId);
              const isFullySelected = isScenarioFullySelected(scenario);
              const isPartial = isScenarioPartiallySelected(scenario);

              return (
                <div key={scenarioId} className="scenario-group">
                  <div
                    className="scenario-header"
                    onClick={(e) => {
                      // Only toggle expand if strictly clicking the header, not elements inside
                      if (e.target.type !== 'checkbox') {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleScenario(scenarioId);
                      }
                    }}
                  >
                    <div className="scenario-header-left">
                      <input
                        type="checkbox"
                        checked={isFullySelected}
                        ref={input => {
                          if (input) input.indeterminate = isPartial && !isFullySelected;
                        }}
                        onChange={(e) => toggleScenarioSelection(scenario, e.target.checked)}
                        style={{ marginRight: '10px', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span className="scenario-toggle">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <span className="scenario-title">{scenario.title}</span>
                      {scenario.feature_area && (
                        <span className="scenario-feature-badge">
                          {scenario.feature_area}
                        </span>
                      )}
                    </div>
                    <div className="scenario-header-right">
                      <span className="scenario-type-badge must-have">
                        Must have
                      </span>
                      <span className="scenario-count">
                        {scenario.totalCases} test cases
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      {scenario.description && (
                        <div className="scenario-description">
                          {scenario.description}
                        </div>
                      )}

                      {scenario.testCases && scenario.testCases.length > 0 && (
                        <div className="test-cases-list">
                          {scenario.testCases.map((testCase, tcIdx) => {
                            const testCaseId = `${scenarioId}-${testCase._id || tcIdx}`;
                            const isTestCaseExpanded = expandedTestCases.has(testCaseId);
                            const isSelected = selectedTestCases.has(testCaseId);

                            return (
                              <div
                                key={testCase._id || `tc-${tcIdx}`}
                                className="test-case-row"
                              >
                                <div
                                  className="test-case-main"
                                  onClick={(e) => {
                                    if (e.target.type !== 'checkbox') {
                                      e.stopPropagation();
                                      toggleTestCase(testCaseId);
                                    }
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleTestCaseSelection(testCaseId)}
                                      style={{ marginRight: '12px', width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    <span className="test-case-toggle">
                                      {isTestCaseExpanded ? '▼' : '▶'}
                                    </span>
                                    <div className="test-case-content" style={{ paddingLeft: '8px' }}>
                                      <div className="test-case-title">
                                        {testCase.title}
                                      </div>
                                      {testCase.description && (
                                        <div className="test-case-description">
                                          {testCase.description}
                                        </div>
                                      )}
                                      <div className="test-case-meta">
                                        <span className={`priority-badge ${getPriorityBadge(testCase.priority)}`}>
                                          {testCase.priority}
                                        </span>
                                        <span className="steps-info">
                                          {testCase.steps?.length || 0} steps
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="test-case-meta-right">
                                    {testCase.source !== 'manual' && <span className="tm-badge tm-badge-mini" style={{ background: '#E0E7FF', color: '#4F46E5', marginRight: '8px' }}>AI Generated</span>}
                                    <span className={`type-badge ${getTypeInfo(testCase.type === 'UI Validation' ? 'UI' : (testCase.type || 'Positive')).class}`} title={testCase.type === 'UI Validation' ? 'UI Validation' : (testCase.type || 'Positive')}>
                                      {getTypeInfo(testCase.type === 'UI Validation' ? 'UI' : (testCase.type || 'Positive')).letter}
                                    </span>
                                  </span>
                                </div>

                                {isTestCaseExpanded && testCase.steps && testCase.steps.length > 0 && (
                                  <div className="test-steps-container">
                                    <table className="test-steps-table">
                                      <thead>
                                        <tr>
                                          <th className="step-number-header">#</th>
                                          <th className="step-action-header">Action</th>
                                          <th className="step-expected-header">Expected Result</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {testCase.steps.map((step, stepIdx) => (
                                          <tr key={stepIdx} className="test-step-row">
                                            <td className="step-number-cell">{step.step_number}</td>
                                            <td className="step-action-cell">{step.action}</td>
                                            <td className="step-expected-cell">{step.expected_outcome}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
