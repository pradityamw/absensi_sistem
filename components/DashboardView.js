import { useState, useEffect } from 'react';
import { AttendanceParser } from '../lib/parser';

export default function DashboardView({ 
    currentDate, 
    setCurrentDate, 
    masterStudents, 
    masterTeachers, 
    onSaveAttendance, 
    showToast 
}) {
    const [rawText, setRawText] = useState('');
    const [defaultTeacher, setDefaultTeacher] = useState('Hendra');
    const [scanResult, setScanResult] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Sync defaultTeacher with first teacher if list changes during render
    if (masterTeachers.length > 0 && !masterTeachers.some(t => t.firstName === defaultTeacher)) {
        setDefaultTeacher(masterTeachers[0].firstName);
    }

    // Filter master students based on defaultTeacher (selected in dropdown)
    const filteredMasterStudents = masterStudents.filter(s => {
        const registeredTeacher = (s.teacherName || '').trim().toLowerCase();
        const teachers = registeredTeacher.split(',').map(t => t.trim().toLowerCase());
        const defTeacherLower = defaultTeacher.toLowerCase();
        if (defTeacherLower === 'hendra') {
            return teachers.includes('hendra') || registeredTeacher === '' || (teachers.length === 1 && teachers[0] === '');
        } else {
            return teachers.includes(defTeacherLower);
        }
    });

    // Format Date object to YYYY-MM-DD
    const formatDateInput = (date) => {
        if (!date) return "";
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Format date in Indonesian for label
    const formatIndonesianDateLabel = (date) => {
        if (!date) return "Pilih Tanggal";
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleDateChange = (e) => {
        const val = e.target.value; // "YYYY-MM-DD"
        if (!val) return;
        const [yearStr, monthStr, dayStr] = val.split('-');
        setCurrentDate(new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr)));
    };

    const loadExample = () => {
        const day = currentDate.getDate();
        const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long' });
        const year = currentDate.getFullYear();
        
        const sample = `Absen ming ${day} ${monthName} ${year}
1. Claretta
2. Charlene
3. Richmond
4. Ben (Hendra) (2.5) (private)
5. Elford
6. Zora (Budi) (1) (group)
7. Owen
8. Quennel (Ani) (2.5) (private)
9. Tahir
10. El jethro 
11. Xavier
12. Axel
13. Lexa
14. Joshua
15. Shannon`;
        
        setRawText(sample);
        showToast("Contoh teks dengan 3 guru berbeda dimuat.");
    };

    const handleClear = () => {
        setRawText('');
        setScanResult(null);
    };

    const handleProcess = async (e) => {
        e.preventDefault();
        const trimmed = rawText.trim();
        if (!trimmed) {
            showToast("Teks presensi kosong!");
            return;
        }

        // Try to parse the date from the pasted text
        const parsedDate = AttendanceParser.parseDateFromText(trimmed, currentDate);
        const targetDate = parsedDate || currentDate;

        if (parsedDate) {
            // Update calendar state to match parsed date
            setCurrentDate(parsedDate);
            showToast(`Mendeteksi tanggal dari teks: ${parsedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`);
        }

        const parsed = AttendanceParser.parseText(trimmed, defaultTeacher);
        const matched = AttendanceParser.matchStudents(parsed, filteredMasterStudents);
        
        setScanResult(matched);

        setIsSaving(true);
        try {
            await onSaveAttendance(targetDate, matched.matched, defaultTeacher);
        } catch (err) {
            console.error(err);
            showToast("Gagal menyimpan absensi: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="dashboard-grid">
            {/* Left Panel: Form Input */}
            <div className="card form-card">
                <div className="card-header">
                    <h2 className="card-title">Input Daftar Hadir</h2>
                    <p className="card-subtitle">Pilih tanggal dan tempelkan teks daftar hadir dari WhatsApp/Telegram.</p>
                </div>
                
                <form onSubmit={handleProcess} className="card-body">
                    <div className="form-group">
                        <label htmlFor="attendanceDate" className="form-label">Tanggal Absensi</label>
                        <div className="date-picker-wrapper">
                            <input 
                                type="date" 
                                id="attendanceDate" 
                                className="form-input" 
                                required 
                                value={formatDateInput(currentDate)}
                                onChange={handleDateChange}
                            />
                            <span className="date-picker-formatted" id="formattedDatePicker">
                                {formatIndonesianDateLabel(currentDate)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="attendanceTeacherDefault" className="form-label">Guru Pengajar (Default)</label>
                        <select 
                            id="attendanceTeacherDefault" 
                            className="form-input"
                            value={defaultTeacher}
                            onChange={(e) => setDefaultTeacher(e.target.value)}
                        >
                            {masterTeachers.map((t, idx) => (
                                <option key={idx} value={t.firstName}>
                                    {t.firstName} {t.lastName || ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <div className="textarea-header">
                            <label htmlFor="attendanceRawText" className="form-label">Teks Kehadiran</label>
                            <button 
                                type="button" 
                                className="btn btn-text-action" 
                                id="btnLoadExample"
                                onClick={loadExample}
                            >
                                Muat Contoh
                            </button>
                        </div>
                        <textarea 
                            id="attendanceRawText" 
                            className="form-textarea" 
                            placeholder="Contoh:&#10;Absen Minggu 1 Juni 2026&#10;1. Claretta&#10;2. Charlene&#10;3. Richmond&#10;..." 
                            required
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            id="btnProcessAttendance"
                            disabled={isSaving}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon" style={{ width: '16px', height: '16px' }}>
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            <span>{isSaving ? 'Menyimpan...' : 'Proses Absensi'}</span>
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            id="btnClearInput"
                            onClick={handleClear}
                        >
                            Hapus
                        </button>
                    </div>
                </form>
            </div>

            {/* Right Panel: Live Results */}
            <div className="dashboard-right-col">
                <div className="stats-mini-grid">
                    <div className="mini-stat-card">
                        <div className="mini-stat-icon blue">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div className="mini-stat-info">
                            <span className="mini-stat-label">Total Siswa</span>
                            <span className="mini-stat-val" id="statTotalStudents">{filteredMasterStudents.length}</span>
                        </div>
                    </div>
                    <div className="mini-stat-card">
                        <div className="mini-stat-icon green">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div className="mini-stat-info">
                            <span className="mini-stat-label">Hadir Hari Ini</span>
                            <span className="mini-stat-val text-success" id="statPresentToday">
                                {scanResult ? scanResult.matched.length : 0}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="card result-card">
                    <div className="card-header">
                        <h2 className="card-title">Hasil Pemindaian</h2>
                        <span className={`badge ${scanResult ? 'success' : ''}`} id="scanStatusBadge">
                            {scanResult ? 'Telah Diproses' : 'Belum Diproses'}
                        </span>
                    </div>
                    <div className="card-body result-container">
                        {!scanResult && (
                            <div className="empty-state" id="resultEmptyState">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <p>Belum ada data absensi yang diproses untuk tanggal terpilih.</p>
                            </div>
                        )}

                        {scanResult && (
                            <div className="parsing-output-details" id="parsingOutputDetails">
                                <div className="parsing-summary-metrics">
                                    <div className="metric-item">
                                        <span className="metric-num text-info" id="countMatched">{scanResult.matched.length}</span>
                                        <span className="metric-lbl">Cocok</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-num text-warning" id="countWarnings">{scanResult.unrecognized.length}</span>
                                        <span className="metric-lbl">Peringatan</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-num text-danger" id="countAbsent">{scanResult.absent.length}</span>
                                        <span className="metric-lbl">Absen (Alpha)</span>
                                    </div>
                                </div>

                                {scanResult.unrecognized.length > 0 && (
                                    <div className="alert alert-warning" id="warningAlert">
                                        <div className="alert-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                            </svg>
                                            <span>Nama Tidak Ditemukan di Database!</span>
                                        </div>
                                        <ul className="warning-list" id="warningNameList">
                                            {scanResult.unrecognized.map((obj, idx) => (
                                                <li key={idx}>
                                                    {obj.name} (Guru: {obj.guru}, Jam: {obj.jam}, Kelas: {obj.kelas})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="log-sections">
                                    <div className="log-section">
                                        <h4>Daftar Hadir Terkonfirmasi:</h4>
                                        <div className="student-pill-grid" id="matchedPills">
                                            {scanResult.matched.length > 0 ? (
                                                scanResult.matched.map((obj, idx) => (
                                                    <div className="student-pill" key={idx}>
                                                        <span className="pill-name">{obj.name}</span>
                                                        <span className="pill-meta">{obj.guru} ({obj.jam}j) ({obj.kelas})</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-muted">Tidak ada siswa hadir terkonfirmasi.</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="log-section">
                                        <h4>Siswa Tidak Hadir (Alpha):</h4>
                                        <div className="student-pill-grid" id="absentPills">
                                            {scanResult.absent.length > 0 ? (
                                                scanResult.absent.map((name, idx) => (
                                                    <div className="student-pill absent" key={idx}>
                                                        <span className="pill-name">{name}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-muted">Semua siswa hadir.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
