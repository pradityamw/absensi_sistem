import { createClient } from '@supabase/supabase-js';

// Helper to hash passwords using SHA-256 (browser-compatible fallback)
export async function sha256(message) {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        try {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        } catch (e) {
            console.warn("Subtle crypto failed, falling back to JS implementation", e);
        }
    }
    return sha256Fallback(message);
}

function sha256Fallback(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j;
    var result = '';
    var words = [];
    var asciiLength = ascii[lengthProperty];
    var hash = [];
    var k = [];
    var primeCounter = 0;
    var isComposite = {};
    
    for (var candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 313; i += candidate) {
                isComposite[i] = 1;
            }
            hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }
    
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        if (j >> 8) return ''; // ASCII only
        words[i >> 2] |= j << ((3 - i % 4) * 8);
    }
    words[words[lengthProperty]] = ((asciiLength * 8) / maxWord) | 0;
    words[words[lengthProperty]] = (asciiLength * 8) | 0;
    
    for (j = 0; j < words[lengthProperty];) {
        var w = words.slice(j, j += 16);
        var oldHash = hash.slice(0);
        hash = hash.slice(0, 8);
        
        for (i = 0; i < 64; i++) {
            var wItem = w[i];
            if (i >= 16) {
                var s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
                var s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
                wItem = w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
            }
            
            var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
            var temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + wItem) | 0;
            var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
            var temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;
            
            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
        }
        
        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }
    
    for (i = 0; i < 8; i++) {
        var word = hash[i];
        if (word < 0) word += maxWord;
        result += word.toString(16).padStart(8, '0');
    }
    
    return result;
}

export const SupabaseDb = {
    client: null,
    config: {
        supabaseUrl: '',
        supabaseAnonKey: ''
    },
    mockUsersKey: 'absensi_mock_users',

    // Initializes client using config or env variables
    init(customConfig = {}) {
        let finalUrl = customConfig.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        let finalKey = customConfig.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        this.config = {
            supabaseUrl: finalUrl,
            supabaseAnonKey: finalKey
        };


        if (finalUrl && finalKey) {
            try {
                this.client = createClient(finalUrl, finalKey, {
                    auth: { persistSession: false }
                });
                console.log("Supabase Client initialized successfully.");
            } catch (e) {
                console.error("Failed to initialize Supabase client:", e);
                this.client = null;
            }
        } else {
            this.client = null;
            this.initMockUsers();
        }
    },

    loadConfig() {
        this.config = { supabaseUrl: '', supabaseAnonKey: '' };
        if (typeof window !== 'undefined') {
            // Try process env
            this.config.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
            this.config.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

            // Try saved settings in localStorage which override process env
            const saved = localStorage.getItem('absensi_supabase_config');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.supabaseUrl) this.config.supabaseUrl = parsed.supabaseUrl;
                    if (parsed.supabaseAnonKey) this.config.supabaseAnonKey = parsed.supabaseAnonKey;
                } catch (e) {
                    console.error('Failed to parse Supabase config from localStorage', e);
                }
            }
        }
        return this.config;
    },

    initMockUsers() {
        if (typeof window === 'undefined') return;
        let users = localStorage.getItem(this.mockUsersKey);
        if (!users) {
            // Default seed admin: hendraadmin1@admin.com / H3ndr4321admin
            const defaultAdmin = {
                email: 'hendraadmin1@admin.com',
                password_hash: '488c2f488dc1dd7fd91656a73d68b7678509f46ecf4820ea7ec1af259ac18f8c',
                role: 'admin',
                created_at: new Date().toISOString()
            };
            localStorage.setItem(this.mockUsersKey, JSON.stringify([defaultAdmin]));
        }
    },

    /* ==========================================================================
       USER MANAGEMENT & AUTH
       ========================================================================== */
    async login(email, password) {
        const emailClean = email.trim().toLowerCase();
        const pwdHash = await sha256(password);

        // Bypass / Dev bypass
        if (emailClean === 'hendraadmin1@admin.com' && pwdHash === '488c2f488dc1dd7fd91656a73d68b7678509f46ecf4820ea7ec1af259ac18f8c') {
            return { success: true, message: 'Login Berhasil (Bypass/Default)', user: { email: 'hendraadmin1@admin.com', role: 'admin' } };
        }

        if (!this.client) {
            this.initMockUsers();
            const localUsers = JSON.parse(localStorage.getItem(this.mockUsersKey) || '[]');
            const foundUser = localUsers.find(u => u.email.toLowerCase() === emailClean);
            
            if (foundUser && foundUser.password_hash === pwdHash) {
                return {
                    success: true,
                    message: "Login Berhasil (Mode Simulasi)",
                    user: { email: foundUser.email, role: foundUser.role }
                };
            }
            return { success: false, message: "Email atau password salah.", user: null };
        }

        try {
            const { data, error } = await this.client
                .from('app_users')
                .select('*')
                .eq('email', emailClean)
                .single();

            if (error || !data) {
                return { success: false, message: "Akun tidak ditemukan atau gagal menghubungi server.", user: null };
            }

            if (data.password_hash === pwdHash) {
                return {
                    success: true,
                    message: "Login Berhasil!",
                    user: { email: data.email, role: data.role }
                };
            }
            return { success: false, message: "Password salah.", user: null };
        } catch (e) {
            return { success: false, message: "Gagal menghubungkan ke Supabase: " + e.message, user: null };
        }
    },

    async getUsers() {
        if (!this.client) {
            this.initMockUsers();
            return JSON.parse(localStorage.getItem(this.mockUsersKey) || '[]');
        }

        try {
            const { data, error } = await this.client
                .from('app_users')
                .select('email, role, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (e) {
            console.error("Failed to fetch users from Supabase, using mock local data", e);
            this.initMockUsers();
            return JSON.parse(localStorage.getItem(this.mockUsersKey) || '[]');
        }
    },

    async addUser(email, password, role) {
        const emailClean = email.trim().toLowerCase();
        const pwdHash = await sha256(password);
        const newUser = {
            email: emailClean,
            password_hash: pwdHash,
            role: role,
            created_at: new Date().toISOString()
        };

        if (!this.client) {
            this.initMockUsers();
            const localUsers = JSON.parse(localStorage.getItem(this.mockUsersKey) || '[]');
            if (localUsers.some(u => u.email.toLowerCase() === emailClean)) {
                throw new Error("Email sudah terdaftar.");
            }
            localUsers.push(newUser);
            localStorage.setItem(this.mockUsersKey, JSON.stringify(localUsers));
            return true;
        }

        try {
            const { error } = await this.client
                .from('app_users')
                .insert([newUser]);

            if (error) {
                if (error.code === '23505') throw new Error("Email sudah terdaftar.");
                throw error;
            }
            return true;
        } catch (e) {
            throw new Error("Gagal menambah user ke Supabase: " + e.message);
        }
    },

    async deleteUser(email) {
        const emailClean = email.trim().toLowerCase();

        if (emailClean === 'hendraadmin1@admin.com') {
            throw new Error("Akun Administrator Utama tidak boleh dihapus.");
        }

        if (!this.client) {
            this.initMockUsers();
            let localUsers = JSON.parse(localStorage.getItem(this.mockUsersKey) || '[]');
            localUsers = localUsers.filter(u => u.email.toLowerCase() !== emailClean);
            localStorage.setItem(this.mockUsersKey, JSON.stringify(localUsers));
            return true;
        }

        try {
            const { error } = await this.client
                .from('app_users')
                .delete()
                .eq('email', emailClean);

            if (error) throw error;
            return true;
        } catch (e) {
            throw new Error("Gagal menghapus user dari Supabase: " + e.message);
        }
    },

    /* ==========================================================================
       MASTER DATA (STUDENTS & TEACHERS)
       ========================================================================== */
    async getMasterStudents() {
        if (!this.client) return null;
        try {
            const { data, error } = await this.client
                .from('master_students')
                .select('*')
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data.map(item => {
                const parts = (item.last_name || '').split('|');
                const lastName = parts[0]?.trim() || '';
                const alias = parts[1]?.trim() || '';
                return {
                    firstName: item.first_name,
                    lastName: lastName,
                    quota: item.quota,
                    teacherName: item.teacher_name || '',
                    alias: alias
                };
            });
        } catch (e) {
            console.error("Supabase: Gagal mengambil data siswa master:", e.message);
            return null;
        }
    },

    async saveMasterStudents(studentsList) {
        if (!this.client) return false;
        try {
            // Clear existing and replace (or upset)
            const { error: deleteError } = await this.client
                .from('master_students')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (deleteError) throw deleteError;

            if (studentsList.length === 0) return true;

            const now = new Date();
            const dbRows = studentsList.map((s, idx) => {
                const serializedLastName = s.alias ? `${s.lastName || ''} | ${s.alias}` : (s.lastName || '');
                return {
                    first_name: s.firstName,
                    last_name: serializedLastName,
                    quota: s.quota,
                    teacher_name: s.teacherName,
                    created_at: new Date(now.getTime() + idx * 1000).toISOString()
                };
            });

            const { error: insertError } = await this.client
                .from('master_students')
                .insert(dbRows);
            if (insertError) throw insertError;
            return true;
        } catch (e) {
            console.error("Supabase: Gagal menyimpan data siswa master:", e.message);
            throw e;
        }
    },

    async getMasterTeachers() {
        if (!this.client) return null;
        try {
            const { data, error } = await this.client
                .from('master_teachers')
                .select('*')
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data.map(item => ({
                firstName: item.first_name,
                lastName: item.last_name || ''
            }));
        } catch (e) {
            console.error("Supabase: Gagal mengambil data guru master:", e.message);
            return null;
        }
    },

    async saveMasterTeachers(teachersList) {
        if (!this.client) return false;
        try {
            const { error: deleteError } = await this.client
                .from('master_teachers')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');
            if (deleteError) throw deleteError;

            if (teachersList.length === 0) return true;

            const now = new Date();
            const dbRows = teachersList.map((t, idx) => ({
                first_name: t.firstName,
                last_name: t.lastName,
                created_at: new Date(now.getTime() + idx * 1000).toISOString()
            }));

            const { error: insertError } = await this.client
                .from('master_teachers')
                .insert(dbRows);
            if (insertError) throw insertError;
            return true;
        } catch (e) {
            console.error("Supabase: Gagal menyimpan data guru master:", e.message);
            throw e;
        }
    },

    /* ==========================================================================
       ATTENDANCE NATIVE DATABASE SYNC
       ========================================================================== */
    async getAttendanceRecords(year, monthIndex, masterStudents) {
        if (!this.client) return null;
        try {
            const masterNames = masterStudents.map(s => typeof s === 'string' ? s : `${s.firstName} ${s.lastName}`.trim());
            const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(year, monthIndex + 1, 0).getDate();
            const endDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            const { data, error } = await this.client
                .from('attendance_records')
                .select('*')
                .gte('attendance_date', startDate)
                .lte('attendance_date', endDate);

            if (error) throw error;

            // Reconstruct row layout: { NO, NAMA, '1': cellObj, '2': cellObj ... '31': cellObj, TOTAL }
            const recordsByStudent = {};
            const uniqueDates = new Set();

            data.forEach(rec => {
                const nameLower = rec.student_name.toLowerCase();
                if (!recordsByStudent[nameLower]) {
                    recordsByStudent[nameLower] = {};
                }
                // Parse day from YYYY-MM-DD string directly to avoid timezone shift issues
                const day = parseInt(rec.attendance_date.split('-')[2], 10);
                
                recordsByStudent[nameLower][day.toString()] = {
                    value: parseFloat(rec.jam),
                    guru: rec.guru,
                    kelas: rec.kelas
                };
                uniqueDates.add(rec.attendance_date);
            });

            // Map master names to rows
            const gridData = masterNames.map((name, index) => {
                const nameLower = name.toLowerCase();
                const studentRecords = recordsByStudent[nameLower] || {};
                
                // Get student's registered teacher name
                const sObj = masterStudents.find(s => {
                    const sName = typeof s === 'string' ? s : `${s.firstName} ${s.lastName}`.trim();
                    return sName.toLowerCase() === nameLower;
                });
                const registeredTeacher = sObj && typeof sObj === 'object' ? (sObj.teacherName || 'Hendra') : 'Hendra';

                const row = { NO: index + 1, NAMA: name };
                let total = 0;

                for (let d = 1; d <= 31; d++) {
                    const dayStr = d.toString();
                    
                    // We check if this date index had any record saved globally in database
                    // Construct YYYY-MM-DD
                    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const isDateRecorded = uniqueDates.has(dateKey);

                    if (studentRecords[dayStr] !== undefined) {
                        row[dayStr] = studentRecords[dayStr];
                        total += parseFloat(studentRecords[dayStr].value) || 0;
                    } else if (isDateRecorded) {
                        // Recorded but this student has no record (meaning absent)
                        row[dayStr] = {
                            value: 0,
                            guru: registeredTeacher,
                            kelas: "group"
                        };
                    } else {
                        // Not recorded at all
                        row[dayStr] = "";
                    }
                }
                row.TOTAL = total;
                return row;
            });

            return gridData;
        } catch (e) {
            console.error("Supabase: Gagal mengambil data absensi:", e.message);
            return null;
        }
    },

    async saveAttendanceRecords(year, monthIndex, day, presentObjects, masterStudents, selectedTeacher = 'Hendra', isSingleEdit = false) {
        if (!this.client) return false;
        try {
            // Construct date string
            const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const masterNames = masterStudents.map(s => typeof s === 'string' ? s : `${s.firstName} ${s.lastName}`.trim());
            
            // 1. Fetch existing records for this specific date and these master student names to do a merge
            const { data: existingRows, error: fetchError } = await this.client
                .from('attendance_records')
                .select('*')
                .eq('attendance_date', dateStr)
                .in('student_name', masterNames);
            
            if (fetchError) throw fetchError;

            const existingMap = new Map((existingRows || []).map(r => [r.student_name.toLowerCase().trim(), r]));

            // We will insert present student records, and ALSO preserve previously present student records.
            const presentMap = new Map(presentObjects.map(obj => [obj.name.toLowerCase().trim(), obj]));
            
            const dbRows = masterStudents.map(s => {
                const name = typeof s === 'string' ? s : `${s.firstName} ${s.lastName}`.trim();
                const nameLower = name.toLowerCase().trim();
                
                if (presentMap.has(nameLower)) {
                    // Student is in the new paste -> use the new paste details
                    const info = presentMap.get(nameLower);
                    return {
                        attendance_date: dateStr,
                        student_name: name,
                        guru: info.guru,
                        jam: info.jam,
                        kelas: info.kelas
                    };
                } else if (!isSingleEdit && existingMap.has(nameLower) && parseFloat(existingMap.get(nameLower).jam) > 0) {
                    // Student was marked present in previous paste -> preserve existing details!
                    const info = existingMap.get(nameLower);
                    return {
                        attendance_date: dateStr,
                        student_name: name,
                        guru: info.guru,
                        jam: parseFloat(info.jam),
                        kelas: info.kelas
                    };
                } else {
                    // Student is absent
                    const studentTeacher = typeof s === 'object' && s ? (s.teacherName || selectedTeacher) : selectedTeacher;
                    
                    // In case teacherName is comma-separated, get the first one or default
                    let finalTeacher = selectedTeacher;
                    if (typeof s === 'object' && s && s.teacherName) {
                        const teachers = s.teacherName.split(',').map(t => t.trim()).filter(Boolean);
                        finalTeacher = teachers.includes(selectedTeacher) ? selectedTeacher : (teachers[0] || selectedTeacher);
                    }
                    
                    return {
                        attendance_date: dateStr,
                        student_name: name,
                        guru: finalTeacher,
                        jam: 0.0,
                        kelas: 'group'
                    };
                }
            });

            // Delete existing records for this specific date and these specific student names
            const { error: deleteError } = await this.client
                .from('attendance_records')
                .delete()
                .eq('attendance_date', dateStr)
                .in('student_name', masterNames);

            if (deleteError) throw deleteError;

            const { error: insertError } = await this.client
                .from('attendance_records')
                .insert(dbRows);

            if (insertError) throw insertError;
            return true;
        } catch (e) {
            console.error("Supabase: Gagal menyimpan data absensi:", e.message);
            throw e;
        }
    },

    async updateAttendanceTeacher(studentName, oldTeacher, newTeacher) {
        if (!this.client) return false;
        try {
            const { error } = await this.client
                .from('attendance_records')
                .update({ guru: newTeacher })
                .eq('student_name', studentName)
                .eq('guru', oldTeacher);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Supabase: Gagal memperbarui guru di catatan absensi:", e.message);
            return false;
        }
    }
};
