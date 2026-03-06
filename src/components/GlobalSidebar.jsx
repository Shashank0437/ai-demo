import { NavLink } from 'react-router-dom';
import './GlobalSidebar.css';

// SVGs
const LogoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="6" height="18" fill="#111827" />
        <rect x="11" y="11" width="10" height="10" fill="#111827" />
        <rect x="11" y="3" width="6" height="6" fill="#111827" />
    </svg>
);

const AutomatorAIIcon = () => (
    <svg className="gs-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);

const TestManagerIcon = () => (
    <svg className="gs-icon-svg" version="1.1" id="XMLID_37_" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 24 24" xmlSpace="preserve" fill="currentColor">
        <g id="document-test">
            <path d="M18.4,0H4v6h2V2h10v6h6v14h-4v2h6V5.6L18.4,0z M18,2.4L21.6,6H18V2.4z" />
            <path d="M11,10h1V8H4v2h1v3.5l-5,8.2V24h8h8v-2.3l-5-8.2V10z M9,10v4.1l1,1.7c-1.1-0.1-2,0.3-2.7,0.6c-0.8,0.3-1.3,0.6-2,0.4
                L7,14.1V10H9z M8,22H2.1l2.1-3.4c0.6,0.2,1.1,0.3,1.6,0.3c0.9,0,1.6-0.3,2.3-0.6c1-0.5,1.9-0.9,3.6,0.1l2.2,3.6H8z"/>
        </g>
    </svg>
);

const ChevronRight = () => (
    <svg className="gs-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

export const GlobalSidebar = () => {
    return (
        <nav className="global-sidebar">
            <div className="gs-logo-container">
                <div className="gs-logo">
                    <LogoIcon />
                    <span className="gs-logo-text">Automator AI</span>
                </div>
            </div>

            <div className="gs-links">
                <NavLink to="/" end className={({ isActive }) => `gs-nav-item ${isActive ? 'active' : ''}`}>
                    <div className="gs-icon-wrapper"><AutomatorAIIcon /></div>
                    <span className="gs-label">Agent Home</span>
                    <ChevronRight />
                </NavLink>

                <NavLink to="/test-manager" className={({ isActive }) => `gs-nav-item ${isActive ? 'active' : ''}`}>
                    <div className="gs-icon-wrapper"><TestManagerIcon /></div>
                    <span className="gs-label">Test Manager</span>
                    <ChevronRight />
                </NavLink>
            </div>
        </nav>
    );
};
