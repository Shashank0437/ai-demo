/**
 * PlanDiff - Display plan modifications with before/after comparison
 */

import './PlanDiff.css';

export const PlanDiff = ({ changes }) => {
  if (!changes || changes.length === 0) {
    return null;
  }

  const renderChange = (change, index) => {
    const { action, scenario, test_case, updates, new_test_cases, test_cases_removed, test_cases } = change;

    return (
      <div key={index} className={`diff-item diff-item-${getActionType(action)}`}>
        <div className="diff-header">
          <span className={`diff-action ${getActionClass(action)}`}>{getActionLabel(action)}</span>
          {scenario && <span className="diff-target">{scenario}</span>}
        </div>
        
        <div className="diff-content">
          {action === 'delete_scenario' && (
            <div className="diff-detail">
              Removed scenario and {test_cases_removed} test case{test_cases_removed !== 1 ? 's' : ''}
            </div>
          )}
          
          {action === 'delete_test_case' && (
            <div className="diff-detail">
              Removed test case: {test_case}
            </div>
          )}
          
          {(action === 'modify_scenario' || action === 'modify_test_case') && updates && (
            <div className="diff-updates">
              {Object.entries(updates).map(([key, value]) => (
                <div key={key} className="diff-field">
                  <span className="diff-field-name">{key}:</span>
                  <span className="diff-field-value">{value}</span>
                </div>
              ))}
            </div>
          )}
          
          {action === 'replan_scenario' && (
            <div className="diff-detail">
              Regenerated {new_test_cases} test case{new_test_cases !== 1 ? 's' : ''}
            </div>
          )}
          
          {action === 'replan_test_case' && test_case && (
            <div className="diff-detail">
              Regenerated test case: {test_case}
            </div>
          )}
          
          {action === 'add_scenario' && (
            <div className="diff-detail">
              Created new scenario with {test_cases} test case{test_cases !== 1 ? 's' : ''}
            </div>
          )}
          
          {action === 'add_test_case' && (
            <div className="diff-detail">
              Added test case: {test_case}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Determine the primary action type for the wrapper
  const primaryActionType = changes.length > 0 ? getActionType(changes[0].action) : 'default';

  return (
    <div className={`plan-diff plan-diff-${primaryActionType}`}>
      <div className="diff-title">Changes Made</div>
      <div className="diff-list">
        {changes.map(renderChange)}
      </div>
    </div>
  );
};

const getActionLabel = (action) => {
  const labels = {
    delete_scenario: 'Deleted',
    delete_test_case: 'Deleted',
    modify_scenario: 'Modified',
    modify_test_case: 'Modified',
    modify_test_steps: 'Modified Steps',
    replan_scenario: 'Replanned',
    replan_test_case: 'Replanned',
    add_scenario: 'Added',
    add_test_case: 'Added',
  };
  return labels[action] || action;
};

const getActionClass = (action) => {
  if (action === 'delete_scenario' || action === 'delete_test_case') {
    return 'diff-action-delete';
  }
  if (action === 'modify_scenario' || action === 'modify_test_case' || action === 'modify_test_steps') {
    return 'diff-action-modify';
  }
  if (action === 'replan_scenario' || action === 'replan_test_case') {
    return 'diff-action-replan';
  }
  if (action === 'add_scenario' || action === 'add_test_case') {
    return 'diff-action-add';
  }
  return '';
};

const getActionType = (action) => {
  if (action === 'delete_scenario' || action === 'delete_test_case') {
    return 'delete';
  }
  if (action === 'modify_scenario' || action === 'modify_test_case' || action === 'modify_test_steps') {
    return 'modify';
  }
  if (action === 'replan_scenario' || action === 'replan_test_case') {
    return 'replan';
  }
  if (action === 'add_scenario' || action === 'add_test_case') {
    return 'add';
  }
  return 'default';
};
