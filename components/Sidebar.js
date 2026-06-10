export default function Sidebar({ 
    activeTab, 
    setActiveTab, 
    syncMethod, 
    currentUser, 
    onLogout, 
    theme, 
    toggleTheme,
    mobileMenuOpen,
    setMobileMenuOpen
}) {
    const isSidebarActive = mobileMenuOpen ? "active" : "";

    const handleNavClick = (tab) => {
        setActiveTab(tab);
        setMobileMenuOpen(false);
    };

    // Mapping sync method to visual badge text
    const getSyncIndicatorText = () => {
        switch (syncMethod) {
            case 'simulated': return 'Mode Simulasi';
            case 'apps-script': return 'Mode Sheets (Apps Script)';
            case 'direct-api': return 'Mode Sheets (API)';
            case 'supabase': return 'Mode Supabase DB';
            default: return 'Mode Simulasi';
        }
    };

    const getSyncIndicatorClass = () => {
        switch (syncMethod) {
            case 'simulated': return 'sync-indicator simulated';
            case 'apps-script': return 'sync-indicator sheets';
            case 'direct-api': return 'sync-indicator sheets';
            case 'supabase': return 'sync-indicator supabase';
            default: return 'sync-indicator simulated';
        }
    };

    return (
        <aside className={`sidebar ${isSidebarActive}`}>
            <div className="sidebar-header">
                <div className="logo">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" strokeLinecap="round" strokeLinejoin="round" className="logo-icon" style={{ width: '28px', height: '28px' }}>
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>PresensiPintar</span>
                </div>
                {mobileMenuOpen && (
                    <button className="close-sidebar-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close Menu" style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>
                        &times;
                    </button>
                )}
            </div>

            <nav className="nav-menu" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', flex: 1 }}>
                <a 
                    href="#/dashboard" 
                    className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => handleNavClick('dashboard')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                        <rect x="3" y="3" width="7" height="9" />
                        <rect x="14" y="3" width="7" height="5" />
                        <rect x="14" y="12" width="7" height="9" />
                        <rect x="3" y="16" width="7" height="5" />
                    </svg>
                    <span>Dashboard</span>
                </a>

                <a 
                    href="#/history" 
                    className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => handleNavClick('history')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span>Histori Absensi</span>
                </a>

                <a 
                    href="#/master-data" 
                    className={`nav-item ${activeTab === 'master-data' ? 'active' : ''}`}
                    onClick={() => handleNavClick('master-data')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span>Data Master</span>
                </a>



                {currentUser && currentUser.role === 'admin' && (
                    <a 
                        href="#/users" 
                        className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => handleNavClick('users')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>Manajemen User</span>
                    </a>
                )}

                {currentUser && currentUser.role === 'admin' && (
                    <a 
                        href="#/settings" 
                        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => handleNavClick('settings')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        <span>Pengaturan</span>
                    </a>
                )}
            </nav>
            
            <div className="sidebar-footer">
                <div className="theme-toggle-container">
                    <span className="theme-label">Mode Gelap</span>
                    <button 
                        className={`theme-toggle-btn ${theme === 'dark' ? 'dark' : ''}`} 
                        onClick={toggleTheme} 
                        aria-label="Toggle Theme"
                    >
                        <span className="toggle-track">
                            <span className="toggle-thumb"></span>
                        </span>
                    </button>
                </div>
                
                <div className={getSyncIndicatorClass()}>
                    <span className="dot"></span>
                    <span className="text">{getSyncIndicatorText()}</span>
                </div>

                {currentUser && (
                    <button 
                        type="button" 
                        className="btn btn-secondary btn-block" 
                        onClick={onLogout}
                        style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Keluar (Logout)</span>
                    </button>
                )}
            </div>
        </aside>
    );
}
