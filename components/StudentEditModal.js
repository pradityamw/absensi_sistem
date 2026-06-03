import { useState, useEffect } from 'react';

export default function StudentEditModal({ 
    studentData, 
    studentIndex, 
    masterTeachers, 
    onSave, 
    onClose,
    isInsert = false,
    onDelete
}) {
    const [firstName, setFirstName] = useState(studentData?.firstName || '');
    const [lastName, setLastName] = useState(studentData?.lastName || '');
    const [quota, setQuota] = useState(studentData?.quota || 8);
    const [alias, setAlias] = useState(studentData?.alias || '');
    const [selectedTeachers, setSelectedTeachers] = useState(() => {
        if (!studentData?.teacherName) return [];
        return studentData.teacherName.split(',').map(t => t.trim()).filter(Boolean);
    });
    const [showConfirm, setShowConfirm] = useState(false);

    const [prevStudentData, setPrevStudentData] = useState(studentData);
    if (studentData !== prevStudentData) {
        setPrevStudentData(studentData);
        setFirstName(studentData?.firstName || '');
        setLastName(studentData?.lastName || '');
        setQuota(studentData?.quota || 8);
        setAlias(studentData?.alias || '');
        setSelectedTeachers(studentData?.teacherName ? studentData.teacherName.split(',').map(t => t.trim()).filter(Boolean) : []);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(studentIndex, {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            quota: parseInt(quota) || 8,
            teacherName: selectedTeachers.join(', '),
            alias: alias.trim()
        });
    };

    const handleDeleteClick = () => {
        setShowConfirm(true);
    };

    return (
        <div className="modal-overlay" id="editStudentModalOverlay" style={{ zIndex: 1500 }}>
            <div className="modal-card" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">{isInsert ? "Sisipkan Siswa Baru" : "Edit Data Siswa"}</h3>
                    <button type="button" className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Nama Depan (First Name)</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            required 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            autoComplete="off" 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nama Belakang (Last Name)</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            autoComplete="off" 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Alias (Nama Panggilan)</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Nama yang dipakai di daftar absen..."
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            autoComplete="off" 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Jatah Bulanan (Sesi)</label>
                        <input 
                            type="number" 
                            className="form-input" 
                            min="1" 
                            max="100" 
                            required 
                            value={quota}
                            onChange={(e) => setQuota(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Guru Pengajar (Bisa pilih lebih dari 1)</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
                            {masterTeachers.map((t, idx) => {
                                const tName = t.firstName;
                                const isChecked = selectedTeachers.includes(tName);
                                return (
                                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', margin: 0, padding: '2px 0' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isChecked}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTeachers([...selectedTeachers, tName]);
                                                } else {
                                                    setSelectedTeachers(selectedTeachers.filter(name => name !== tName));
                                                }
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                        />
                                        <span style={{ color: 'var(--text-primary)' }}>{tName} {t.lastName || ''}</span>
                                    </label>
                                );
                            })}
                            {masterTeachers.length === 0 && (
                                <span className="text-muted" style={{ fontSize: '13px' }}>Tidak ada data guru master.</span>
                            )}
                        </div>
                    </div>
                    <div className="form-actions border-top" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button type="submit" className="btn btn-primary btn-block" style={{ margin: 0 }}>{isInsert ? "Sisipkan Siswa" : "Simpan Perubahan"}</button>
                        {!isInsert && onDelete && (
                            <button 
                                type="button" 
                                className="btn btn-danger btn-block" 
                                onClick={handleDeleteClick}
                                style={{ margin: 0 }}
                            >
                                Hapus Siswa
                            </button>
                        )}
                        <button type="button" className="btn btn-secondary btn-block" onClick={onClose} style={{ margin: 0 }}>Batal</button>
                    </div>
                </form>
            </div>

            {showConfirm && (
                <div className="modal-overlay" style={{ zIndex: 1600, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="modal-card" style={{ maxWidth: '380px', width: '100%', margin: '0 20px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Konfirmasi Hapus</h3>
                            <button type="button" className="modal-close-btn" onClick={() => setShowConfirm(false)}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px 24px' }}>
                            <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                Apakah Anda yakin ingin menghapus siswa <strong>{firstName} {lastName || ''}</strong>? Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="form-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: 0, marginTop: '20px', borderTop: 'none' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowConfirm(false)} style={{ margin: 0, padding: '8px 16px' }}>Batal</button>
                                <button type="button" className="btn btn-danger" onClick={() => {
                                    onDelete(studentIndex);
                                    onClose();
                                }} style={{ margin: 0, padding: '8px 16px' }}>Ya, Hapus</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
