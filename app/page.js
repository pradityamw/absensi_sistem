'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SupabaseDb } from '../lib/supabase-db';
import { GoogleSheetsSync } from '../lib/sheets';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DashboardView from '../components/DashboardView';
import HistoryView from '../components/HistoryView';
import MasterDataView from '../components/MasterDataView';
import UserManagementView from '../components/UserManagementView';
import LoginOverlay from '../components/LoginOverlay';
import AttendanceEditModal from '../components/AttendanceEditModal';
import StudentEditModal from '../components/StudentEditModal';

const defaultStudents = [
    { firstName: "Claretta", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Charlene", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Richmond", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Ben", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Elford", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Zora", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Owen", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Quennel", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Tahir", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "El Jethro", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Xavier", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Axel", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Lexa", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Joshua", lastName: "", quota: 8, teacherName: "Hendra" },
    { firstName: "Shannon", lastName: "", quota: 8, teacherName: "Hendra" }
];

const defaultTeachers = [
    { firstName: "Hendra", lastName: "" },
    { firstName: "Budi", lastName: "" },
    { firstName: "Ani", lastName: "" }
];

const defaultSheetsConfig = {
    method: 'simulated',
    appsScriptUrl: '',
    spreadsheetId: '',
    sheetName: 'Juni 2026',
    apiKey: '',
    clientId: ''
};

export default function Home() {
    // 1. Session & Auth States
    const [currentUser, setCurrentUser] = useState(null);
    const [checkedAuth, setCheckedAuth] = useState(false);

    // 2. Navigation State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // 3. Central Application Data States
    const [masterStudents, setMasterStudents] = useState([]);
    const [masterTeachers, setMasterTeachers] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [prevMonthData, setPrevMonthData] = useState([]);

    // 4. Config & Environment States
    const [syncMethod, setSyncMethod] = useState('supabase');
    const [sheetsConfig, setSheetsConfig] = useState(defaultSheetsConfig);
    const [supabaseConfig, setSupabaseConfig] = useState({
        supabaseUrl: '',
        supabaseAnonKey: ''
    });
    const [currentDate, setCurrentDate] = useState(() => {
        // Default to June 2026 to match template or today if preferred, 
        // let's use today's date but if it is 2026, keep it. 
        const today = new Date();
        // Seed default June 1st, 2026 if today is not 2026
        if (today.getFullYear() !== 2026) {
            return new Date(2026, 5, 1); // 1 June 2026
        }
        return today;
    });

    // 5. Interface UI Utilities
    const [isLoading, setIsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastActive, setToastActive] = useState(false);
    const [theme, setTheme] = useState('light');
    const [isInitialized, setIsInitialized] = useState(false);

    // 6. Modals
    const [editingCell, setEditingCell] = useState(null); // { studentName, day, hours, teacher, classType }
    const [editingStudentIdx, setEditingStudentIdx] = useState(null); // index of student being edited
    const [insertStudentIndex, setInsertStudentIndex] = useState(null); // index to insert student in the middle
    const [undoStack, setUndoStack] = useState([]); // Undo history stack

    const showToast = useCallback((msg) => {
        setToastMessage(msg);
        setToastActive(true);
    }, []);

    // Hide toast automatically
    useEffect(() => {
        if (toastActive) {
            const timer = setTimeout(() => {
                setToastActive(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastActive]);

    // Format months in Indonesian
    const indonesianMonths = useMemo(() => [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ], []);

    // Master student names mapped
    const masterStudentNames = useMemo(() => {
        return masterStudents.map(s => `${s.firstName} ${s.lastName}`.trim());
    }, [masterStudents]);

    /* ==========================================================================
       STARTUP & INITIALIZATION (CLIENT-SIDE ONLY)
       ========================================================================== */
    useEffect(() => {
        if (typeof window === 'undefined') return;

        let active = true;

        const initializeApp = async () => {
            // A. Fetch config from runtime API
            let serverConfig = { supabaseUrl: '', supabaseAnonKey: '' };
            try {
                const res = await fetch('/api/config');
                if (res.ok) {
                    serverConfig = await res.json();
                }
            } catch (e) {
                console.error("Failed to load dynamic environment config", e);
            }

            if (!active) return;

            // B. Load Session
            const savedUser = sessionStorage.getItem('absensi_current_user');
            if (savedUser) {
                try {
                    setCurrentUser(JSON.parse(savedUser));
                } catch (e) {
                    console.error("Failed to parse user session", e);
                }
            }
            setCheckedAuth(true);

            // C. Load Theme
            const savedTheme = localStorage.getItem('absensi_theme') || 'light';
            setTheme(savedTheme);
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }

            // D. Load Supabase Config & Initialize
            const subConf = SupabaseDb.loadConfig();

            // Prioritize runtime server config if available
            const finalSupabaseUrl = serverConfig.supabaseUrl || subConf.supabaseUrl || '';
            const finalSupabaseAnonKey = serverConfig.supabaseAnonKey || subConf.supabaseAnonKey || '';
            const mergedSubConf = {
                supabaseUrl: finalSupabaseUrl,
                supabaseAnonKey: finalSupabaseAnonKey
            };

            setSupabaseConfig(mergedSubConf);
            SupabaseDb.init(mergedSubConf);
            const hasSupabase = !!SupabaseDb.client;

            // E. Load Sheets Config
            const savedSheets = localStorage.getItem('absensi_sheets_config');
            let initialMethod = hasSupabase ? 'supabase' : 'simulated';
            if (savedSheets) {
                try {
                    const parsed = JSON.parse(savedSheets);
                    setSheetsConfig(prev => ({ ...prev, ...parsed }));
                    GoogleSheetsSync.init(parsed);
                    if (parsed.method) {
                        initialMethod = parsed.method;
                    }
                } catch (e) {
                    console.error("Failed to parse Sheets config", e);
                }
            } else {
                GoogleSheetsSync.init(defaultSheetsConfig);
            }
            if (initialMethod === 'supabase' && !hasSupabase) {
                initialMethod = 'simulated';
            }
            setSyncMethod(initialMethod);
            setIsInitialized(true);
        };

        initializeApp();

        return () => {
            active = false;
        };
    }, []);

    // Toggle Dark Mode
    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        if (nextTheme === 'dark') {
            document.body.classList.add('dark-theme');
            localStorage.setItem('absensi_theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('absensi_theme', 'light');
        }
    };

    /* ==========================================================================
       LOAD MASTER LISTS
       ========================================================================== */
    const loadSimulatedMasterLists = useCallback(() => {
        // A. Master Students
        const savedSiswa = localStorage.getItem('absensi_master_siswa');
        if (savedSiswa) {
            try {
                const parsed = JSON.parse(savedSiswa);
                if (parsed && parsed.length > 0) {
                    setMasterStudents(parsed);
                } else {
                    localStorage.setItem('absensi_master_siswa', JSON.stringify(defaultStudents));
                    setMasterStudents(defaultStudents);
                }
            } catch (e) {
                localStorage.setItem('absensi_master_siswa', JSON.stringify(defaultStudents));
                setMasterStudents(defaultStudents);
            }
        } else {
            localStorage.setItem('absensi_master_siswa', JSON.stringify(defaultStudents));
            setMasterStudents(defaultStudents);
        }

        // B. Master Teachers
        const savedGuru = localStorage.getItem('absensi_master_guru');
        if (savedGuru) {
            try {
                const parsed = JSON.parse(savedGuru);
                if (parsed && parsed.length > 0) {
                    setMasterTeachers(parsed);
                } else {
                    localStorage.setItem('absensi_master_guru', JSON.stringify(defaultTeachers));
                    setMasterTeachers(defaultTeachers);
                }
            } catch (e) {
                localStorage.setItem('absensi_master_guru', JSON.stringify(defaultTeachers));
                setMasterTeachers(defaultTeachers);
            }
        } else {
            localStorage.setItem('absensi_master_guru', JSON.stringify(defaultTeachers));
            setMasterTeachers(defaultTeachers);
        }
    }, []);

    const loadMasterLists = useCallback(async (currentSync = syncMethod) => {
        if (typeof window === 'undefined') return;

        if (currentSync === 'supabase') {
            setIsLoading(true);
            try {
                if (!SupabaseDb.client) {
                    throw new Error("Supabase client not initialized");
                }
                // A. Load Master Students
                let students = await SupabaseDb.getMasterStudents();
                if (students === null) {
                    throw new Error("Gagal mengambil data siswa master");
                }
                if (students.length === 0) {
                    console.log("Database master_students is empty. Seeding defaults...");
                    await SupabaseDb.saveMasterStudents(defaultStudents);
                    students = defaultStudents;
                }
                setMasterStudents(students);

                // B. Load Master Teachers
                let teachers = await SupabaseDb.getMasterTeachers();
                if (teachers === null) {
                    throw new Error("Gagal mengambil data guru master");
                }
                if (teachers.length === 0) {
                    console.log("Database master_teachers is empty. Seeding defaults...");
                    await SupabaseDb.saveMasterTeachers(defaultTeachers);
                    teachers = defaultTeachers;
                }
                setMasterTeachers(teachers);
            } catch (e) {
                console.error("Failed to load master lists from Supabase, loading simulated fallback.", e);
                loadSimulatedMasterLists();
            } finally {
                setIsLoading(false);
            }
        } else {
            loadSimulatedMasterLists();
        }
    }, [syncMethod, loadSimulatedMasterLists]);

    // Load master lists on syncMethod change or initialization completion
    useEffect(() => {
        if (!isInitialized) return;
        let active = true;
        Promise.resolve().then(() => {
            if (active) loadMasterLists();
        });
        return () => {
            active = false;
        };
    }, [loadMasterLists, isInitialized]);

    /* ==========================================================================
       LOAD ATTENDANCE REGISTER
       ========================================================================== */
    const loadAttendanceData = useCallback(async (forceFetch = false) => {
        if (masterStudents.length === 0) return;

        setIsLoading(true);
        try {
            const yearVal = currentDate.getFullYear();
            const monthIdx = currentDate.getMonth();
            const sheetTitle = `${indonesianMonths[monthIdx]} ${yearVal}`;

            // Sync sheetName in GoogleSheets config temporarily
            GoogleSheetsSync.config.sheetName = sheetTitle;

            let data = [];
            if (syncMethod === 'supabase') {
                data = await SupabaseDb.getAttendanceRecords(yearVal, monthIdx, masterStudents);
                if (!data) {
                    // Fallback simulated empty data
                    data = GoogleSheetsSync._getSimulatedData(masterStudents);
                }
            } else {
                data = await GoogleSheetsSync.getAttendanceData(masterStudents);
            }
            setAttendanceData(data);

            // Fetch previous month's data to calculate BULAN_LALU sessions attended count
            const prevDate = new Date(yearVal, monthIdx - 1, 1);
            const prevSheetTitle = `${indonesianMonths[prevDate.getMonth()]} ${prevDate.getFullYear()}`;
            
            let prevData = [];
            if (syncMethod === 'supabase') {
                prevData = await SupabaseDb.getAttendanceRecords(prevDate.getFullYear(), prevDate.getMonth(), masterStudents);
            } else {
                // Temporarily alter GoogleSheets sheetName config
                const origSheetName = GoogleSheetsSync.config.sheetName;
                GoogleSheetsSync.config.sheetName = prevSheetTitle;
                try {
                    prevData = await GoogleSheetsSync.getAttendanceData(masterStudents);
                } catch (prevErr) {
                    // Ignore error: sheet might not exist
                }
                GoogleSheetsSync.config.sheetName = origSheetName;
            }
            setPrevMonthData(prevData || []);

            if (forceFetch) {
                showToast("Data absensi berhasil diperbarui.");
            }
        } catch (e) {
            console.error("Gagal sinkronisasi data absensi:", e);
            showToast("Gagal sinkronisasi: " + e.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentDate, masterStudents, syncMethod, indonesianMonths, showToast]);

    // Fetch attendance when date, masterStudentNames, or activeTab changes
    useEffect(() => {
        if (masterStudents.length > 0) {
            let active = true;
            Promise.resolve().then(() => {
                if (active) loadAttendanceData();
            });
            return () => {
                active = false;
            };
        }
    }, [currentDate, masterStudents, loadAttendanceData, activeTab]);

    const captureUndoState = async (day, customYear, customMonthIndex) => {
        const yearVal = customYear !== undefined ? customYear : currentDate.getFullYear();
        const monthIdx = customMonthIndex !== undefined ? customMonthIndex : currentDate.getMonth();
        let oldRows = [];
        let oldDayValues = [];
        
        const targetSheetName = `${indonesianMonths[monthIdx]} ${yearVal}`;

        // Capture in-memory cell state for all students for local rollbacks (works for simulated, apps-script, direct-api)
        if (attendanceData && attendanceData.length > 0) {
            oldDayValues = attendanceData.map(row => ({
                studentName: row.NAMA,
                cell: row[day.toString()]
            }));
        }

        try {
            if (syncMethod === 'supabase' && SupabaseDb.client) {
                const dateStr = `${yearVal}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const { data } = await SupabaseDb.client
                    .from('attendance_records')
                    .select('*')
                    .eq('attendance_date', dateStr);
                oldRows = data || [];
            }
        } catch (err) {
            console.error("Failed to capture undo state:", err);
        }

        const undoAction = {
            syncMethod: syncMethod,
            year: yearVal,
            monthIndex: monthIdx,
            day: day,
            sheetName: targetSheetName,
            oldSupabaseRows: oldRows,
            oldSimulatedValues: oldDayValues,
            description: `Absensi Tanggal ${day} ${indonesianMonths[monthIdx]} ${yearVal}`
        };
        setUndoStack(prev => [...prev, undoAction]);
    };

    const handleUndo = async () => {
        if (undoStack.length === 0) return;
        const action = undoStack[undoStack.length - 1];
        setIsLoading(true);

        try {
            if (action.syncMethod === 'supabase' && SupabaseDb.client) {
                const dateStr = `${action.year}-${String(action.monthIndex + 1).padStart(2, '0')}-${String(action.day).padStart(2, '0')}`;
                
                // 1. Delete all records for that date
                const { error: deleteError } = await SupabaseDb.client
                    .from('attendance_records')
                    .delete()
                    .eq('attendance_date', dateStr);
                if (deleteError) throw deleteError;

                // 2. Insert old records back if any, sanitizing to avoid writing auto-generated fields
                if (action.oldSupabaseRows.length > 0) {
                    const sanitizedRows = action.oldSupabaseRows.map(row => ({
                        attendance_date: row.attendance_date,
                        student_name: row.student_name,
                        guru: row.guru,
                        jam: row.jam,
                        kelas: row.kelas
                    }));
                    const { error: insertError } = await SupabaseDb.client
                        .from('attendance_records')
                        .insert(sanitizedRows);
                    if (insertError) throw insertError;
                }
            } else if (action.syncMethod === 'simulated') {
                const key = `sim_attendance_${action.sheetName.replace(/\s+/g, '_')}`;
                const localGrid = JSON.parse(localStorage.getItem(key) || '[]');
                const valueMap = new Map(action.oldSimulatedValues.map(v => [v.studentName.toLowerCase(), v.cell]));

                localGrid.forEach(row => {
                    const keyLower = row.NAMA.toLowerCase();
                    if (valueMap.has(keyLower)) {
                        row[action.day.toString()] = valueMap.get(keyLower);
                    }
                });

                // Recalculate row totals
                localGrid.forEach(row => {
                    let total = 0;
                    for (let d = 1; d <= 31; d++) {
                        const cell = row[d.toString()];
                        if (cell && typeof cell === 'object') {
                            total += parseFloat(cell.value) || 0;
                        } else if (cell && (typeof cell === 'number' || typeof cell === 'string')) {
                            total += parseFloat(cell) || 0;
                        }
                    }
                    row.TOTAL = total;
                });
                localStorage.setItem(key, JSON.stringify(localGrid));
            } else if (action.syncMethod === 'apps-script' || action.syncMethod === 'direct-api') {
                // Reconstruct presentObjects from the captured oldDayValues
                const presentObjects = [];
                action.oldSimulatedValues.forEach(item => {
                    const cell = item.cell;
                    let val = 0;
                    let guru = "Hendra";
                    let kelas = "group";
                    
                    if (cell && typeof cell === 'object') {
                        val = parseFloat(cell.value) || 0;
                        guru = cell.guru || "Hendra";
                        kelas = cell.kelas || "group";
                    } else if (cell !== undefined && cell !== null && cell !== "") {
                        val = parseFloat(cell) || 0;
                    }
                    
                    if (val > 0) {
                        presentObjects.push({
                            name: item.studentName,
                            guru,
                            jam: val,
                            kelas
                        });
                    }
                });

                // Set sheet config name and write
                GoogleSheetsSync.config.sheetName = action.sheetName;
                await GoogleSheetsSync.saveAttendance(action.day, presentObjects, masterStudents);
            }

            setUndoStack(prev => prev.slice(0, -1));
            showToast(`Membatalkan tindakan: Revert ${action.description}`);
            await loadAttendanceData();
        } catch (e) {
            console.error("Gagal melakukan undo:", e);
            showToast("Gagal melakukan undo: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    /* ==========================================================================
       SAVE ATTENDANCE FOR A DAY
       ========================================================================== */
    const handleSaveAttendance = async (dateOrDay, presentObjects, selectedTeacher = 'Hendra') => {
        setIsLoading(true);
        try {
            let yearVal, monthIdx, day;
            if (dateOrDay instanceof Date) {
                yearVal = dateOrDay.getFullYear();
                monthIdx = dateOrDay.getMonth();
                day = dateOrDay.getDate();
            } else {
                yearVal = currentDate.getFullYear();
                monthIdx = currentDate.getMonth();
                day = dateOrDay;
            }

            const sheetTitle = `${indonesianMonths[monthIdx]} ${yearVal}`;
            GoogleSheetsSync.config.sheetName = sheetTitle;

            await captureUndoState(day, yearVal, monthIdx);

            // Filter master students belonging to the selected teacher (case-insensitive)
            const filteredStudents = masterStudents.filter(s => {
                const regTeacher = (s.teacherName || '').trim().toLowerCase();
                const teachers = regTeacher.split(',').map(t => t.trim().toLowerCase());
                const selTeacherLower = selectedTeacher.toLowerCase();
                if (selTeacherLower === 'hendra') {
                    return teachers.includes('hendra') || regTeacher === '' || (teachers.length === 1 && teachers[0] === '');
                } else {
                    return teachers.includes(selTeacherLower);
                }
            });

            if (syncMethod === 'supabase') {
                await SupabaseDb.saveAttendanceRecords(yearVal, monthIdx, day, presentObjects, filteredStudents, selectedTeacher);
            } else {
                await GoogleSheetsSync.saveAttendance(day, presentObjects, filteredStudents);
            }

            showToast(`Absensi Tanggal ${day} berhasil diproses & disimpan!`);
            await loadAttendanceData();
        } catch (e) {
            console.error("Failed to save attendance:", e);
            showToast("Gagal menyimpan absensi: " + e.message);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    /* ==========================================================================
       CELL EDIT SAVE
       ========================================================================== */
    const handleCellSave = async (editDetails) => {
        const { studentName, day, status, hours, teacher, classType, moveStudent, moveTeacher } = editDetails;
        
        await captureUndoState(day);
        
        let localData = [...attendanceData];
        let targetRow = localData.find(r => r.NAMA.toLowerCase() === studentName.toLowerCase());
        
        if (!targetRow) {
            // Generate simulated data structure in memory to operate on
            localData = GoogleSheetsSync._getSimulatedData(masterStudentNames);
            targetRow = localData.find(r => r.NAMA.toLowerCase() === studentName.toLowerCase());
        }

        const isPresent = status === 'present';
        const cellVal = isPresent ? hours : 0;
        const cellGuru = isPresent ? (moveTeacher !== "" ? moveTeacher : teacher) : "Hendra";
        const cellKelas = isPresent ? classType : "group";

        if (moveStudent !== "") {
            // Move attendance record from target to destination student
            const destRow = localData.find(r => r.NAMA.toLowerCase() === moveStudent.toLowerCase());
            if (destRow) {
                destRow[day.toString()] = {
                    value: cellVal,
                    guru: cellGuru,
                    kelas: cellKelas
                };
            }
            // Clear current student cell
            targetRow[day.toString()] = {
                value: 0,
                guru: "Hendra",
                kelas: "group"
            };
            if (moveTeacher !== "") {
                showToast(`Memindahkan absensi dari ${studentName} ke ${moveStudent} & dialihkan ke Guru ${moveTeacher}...`);
            } else {
                showToast(`Memindahkan absensi dari ${studentName} ke ${moveStudent}...`);
            }
        } else {
            // Edit standard cell values
            targetRow[day.toString()] = {
                value: cellVal,
                guru: cellGuru,
                kelas: cellKelas
            };
            if (moveTeacher !== "") {
                showToast(`Mengalihkan absensi ${studentName} ke Guru ${moveTeacher}...`);
            } else {
                showToast(`Memperbarui absensi ${studentName}...`);
            }
        }

        // Reconstruct dayPresentObjects to push to database save
        const dayPresentObjects = [];
        localData.forEach(row => {
            const cell = row[day.toString()];
            let val = 0;
            let guru = "Hendra";
            let kelas = "group";

            if (cell && typeof cell === 'object') {
                val = parseFloat(cell.value) || 0;
                guru = cell.guru || "Hendra";
                kelas = cell.kelas || "group";
            } else if (cell !== undefined && cell !== null && cell !== "") {
                val = parseFloat(cell) || 0;
            }

            if (val > 0) {
                dayPresentObjects.push({
                    name: row.NAMA,
                    guru,
                    jam: val,
                    kelas
                });
            }
        });

        setIsLoading(true);
        try {
            setEditingCell(null);
            
            const yearVal = currentDate.getFullYear();
            const monthIdx = currentDate.getMonth();
            const sheetTitle = `${indonesianMonths[monthIdx]} ${yearVal}`;
            GoogleSheetsSync.config.sheetName = sheetTitle;

            if (syncMethod === 'supabase') {
                await SupabaseDb.saveAttendanceRecords(yearVal, monthIdx, day, dayPresentObjects, masterStudents, undefined, true);
            } else {
                await GoogleSheetsSync.saveAttendance(day, dayPresentObjects, masterStudents);
            }

            showToast("Perubahan sel berhasil disimpan!");
            await loadAttendanceData();
        } catch (e) {
            console.error(e);
            showToast("Gagal menyimpan perubahan sel: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    /* ==========================================================================
       MASTER STUDENTS CRUD
       ========================================================================== */
    const handleAddStudent = async (newStudent, reload = true) => {
        const updatedList = [...masterStudents, newStudent];
        setIsLoading(true);
        try {
            if (syncMethod === 'supabase') {
                await SupabaseDb.saveMasterStudents(updatedList);
            } else {
                localStorage.setItem('absensi_master_siswa', JSON.stringify(updatedList));
            }
            setMasterStudents(updatedList);
            if (reload) {
                showToast(`Siswa ${newStudent.firstName} ditambahkan ke database master.`);
                await loadMasterLists();
            }
        } catch (err) {
            console.error("Gagal menambahkan siswa:", err);
            showToast("Gagal menyimpan siswa ke Supabase: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStudents = async (newStudentsList) => {
        const updatedList = [...masterStudents, ...newStudentsList];
        setIsLoading(true);
        try {
            if (syncMethod === 'supabase') {
                await SupabaseDb.saveMasterStudents(updatedList);
            } else {
                localStorage.setItem('absensi_master_siswa', JSON.stringify(updatedList));
            }
            setMasterStudents(updatedList);
            showToast(`Berhasil mengimpor ${newStudentsList.length} siswa.`);
            await loadMasterLists();
        } catch (err) {
            console.error("Gagal mengimpor siswa:", err);
            showToast("Gagal mengimpor siswa ke Supabase: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveStudentInsert = async (index, newStudent) => {
        const updatedList = [...masterStudents];
        updatedList.splice(index, 0, newStudent);
        setIsLoading(true);
        try {
            if (syncMethod === 'supabase') {
                await SupabaseDb.saveMasterStudents(updatedList);
            } else {
                localStorage.setItem('absensi_master_siswa', JSON.stringify(updatedList));
            }
            setMasterStudents(updatedList);
            setInsertStudentIndex(null);
            showToast(`Siswa ${newStudent.firstName} berhasil disisipkan!`);
            await loadMasterLists();
        } catch (err) {
            console.error("Gagal menyisipkan siswa:", err);
            showToast("Gagal menyisipkan siswa ke Supabase: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveStudentEdit = async (index, updatedStudent) => {
        const oldStudent = masterStudents[index];
        const updatedList = [...masterStudents];
        updatedList[index] = updatedStudent;
        setIsLoading(true);
        try {
            if (syncMethod === 'supabase') {
                await SupabaseDb.saveMasterStudents(updatedList);
                
                // If teacher changed, propagate update to existing attendance records in Supabase
                const oldTeacherName = (oldStudent?.teacherName || '').trim();
                const newTeacherName = (updatedStudent?.teacherName || '').trim();
                
                if (oldTeacherName.toLowerCase() !== newTeacherName.toLowerCase()) {
                    const studentFullName = `${updatedStudent.firstName} ${updatedStudent.lastName}`.trim();
                    await SupabaseDb.updateAttendanceTeacher(
                        studentFullName,
                        oldTeacherName || 'Hendra',
                        newTeacherName
                    );
                }
            } else {
                localStorage.setItem('absensi_master_siswa', JSON.stringify(updatedList));
            }
            setMasterStudents(updatedList);
            setEditingStudentIdx(null);
            showToast(`Siswa ${updatedStudent.firstName} berhasil diedit!`);
            await loadMasterLists();
        } catch (err) {
            console.error("Gagal menyimpan edit siswa:", err);
            showToast("Gagal menyimpan edit siswa ke Supabase: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteStudent = async (index) => {
        const updatedList = masterStudents.filter((_, idx) => idx !== index);
        setIsLoading(true);
        try {
            if (syncMethod === 'supabase') {
                await SupabaseDb.saveMasterStudents(updatedList);
            } else {
                localStorage.setItem('absensi_master_siswa', JSON.stringify(updatedList));
            }
            setMasterStudents(updatedList);
            showToast("Siswa berhasil dihapus dari database master.");
            await loadMasterLists();
        } catch (err) {
            console.error("Gagal menghapus siswa:", err);
            showToast("Gagal menghapus siswa di Supabase: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkAssignTeacher = async (studentIndices, teacherName) => {
        const updatedList = masterStudents.map((s, idx) => {
            if (studentIndices.includes(idx)) {
                return { ...s, teacherName: teacherName };
            }
            return s;
        });
        setIsLoading(true);
        try {
            if (syncMethod === 'supabase') {
                await SupabaseDb.saveMasterStudents(updatedList);
                
                // Propagate teacher changes to existing attendance records in Supabase
                for (const idx of studentIndices) {
                    const oldStudent = masterStudents[idx];
                    const oldTeacherName = (oldStudent?.teacherName || '').trim();
                    if (oldTeacherName.toLowerCase() !== teacherName.toLowerCase()) {
                        const studentFullName = `${oldStudent.firstName} ${oldStudent.lastName}`.trim();
                        await SupabaseDb.updateAttendanceTeacher(
                            studentFullName,
                            oldTeacherName || 'Hendra',
                            teacherName
                        );
                    }
                }
            } else {
                localStorage.setItem('absensi_master_siswa', JSON.stringify(updatedList));
            }
            setMasterStudents(updatedList);
            showToast(`Berhasil memperbarui kelas pengajar untuk ${studentIndices.length} siswa.`);
            await loadMasterLists();
        } catch (err) {
            console.error("Gagal menyimpan edit massal siswa:", err);
            showToast("Gagal menyimpan edit massal ke Supabase: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkDeleteStudents = async (studentIndices) => {
        const updatedList = masterStudents.filter((_, idx) => !studentIndices.includes(idx));
        setIsLoading(true);
        try {
            if (syncMethod === 'supabase') {
                await SupabaseDb.saveMasterStudents(updatedList);
            } else {
                localStorage.setItem('absensi_master_siswa', JSON.stringify(updatedList));
            }
            setMasterStudents(updatedList);
            showToast(`Berhasil menghapus ${studentIndices.length} siswa.`);
            await loadMasterLists();
        } catch (err) {
            console.error("Gagal menyimpan penghapusan massal siswa:", err);
            showToast("Gagal menghapus siswa di Supabase: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetStudents = async () => {
        setIsLoading(true);
        try {
            if (syncMethod === 'supabase') {
                await SupabaseDb.saveMasterStudents([]);
            } else {
                localStorage.setItem('absensi_master_siswa', JSON.stringify([]));
            }
            setMasterStudents([]);
            showToast("Semua data master siswa berhasil dihapus.");
            await loadMasterLists();
        } catch (err) {
            console.error("Gagal menghapus data master siswa:", err);
            showToast("Gagal menghapus data master siswa di Supabase: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    /* ==========================================================================
       MASTER TEACHERS CRUD
       ========================================================================== */
    const handleAddTeacher = async (newTeacher, reload = true) => {
        const updatedList = [...masterTeachers, newTeacher];
        setIsLoading(true);
        try {
            if (syncMethod === 'supabase') {
                await SupabaseDb.saveMasterTeachers(updatedList);
            } else {
                localStorage.setItem('absensi_master_guru', JSON.stringify(updatedList));
            }
            setMasterTeachers(updatedList);
            if (reload) {
                showToast(`Guru ${newTeacher.firstName} ditambahkan ke database master.`);
                await loadMasterLists();
            }
        } catch (err) {
            console.error("Gagal menambahkan guru:", err);
            showToast("Gagal menyimpan guru ke Supabase: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTeachers = async (newTeachersList) => {
        const updatedList = [...masterTeachers, ...newTeachersList];
        setIsLoading(true);
        try {
            if (syncMethod === 'supabase') {
                await SupabaseDb.saveMasterTeachers(updatedList);
            } else {
                localStorage.setItem('absensi_master_guru', JSON.stringify(updatedList));
            }
            setMasterTeachers(updatedList);
            showToast(`Berhasil mengimpor ${newTeachersList.length} guru.`);
            await loadMasterLists();
        } catch (err) {
            console.error("Gagal mengimpor guru:", err);
            showToast("Gagal mengimpor guru ke Supabase: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTeacher = async (index) => {
        const updatedList = masterTeachers.filter((_, idx) => idx !== index);
        setIsLoading(true);
        try {
            if (syncMethod === 'supabase') {
                await SupabaseDb.saveMasterTeachers(updatedList);
            } else {
                localStorage.setItem('absensi_master_guru', JSON.stringify(updatedList));
            }
            setMasterTeachers(updatedList);
            showToast("Guru berhasil dihapus dari database master.");
            await loadMasterLists();
        } catch (err) {
            console.error("Gagal menghapus guru:", err);
            showToast("Gagal menghapus guru di Supabase: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetTeachers = async () => {
        setIsLoading(true);
        try {
            if (syncMethod === 'supabase') {
                await SupabaseDb.saveMasterTeachers([]);
            } else {
                localStorage.setItem('absensi_master_guru', JSON.stringify([]));
            }
            setMasterTeachers([]);
            showToast("Semua data master pengajar berhasil dihapus.");
            await loadMasterLists();
        } catch (err) {
            console.error("Gagal menghapus data master guru:", err);
            showToast("Gagal menghapus data master guru di Supabase: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    /* ==========================================================================
       SETTINGS & CONFIG SAVES
       ========================================================================== */
    const handleSaveSheetsConfig = (newConfig) => {
        setSheetsConfig(prev => ({ ...prev, ...newConfig }));
        setSyncMethod(newConfig.method);
        
        // Save connection to local storage
        localStorage.setItem('absensi_sheets_config', JSON.stringify(newConfig));
        GoogleSheetsSync.init(newConfig);
    };

    const handleTestSheetsConnection = async (testConfig) => {
        GoogleSheetsSync.init(testConfig);
        return await GoogleSheetsSync.testConnection();
    };

    const handleSaveSupabaseConfig = (newConfig) => {
        setSupabaseConfig(newConfig);
        localStorage.setItem('absensi_supabase_config', JSON.stringify(newConfig));
        SupabaseDb.init(newConfig);
    };

    /* ==========================================================================
       LOGOUT ACTION
       ========================================================================== */
    const handleLogout = () => {
        sessionStorage.removeItem('absensi_current_user');
        setCurrentUser(null);
        setActiveTab('dashboard');
        showToast("Logout berhasil!");
    };

    if (!checkedAuth) {
        return (
            <div style={{ display: 'flex', height: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <span>Memuat Aplikasi...</span>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Render login overlay if not logged in */}
            {!currentUser && <LoginOverlay onLoginSuccess={(user) => setCurrentUser(user)} />}
            {/* Sidebar component */}
            <Sidebar 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                syncMethod={syncMethod}
                currentUser={currentUser}
                onLogout={handleLogout}
                theme={theme}
                toggleTheme={toggleTheme}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />

            {/* Main Content Dashboard Area */}
            <main className="main-content">
                <Header 
                    activeTab={activeTab}
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    setMobileMenuOpen={setMobileMenuOpen}
                    undoStack={undoStack}
                    onUndo={handleUndo}
                />

                <div className="view-content">
                    {/* Render Views based on activeTab */}
                    {activeTab === 'dashboard' && (
                        <DashboardView 
                            currentDate={currentDate}
                            setCurrentDate={setCurrentDate}
                            masterStudents={masterStudents}
                            masterTeachers={masterTeachers}
                            onSaveAttendance={handleSaveAttendance}
                            showToast={showToast}
                        />
                    )}

                    {activeTab === 'history' && (
                        <HistoryView 
                            currentDate={currentDate}
                            attendanceData={attendanceData}
                            prevMonthData={prevMonthData}
                            masterStudents={masterStudents}
                            masterTeachers={masterTeachers}
                            onCellClick={(studentName, day, val, guru, kelas) => {
                                setEditingCell({ studentName, day, hours: val, teacher: guru, classType: kelas });
                            }}
                            onRefresh={loadAttendanceData}
                            isLoading={isLoading}
                            showToast={showToast}
                            onEditStudentClick={(idx) => setEditingStudentIdx(idx)}
                            onInsertStudentClick={(idx) => setInsertStudentIndex(idx)}
                        />
                    )}

                    {activeTab === 'master-data' && (
                        <MasterDataView 
                            masterStudents={masterStudents}
                            masterTeachers={masterTeachers}
                            onAddStudent={handleAddStudent}
                            onAddStudents={handleAddStudents}
                            onDeleteStudent={handleDeleteStudent}
                            onResetStudents={handleResetStudents}
                            onAddTeacher={handleAddTeacher}
                            onAddTeachers={handleAddTeachers}
                            onDeleteTeacher={handleDeleteTeacher}
                            onResetTeachers={handleResetTeachers}
                            onEditStudentClick={(idx) => setEditingStudentIdx(idx)}
                            onBulkAssignTeacher={handleBulkAssignTeacher}
                            onBulkDeleteStudents={handleBulkDeleteStudents}
                            showToast={showToast}
                            onInsertStudentClick={(idx) => setInsertStudentIndex(idx)}
                        />
                    )}



                    {activeTab === 'users' && currentUser.role === 'admin' && (
                        <UserManagementView showToast={showToast} />
                    )}
                </div>
            </main>

            {/* Toast Element */}
            <div className={`toast ${toastActive ? 'show' : ''}`} id="toast" style={{ visibility: toastActive ? 'visible' : 'hidden', opacity: toastActive ? 1 : 0, transition: 'opacity 0.25s ease' }}>
                <span className="toast-message" id="toastMessage">{toastMessage}</span>
            </div>

            {/* Editing Modals */}
            {editingCell && (
                <AttendanceEditModal 
                    studentName={editingCell.studentName}
                    day={editingCell.day}
                    initialHours={editingCell.hours}
                    initialTeacher={editingCell.teacher}
                    initialClassType={editingCell.classType}
                    masterStudents={masterStudents}
                    masterTeachers={masterTeachers}
                    onSave={handleCellSave}
                    onClose={() => setEditingCell(null)}
                />
            )}

            {editingStudentIdx !== null && (
                <StudentEditModal 
                    studentData={masterStudents[editingStudentIdx]}
                    studentIndex={editingStudentIdx}
                    masterTeachers={masterTeachers}
                    onSave={handleSaveStudentEdit}
                    onDelete={handleDeleteStudent}
                    onClose={() => setEditingStudentIdx(null)}
                />
            )}

            {insertStudentIndex !== null && (
                <StudentEditModal 
                    studentData={null}
                    studentIndex={insertStudentIndex}
                    masterTeachers={masterTeachers}
                    onSave={handleSaveStudentInsert}
                    onClose={() => setInsertStudentIndex(null)}
                    isInsert={true}
                />
            )}
        </div>
    );
}
