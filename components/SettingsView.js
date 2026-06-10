import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SettingsView({ 
    supabaseConfig, 
    onSaveSupabaseConfig, 
    syncMethod,
    onSaveSheetsConfig,
    sheetsConfig,
    showToast 
}) {
    const [url, setUrl] = useState(supabaseConfig.supabaseUrl || '');
    const [key, setKey] = useState(supabaseConfig.supabaseAnonKey || '');
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Google Sheets local state
    const [sheetMethod, setSheetMethod] = useState(sheetsConfig.method || 'supabase');
    const [appsScriptUrl, setAppsScriptUrl] = useState(sheetsConfig.appsScriptUrl || '');
    const [spreadsheetId, setSpreadsheetId] = useState(sheetsConfig.spreadsheetId || '');
    const [sheetName, setSheetName] = useState(sheetsConfig.sheetName || 'Juni 2026');

    useEffect(() => {
        setUrl(supabaseConfig.supabaseUrl || '');
        setKey(supabaseConfig.supabaseAnonKey || '');
    }, [supabaseConfig]);

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const trimmedUrl = url.trim();
            const trimmedKey = key.trim();

            if (!trimmedUrl || !trimmedKey) {
                throw new Error("URL Supabase dan Anon Key wajib diisi!");
            }

            // Simple URL format check
            if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
                throw new Error("URL Supabase harus dimulai dengan http:// atau https://");
            }

            const tempClient = createClient(trimmedUrl, trimmedKey, {
                auth: { persistSession: false }
            });

            // Perform a query on one of the required tables to check connection and permissions
            const { error } = await tempClient
                .from('master_students')
                .select('id')
                .limit(1);

            if (error) throw error;

            setTestResult({
                success: true,
                message: "Koneksi Berhasil! Aplikasi dapat terhubung ke database Supabase dengan lancar."
            });
            showToast("Koneksi ke Supabase berhasil!");
        } catch (err) {
            console.error("Test connection failed:", err);
            setTestResult({
                success: false,
                message: "Koneksi Gagal: " + (err.message || "Pastikan URL dan Anon Key benar serta internet Anda aktif.")
            });
            showToast("Koneksi ke Supabase gagal!");
        } finally {
            setIsTesting(false);
        }
    };

    const handleSaveSupabase = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSaveSupabaseConfig({
                supabaseUrl: url.trim(),
                supabaseAnonKey: key.trim()
            });
            showToast("Kredensial Supabase berhasil disimpan!");
        } catch (err) {
            showToast("Gagal menyimpan kredensial: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSheets = (e) => {
        e.preventDefault();
        onSaveSheetsConfig({
            method: sheetMethod,
            appsScriptUrl: appsScriptUrl.trim(),
            spreadsheetId: spreadsheetId.trim(),
            sheetName: sheetName.trim()
        });
        showToast("Setelan sinkronisasi berhasil diperbarui!");
    };

    return (
        <div className="settings-grid">
            {/* Supabase Connection Settings Card */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Koneksi Database Supabase</h2>
                    <p className="card-subtitle">Atur alamat endpoint API dan kunci akses publik untuk database presensi Anda.</p>
                </div>
                
                <div className="card-body">
                    <form onSubmit={handleSaveSupabase} className="form-compact">
                        <div className="form-group">
                            <label htmlFor="settingsSubUrl" className="form-label">Supabase URL</label>
                            <input 
                                type="text" 
                                id="settingsSubUrl" 
                                className="form-input" 
                                placeholder="https://xxxx.supabase.co" 
                                required 
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="settingsSubKey" className="form-label">Supabase Anon Key</label>
                            <textarea 
                                id="settingsSubKey" 
                                className="form-textarea" 
                                placeholder="Masukkan Anon Key Supabase..." 
                                required 
                                style={{ minHeight: '100px', fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.4' }}
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                            ></textarea>
                        </div>

                        {testResult && (
                            <div className={`alert ${testResult.success ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                        {testResult.success ? (
                                            <>
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </>
                                        ) : (
                                            <>
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </>
                                        )}
                                    </svg>
                                    <span>{testResult.message}</span>
                                </div>
                            </div>
                        )}

                        <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px', borderTop: 'none', padding: 0 }}>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                disabled={isSaving || isTesting}
                            >
                                {isSaving ? 'Menyimpan...' : 'Simpan Kredensial'}
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-secondary"
                                style={{ flex: 1, borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 600 }}
                                onClick={handleTestConnection}
                                disabled={isSaving || isTesting}
                            >
                                {isTesting ? 'Menguji...' : 'Test Koneksi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Sync Mode Instructions & Status */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Status Sinkronisasi Aktif</h2>
                    <p className="card-subtitle">Informasi mengenai koneksi sinkronisasi data presensi saat ini.</p>
                </div>
                
                <div className="card-body">
                    <div className="settings-section" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <span className="dot" style={{ 
                                width: '12px', 
                                height: '12px', 
                                borderRadius: '50%', 
                                backgroundColor: supabaseConfig.supabaseUrl ? 'var(--success)' : 'var(--danger)',
                                display: 'inline-block',
                                boxShadow: supabaseConfig.supabaseUrl ? '0 0 8px var(--success)' : 'none'
                            }}></span>
                            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>
                                {supabaseConfig.supabaseUrl ? 'Database Supabase Terhubung' : 'Database Supabase Terputus'}
                            </span>
                        </div>

                        <div className="guide-content">
                            <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                                Aplikasi ini dikonfigurasi untuk menyimpan seluruh data master siswa, pengajar, akun pengguna, dan riwayat presensi langsung ke database Supabase PostgreSQL Anda.
                            </p>
                            
                            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                Cara Menyiapkan Database:
                            </h4>
                            
                            <ul className="tutorial-list" style={{ fontSize: '13px' }}>
                                <li>
                                    Buat proyek baru di <b>Supabase Console</b> (supabase.com).
                                </li>
                                <li>
                                    Buka menu <b>SQL Editor</b> di dashboard Supabase Anda.
                                </li>
                                <li>
                                    Salin dan jalankan perintah DDL tabel yang sesuai untuk membuat tabel-tabel berikut:
                                    <ul>
                                        <li><code>app_users</code></li>
                                        <li><code>master_students</code></li>
                                        <li><code>master_teachers</code></li>
                                        <li><code>attendance_records</code></li>
                                    </ul>
                                </li>
                                <li>
                                    Nonaktifkan <b>Row Level Security (RLS)</b> pada tabel-tabel tersebut atau buat kebijakan akses (policy) bertipe <code>public</code> (seperti pada contoh berkas <code>scratch/rls-fix.sql</code>).
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
