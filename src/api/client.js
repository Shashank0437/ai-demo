/**
 * Dummy API Client for Vercel demo — no backend, all in-memory dummy data.
 * Same interface as the real client so the UI works unchanged.
 */

// ——— In-memory stores (orchestrated like a read backend) ———
const plansStore = new Map();
const manualPlansStore = new Map();

const DUMMY_SCENARIOS = [
  {
    id: 'sc-1',
    title: 'User login and authentication',
    feature_area: 'Authentication',
    test_cases: [
      { title: 'Valid login with email and password', type: 'Positive', priority: 'P1', source: 'ai', is_automated: false, steps: [{ step_number: 1, action: 'Navigate to login page', expected_outcome: 'Login form is displayed' }, { step_number: 2, action: 'Enter valid credentials', expected_outcome: 'User is logged in' }], description: 'Verify successful login', preconditions: 'User has an account' },
      { title: 'Invalid password shows error', type: 'Negative', priority: 'P2', source: 'ai', is_automated: false, steps: [{ step_number: 1, action: 'Enter wrong password', expected_outcome: 'Error message is shown' }], description: 'Verify error handling', preconditions: '' },
    ],
  },
  {
    id: 'sc-2',
    title: 'Checkout flow',
    feature_area: 'E-commerce',
    test_cases: [
      { title: 'Complete purchase with valid payment', type: 'Positive', priority: 'P1', source: 'manual', is_automated: false, steps: [{ step_number: 1, action: 'Add item to cart', expected_outcome: 'Cart updates' }, { step_number: 2, action: 'Proceed to checkout', expected_outcome: 'Payment form is shown' }], description: 'End-to-end purchase', preconditions: 'User is logged in' },
      { title: 'Cart persists on refresh', type: 'UI Validation', priority: 'P3', source: 'ai', is_automated: false, steps: [{ step_number: 1, action: 'Refresh page', expected_outcome: 'Cart contents remain' }], description: 'Session persistence', preconditions: '' },
    ],
  },
];

function buildDummyPlan(planId, overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: planId,
    _id: planId,
    url: overrides.url || 'https://example.com',
    prompt: overrides.prompt || 'Create a comprehensive test plan for this website.',
    user_prompt: overrides.prompt || overrides.user_prompt,
    status: overrides.status || 'completed',
    mode: overrides.mode || 'planner',
    total_scenarios: DUMMY_SCENARIOS.length,
    total_test_cases: DUMMY_SCENARIOS.reduce((acc, s) => acc + (s.test_cases?.length || 0), 0),
    scenarios: overrides.scenarios ?? DUMMY_SCENARIOS,
    created_at: overrides.created_at || now,
    updated_at: overrides.updated_at || now,
    ...overrides,
  };
}

function buildDummyManualPlan(planId, overrides = {}) {
  const now = new Date().toISOString();
  const scenarios = overrides.scenarios ?? DUMMY_SCENARIOS.map((s, i) => ({
    ...s,
    id: s.id || `SC-${i + 1}`,
    scenario_title: s.title,
    scenario_description: s.feature_area,
    test_cases: (s.test_cases || []).map((tc, j) => ({
      ...tc,
      priority_label: tc.priority,
      scenario_description: tc.description,
    })),
  }));
  return {
    id: planId,
    _id: planId,
    url: 'Manual Context',
    prompt: overrides.prompt || 'Generate manual test cases',
    user_prompt: overrides.prompt || overrides.user_prompt,
    status: overrides.status || 'completed',
    mode: 'manual',
    total_scenarios: scenarios.length,
    total_test_cases: scenarios.reduce((acc, s) => acc + (s.test_cases?.length || 0), 0),
    scenarios,
    created_at: overrides.created_at || now,
    updated_at: overrides.updated_at || now,
    ...overrides,
  };
}

/** Called by dummy useSSE when stream "completes" to persist the plan for getPlan/getManualPlan */
export function __dummyCompletePlan(planId, mode, planDoc) {
  if (mode === 'manual') {
    manualPlansStore.set(planId, { ...planDoc, id: planId });
  } else {
    plansStore.set(planId, { ...planDoc, id: planId });
  }
}

// Seed a couple of recent plans so "Recent Plans" isn't empty
const seedPlan1 = buildDummyPlan('plan-demo-1', { created_at: new Date(Date.now() - 86400000).toISOString() });
const seedPlan2 = buildDummyManualPlan('plan-demo-manual-1', { prompt: 'Login and logout manual test cases', created_at: new Date(Date.now() - 172800000).toISOString() });
plansStore.set(seedPlan1.id, seedPlan1);
manualPlansStore.set(seedPlan2.id, seedPlan2);

// ——— Test Manager: in-memory folders (mutable for edit/delete) ———
let testManagerFolders = [
  {
    _id: 'tm-1',
    plan_id: seedPlan1.id,
    root_folder_name: 'Demo Test Suite',
    scenarios: JSON.parse(JSON.stringify(DUMMY_SCENARIOS)),
  },
];

function getPlansList(store) {
  return Array.from(store.values()).map((p) => ({
    id: p.id,
    _id: p.id,
    title: p.title || p.prompt?.slice(0, 50) || p.url,
    url: p.url,
    prompt: p.prompt,
    user_prompt: p.user_prompt,
    status: p.status,
    created_at: p.created_at,
  }));
}

// ——— API surface (no network) ———

export const api = { get: async () => ({ data: {} }), post: async () => ({ data: {} }), put: async () => ({ data: {} }), delete: async () => ({ data: {} }) };

export const listPlans = async () => getPlansList(plansStore);

export const getPlan = async (planId) => {
  let plan = plansStore.get(planId);
  if (!plan) {
    plan = buildDummyPlan(planId);
    plansStore.set(planId, plan);
  }
  return { ...plan, id: plan.id || plan._id };
};

export const createPlan = async (planData) => {
  const id = planData.id || generatePlanId();
  const plan = buildDummyPlan(id, { ...planData, status: 'completed' });
  plansStore.set(id, plan);
  return { id, ...plan };
};

export const stopPlan = async () => ({ ok: true });

export const getPlanMessages = async (planId) => {
  const plan = plansStore.get(planId);
  const prompt = plan?.prompt || plan?.user_prompt || 'Create test plan';
  return {
    messages: [
      { method: 'conversation', role: 'user', content: prompt, timestamp: new Date().toISOString() },
      { method: 'conversation', role: 'assistant', content: 'Test plan generation completed successfully.', type: 'plan_completed', timestamp: new Date().toISOString() },
    ],
  };
};

export const getPlanSummary = async (planId) => {
  const plan = await getPlan(planId);
  return { ...plan, coverage: { by_type: { Positive: 2, Negative: 1, Edge: 0, 'UI Validation': 1 }, by_priority: { P1: 2, P2: 1, P3: 1 } } };
};

export const getExportUrl = () => '#';

export const getStreamUrl = () => '#'; // Not used by dummy useSSE

export const generatePlanId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `plan-${timestamp}${random}`;
};

export const exportToTestManager = async (exportData) => {
  const { plan_id, root_folder_name, scenarios } = exportData;
  if (!plan_id || !scenarios || scenarios.length === 0) return { ok: true };

  const folder = {
    _id: `tm-${Date.now()}`,
    plan_id,
    root_folder_name: root_folder_name || `Exported Plan ${plan_id}`,
    scenarios: JSON.parse(JSON.stringify(scenarios))
  };

  testManagerFolders.push(folder);
  
  return { ok: true };
};

export const getTestManagerData = async () => ({ folders: JSON.parse(JSON.stringify(testManagerFolders)) });

export const listManualPlans = async () => getPlansList(manualPlansStore);

export const getManualPlan = async (planId) => {
  let plan = manualPlansStore.get(planId);
  if (!plan) {
    plan = buildDummyManualPlan(planId);
    manualPlansStore.set(planId, plan);
  }
  return { ...plan, id: plan.id || plan._id };
};

export const getManualPlanMessages = async (planId) => {
  const plan = manualPlansStore.get(planId);
  const prompt = plan?.prompt || plan?.user_prompt || 'Generate manual test cases';
  return {
    messages: [
      { method: 'conversation', role: 'user', content: prompt, timestamp: new Date().toISOString() },
      { method: 'conversation', role: 'assistant', content: 'Manual test cases generated.', type: 'plan_completed', timestamp: new Date().toISOString() },
    ],
  };
};

export const getManualPlanSummary = async (planId) => {
  const plan = await getManualPlan(planId);
  return { ...plan };
};

export const deletePlan = async (planId) => {
  plansStore.delete(planId);
  return { ok: true };
};

export const deleteManualPlan = async (planId) => {
  manualPlansStore.delete(planId);
  return { ok: true };
};

export const deleteTestCase = async (planId, scenarioTitle, tcTitle) => {
  const folder = testManagerFolders.find((f) => f.plan_id === planId);
  if (folder?.scenarios) {
    const scenario = folder.scenarios.find((s) => s.title === scenarioTitle);
    if (scenario?.test_cases) {
      scenario.test_cases = scenario.test_cases.filter((tc) => tc.title !== tcTitle);
    }
  }
  return { ok: true };
};

export const updateTestCase = async (planId, scenarioTitle, tcTitle, updatedData) => {
  const folder = testManagerFolders.find((f) => f.plan_id === planId);
  if (folder?.scenarios) {
    const scenario = folder.scenarios.find((s) => s.title === scenarioTitle);
    const tc = scenario?.test_cases?.find((t) => t.title === tcTitle);
    if (tc) Object.assign(tc, updatedData);
  }
  return { ok: true };
};
