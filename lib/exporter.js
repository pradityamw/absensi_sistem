/**
 * Export Utility Module (Excel & PDF)
 * Supports cell metadata (duration, teacher, class type)
 */
export const AttendanceExporter = {
    /**
     * Export attendance data to an Excel file (.xlsx)
     */
    async exportToExcel(sheetName, attendanceData) {
        if (typeof window === 'undefined') return;
        if (!attendanceData || attendanceData.length === 0) {
            throw new Error("Tidak ada data untuk diexport.");
        }

        const XLSX = await import('xlsx');

        const rows = attendanceData.map(row => {
            const excelRow = {
                'NO': row.NO,
                'NAMA': row.NAMA,
                'BULAN LALU': row.BULAN_LALU || 0
            };
            
            // Days 1-31
            for (let d = 1; d <= 31; d++) {
                const cell = row[d.toString()];
                let cellVal = "";
                
                if (cell && typeof cell === 'object') {
                    cellVal = (cell.value > 0) ? cell.value : "";
                } else if (cell !== undefined && cell !== null && cell !== "") {
                    const parsedNum = parseFloat(cell);
                    cellVal = (parsedNum > 0) ? parsedNum : "";
                }
                
                excelRow[d.toString()] = cellVal;
            }
            
            excelRow['TOT JAM'] = row.TOTAL;
            excelRow['SESI (HADIR/JATAH)'] = row.SESI_JATAH || "";
            excelRow['% HARI'] = row.PERCENT_HARI || "";
            excelRow['LAST PRESENT'] = row.LAST_PRESENT || "";
            return excelRow;
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        const colWidths = [{ wch: 4 }, { wch: 20 }, { wch: 12 }]; // Added width for Bulan Lalu
        for (let d = 1; d <= 31; d++) {
            colWidths.push({ wch: 3 });
        }
        colWidths.push({ wch: 8 }, { wch: 18 }, { wch: 8 }, { wch: 15 }); // Widths for Tot, Sesi, %, Last Present
        ws['!cols'] = colWidths;

        const fileName = `Absensi_Siswa_${sheetName.replace(/\s+/g, '_')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    },

    /**
     * Export attendance data to a PDF file (.pdf)
     */
    async exportToPdf(sheetName, attendanceData) {
        if (typeof window === 'undefined') return;
        if (!attendanceData || attendanceData.length === 0) {
            throw new Error("Tidak ada data untuk diexport.");
        }

        const { jsPDF } = await import('jspdf');
        const { autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(37, 99, 235);
        doc.text(`ABSENSI SISWA - BULAN ${sheetName.toUpperCase()}`, 14, 15);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        const formattedDate = new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(`Diexport pada: ${formattedDate} | Total Siswa: ${attendanceData.length}`, 14, 21);

        const headers = ['NO', 'NAMA', 'BLN LALU'];
        for (let d = 1; d <= 31; d++) {
            headers.push(d.toString());
        }
        headers.push('TOT', 'SESI', '% HARI', 'LAST PRES');

        const body = attendanceData.map(row => {
            const pdfRow = [
                row.NO,
                row.NAMA,
                `${row.BULAN_LALU || 0} kelas`
            ];
            
            for (let d = 1; d <= 31; d++) {
                const cell = row[d.toString()];
                let cellText = "";
                
                if (cell && typeof cell === 'object') {
                    cellText = (cell.value > 0) ? cell.value.toString() : "";
                } else if (cell !== undefined && cell !== null && cell !== "") {
                    const parsedNum = parseFloat(cell);
                    cellText = (parsedNum > 0) ? parsedNum.toString() : "";
                }
                
                pdfRow.push(cellText);
            }
            
            pdfRow.push(row.TOTAL);
            pdfRow.push(row.SESI_JATAH || "");
            pdfRow.push(row.PERCENT_HARI || "");
            pdfRow.push(row.LAST_PRESENT || "");
            return pdfRow;
        });

        autoTable(doc, {
            startY: 26,
            head: [headers],
            body: body,
            theme: 'grid',
            styles: {
                fontSize: 6.0, // Slipped slightly smaller to fit perfectly
                cellPadding: 1.0,
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.15,
                lineColor: [226, 232, 240]
            },
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 7 },
                1: { cellWidth: 26, halign: 'left' },
                2: { cellWidth: 12 },
                34: { cellWidth: 8, fontStyle: 'bold', fillColor: [239, 246, 255], textColor: [37, 99, 235] },
                35: { cellWidth: 12 },
                36: { cellWidth: 10 },
                37: { cellWidth: 15 }
            },
            margin: { left: 8, right: 8 },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index >= 3 && data.column.index <= 33) {
                    const cellValText = data.cell.text[0];
                    if (cellValText && cellValText !== "") {
                        const parsedHours = parseFloat(cellValText);
                        if (parsedHours > 0) {
                            if (parsedHours === 1) {
                                // Group - green tint
                                data.cell.styles.fillColor = [209, 250, 229]; 
                                data.cell.styles.textColor = [5, 150, 105]; 
                                data.cell.styles.fontStyle = 'bold';
                            } else {
                                // Private or custom hours - blue/indigo tint
                                data.cell.styles.fillColor = [239, 246, 255]; 
                                data.cell.styles.textColor = [37, 99, 235]; 
                                data.cell.styles.fontStyle = 'bold';
                            }
                        }
                    }
                }
            }
        });

        const fileName = `Absensi_Siswa_${sheetName.replace(/\s+/g, '_')}.pdf`;
        doc.save(fileName);
    }
};
