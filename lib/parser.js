/**
 * Parser module for cleaning, parsing, and validating attendance inputs.
 * Supports metadata tags: Name (Teacher) (Hours) (Class Type)
 */
export const AttendanceParser = {
    /**
     * Clean and extract names and metadata from a pasted text block.
     * Handles numbering, bullet points, leading/trailing whitespace, and parenthetical tags.
     * @param {string} text - Raw input block
     * @param {string} defaultTeacher - Default teacher selected
     * @returns {Object[]} - Array of parsed student objects { name, guru, jam, kelas }
     */
    parseText(text, defaultTeacher = "Hendra") {
        if (!text) return [];

        // Split by lines
        const lines = text.split(/\r?\n/);
        const nameSet = new Set();
        const parsedObjects = [];

        for (let line of lines) {
            let clean = line.trim();
            if (!clean) continue;

            // 1. Remove introductory/meta lines like "Absen Minggu 1 Juni 2026", "Daftar Hadir:", etc.
            if (/^absen/i.test(clean) && clean.split(/\s+/).length > 2) {
                continue;
            }
            if (/^daftar\s+hadir/i.test(clean)) {
                continue;
            }

            // 2. Strip numbers at start: "1. Claretta", "1) Claretta"
            clean = clean.replace(/^\[?\d+\]?[\s\.\)\-:\t]+/, '');

            // 3. Strip bullet points or dash signs: "- Claretta"
            clean = clean.replace(/^[\-\*\•\+\s]+/, '');

            if (!clean) continue;

            // 4. Extract all elements inside parentheses
            const tags = [];
            const tagMatches = clean.matchAll(/\(([^)]+)\)/g);
            for (const match of tagMatches) {
                tags.push(match[1].trim());
            }

            // 5. Clean the student's name by removing all parenthesis blocks and extra spaces
            let name = clean.replace(/\([^)]+\)/g, '').replace(/\s+/g, ' ').trim();
            if (!name) continue;

            // 6. Set defaults
            let guru = defaultTeacher || "Hendra";
            let jam = 1;
            let kelas = "group";
            let hasExplicitTeacher = false;

            // 7. Classify tags
            tags.forEach(tag => {
                const tagLower = tag.toLowerCase();
                // Check if numeric (class duration in hours)
                if (!isNaN(tag) && !isNaN(parseFloat(tag))) {
                    jam = parseFloat(tag);
                }
                // Check if class type matches private/group
                else if (tagLower === 'private' || tagLower === 'group') {
                    kelas = tagLower;
                }
                // Otherwise it is the teacher's name
                else {
                    // Capitalize first letter of each word in teacher's name
                    guru = tag.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    hasExplicitTeacher = true;
                }
            });

            // 8. Deduplicate case-insensitively
            const nameLower = name.toLowerCase();
            if (!nameSet.has(nameLower)) {
                nameSet.add(nameLower);
                parsedObjects.push({
                    name: name,
                    guru: guru,
                    jam: jam,
                    kelas: kelas,
                    hasExplicitTeacher: hasExplicitTeacher
                });
            }
        }

        return parsedObjects;
    },

    /**
     * Match a parsed list of student objects against the database's master student list.
     * @param {Object[]} parsedObjects - Cleaned student objects from the parser
     * @param {Object[]} masterStudents - Database list of student objects { firstName, lastName, quota, teacherName }
     * @returns {Object} - Results containing matched student objects, unrecognized objects, and absent names
     */
    matchStudents(parsedObjects, masterStudents) {
        const matched = [];
        const unrecognized = [];
        const absent = [];

        // Map master list to lowercase keys for case-insensitive lookup
        const masterMap = new Map();
        for (const item of masterStudents) {
            const name = typeof item === 'string' ? item : `${item.firstName} ${item.lastName}`.trim();
            masterMap.set(name.trim().toLowerCase(), item);
        }

        // Keep track of matched keys to find absentees
        const matchedKeys = new Set();

        // Process parsed inputs
        for (const obj of parsedObjects) {
            const keyLower = obj.name.toLowerCase();
            if (masterMap.has(keyLower)) {
                const studentData = masterMap.get(keyLower);
                const originalSpelling = typeof studentData === 'string' ? studentData : `${studentData.firstName} ${studentData.lastName}`.trim();
                
                // If no explicit teacher is parsed in text, use student's registered teacherName from database if available
                let finalTeacher = obj.guru;
                if (!obj.hasExplicitTeacher && studentData && studentData.teacherName) {
                    finalTeacher = studentData.teacherName;
                }

                matched.push({
                    name: originalSpelling,
                    guru: finalTeacher,
                    jam: obj.jam,
                    kelas: obj.kelas
                });
                matchedKeys.add(keyLower);
            } else {
                unrecognized.push(obj);
            }
        }

        // Compute absentees (those in master who are NOT in matchedKeys)
        for (const item of masterStudents) {
            const name = typeof item === 'string' ? item : `${item.firstName} ${item.lastName}`.trim();
            const key = name.trim().toLowerCase();
            if (!matchedKeys.has(key)) {
                absent.push(name.trim());
            }
        }

        return {
            matched: matched,       // List of matched objects { name, guru, jam, kelas }
            unrecognized: unrecognized, // List of unrecognized objects { name, guru, jam, kelas }
            absent: absent         // Names of absent students
        };
    }
};
