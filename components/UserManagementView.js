import { useState, useEffect, useCallback } from 'react';
import { SupabaseDb } from '../lib/supabase-db';

export default function UserManagementView({ showToast }) {
    const [usersList, setUsersList] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState(null); // { message, onConfirm }

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const list = await SupabaseDb.getUsers();
            setUsersList(list);
        } catch (err) {
            showToast("Gagal memuat daftar user: " + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (active) {
                loadUsers();
            }
        });
        return () => {
            active = false;
        };
    }, [loadUsers]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        
        if (!trimmedEmail || !trimmedPassword) {
            showToast("Email dan password wajib diisi!");
            return;
        }

        try {
            await SupabaseDb.addUser(trimmedEmail, trimmedPassword, role);
            showToast(`Akun ${trimmedEmail} berhasil dibuat!`);
            setEmail('');
            setPassword('');
            setRole('user');
            loadUsers();
        } catch (err) {
            showToast("Gagal membuat akun: " + err.message);
        }
    };

    const handleDeleteUser = (userEmail) => {
        if (userEmail.toLowerCase() === 'hendraadmin1@admin.com') {
            showToast("Akun Administrator Utama tidak boleh dihapus!");
            return;
        }

        setConfirmConfig({
            message: `Apakah Anda yakin ingin menghapus akun ${userEmail}?`,
            onConfirm: async () => {
                setConfirmConfig(null);
                try {
                    await SupabaseDb.deleteUser(userEmail);
                    showToast(`Akun ${userEmail} berhasil dihapus.`);
                    loadUsers();
                } catch (err) {
                    showToast("Gagal menghapus user: " + err.message);
                }
            }
        });
    };

    const formatDateString = (dateStr) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="master-layout-grid">
            {/* Add User Column */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Buat Akun Pengguna</h2>
                    <p className="card-subtitle">Hanya Administrator yang dapat membuat akun akses baru.</p>
                </div>
                <div className="card-body">
                    <form onSubmit={handleCreateUser} className="form-compact">
                        <div className="form-group">
                            <label htmlFor="newUserEmail" className="form-label">Alamat Email</label>
                            <input 
                                type="email" 
                                id="newUserEmail" 
                                className="form-input" 
                                placeholder="email@admin.com" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="off" 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="newUserPassword" className="form-label">Password</label>
                            <input 
                                type="password" 
                                id="newUserPassword" 
                                className="form-input" 
                                placeholder="Password akun..." 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="off" 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="newUserRole" className="form-label">Role Akses</label>
                            <select 
                                id="newUserRole" 
                                className="form-input"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="user">User (Hanya Baca/Input Absen)</option>
                                <option value="admin">Admin (Akses Penuh + Buat User)</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary btn-block">Buat Akun Baru</button>
                    </form>
                </div>
            </div>

            {/* User List Column */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                    <div>
                        <h2 className="card-title">Database Akun Pengguna</h2>
                        <p className="card-subtitle">Akun terdaftar yang memiliki izin masuk</p>
                    </div>
                    {isLoading && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Memuat...</span>}
                </div>
                <div className="card-body scrollable-list-container">
                    <div className="student-list" id="usersListContainer">
                        {usersList.map((u, idx) => {
                            const isMainAdmin = u.email.toLowerCase() === 'hendraadmin1@admin.com';
                            return (
                                <div className="student-item" key={idx}>
                                    <div className="student-info">
                                        <span className="student-name">
                                            {u.email}
                                            {isMainAdmin && <span className="badge success" style={{ marginLeft: '8px', fontSize: '9px', padding: '2px 6px' }}>Utama</span>}
                                        </span>
                                        <div className="student-badges">
                                            <span className="badge" style={{ backgroundColor: u.role === 'admin' ? 'var(--primary-light)' : 'var(--bg-primary)', color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                                Role: {u.role.toUpperCase()}
                                            </span>
                                            <span className="badge" style={{ color: 'var(--text-muted)' }}>
                                                Dibuat: {formatDateString(u.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="student-actions">
                                        {!isMainAdmin && (
                                            <button 
                                                type="button" 
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDeleteUser(u.email)}
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {usersList.length === 0 && !isLoading && (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                                Tidak ada user ditemukan.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
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
                                <button type="button" className="btn btn-danger" onClick={confirmConfig.onConfirm} style={{ margin: 0, padding: '8px 16px' }}>Ya, Hapus</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
