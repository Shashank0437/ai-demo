import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTestManagerData, deleteTestCase, updateTestCase } from '../api/client';
import './TestManagerPage.css';

export const TestManagerPage = () => {
    const navigate = useNavigate();
    const [folders, setFolders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeSelection, setActiveSelection] = useState(null);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [selectedTestCase, setSelectedTestCase] = useState(null);
    const [priorityFilters, setPriorityFilters] = useState([]);
    const [typeFilters, setTypeFilters] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [activeRowMenu, setActiveRowMenu] = useState(null);
    const [isEditingTestCase, setIsEditingTestCase] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [showAutomateMenu, setShowAutomateMenu] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            try {
                setIsLoading(true);
                const data = await getTestManagerData();
                if (mounted) {
                    setFolders(data.folders || []);
                    // removed default selection logic
                }
            } catch (err) {
                if (mounted) setError(err.message || 'Failed to load test manager data');
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        loadData();
        return () => { mounted = false; };
    }, []);

    const toggleFolderExpand = (id) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectNode = (type, id) => {
        if (type === 'plan') {
            // Clicking a plan only toggles expansion, it does not select it for the right pane.
            toggleFolderExpand(id);
            // Optionally clear active selection if you don't want old test cases showing
            // setActiveSelection(null);
        } else {
            setActiveSelection({ type, id });
        }
    };

    const getPriorityBadgeClass = (priority) => {
        const classes = {
            P1: 'tm-badge-p1',
            P2: 'tm-badge-p2',
            P3: 'tm-badge-p3',
        };
        return classes[priority] || 'tm-badge-p3';
    };

    // Calculate which test cases to show on the right.
    const getDisplayedTestCases = () => {
        if (!activeSelection) return [];

        for (const folder of folders) {
            // Only return test cases if a specific scenario is selected.
            if (activeSelection.type === 'scenario') {
                const parts = activeSelection.id.split('-s');
                if (parts[0] === folder.plan_id) {
                    const sIdx = parseInt(parts[1], 10);
                    if (folder.scenarios && folder.scenarios[sIdx]) {
                        const scenario = folder.scenarios[sIdx];
                        return (scenario.test_cases || []).map(tc => ({
                            ...tc,
                            _scenarioTitle: scenario.title
                        }));
                    }
                }
            }
        }
        return [];
    };

    const getActiveFolderAndScenario = () => {
        if (activeSelection?.type === 'scenario') {
            const parts = activeSelection.id.split('-s');
            const planId = parts[0];
            const sIdx = parseInt(parts[1], 10);
            const folder = folders.find(f => f.plan_id === planId);
            if (folder && folder.scenarios) {
                return { folder, scenario: folder.scenarios[sIdx] };
            }
        }
        return { folder: null, scenario: null };
    };

    const displayedTestCases = getDisplayedTestCases().filter(tc => {
        if (priorityFilters.length > 0 && !priorityFilters.includes(tc.priority)) return false;

        if (typeFilters.length > 0) {
            const tcType = (tc.type || 'Positive').toLowerCase();
            const normalizedFilters = typeFilters.map(t => t.toLowerCase());
            if (!normalizedFilters.includes(tcType)) return false;
        }
        return true;
    });

    const getTypeInfo = (type) => {
        const typeMap = {
            'Positive': { letter: 'P', class: 'type-positive' },
            'Negative': { letter: 'N', class: 'type-negative' },
            'Edge': { letter: 'E', class: 'type-edge' },
            'Boundary/Edge Cases': { letter: 'B', class: 'type-edge' },
            'Functional': { letter: 'F', class: 'type-functional' },
            'Non-Functional': { letter: 'NF', class: 'type-nonfunctional' },
            'UI Validation': { letter: 'U', class: 'type-ui' },
            'UI': { letter: 'U', class: 'type-ui' },
        };
        return typeMap[type] || { letter: '?', class: 'type-default' };
    };

    const toggleFilter = (type, value) => {
        if (type === 'priority') {
            setPriorityFilters(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
        } else {
            setTypeFilters(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
        }
    };

    const handleDeleteTestCase = async (e, tc) => {
        e.stopPropagation();
        const { folder, scenario } = getActiveFolderAndScenario();
        if (!folder || !scenario) return;

        try {
            await deleteTestCase(folder.plan_id, scenario.title, tc.title);
            const data = await getTestManagerData();
            setFolders(data.folders || []);
            setActiveRowMenu(null);
        } catch (err) {
            alert("Failed to delete test case: " + err.message);
        }
    };

    const handleEditClick = (e, tc) => {
        e.stopPropagation();
        setActiveRowMenu(null);
        setSelectedTestCase(tc);
        setIsEditingTestCase(true);
        setEditForm(JSON.parse(JSON.stringify(tc))); // deep copy
    };

    const handleSaveTestCase = async () => {
        const { folder, scenario } = getActiveFolderAndScenario();
        if (!folder || !scenario) return;

        try {
            await updateTestCase(folder.plan_id, scenario.title, selectedTestCase.title, editForm);
            const data = await getTestManagerData();
            setFolders(data.folders || []);
            setSelectedTestCase(editForm);
            setIsEditingTestCase(false);
        } catch (err) {
            alert("Failed to save test case: " + err.message);
        }
    };

    const handleStepChange = (idx, field, value) => {
        const newForm = { ...editForm };
        newForm.steps[idx] = { ...newForm.steps[idx], [field]: value };
        setEditForm(newForm);
    };

    const handleAddStep = () => {
        const newForm = { ...editForm };
        if (!newForm.steps) newForm.steps = [];
        newForm.steps.push({
            step_number: newForm.steps.length + 1,
            action: '',
            expected_outcome: ''
        });
        setEditForm(newForm);
    };

    const handleRemoveStep = (idx) => {
        const newForm = { ...editForm };
        newForm.steps.splice(idx, 1);
        newForm.steps.forEach((step, i) => step.step_number = i + 1);
        setEditForm(newForm);
    };

    const handleInsertStep = (idx) => {
        const newForm = { ...editForm };
        if (!newForm.steps) newForm.steps = [];
        newForm.steps.splice(idx + 1, 0, {
            step_number: 0,
            action: '',
            expected_outcome: ''
        });
        newForm.steps.forEach((step, i) => step.step_number = i + 1);
        setEditForm(newForm);
    };

    if (isLoading) {
        return <div className="tm-loading">Loading Test Manager...</div>;
    }

    if (error) {
        return (
            <div className="tm-error">
                <p>Error: {error}</p>
                <button onClick={() => navigate('/')}>Return Home</button>
            </div>
        );
    }

    return (
        <div className="tm-container">
            <div className="tm-header">
                <div className="tm-header-left">
                    <h1>Folders</h1>
                </div>
            </div>

            <div className="tm-layout-split">
                {/* Left Sidebar */}
                <div className="tm-sidebar">
                    {folders.length === 0 ? (
                        <div className="tm-sidebar-empty">No folders</div>
                    ) : (
                        <div className="tm-folder-tree">
                            <div className="tm-all-testcases">
                                <svg className="tm-sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 4C2.895 4 2 4.895 2 6V18C2 19.105 2.895 20 4 20H20C21.105 20 22 19.105 22 18V9C22 7.895 21.105 7 20 7H11.586L9.586 5H4Z" />
                                </svg>
                                <b>All Test Cases</b>
                                <span className="tm-count-pill">{folders.reduce((acc, f) => acc + (f.scenarios?.reduce((acc2, s) => acc2 + (s.test_cases?.length || 0), 0) || 0), 0)}</span>
                            </div>

                            {folders.map(folder => {
                                const planId = folder.plan_id;
                                const isExpanded = expandedFolders.has(planId);
                                const isSelected = activeSelection?.type === 'plan' && activeSelection?.id === planId;
                                const totalCases = folder.scenarios?.reduce((acc, s) => acc + (s.test_cases?.length || 0), 0) || 0;

                                return (
                                    <div key={folder._id} className="tm-tree-node">
                                        <div
                                            className={`tm-tree-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleSelectNode('plan', planId)}
                                        >
                                            <span
                                                className="tm-expander"
                                                onClick={(e) => { e.stopPropagation(); toggleFolderExpand(planId); }}
                                            >
                                                {isExpanded ? (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                ) : (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                )}
                                            </span>
                                            <svg className="tm-sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="#4B5563" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4 4C2.895 4 2 4.895 2 6V18C2 19.105 2.895 20 4 20H20C21.105 20 22 19.105 22 18V9C22 7.895 21.105 7 20 7H11.586L9.586 5H4Z" />
                                            </svg>
                                            <span className="tm-tree-title">{folder.root_folder_name}</span>
                                            <span className="tm-tree-count">{totalCases}</span>
                                        </div>

                                        {isExpanded && folder.scenarios && (
                                            <div className="tm-tree-children">
                                                {folder.scenarios.map((scenario, sIdx) => {
                                                    const scenarioId = `${planId}-s${sIdx}`;
                                                    const isScenSelected = activeSelection?.type === 'scenario' && activeSelection?.id === scenarioId;
                                                    const tcCount = scenario.test_cases?.length || 0;

                                                    return (
                                                        <div
                                                            key={scenarioId}
                                                            className={`tm-tree-item sub-item ${isScenSelected ? 'selected' : ''}`}
                                                            onClick={() => handleSelectNode('scenario', scenarioId)}
                                                        >
                                                            <svg className="tm-sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="#6B7280" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M4 4C2.895 4 2 4.895 2 6V18C2 19.105 2.895 20 4 20H20C21.105 20 22 19.105 22 18V9C22 7.895 21.105 7 20 7H11.586L9.586 5H4Z" />
                                                            </svg>
                                                            <span className="tm-tree-title">{scenario.title}</span>
                                                            <span className="tm-tree-count">{tcCount}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Content Area */}
                <div className="tm-main-view">
                    <div className="tm-main-header">
                        <div className="tm-search-bar">
                            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input type="text" placeholder="Search by Test Case ID or Title" />
                        </div>
                    </div>

                    <div className="tm-testcase-list">
                        {displayedTestCases.length === 0 ? (
                            <div className="tm-empty-state">
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="#E5E7EB" xmlns="http://www.w3.org/2000/svg" className="folder-icon-large">
                                    <path d="M4 4C2.895 4 2 4.895 2 6V18C2 19.105 2.895 20 4 20H20C21.105 20 22 19.105 22 18V9C22 7.895 21.105 7 20 7H11.586L9.586 5H4Z" />
                                </svg>
                                <h2>No test cases in selection</h2>
                            </div>
                        ) : (
                            displayedTestCases.map((tc, tcIdx) => (
                                <div key={tcIdx} className="tm-tc-row" onClick={() => setSelectedTestCase(tc)}>
                                    <div className="tm-tc-row-header">
                                        <div className="tm-tc-title-wrap">
                                            <svg className="tm-status-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                            </svg>
                                            <span className="tm-tc-title">{tc.title}</span>
                                            {tc.source !== 'manual' && <span className="tm-tag tm-tag-ai">AI Generated</span>}
                                            <span className={`tm-tag tm-tag-type ${getTypeInfo(tc.type === 'UI Validation' ? 'UI' : (tc.type || 'Positive')).class}`} title={tc.type === 'UI Validation' ? 'UI Validation' : (tc.type || 'Positive')}>
                                                {getTypeInfo(tc.type === 'UI Validation' ? 'UI' : (tc.type || 'Positive')).letter}
                                            </span>
                                            {tc.os === 'app' ? (
                                                <span className="tm-tag tm-tag-os" title="Mobile App" style={{ display: 'inline-flex', alignItems: 'center', background: '#F3F4F6', color: '#4B5563' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                                                    App
                                                </span>
                                            ) : (
                                                <span className="tm-tag tm-tag-os" title="Web Browser" style={{ display: 'inline-flex', alignItems: 'center', background: '#F3F4F6', color: '#4B5563' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                                                    Web
                                                </span>
                                            )}
                                        </div>
                                        <div className="tm-tc-row-actions" style={{ position: 'relative' }}>
                                            <div className="tm-action-dots" onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveRowMenu(activeRowMenu === tcIdx ? null : tcIdx);
                                            }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF">
                                                    <circle cx="5" cy="12" r="2" />
                                                    <circle cx="12" cy="12" r="2" />
                                                    <circle cx="19" cy="12" r="2" />
                                                </svg>
                                            </div>
                                            {activeRowMenu === tcIdx && (
                                                <div className="tm-row-dropdown-menu">
                                                    <div className="tm-dropdown-item" onClick={(e) => handleEditClick(e, tc)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: '#6B7280' }}>
                                                            <path d="M12 20h9"></path>
                                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                        </svg>
                                                        Edit
                                                    </div>
                                                    <div className="tm-dropdown-item text-red" onClick={(e) => handleDeleteTestCase(e, tc)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: '#DC2626' }}>
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                        Delete
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="tm-tc-row-meta">
                                        <span className="tc-id">TC-{tcIdx + 1}</span>
                                        <span className="tm-dot-sep">•</span>
                                        <span className="tc-updated">Updated just now</span>
                                        <span className="tm-dot-sep">•</span>
                                        <span className={`tm-badge-mini ${getPriorityBadgeClass(tc.priority)}`}>{tc.priority}</span>
                                    </div>
                                    <div className="tm-tc-row-path">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                                            <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V9C22 7.89543 21.1046 7 20 7H11.5858L9.58579 5H4Z" fill="#9CA3AF" />
                                        </svg>
                                        {tc._scenarioTitle || tc.title}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Test Case Detail Modal */}
            {selectedTestCase && (
                <div className="tm-modal-overlay" onClick={() => {
                    setSelectedTestCase(null);
                    setIsEditingTestCase(false);
                }}>
                    <div className="tm-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="tm-modal-header">
                            <div className="tm-modal-title-row">
                                <h2>{selectedTestCase.title}</h2>
                                <div className="tm-modal-top-actions">
                                    {isEditingTestCase && (
                                        <button className="tm-btn-primary tm-btn-save" onClick={handleSaveTestCase}>Save</button>
                                    )}
                                    {selectedTestCase.is_automated === false && (
                                        <div className="tm-automate-wrapper">
                                            <button
                                                type="button"
                                                className="tm-btn-automate"
                                                onClick={() => setShowAutomateMenu(!showAutomateMenu)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                                    <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z" />
                                                </svg>
                                                Execute with Automator AI Agents
                                            </button>
                                            {showAutomateMenu && (
                                                <>
                                                    <div 
                                                        className="tm-dropdown-overlay" 
                                                        onClick={(e) => { e.stopPropagation(); setShowAutomateMenu(false); }} 
                                                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
                                                    />
                                                    <div className="tm-automate-dropdown" style={{ zIndex: 100 }}>
                                                        <div className="tm-automate-option" onClick={() => { setShowAutomateMenu(false); showToast(`Quick Authoring Agent started for "${selectedTestCase.title}" (demo mode)`); }}>
                                                            <div className="tm-automate-option-icon text-yellow-500">
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                                                </svg>
                                                            </div>
                                                            <div className="tm-automate-option-text">
                                                                <strong>Quick Authoring Agent</strong>
                                                                <span>Debug and live preview</span>
                                                            </div>
                                                        </div>
                                                        <div className="tm-automate-option" onClick={() => { setShowAutomateMenu(false); showToast(`Background Runner Agent started for "${selectedTestCase.title}" (demo mode)`); }}>
                                                            <div className="tm-automate-option-icon text-blue-500">
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                                                                    <circle cx="12" cy="5" r="2"></circle>
                                                                    <path d="M12 7v4"></path>
                                                                    <line x1="8" y1="16" x2="8" y2="16"></line>
                                                                    <line x1="16" y1="16" x2="16" y2="16"></line>
                                                                </svg>
                                                            </div>
                                                            <div className="tm-automate-option-text">
                                                                <strong>Background Runner Agent</strong>
                                                                <span>Run silently in background</span>
                                                            </div>
                                                        </div>
                                                        {selectedTestCase.source === 'manual' && (
                                                            <div className="tm-automate-option" onClick={() => { setShowAutomateMenu(false); showToast(`Manual Executor Agent started for "${selectedTestCase.title}" (demo mode)`); }}>
                                                                <div className="tm-automate-option-icon text-teal-600" style={{ color: '#0f766e' }}>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <circle cx="12" cy="12" r="10"></circle>
                                                                        <polygon points="10 8 16 12 10 16 10 8"></polygon>
                                                                    </svg>
                                                                </div>
                                                                <div className="tm-automate-option-text">
                                                                    <strong>Manual Executor Agent</strong>
                                                                    <span>Execute manual steps</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button className="tm-modal-close" onClick={() => {
                                    setSelectedTestCase(null);
                                    setIsEditingTestCase(false);
                                }}>×</button>
                            </div>
                            <div className="tm-modal-meta-row">
                                <div className="tm-modal-meta">
                                    <span className={`tm-badge ${getPriorityBadgeClass(selectedTestCase.priority)}`}>
                                        {selectedTestCase.priority}
                                    </span>
                                    <span className={`tm-tag tm-tag-type ${getTypeInfo(selectedTestCase.type === 'UI Validation' ? 'UI' : (selectedTestCase.type || 'Positive')).class}`} title={selectedTestCase.type === 'UI Validation' ? 'UI Validation' : (selectedTestCase.type || 'Positive')}>
                                        {getTypeInfo(selectedTestCase.type === 'UI Validation' ? 'UI' : (selectedTestCase.type || 'Positive')).letter}
                                    </span>
                                    {selectedTestCase.source !== 'manual' && <span className="tm-tag tm-tag-ai">AI Generated</span>}
                                    {selectedTestCase.os === 'app' ? (
                                        <span className="tm-tag tm-tag-os" title="Mobile App" style={{ display: 'inline-flex', alignItems: 'center', background: '#F3F4F6', color: '#4B5563', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, border: '1px solid #E5E7EB' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                                            App
                                        </span>
                                    ) : (
                                        <span className="tm-tag tm-tag-os" title="Web Browser" style={{ display: 'inline-flex', alignItems: 'center', background: '#F3F4F6', color: '#4B5563', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, border: '1px solid #E5E7EB' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                                            Web
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="tm-modal-body">
                            {isEditingTestCase ? (
                                <>
                                    <div className="tm-tc-description">
                                        <h3>Description</h3>
                                        <textarea
                                            className="tm-edit-textarea"
                                            value={editForm.description || ''}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            placeholder="Enter description..."
                                        />
                                    </div>
                                    <div className="tm-tc-description">
                                        <h3>Preconditions</h3>
                                        <textarea
                                            className="tm-edit-textarea"
                                            value={editForm.preconditions || ''}
                                            onChange={(e) => setEditForm({ ...editForm, preconditions: e.target.value })}
                                            placeholder="Enter preconditions..."
                                        />
                                    </div>
                                    <h3>Steps</h3>
                                    <div className="tc-step-grid">
                                        {editForm.steps?.map((step, idx) => (
                                            <div key={idx} className="tc-step-row-edit-wrap">
                                                <div className="tc-step-row has-actions">
                                                    <div className="tc-step-box">
                                                        <div className="tc-step-label">Step {step.step_number} Action</div>
                                                        <textarea
                                                            className="tm-edit-textarea-step"
                                                            value={step.action || ''}
                                                            onChange={(e) => handleStepChange(idx, 'action', e.target.value)}
                                                            placeholder="Navigate to..."
                                                        />
                                                    </div>
                                                    <div className="tc-outcome-box">
                                                        <div className="tc-step-label">Expected Outcome</div>
                                                        <textarea
                                                            className="tm-edit-textarea-step"
                                                            value={step.expected_outcome || ''}
                                                            onChange={(e) => handleStepChange(idx, 'expected_outcome', e.target.value)}
                                                            placeholder="The page loads..."
                                                        />
                                                    </div>
                                                    <div className="tc-step-actions">
                                                        <button
                                                            className="tc-step-action-btn delete"
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveStep(idx); }}
                                                            title="Delete step"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className="tc-step-action-btn insert"
                                                            onClick={(e) => { e.stopPropagation(); handleInsertStep(idx); }}
                                                            title="Insert step below"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="tc-step-add-row">
                                        <button className="tm-btn-add-step" onClick={handleAddStep}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                            Add test step
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {selectedTestCase.description && (
                                        <div className="tm-tc-description">
                                            <h3>Description</h3>
                                            <p>{selectedTestCase.description}</p>
                                        </div>
                                    )}
                                    {selectedTestCase.preconditions && (
                                        <div className="tm-tc-description">
                                            <h3>Preconditions</h3>
                                            <p style={{ whiteSpace: 'pre-line' }}>{selectedTestCase.preconditions}</p>
                                        </div>
                                    )}

                                    <h3>Steps</h3>
                                    <div className="tc-step-grid">
                                        {selectedTestCase.steps?.map((step, idx) => (
                                            <div key={idx} className="tc-step-row">
                                                <div className="tc-step-box">
                                                    <div className="tc-step-label">Step {step.step_number}</div>
                                                    <div className="tc-step-content">{step.action}</div>
                                                </div>
                                                <div className="tc-outcome-box">
                                                    <div className="tc-step-label">Outcome</div>
                                                    <div className="tc-step-content">{step.expected_outcome}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast notification */}
            {toast && (
                <div className="tm-toast" onClick={() => setToast(null)}>
                    <div className="tm-toast-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};
