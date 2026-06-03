import { useState } from 'react';

export default function MasterDataView({ 
    masterStudents, 
    masterTeachers, 
    onAddStudent, 
    onAddStudents,
    onDeleteStudent, 
    onResetStudents, 
    onAddTeacher, 
    onAddTeachers,
    onDeleteTeacher, 
    onResetTeachers,
    onEditStudentClick,
    onBulkAssignTeacher,
    onBulkDeleteStudents,
    showToast,
    onInsertStudentClick // Add this!
}) {
    const [activeSubTab, setActiveSubTab] = useState('siswa'); // 'siswa' | 'guru'
    const [selectedSiswa, setSelectedSiswa] = useState([]); // Array of student indices selected
 
    // Form states for Student
    const [sFirstName, setSFirstName] = useState('');
    const [sLastName, setSLastName] = useState('');
    const [sQuota, setSQuota] = useState(8);
    const [sTeachers, setSTeachers] = useState([]); // Array of selected teacher names
    const [sAlias, setSAlias] = useState(''); // State for alias
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
                teacherName: sTeachers.join(', '),
                alias: sAlias.trim()
            });
            setSFirstName('');
            setSLastName('');
            setSQuota(8);
            setSTeachers([]);
            setSAlias('');
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
                teacherName: '',
                alias: ''
            };
        });
 
        try {
            await onAddStudents(newStudents);
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
            await onAddTeachers(newTeachers);
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
                                        <label htmlFor="newStudentAlias" className="form-label">Alias (Nama Panggilan)</label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            placeholder="Nama yang dipakai di daftar absen..." 
                                            value={sAlias}
                                            onChange={(e) => setSAlias(e.target.value)}
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
                                        <label className="form-label">Guru Pengajar (Bisa pilih lebih dari 1)</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
                                            {masterTeachers.map((t, idx) => {
                                                const tName = t.firstName;
                                                const isChecked = sTeachers.includes(tName);
                                                return (
                                                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', margin: 0, padding: '2px 0' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSTeachers([...sTeachers, tName]);
                                                                } else {
                                                                    setSTeachers(sTeachers.filter(name => name !== tName));
                                                                }
                                                            }}
                                                            style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                                                        />
                                                        <span style={{ color: 'var(--text-primary)' }}>{tName} {t.lastName || ''}</span>
                                                    </label>
                                                );
                                            })}
                                            {masterTeachers.length === 0 && (
                                                <span className="text-muted" style={{ fontSize: '12px' }}>Tidak ada data guru master.</span>
                                            )}
                                        </div>
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
                                            message: "Apakah Anda yakin ingin menghapus semua data master siswa?",
                                            onConfirm: () => {
                                                onResetStudents();
                                                setConfirmConfig(null);
                                            }
                                        });
                                    }}
                                >
                                    Hapus Semua Data
                                </button>
                            </div>
                            
                            <div className="card-body scrollable-list-container">
                                {masterStudents.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', paddingLeft: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                        <input 
                                            type="checkbox" 
                                            id="selectAllSiswa"
                                            style={{ width: '18px', height: '18px', marginRight: '8px', cursor: 'pointer' }}
                                            checked={selectedSiswa.length === masterStudents.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedSiswa(masterStudents.map((_, i) => i));
                                                } else {
                                                    setSelectedSiswa([]);
                                                }
                                            }}
                                        />
                                        <label htmlFor="selectAllSiswa" style={{ fontSize: '14px', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                            Pilih Semua Siswa
                                        </label>
                                    </div>
                                )}

                                {selectedSiswa.length > 0 && (
                                    <div className="bulk-actions-bar" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '12px 16px',
                                        marginBottom: '16px',
                                        gap: '12px',
                                        flexWrap: 'wrap'
                                    }}>
                                        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                                            {selectedSiswa.length} siswa terpilih
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <select 
                                                className="form-input" 
                                                style={{ margin: 0, padding: '6px 12px', width: 'auto', fontSize: '14px', height: '36px' }}
                                                id="bulkTeacherSelect"
                                            >
                                                <option value="">-- Hubungkan ke Guru --</option>
                                                <option value="none">Kosongkan (Belum Diatur)</option>
                                                {masterTeachers.map((t, idx) => (
                                                    <option key={idx} value={t.firstName}>
                                                        {t.firstName} {t.lastName || ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <button 
                                                type="button" 
                                                className="btn btn-primary"
                                                style={{ margin: 0, padding: '8px 16px', fontSize: '14px', height: '36px', display: 'flex', alignItems: 'center' }}
                                                onClick={async () => {
                                                    const selectEl = document.getElementById('bulkTeacherSelect');
                                                    const selectedTeacher = selectEl.value;
                                                    if (selectedTeacher === "") {
                                                        showToast("Silakan pilih guru pengajar terlebih dahulu.");
                                                        return;
                                                    }
                                                    const teacherVal = selectedTeacher === 'none' ? '' : selectedTeacher;
                                                    
                                                    setConfirmConfig({
                                                        message: `Apakah Anda yakin ingin memindahkan ${selectedSiswa.length} siswa terpilih ke kelas Guru ${teacherVal || '(Belum Diatur)'}?`,
                                                        onConfirm: async () => {
                                                            try {
                                                                await onBulkAssignTeacher(selectedSiswa, teacherVal);
                                                                setSelectedSiswa([]);
                                                            } catch (err) {
                                                                showToast("Gagal memperbarui guru siswa: " + err.message);
                                                            }
                                                            setConfirmConfig(null);
                                                        }
                                                    });
                                                }}
                                            >
                                                Simpan Guru
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn btn-danger"
                                                style={{ margin: 0, padding: '8px 16px', fontSize: '14px', height: '36px', display: 'flex', alignItems: 'center' }}
                                                onClick={() => {
                                                    setConfirmConfig({
                                                        message: `Apakah Anda yakin ingin menghapus ${selectedSiswa.length} siswa terpilih dari database master?`,
                                                        onConfirm: async () => {
                                                            try {
                                                                await onBulkDeleteStudents(selectedSiswa);
                                                                setSelectedSiswa([]);
                                                            } catch (err) {
                                                                showToast("Gagal menghapus siswa: " + err.message);
                                                            }
                                                            setConfirmConfig(null);
                                                        }
                                                    });
                                                }}
                                            >
                                                Hapus Terpilih
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn btn-secondary"
                                                style={{ margin: 0, padding: '8px 12px', fontSize: '14px', height: '36px', display: 'flex', alignItems: 'center' }}
                                                onClick={() => setSelectedSiswa([])}
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="student-list">
                                    {masterStudents.map((s, idx) => (
                                        <div className="student-item" key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input 
                                                type="checkbox" 
                                                className="form-checkbox"
                                                style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                                                checked={selectedSiswa.includes(idx)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedSiswa([...selectedSiswa, idx]);
                                                    } else {
                                                        setSelectedSiswa(selectedSiswa.filter(i => i !== idx));
                                                    }
                                                }}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '45px', flexShrink: 0 }}>
                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>{idx + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => onInsertStudentClick(idx + 1)}
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
                                                    }}
                                                    title={`Sisipkan murid baru di bawah nomor ${idx + 1}`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="student-info" style={{ flex: 1 }}>
                                                <span className="student-name">
                                                    {s.firstName} {s.lastName || ''}
                                                    {s.alias && <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 'normal', marginLeft: '6px' }}>({s.alias})</span>}
                                                </span>
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
                                            message: "Apakah Anda yakin ingin menghapus semua data master guru?",
                                            onConfirm: () => {
                                                onResetTeachers();
                                                setConfirmConfig(null);
                                            }
                                        });
                                    }}
                                >
                                    Hapus Semua Data
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
