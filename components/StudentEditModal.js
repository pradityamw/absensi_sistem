import { useState, useEffect } from 'react';

export default function StudentEditModal({ 
    studentData, 
    studentIndex, 
    masterTeachers, 
    onSave, 
    onClose 
}) {
    const [firstName, setFirstName] = useState(studentData?.firstName || '');
    const [lastName, setLastName] = useState(studentData?.lastName || '');
    const [quota, setQuota] = useState(studentData?.quota || 8);
    const [teacherName, setTeacherName] = useState(studentData?.teacherName || '');

    const [prevStudentData, setPrevStudentData] = useState(studentData);
    if (studentData !== prevStudentData) {
        setPrevStudentData(studentData);
        setFirstName(studentData?.firstName || '');
        setLastName(studentData?.lastName || '');
        setQuota(studentData?.quota || 8);
        setTeacherName(studentData?.teacherName || '');
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(studentIndex, {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            quota: parseInt(quota) || 8,
            teacherName
        });
    };

    return (
        <div className="modal-overlay" id="editStudentModalOverlay" style={{ zIndex: 1500 }}>
            <div className="modal-card" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">Edit Data Siswa</h3>
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
                        <label className="form-label">Guru Pengajar (Teacher)</label>
                        <select 
                            className="form-input"
                            value={teacherName}
                            onChange={(e) => setTeacherName(e.target.value)}
                        >
                            <option value="">-- Hubungkan Guru (Belum Diatur) --</option>
                            {masterTeachers.map((t, idx) => (
                                <option key={idx} value={t.firstName}>
                                    {t.firstName} {t.lastName || ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-actions border-top">
                        <button type="submit" className="btn btn-primary btn-block">Simpan Perubahan</button>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
