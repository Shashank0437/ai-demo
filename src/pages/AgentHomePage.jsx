/**
 * AgentHomePage - Landing page showing all available agents
 */

import { useNavigate } from 'react-router-dom';
import './AgentHomePage.css';

// SVG Icons
const PauseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
);

const PenIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
);

const DocIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);

const CodeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
    </svg>
);

const ArrowRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

export const AgentHomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="agent-home">
            {/* Breadcrumb */}
            <div className="ah-breadcrumb">Agent Home</div>

            {/* Hero */}
            <div className="ah-hero">
                <div className="ah-icon-wrapper">
                    <PauseIcon />
                </div>
                <h1 className="ah-title">Agentic AI Test Suite</h1>
                <p className="ah-subtitle">Select an agent to begin your testing workflow.</p>
            </div>

            {/* Agent Cards */}
            <div className="ah-cards">
                {/* Card 1: Quick Author */}
                <div className="ah-card">
                    <div className="ah-card-icon default">
                        <PenIcon />
                    </div>
                    <h3 className="ah-card-title">Quick Author</h3>
                    <p className="ah-card-desc">
                        Rapidly create test scripts using natural language prompts. Ideal for quick smoke tests and hotfixes.
                    </p>
                    <div className="ah-card-action">
                        <button className="ah-link-btn" onClick={() => alert('Coming Soon')}>
                            <span>Launch Agent</span>
                            <ArrowRight />
                        </button>
                    </div>
                </div>

                {/* Card 2: Generate Manual Testcases */}
                <div className="ah-card">
                    <div className="ah-card-icon default">
                        <DocIcon />
                    </div>
                    <h3 className="ah-card-title">Generate Manual Testcases</h3>
                    <p className="ah-card-desc">
                        Convert feature requirements into detailed manual test steps formatted for Jira or Excel export.
                    </p>
                    <div className="ah-card-action">
                        <button className="ah-link-btn" onClick={() => alert('Coming Soon')}>
                            <span>Start Generation</span>
                            <ArrowRight />
                        </button>
                    </div>
                </div>

                {/* Card 3: Agentic UI Planner (Featured) */}
                <div className="ah-card featured">
                    <span className="ah-popular-badge">POPULAR</span>
                    <div className="ah-card-icon featured">
                        <CodeIcon />
                    </div>
                    <h3 className="ah-card-title">Agentic UI Planner</h3>
                    <p className="ah-card-desc">
                        Comprehensive test planning agent that analyzes UI components and generates full coverage strategies.
                    </p>
                    <div className="ah-card-action" style={{ borderTop: 'none', paddingTop: 0 }}>
                        <button className="ah-cta-btn" onClick={() => navigate('/planner')}>
                            <span>Get Started</span>
                            <ArrowRight />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
