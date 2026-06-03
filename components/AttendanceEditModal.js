import { useState, useEffect } from 'react';

export default function AttendanceEditModal({ 
    studentName, 
    day, 
    initialHours, 
    initialTeacher, 
    initialClassType, 
    masterStudents, 
    masterTeachers, 
    onSave, 
    onClose 
}) {
    const [status, setStatus] = useState(initialHours > 0 ? 'present' : 'absent');
    const [teacher, setTeacher] = useState(initialTeacher || 'Hendra');
    const [customTeacher, setCustomTeacher] = useState('');
    const [hours, setHours] = useState(initialHours || 1);
    const [classType, setClassType] = useState(initialClassType || 'group');

    const [moveStudent, setMoveStudent] = useState('');
    const [moveTeacher, setMoveTeacher] = useState('');

    const [showCustomTeacherInput, setShowCustomTeacherInput] = useState(false);

    const [prevKey, setPrevKey] = useState(null);
    const currentKey = `${studentName}_${day}`;

    if (currentKey !== prevKey) {
        setPrevKey(currentKey);
        setStatus(initialHours > 0 ? 'present' : 'absent');
        
        const isStandard = masterTeachers.some(t => t.firstName.toLowerCase() === (initialTeacher || '').toLowerCase());
        if (isStandard || !initialTeacher) {
            setTeacher(initialTeacher || (masterTeachers[0] ? masterTeachers[0].firstName : 'Hendra'));
            setShowCustomTeacherInput(false);
            setCustomTeacher('');
        } else {
            setTeacher('custom');
            setCustomTeacher(initialTeacher);
            setShowCustomTeacherInput(true);
        }

        setHours(initialHours || 1);
        setClassType(initialClassType || 'group');
        setMoveStudent('');
        setMoveTeacher('');
    }

    const handleTeacherChange = (e) => {
        const val = e.target.value;
        setTeacher(val);
        if (val === 'custom') {
            setShowCustomTeacherInput(true);
        } else {
            setShowCustomTeacherInput(false);
            setCustomTeacher('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let finalTeacher = teacher;
        if (status === 'present') {
            if (moveTeacher !== "") {
                finalTeacher = moveTeacher;
            } else if (teacher === 'custom') {
                finalTeacher = customTeacher.trim() || "Hendra";
            }
        }

        onSave({
            studentName,
            day,
            status,
            hours: status === 'present' ? parseFloat(hours) || 1 : 0,
            teacher: finalTeacher,
            classType,
            moveStudent,
            moveTeacher
        });
    };

    // Filter master list to exclude current student for transfer
    const otherStudents = masterStudents.filter(s => {
        const fullName = `${s.firstName} ${s.lastName}`.trim();
        return fullName.toLowerCase() !== studentName.toLowerCase();
    });

    return (
        <div className="modal-overlay" id="editModalOverlay" style={{ zIndex: 1500 }}>
            <div className="modal-card" style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">Edit Presensi - {studentName} (Tgl {day})</h3>
                    <button type="button" className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    
                    <div className="form-group">
                        <label htmlFor="editStatus" className="form-label">Status Kehadiran</label>
                        <select 
                            id="editStatus" 
                            className="form-input"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="present">Hadir</option>
                            <option value="absent">Absen (Alpha)</option>
                        </select>
                    </div>
                    
                    {status === 'present' && (
                        <div id="editDetailsContainer">
                            <div className="form-group">
                                <label htmlFor="editTeacher" className="form-label">Guru / Pengajar</label>
                                <select 
                                    id="editTeacher" 
                                    className="form-input"
                                    value={teacher}
                                    onChange={handleTeacherChange}
                                >
                                    {masterTeachers.map((t, idx) => (
                                        <option key={idx} value={t.firstName}>
                                            {t.firstName} {t.lastName || ''}
                                        </option>
                                    ))}
                                    <option value="custom">-- Guru Kustom --</option>
                                </select>
                                
                                {showCustomTeacherInput && (
                                    <input 
                                        type="text" 
                                        id="editTeacherCustom" 
                                        className="form-input" 
                                        style={{ marginTop: '8px' }} 
                                        placeholder="Tulis nama guru baru..."
                                        value={customTeacher}
                                        onChange={(e) => setCustomTeacher(e.target.value)}
                                        required
                                    />
                                )}
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="editHours" className="form-label">Durasi (Jam)</label>
                                <input 
                                    type="number" 
                                    id="editHours" 
                                    className="form-input" 
                                    min="0.5" 
                                    step="0.5" 
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="editClassType" className="form-label">Tipe Kelas</label>
                                <select 
                                    id="editClassType" 
                                    className="form-input"
                                    value={classType}
                                    onChange={(e) => setClassType(e.target.value)}
                                >
                                    <option value="group">Group (Kelompok)</option>
                                    <option value="private">Private (Mandiri)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="divider"><span>Pindahkan Kehadiran (Opsional)</span></div>
                    
                    <div className="form-group">
                        <label htmlFor="editMoveStudent" className="form-label">Pindahkan Ke Siswa Lain (Jika Salah Absen)</label>
                        <select 
                            id="editMoveStudent" 
                            className="form-input"
                            value={moveStudent}
                            onChange={(e) => setMoveStudent(e.target.value)}
                        >
                            <option value="">-- Tetap untuk siswa ini --</option>
                            {otherStudents.map((s, idx) => {
                                const fullName = `${s.firstName} ${s.lastName}`.trim();
                                return (
                                    <option key={idx} value={fullName}>
                                        {fullName}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    
                    <div className="form-group" style={{ marginTop: '12px' }}>
                        <label htmlFor="editMoveTeacher" className="form-label">Pindahkan Ke Guru Lain (Jika Salah Input Pengajar)</label>
                        <select 
                            id="editMoveTeacher" 
                            className="form-input"
                            value={moveTeacher}
                            onChange={(e) => setMoveTeacher(e.target.value)}
                        >
                            <option value="">-- Tetap dengan pengajar ini --</option>
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
