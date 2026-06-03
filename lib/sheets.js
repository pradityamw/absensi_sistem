export /**
 * Google Sheets API Integration and Local Simulation Module
 * Supports rich cell metadata (duration value, teacher name, class type)
 */
const GoogleSheetsSync = {
    config: {
        method: 'simulated', // 'simulated', 'apps-script', 'direct-api'
        appsScriptUrl: '',
        spreadsheetId: '',
        sheetName: 'Juni 2026',
        apiKey: '',
        clientId: '',
        accessToken: ''
    },

    /**
     * Initialize connection settings
     */
    init(newConfig) {
        this.config = { ...this.config, ...newConfig };
        localStorage.setItem('absensi_sheets_config', JSON.stringify({
            method: this.config.method,
            appsScriptUrl: this.config.appsScriptUrl,
            spreadsheetId: this.config.spreadsheetId,
            sheetName: this.config.sheetName,
            apiKey: this.config.apiKey,
            clientId: this.config.clientId
        }));
    },

    /**
     * Load config from localStorage
     */
    loadConfig() {
        const saved = localStorage.getItem('absensi_sheets_config');
        if (saved) {
            try {
                this.config = { ...this.config, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Failed to parse sheets config", e);
            }
        }
        return this.config;
    },

    /**
     * Test the connection to the sheet
     */
    async testConnection() {
        const method = this.config.method;
        if (method === 'simulated') {
            return { success: true, message: "Koneksi simulasi berhasil. Data disimpan di browser." };
        }

        if (method === 'apps-script') {
            if (!this.config.appsScriptUrl) {
                return { success: false, message: "URL Google Apps Script belum dikonfigurasi." };
            }
            try {
                const response = await fetch(this.config.appsScriptUrl, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'test',
                        spreadsheetId: this.config.spreadsheetId,
                        sheetName: this.config.sheetName
                    })
                });
                const result = await response.json();
                if (result.status === 'success') {
                    return { success: true, message: "Koneksi Google Apps Script Berhasil!" };
                } else {
                    return { success: false, message: result.message || "Gagal menghubungi Spreadsheet." };
                }
            } catch (e) {
                return { success: false, message: "Gagal melakukan request. Detail: " + e.message };
            }
        }

        if (method === 'direct-api') {
            if (!this.config.spreadsheetId) return { success: false, message: "Spreadsheet ID kosong." };
            if (!this.config.apiKey) return { success: false, message: "API Key kosong." };
            try {
                const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}?key=${this.config.apiKey}`;
                const response = await fetch(url);
                if (response.ok) {
                    return { success: true, message: "Koneksi Direct API Berhasil! Spreadsheet ditemukan." };
                } else {
                    const err = await response.json();
                    return { success: false, message: err.error?.message || "Gagal mengakses spreadsheet via API." };
                }
            } catch (e) {
                return { success: false, message: "Gagal menghubungi Google API: " + e.message };
            }
        }

        return { success: false, message: "Metode tidak dikenali." };
    },

    /**
     * Fetch attendance sheet data
     * @param {string[]} fallbackMaster - Master student names
     * @returns {Promise<Object[]>}
     */
    async getAttendanceData(fallbackMaster = []) {
        const masterNames = fallbackMaster.map(s => typeof s === 'string' ? s : `${s.firstName} ${s.lastName}`.trim());
        const method = this.config.method;

        if (method === 'simulated') {
            return this._getSimulatedData(masterNames);
        }

        if (method === 'apps-script') {
            if (!this.config.appsScriptUrl) throw new Error("Apps Script URL belum diisi.");
            
            const queryUrl = `${this.config.appsScriptUrl}?action=read&spreadsheetId=${encodeURIComponent(this.config.spreadsheetId)}&sheetName=${encodeURIComponent(this.config.sheetName)}&masterNames=${encodeURIComponent(JSON.stringify(masterNames))}`;
            const response = await fetch(queryUrl);
            const result = await response.json();
            
            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message || "Gagal mengambil data dari Google Sheet.");
            }
        }

        if (method === 'direct-api') {
            return this._getDirectApiData(masterNames);
        }

        return [];
    },

    /**
     * Save attendance status for a specific day
     * @param {number} day - Day index (1-31)
     * @param {Object[]} presentObjects - Objects containing parsed student details { name, guru, jam, kelas }
     * @param {string[]} masterStudents - Master student names
     */
    async saveAttendance(day, presentObjects, masterStudents) {
        const masterNames = masterStudents.map(s => typeof s === 'string' ? s : `${s.firstName} ${s.lastName}`.trim());
        const method = this.config.method;

        if (method === 'simulated') {
            return this._saveSimulatedData(day, presentObjects, masterNames);
        }

        if (method === 'apps-script') {
            if (!this.config.appsScriptUrl) throw new Error("Apps Script URL belum diisi.");
            
            const response = await fetch(this.config.appsScriptUrl, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'write',
                    spreadsheetId: this.config.spreadsheetId,
                    sheetName: this.config.sheetName,
                    day: day,
                    presentObjects: presentObjects, // Passes rich objects
                    masterNames: masterNames
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                return true;
            } else {
                throw new Error(result.message || "Gagal menyimpan absensi ke Google Sheet.");
            }
        }

        if (method === 'direct-api') {
            return this._saveDirectApiData(day, presentObjects, masterNames);
        }

        return false;
    },

    /* ==========================================================================
       LOCAL SIMULATION ADAPTER
       ========================================================================== */
    _getSimulatedData(masterStudents) {
        const key = `sim_attendance_${this.config.sheetName.replace(/\s+/g, '_')}`;
        let data = localStorage.getItem(key);
        
        if (!data) {
            const mockData = masterStudents.map((name, index) => {
                const row = { NO: index + 1, NAMA: name };
                for (let d = 1; d <= 31; d++) {
                    row[d.toString()] = "";
                }
                row.TOTAL = 0;
                return row;
            });
            localStorage.setItem(key, JSON.stringify(mockData));
            return mockData;
        }
        
        let parsed = JSON.parse(data);
        const parsedMap = new Map(parsed.map(r => [r.NAMA.toLowerCase(), r]));
        
        const mergedData = masterStudents.map((name, index) => {
            const keyLower = name.toLowerCase();
            if (parsedMap.has(keyLower)) {
                const existingRow = parsedMap.get(keyLower);
                existingRow.NO = index + 1;
                existingRow.NAMA = name;
                return existingRow;
            } else {
                const newRow = { NO: index + 1, NAMA: name };
                for (let d = 1; d <= 31; d++) {
                    newRow[d.toString()] = "";
                }
                newRow.TOTAL = 0;
                return newRow;
            }
        });

        // Recalculate Totals (Summing the values of the rich cell objects)
        mergedData.forEach(row => {
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

        localStorage.setItem(key, JSON.stringify(mergedData));
        return mergedData;
    },

    _saveSimulatedData(day, presentObjects, masterStudents) {
        const key = `sim_attendance_${this.config.sheetName.replace(/\s+/g, '_')}`;
        const currentData = this._getSimulatedData(masterStudents);
        
        const presentMap = new Map();
        presentObjects.forEach(obj => {
            presentMap.set(obj.name.toLowerCase(), obj);
        });
        
        const masterSet = new Set(masterStudents.map(n => n.toLowerCase()));

        currentData.forEach(row => {
            const nameLower = row.NAMA.toLowerCase();
            if (masterSet.has(nameLower)) {
                if (presentMap.has(nameLower)) {
                    const matchedInfo = presentMap.get(nameLower);
                    row[day.toString()] = {
                        value: matchedInfo.jam,
                        guru: matchedInfo.guru,
                        kelas: matchedInfo.kelas
                    };
                } else {
                    row[day.toString()] = {
                        value: 0,
                        guru: "Hendra",
                        kelas: "group"
                    };
                }
            }
            
            // Recalculate Row Total Hours
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

        localStorage.setItem(key, JSON.stringify(currentData));
        return true;
    },

    /* ==========================================================================
       DIRECT API (OAUTH / KEY REST) ADAPTER
       ========================================================================== */
    async _getDirectApiData(masterStudents) {
        if (!this.config.accessToken) {
            throw new Error("Direct API membutuhkan OAuth Token.");
        }

        const sheetNameStr = encodeURIComponent(this.config.sheetName);
        const range = `${sheetNameStr}!A1:AH100`;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${range}?key=${this.config.apiKey}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${this.config.accessToken}` }
        });

        if (!response.ok) {
            const err = await response.json();
            if (response.status === 400 && err.error?.message.includes("range")) {
                await this._directApiCreateAndPopulateSheet(masterStudents);
                return this._getDirectApiData(masterStudents);
            }
            throw new Error(err.error?.message || "Gagal membaca Google Sheets.");
        }

        const data = await response.json();
        const rows = data.values;
        if (!rows || rows.length === 0) {
            await this._directApiCreateAndPopulateSheet(masterStudents);
            return this._getDirectApiData(masterStudents);
        }

        const studentRows = [];
        for (let r = 1; r < rows.length; r++) {
            const val = rows[r];
            if (!val[1]) continue;
            
            const rowObj = {
                NO: parseInt(val[0]) || r,
                NAMA: val[1]
            };

            for (let d = 1; d <= 31; d++) {
                const colIdx = d + 1;
                const cellVal = val[colIdx];
                // Without note reading, we fallback duration value, with default teacher metadata
                const parsedVal = cellVal === "" ? "" : parseFloat(cellVal) || 0;
                rowObj[d.toString()] = {
                    value: parsedVal,
                    guru: "Hendra",
                    kelas: parsedVal === 2.5 ? "private" : "group"
                };
            }
            
            rowObj.TOTAL = parseFloat(val[33]) || 0;
            studentRows.push(rowObj);
        }

        return studentRows;
    },

    async _saveDirectApiData(day, presentObjects, masterStudents) {
        if (!this.config.accessToken) {
            throw new Error("Direct API membutuhkan OAuth Token untuk menulis data.");
        }

        const studentRows = await this._getDirectApiData(masterStudents);
        const presentMap = new Map(presentObjects.map(o => [o.name.toLowerCase(), o]));
        const colLetter = this._getColumnLetter(day + 2); 
        const valueRanges = [];
        
        studentRows.forEach((row, index) => {
            const rowIndex = index + 2; 
            const nameLower = row.NAMA.toLowerCase();
            const isPresent = presentMap.has(nameLower);
            const duration = isPresent ? presentMap.get(nameLower).jam : 0;
            
            valueRanges.push({
                range: `${this.config.sheetName}!${colLetter}${rowIndex}`,
                values: [[duration]]
            });
            
            // Formula updated to SUM instead of COUNTIF to support decimal hours
            valueRanges.push({
                range: `${this.config.sheetName}!AH${rowIndex}`,
                values: [[`=SUM(C${rowIndex}:AG${rowIndex})`]]
            });
        });

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values:batchUpdate?key=${this.config.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                valueInputOption: 'USER_ENTERED',
                data: valueRanges
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Gagal menulis absensi ke Google Sheet.");
        }

        return true;
    },

    async _directApiCreateAndPopulateSheet(masterStudents) {
        const addSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}:batchUpdate`;
        const addResponse = await fetch(addSheetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [{ addSheet: { properties: { title: this.config.sheetName } } }]
            })
        });

        if (!addResponse.ok && addResponse.status !== 400) {
            const err = await addResponse.json();
            throw new Error("Gagal membuat sheet tab baru: " + err.error?.message);
        }

        const headers = ["NO", "NAMA"];
        for (let d = 1; d <= 31; d++) headers.push(d.toString());
        headers.push("TOTAL");

        const gridValues = [headers];
        masterStudents.forEach((name, index) => {
            const rowIdx = index + 2;
            const row = [index + 1, name];
            for (let d = 1; d <= 31; d++) row.push("");
            row.push(`=SUM(C${rowIdx}:AG${rowIdx})`); // TOTAL formula changed to SUM
            gridValues.push(row);
        });

        const sheetNameStr = encodeURIComponent(this.config.sheetName);
        const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${sheetNameStr}!A1:AH${gridValues.length}?valueInputOption=USER_ENTERED&key=${this.config.apiKey}`;
        
        const writeResponse = await fetch(writeUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ values: gridValues })
        });

        if (!writeResponse.ok) {
            const err = await writeResponse.json();
            throw new Error("Gagal menginisialisasi tabel absensi: " + err.error?.message);
        }
    },

    _getColumnLetter(columnNumber) {
        let temp, letter = '';
        while (columnNumber > 0) {
            temp = (columnNumber - 1) % 26;
            letter = String.fromCharCode(65 + temp) + letter;
            columnNumber = (columnNumber - temp - 1) / 26;
        }
        return letter;
    }
};

if (typeof window !== 'undefined') {
    window.GoogleSheetsSync = GoogleSheetsSync;
}

