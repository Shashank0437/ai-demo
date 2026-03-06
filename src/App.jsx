/**
 * Main App Component
 * URL routing for home page and plan views
 */

import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { PlanPage } from './pages/PlanPage';
import { TestManagerPage } from './pages/TestManagerPage';
import { GlobalSidebar } from './components/GlobalSidebar';
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <GlobalSidebar />
      <div className="app-main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/plans/:planId" element={<PlanPage />} />
          <Route path="/test-manager" element={<TestManagerPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
