export default function Header({ 
    activeTab, 
    currentDate, 
    setCurrentDate, 
    setMobileMenuOpen,
    undoStack = [],
    onUndo
}) {
    // Determine title based on active tab
    const getPageTitle = () => {
        switch (activeTab) {
            case 'dashboard': return 'Dashboard Absensi';
            case 'history': return 'Histori Absensi';
            case 'master-data': return 'Database Master';
            case 'settings': return 'Pengaturan Sinkronisasi';
            case 'users': return 'Manajemen Akun Pengguna';
            default: return 'Dashboard';
        }
    };

    // Format current date into Indonesian format: e.g. "Rabu, 3 Juni 2026"
    const formatIndonesianDate = (date) => {
        if (!date) return "";
        try {
            return date.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return date.toDateString();
        }
    };

    // Get YYYY-MM representation of Date object
    const getYearMonthString = (date) => {
        if (!date) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    // Handle change of month selector
    const handleMonthChange = (e) => {
        const val = e.target.value; // "YYYY-MM"
        if (!val) return;
        const [yearStr, monthStr] = val.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1; // 0-indexed month
        
        // Preserve current day if possible, otherwise clamp to days in month
        const currentDay = currentDate ? currentDate.getDate() : 1;
        const maxDays = new Date(year, month + 1, 0).getDate();
        const day = Math.min(currentDay, maxDays);

        setCurrentDate(new Date(year, month, day));
    };

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button 
                    className="mobile-menu-btn" 
                    id="mobileMenuBtn" 
                    aria-label="Open Menu"
                    onClick={() => setMobileMenuOpen(true)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <h1 className="page-title" id="pageMainTitle">{getPageTitle()}</h1>
            </div>
            <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <style>{`
                    @keyframes pulse-light {
                        0%, 100% { transform: scale(1); box-shadow: var(--shadow-sm); }
                        50% { transform: scale(0.98); box-shadow: 0 0 8px rgba(217, 119, 6, 0.4); }
                    }
                `}</style>
                {onUndo && undoStack && undoStack.length > 0 && (
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onUndo}
                        style={{
                            height: '38px',
                            padding: '0 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#fffbeb',
                            borderColor: '#d97706',
                            color: '#b45309',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            animation: 'pulse-light 2.5s infinite',
                            margin: 0
                        }}
                        title={`Undo: ${undoStack[undoStack.length - 1].description}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}>
                            <path d="M3 7v6h6" />
                            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                        </svg>
                        <span>Undo ({undoStack.length})</span>
                    </button>
                )}
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <input 
                        type="month" 
                        id="topbarMonthSelector" 
                        className="form-input" 
                        value={getYearMonthString(currentDate)}
                        onChange={handleMonthChange}
                        style={{ 
                            width: '165px', 
                            height: '38px', 
                            padding: '0 12px', 
                            fontSize: '14px', 
                            marginBottom: 0, 
                            backgroundColor: 'var(--bg-card)', 
                            borderColor: 'var(--border-color)', 
                            cursor: 'pointer', 
                            borderRadius: 'var(--radius-md)', 
                            fontWeight: 500 
                        }} 
                    />
                </div>
                <div className="current-date-badge" id="currentDateBadge">
                    {formatIndonesianDate(currentDate)}
                </div>
            </div>
        </header>
    );
}
