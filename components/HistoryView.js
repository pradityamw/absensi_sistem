import { useState, useMemo } from 'react';
import { AttendanceExporter } from '../lib/exporter';

// Months in Indonesian (static arrays outside component scope)
const indonesianMonthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];
const indonesianMonthsFull = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function HistoryView({ 
    currentDate, 
    attendanceData, 
    prevMonthData, 
    masterStudents, 
    masterTeachers, 
    onCellClick, 
    onRefresh,
    isLoading,
    showToast,
    onEditStudentClick,
    onInsertStudentClick
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [teacherFilter, setTeacherFilter] = useState('all');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Enrich the data inside useMemo to keep it fast
    const enrichedData = useMemo(() => {
        if (!attendanceData || attendanceData.length === 0) return [];

        // 1. Calculate activeDaysCount for percentage rate
        let activeDaysCount = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            let active = false;
            for (let r = 0; r < attendanceData.length; r++) {
                const cell = attendanceData[r][d.toString()];
                let cellVal = 0;
                let cellGuru = "Hendra";
                if (cell && typeof cell === 'object') {
                    cellVal = parseFloat(cell.value) || 0;
                    cellGuru = cell.guru || "Hendra";
                } else if (cell !== undefined && cell !== null && cell !== "") {
                    cellVal = parseFloat(cell) || 0;
                }
                if (cellVal > 0 || cell === 0 || cell === "0" || (cell && cell.value !== undefined)) {
                    if (teacherFilter === 'all' || cellGuru.toLowerCase() === teacherFilter.toLowerCase()) {
                        active = true;
                        break;
                    }
                }
            }
            if (active) activeDaysCount++;
        }

        // 2. Create previous month attended classes counts map
        const prevMonthCountMap = new Map();
        if (prevMonthData && prevMonthData.length > 0) {
            prevMonthData.forEach(row => {
                let count = 0;
                for (let d = 1; d <= 31; d++) {
                    const cell = row[d.toString()];
                    let cellVal = 0;
                    if (cell && typeof cell === 'object') {
                        cellVal = parseFloat(cell.value) || 0;
                    } else if (cell !== undefined && cell !== null && cell !== "") {
                        cellVal = parseFloat(cell) || 0;
                    }
                    if (cellVal > 0) {
                        count++;
                    }
                }
                prevMonthCountMap.set(row.NAMA.toLowerCase(), count);
            });
        }

        // 3. Create student quota map
        const studentMap = new Map();
        masterStudents.forEach(s => {
            const fullName = `${s.firstName} ${s.lastName}`.trim();
            studentMap.set(fullName.toLowerCase(), s);
        });

        // 4. Map and enrich
        return attendanceData.map((row, index) => {
            const studentObj = studentMap.get(row.NAMA.toLowerCase());
            const quota = studentObj ? studentObj.quota : 8;
            const studentTeacher = studentObj ? (studentObj.teacherName || '') : '';

            let lastPresentDay = 0;
            let currentTotalHours = 0;
            let daysPresentCount = 0;

            for (let d = 1; d <= daysInMonth; d++) {
                const cell = row[d.toString()];
                let cellVal = 0;
                let cellGuru = "Hendra";
                if (cell && typeof cell === 'object') {
                    cellVal = parseFloat(cell.value) || 0;
                    cellGuru = cell.guru || "Hendra";
                    if (cellVal === 0 && studentTeacher) {
                        cellGuru = studentTeacher;
                    }
                } else if (cell !== undefined && cell !== null && cell !== "") {
                    cellVal = parseFloat(cell) || 0;
                }

                if (teacherFilter === 'all' || cellGuru.toLowerCase() === teacherFilter.toLowerCase()) {
                    if (cellVal > 0) {
                        lastPresentDay = d;
                        currentTotalHours += cellVal;
                        daysPresentCount++;
                    }
                }
            }

            const rate = activeDaysCount > 0 ? Math.round((daysPresentCount / activeDaysCount) * 100) : 0;
            const prevMonthCount = prevMonthCountMap.get(row.NAMA.toLowerCase()) || 0;

            const lastPresentText = lastPresentDay > 0 
                ? `${lastPresentDay} ${indonesianMonthsShort[month]}`
                : 'Belum hadir';

            return {
                ...row,
                NO: index + 1,
                BULAN_LALU: prevMonthCount,
                TOTAL: currentTotalHours,
                DAYS_PRESENT: daysPresentCount,
                QUOTA: quota,
                SESI_JATAH: `${daysPresentCount} / ${quota}`,
                PERCENT_HARI: `${rate}%`,
                LAST_PRESENT: lastPresentText,
                lastPresentDay: lastPresentDay,
                STUDENT_TEACHER: studentTeacher,
                ALIAS: studentObj ? (studentObj.alias || '') : ''
            };
        });
    }, [attendanceData, prevMonthData, masterStudents, teacherFilter, daysInMonth, month]);

    // Average attendance rate of all rendered students
    const avgAttendanceRate = useMemo(() => {
        if (enrichedData.length === 0) return "0%";
        const filtered = enrichedData.filter(row => {
            if (searchQuery && !row.NAMA.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
        if (filtered.length === 0) return "0%";

        const sum = filtered.reduce((acc, row) => {
            const val = parseInt(row.PERCENT_HARI) || 0;
            return acc + val;
        }, 0);
        return `${Math.round(sum / filtered.length)}%`;
    }, [enrichedData, searchQuery]);

    const handleExportExcel = async () => {
        try {
            const sheetTitle = `${indonesianMonthsFull[month]} ${year}`;
            await AttendanceExporter.exportToExcel(sheetTitle, enrichedData);
            showToast("Excel berhasil diunduh!");
        } catch (e) {
            showToast("Gagal export Excel: " + e.message);
        }
    };

    const handleExportPdf = async () => {
        try {
            const sheetTitle = `${indonesianMonthsFull[month]} ${year}`;
            await AttendanceExporter.exportToPdf(sheetTitle, enrichedData);
            showToast("PDF berhasil diunduh!");
        } catch (e) {
            showToast("Gagal export PDF: " + e.message);
        }
    };

    // Filter by search query and teacher selection
    const filteredRows = enrichedData.filter(row => {
        if (searchQuery && !row.NAMA.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        
        // Filter student rows by teacher filter
        if (teacherFilter !== 'all') {
            const studentRegTeacher = (row.STUDENT_TEACHER || '').trim().toLowerCase();
            const teachers = studentRegTeacher.split(',').map(t => t.trim().toLowerCase());
            if (teacherFilter.toLowerCase() === 'hendra') {
                // Hendra is default: matches Hendra, empty, or if Hendra is one of the teachers
                const isHendra = teachers.includes('hendra') || studentRegTeacher === '';
                if (!isHendra) return false;
            } else {
                if (!teachers.includes(teacherFilter.toLowerCase())) {
                    return false;
                }
            }
        }
        return true;
    });

    return (
        <div>
            {/* History Stats Row */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon-wrapper blue">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="stat-icon">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Absen Bulan Ini</span>
                        <span className="stat-value" id="historyMonthTitle">{`${indonesianMonthsFull[month]} ${year}`}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper green">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="stat-icon">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Persentase Rata-rata</span>
                        <span className="stat-value" id="avgAttendanceRate">{avgAttendanceRate}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper purple" style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="stat-icon">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Jumlah Siswa</span>
                        <span className="stat-value" id="lastUpdatedTime">{filteredRows.length} orang</span>
                    </div>
                </div>
            </div>

            {/* Attendance Table Card */}
            <div className="card table-card">
                <div className="card-header table-header-actions">
                    <div className="table-title-search">
                        <h2 className="card-title">Tabel Bulanan Register Siswa</h2>
                        <div className="table-search-box">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input 
                                type="text" 
                                id="historySearch" 
                                placeholder="Cari siswa..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="table-filter-box" style={{ marginLeft: '10px' }}>
                            <select 
                                id="historyTeacherFilter" 
                                className="form-input" 
                                value={teacherFilter}
                                onChange={(e) => setTeacherFilter(e.target.value)}
                                style={{ padding: '6px 12px', fontSize: '13px', minHeight: '34px', width: '140px', borderRadius: 'var(--radius-md)', marginBottom: 0 }}
                            >
                                <option value="all">Semua Guru</option>
                                {masterTeachers.map((t, idx) => (
                                    <option key={idx} value={t.firstName}>
                                        Guru: {t.firstName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="export-actions">
                        <button 
                            type="button" 
                            className="btn btn-secondary btn-icon-only-mobile" 
                            id="btnExportExcel" 
                            title="Export Excel"
                            onClick={handleExportExcel}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <span>Export Excel</span>
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-secondary btn-icon-only-mobile" 
                            id="btnExportPdf" 
                            title="Export PDF"
                            onClick={handleExportPdf}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>Export PDF</span>
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            id="btnFetchSheetsData"
                            disabled={isLoading}
                            onClick={() => onRefresh(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className={`btn-icon ${isLoading ? 'spin' : ''}`} style={{ width: '16px', height: '16px' }}>
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                            </svg>
                            <span>{isLoading ? 'Memuat...' : 'Muat Ulang'}</span>
                        </button>
                    </div>
                </div>

                {/* Scrollable Table Container */}
                <div className="table-responsive-container">
                    <table className="attendance-table" id="attendanceTable">
                        <thead>
                            <tr>
                                <th>NO</th>
                                <th>NAMA</th>
                                <th>BLN LALU</th>
                                {Array.from({ length: daysInMonth }, (_, idx) => (
                                    <th key={idx}>{idx + 1}</th>
                                ))}
                                <th>TOT JAM</th>
                                <th>SESI (HADIR/JATAH)</th>
                                <th>% HARI</th>
                                <th>LAST PRESENT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.length > 0 ? (
                                filteredRows.map((row, index) => (
                                    <tr key={index}>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRight: 'none', justifyContent: 'center' }}>
                                            <span>{index + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => onInsertStudentClick(row.NO)}
                                                style={{
                                                    padding: '1px 5px',
                                                    fontSize: '11px',
                                                    lineHeight: 1,
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    backgroundColor: 'var(--success-light, #ecfdf5)',
                                                    color: 'var(--success, #059669)',
                                                    border: '1px solid var(--success-border, #a7f3d0)',
                                                    fontWeight: 'bold',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginLeft: '4px'
                                                }}
                                                title={`Sisipkan murid baru di bawah nomor ${index + 1}`}
                                            >
                                                +
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => onEditStudentClick(row.NO - 1)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--primary)',
                                                    textDecoration: 'underline',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    padding: 0,
                                                    textAlign: 'left'
                                                }}
                                                title="Klik untuk Edit Data Siswa"
                                            >
                                                {row.NAMA}
                                                {row.ALIAS && <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 'normal', textDecoration: 'none', display: 'inline-block', marginLeft: '6px' }}>({row.ALIAS})</span>}
                                            </button>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{row.BULAN_LALU} kelas</td>
                                        
                                        {Array.from({ length: daysInMonth }, (_, dIdx) => {
                                            const dayNum = dIdx + 1;
                                            const cell = row[dayNum.toString()];
                                            
                                            let cellVal = 0;
                                            let cellGuru = "Hendra";
                                            let cellKelas = "group";

                                            if (cell && typeof cell === 'object') {
                                                cellVal = parseFloat(cell.value) || 0;
                                                cellGuru = cell.guru || "Hendra";
                                                cellKelas = cell.kelas || "group";
                                            } else if (cell !== undefined && cell !== null && cell !== "") {
                                                cellVal = parseFloat(cell) || 0;
                                                cellKelas = (cellVal === 2.5) ? "private" : "group";
                                            }

                                            // Determine className and title
                                            let className = 'cell-empty';
                                            let text = '-';
                                            let title = 'Belum diabsen\n[Klik untuk Edit]';

                                            if (teacherFilter !== 'all' && cellGuru.toLowerCase() !== teacherFilter.toLowerCase()) {
                                                className = 'cell-empty';
                                                text = '-';
                                                title = 'Guru lain mengajar pada tanggal ini';
                                            } 
                                            else if (cellVal > 0) {
                                                className = cellKelas === 'private' ? 'cell-present-private' : 'cell-present';
                                                text = cellVal.toString();
                                                title = `Guru: ${cellGuru}\nKelas: ${cellKelas.toUpperCase()}\nDurasi: ${cellVal} jam\n[Klik untuk Edit]`;
                                            } 
                                            else if (cellVal === 0 && (cell !== "" && cell !== undefined)) {
                                                className = 'cell-absent';
                                                text = '0';
                                                title = 'Absen (Alpha)\n[Klik untuk Edit]';
                                            }

                                            return (
                                                <td 
                                                    key={dIdx} 
                                                    className={className} 
                                                    title={title}
                                                    onClick={() => onCellClick(row.NAMA, dayNum, cellVal, cellGuru, cellKelas)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {text}
                                                </td>
                                            );
                                        })}
                                        
                                        <td className="cell-total">{row.TOTAL}</td>
                                        <td 
                                            className="cell-sesi" 
                                            style={{
                                                color: row.DAYS_PRESENT >= row.QUOTA ? 'var(--danger)' : 'var(--success)',
                                                fontWeight: row.DAYS_PRESENT >= row.QUOTA ? 'bold' : 'normal'
                                            }}
                                            title={row.DAYS_PRESENT >= row.QUOTA ? 'Kuota sesi telah tercapai/habis!' : ''}
                                        >
                                            {row.SESI_JATAH}
                                        </td>
                                        
                                        <td 
                                            className="attendance-rate-cell"
                                            style={{
                                                color: parseInt(row.PERCENT_HARI) >= 90 
                                                    ? 'var(--success)' 
                                                    : (parseInt(row.PERCENT_HARI) < 75 && parseInt(row.PERCENT_HARI) > 0) 
                                                        ? 'var(--danger)' 
                                                        : ''
                                            }}
                                        >
                                            {row.PERCENT_HARI}
                                        </td>
                                        
                                        <td style={{ color: row.lastPresentDay === 0 ? 'var(--text-muted)' : '' }}>
                                            {row.LAST_PRESENT}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={daysInMonth + 7} style={{ padding: '40px 0', textAlign: 'center' }}>
                                        <span className="text-muted">Tidak ada siswa ditemukan.</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
