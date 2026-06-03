import { useState } from 'react';
import { SupabaseDb } from '../lib/supabase-db';

export default function LoginOverlay({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        try {
            const result = await SupabaseDb.login(email, password);
            if (result.success) {
                // Save session in sessionStorage
                sessionStorage.setItem('absensi_current_user', JSON.stringify(result.user));
                onLoginSuccess(result.user);
            } else {
                setErrorMsg(result.message || "Email atau password salah.");
            }
        } catch (err) {
            setErrorMsg("Gagal melakukan verifikasi: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal-card" style={{ maxWidth: '400px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-premium)' }}>
                <div className="modal-header" style={{ border: 'none', padding: '24px 24px 10px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div className="logo" style={{ marginBottom: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" strokeLinecap="round" strokeLinejoin="round" className="logo-icon" style={{ width: '36px', height: '36px' }}>
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            <path d="m9 12 2 2 4-4" />
                        </svg>
                        <span style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 'bold' }}>PresensiPintar</span>
                    </div>
                    <h3 className="modal-title" style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-secondary)' }}>Sistem Absensi Guru & Siswa</h3>
                </div>
                
                <div className="modal-body" style={{ padding: '24px' }}>
                    {errorMsg && (
                        <div className="alert alert-danger" style={{ marginBottom: '16px', padding: '10px 14px', fontSize: '13px' }}>
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="loginEmail" className="form-label">Email Administrator</label>
                            <input 
                                type="email" 
                                id="loginEmail" 
                                className="form-input" 
                                placeholder="nama@email.com" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="username" 
                            />
                        </div>
                        
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label htmlFor="loginPassword" className="form-label">Kata Sandi (Password)</label>
                            <input 
                                type="password" 
                                id="loginPassword" 
                                className="form-input" 
                                placeholder="Masukkan password..." 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password" 
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block" 
                            style={{ padding: '12px' }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Memverifikasi...' : 'Masuk Sekarang'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
