export default function Header({ 
    activeTab, 
    currentDate, 
    setCurrentDate, 
    setMobileMenuOpen 
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
