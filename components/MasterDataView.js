import { useState } from 'react';

export default function MasterDataView({ 
    masterStudents, 
    masterTeachers, 
    onAddStudent, 
    onDeleteStudent, 
    onResetStudents, 
    onAddTeacher, 
    onDeleteTeacher, 
    onResetTeachers,
    onEditStudentClick,
    showToast 
}) {
    const [activeSubTab, setActiveSubTab] = useState('siswa'); // 'siswa' | 'guru'

    // Form states for Student
    const [sFirstName, setSFirstName] = useState('');
    const [sLastName, setSLastName] = useState('');
    const [sQuota, setSQuota] = useState(8);
    const [sTeacher, setSTeacher] = useState('');
    const [sBulkText, setSBulkText] = useState('');

    // Form states for Teacher
    const [tFirstName, setTFirstName] = useState('');
    const [tLastName, setTLastName] = useState('');
    const [tBulkText, setTBulkText] = useState('');

    // Custom confirm dialog state
    const [confirmConfig, setConfirmConfig] = useState(null); // { message, onConfirm }

    // Handlers for Students
    const handleAddStudentSubmit = async (e) => {
        e.preventDefault();
        const fName = sFirstName.trim();
        if (!fName) return;

        try {
            await onAddStudent({
                firstName: fName,
                lastName: sLastName.trim(),
                quota: parseInt(sQuota) || 8,
                teacherName: sTeacher
            });
            setSFirstName('');
            setSLastName('');
            setSQuota(8);
            setSTeacher('');
        } catch (err) {
            showToast("Gagal menambah siswa: " + err.message);
        }
    };

    const handleBulkStudentSubmit = async (e) => {
        e.preventDefault();
        const lines = sBulkText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return;

        const newStudents = lines.map(line => {
            // Split name into first and last
            const parts = line.split(/\s+/);
            const firstName = parts[0] || '';
            const lastName = parts.slice(1).join(' ') || '';
            return {
                firstName,
                lastName,
                quota: 8,
                teacherName: ''
            };
        });

        try {
            for (const s of newStudents) {
                await onAddStudent(s, false); // batch mode
            }
            await onResetStudents(true); // force reload after batch insertions
            setSBulkText('');
            showToast(`${newStudents.length} siswa berhasil diimpor!`);
        } catch (err) {
            showToast("Gagal mengimpor siswa: " + err.message);
        }
    };

    // Handlers for Teachers
    const handleAddTeacherSubmit = async (e) => {
        e.preventDefault();
        const fName = tFirstName.trim();
        if (!fName) return;

        try {
            await onAddTeacher({
                firstName: fName,
                lastName: tLastName.trim()
            });
            setTFirstName('');
            setTLastName('');
        } catch (err) {
            showToast("Gagal menambah guru: " + err.message);
        }
    };

    const handleBulkTeacherSubmit = async (e) => {
        e.preventDefault();
        const lines = tBulkText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return;

        const newTeachers = lines.map(line => {
            const parts = line.split(/\s+/);
            const firstName = parts[0] || '';
            const lastName = parts.slice(1).join(' ') || '';
            return { firstName, lastName };
        });

        try {
            for (const t of newTeachers) {
                await onAddTeacher(t, false);
            }
            await onResetTeachers(true);
            setTBulkText('');
            showToast(`${newTeachers.length} guru berhasil diimpor!`);
        } catch (err) {
            showToast("Gagal mengimpor guru: " + err.message);
        }
    };

    return (
        <div>
            {/* Tab Navigation */}
            <div className="tabs-navigation" style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px' }}>
                <button 
                    type="button" 
                    className={`tab-btn ${activeSubTab === 'siswa' ? 'active' : ''}`} 
                    onClick={() => setActiveSubTab('siswa')}
                >
                    Master Siswa
                </button>
                <button 
                    type="button" 
                    className={`tab-btn ${activeSubTab === 'guru' ? 'active' : ''}`} 
                    onClick={() => setActiveSubTab('guru')}
                >
                    Master Guru
                </button>
            </div>

            {/* Siswa Tab Content */}
            {activeSubTab === 'siswa' && (
                <div className="master-tab-content">
                    <div className="master-layout-grid">
                        {/* Add Student Column */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Tambah Siswa Baru</h2>
                                <p className="card-subtitle">Tambahkan satu atau beberapa siswa ke dalam database master.</p>
                            </div>
                            <div className="card-body">
                                {/* Add Single Student */}
                                <form onSubmit={handleAddStudentSubmit} className="form-compact">
                                    <div className="form-group">
                                        <label htmlFor="newStudentFirstName" className="form-label">Nama Depan (First Name)</label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            placeholder="Nama depan siswa..." 
                                            required 
                                            value={sFirstName}
                                            onChange={(e) => setSFirstName(e.target.value)}
                                            autoComplete="off" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="newStudentLastName" className="form-label">Nama Belakang (Last Name)</label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            placeholder="Nama belakang siswa..." 
                                            value={sLastName}
                                            onChange={(e) => setSLastName(e.target.value)}
                                            autoComplete="off" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="newStudentQuota" className="form-label">Jatah Bulanan (Sesi)</label>
                                        <input 
                                            type="number" 
                                            className="form-input" 
                                            min="1" 
                                            max="100" 
                                            required
                                            value={sQuota}
                                            onChange={(e) => setSQuota(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="newStudentTeacher" className="form-label">Guru Pengajar (Teacher)</label>
                                        <select 
                                            className="form-input"
                                            value={sTeacher}
                                            onChange={(e) => setSTeacher(e.target.value)}
                                        >
                                            <option value="">-- Hubungkan Guru (Belum Diatur) --</option>
                                            {masterTeachers.map((t, idx) => (
                                                <option key={idx} value={t.firstName}>
                                                    {t.firstName} {t.lastName || ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-block">Tambah Siswa</button>
                                </form>

                                <div className="divider"><span>atau</span></div>

                                {/* Bulk Add Students */}
                                <form onSubmit={handleBulkStudentSubmit} className="form-compact">
                                    <div className="form-group">
                                        <label htmlFor="bulkStudentText" className="form-label">Bulk Input (Satu Nama per Baris)</label>
                                        <textarea 
                                            className="form-textarea compact" 
                                            placeholder="Siswa A&#10;Siswa B&#10;Siswa C" 
                                            required
                                            value={sBulkText}
                                            onChange={(e) => setSBulkText(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="btn btn-secondary btn-block">Impor Masal</button>
                                </form>
                            </div>
                        </div>

                        {/* Student List Column */}
                        <div className="card">
                            <div className="card-header list-header-actions">
                                <div>
                                    <h2 className="card-title">Database Master Siswa</h2>
                                    <p className="card-subtitle"><span id="masterStudentsCount">{masterStudents.length}</span> siswa terdaftar</p>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn btn-danger-text" 
                                    id="btnResetMaster"
                                    onClick={() => {
                                        setConfirmConfig({
                                            message: "Apakah Anda yakin ingin mereset master siswa ke data default?",
                                            onConfirm: () => {
                                                onResetStudents();
                                                setConfirmConfig(null);
                                            }
                                        });
                                    }}
                                >
                                    Reset ke Default
                                </button>
                            </div>
                            
                            <div className="card-body scrollable-list-container">
                                <div className="student-list">
                                    {masterStudents.map((s, idx) => (
                                        <div className="student-item" key={idx}>
                                            <div className="student-info">
                                                <span className="student-name">{s.firstName} {s.lastName || ''}</span>
                                                <div className="student-badges">
                                                    <span className="badge badge-teacher">Guru: {s.teacherName || '(Belum Diatur)'}</span>
                                                    <span className="badge badge-quota">Jatah: {s.quota} sesi</span>
                                                </div>
                                            </div>
                                            <div className="student-actions" style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => onEditStudentClick(idx)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => {
                                                        setConfirmConfig({
                                                            message: `Hapus siswa ${s.firstName} ${s.lastName || ''} dari database master?`,
                                                            onConfirm: () => {
                                                                onDeleteStudent(idx);
                                                                setConfirmConfig(null);
                                                            }
                                                        });
                                                    }}
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Guru Tab Content */}
            {activeSubTab === 'guru' && (
                <div className="master-tab-content">
                    <div className="master-layout-grid">
                        {/* Add Teacher Column */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Tambah Guru Baru</h2>
                                <p className="card-subtitle">Tambahkan pengajar ke dalam database master.</p>
                            </div>
                            <div className="card-body">
                                {/* Add Single Teacher */}
                                <form onSubmit={handleAddTeacherSubmit} className="form-compact">
                                    <div className="form-group">
                                        <label htmlFor="newTeacherFirstName" className="form-label">Nama Depan (First Name)</label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            placeholder="Nama depan guru..." 
                                            required 
                                            value={tFirstName}
                                            onChange={(e) => setTFirstName(e.target.value)}
                                            autoComplete="off" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="newTeacherLastName" className="form-label">Nama Belakang (Last Name)</label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            placeholder="Nama belakang guru..." 
                                            value={tLastName}
                                            onChange={(e) => setTLastName(e.target.value)}
                                            autoComplete="off" 
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-block">Tambah Guru</button>
                                </form>

                                <div className="divider"><span>atau</span></div>

                                {/* Bulk Add Teachers */}
                                <form onSubmit={handleBulkTeacherSubmit} className="form-compact">
                                    <div className="form-group">
                                        <label htmlFor="bulkTeacherText" className="form-label">Bulk Input (Satu Nama per Baris)</label>
                                        <textarea 
                                            className="form-textarea compact" 
                                            placeholder="Guru A&#10;Guru B&#10;Guru C" 
                                            required
                                            value={tBulkText}
                                            onChange={(e) => setTBulkText(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="btn btn-secondary btn-block">Impor Masal</button>
                                </form>
                            </div>
                        </div>

                        {/* Teacher List Column */}
                        <div className="card">
                            <div className="card-header list-header-actions">
                                <div>
                                    <h2 className="card-title">Database Master Guru</h2>
                                    <p className="card-subtitle"><span id="masterTeachersCount">{masterTeachers.length}</span> guru terdaftar</p>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn btn-danger-text" 
                                    id="btnResetMasterTeachers"
                                    onClick={() => {
                                        setConfirmConfig({
                                            message: "Apakah Anda yakin ingin mereset master guru ke data default?",
                                            onConfirm: () => {
                                                onResetTeachers();
                                                setConfirmConfig(null);
                                            }
                                        });
                                    }}
                                >
                                    Reset ke Default
                                </button>
                            </div>
                            
                            <div className="card-body scrollable-list-container">
                                <div className="student-list" id="teacherMasterList">
                                    {masterTeachers.map((t, idx) => (
                                        <div className="student-item" key={idx}>
                                            <div className="student-info">
                                                <span className="student-name">{t.firstName} {t.lastName || ''}</span>
                                            </div>
                                            <div className="student-actions">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => {
                                                        setConfirmConfig({
                                                            message: `Hapus guru ${t.firstName} ${t.lastName || ''} dari database master?`,
                                                            onConfirm: () => {
                                                                onDeleteTeacher(idx);
                                                                setConfirmConfig(null);
                                                            }
                                                        });
                                                    }}
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {confirmConfig && (
                <div className="modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="modal-card" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Konfirmasi Tindakan</h3>
                            <button type="button" className="modal-close-btn" onClick={() => setConfirmConfig(null)}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px 24px' }}>
                            <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                {confirmConfig.message}
                            </p>
                            <div className="form-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: 0, marginTop: '20px', borderTop: 'none' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setConfirmConfig(null)} style={{ margin: 0, padding: '8px 16px' }}>Batal</button>
                                <button type="button" className="btn btn-danger" onClick={confirmConfig.onConfirm} style={{ margin: 0, padding: '8px 16px' }}>Ya, Konfirmasi</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
