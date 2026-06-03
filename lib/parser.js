/**
 * Helper to compute Levenshtein Distance between two strings.
 */
function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) {
            costs[s2.length] = lastValue;
        }
    }
    return costs[s2.length];
}

/**
 * Calculates string similarity ratio between 0.0 and 1.0.
 */
function getSimilarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

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
        let currentClassType = null; // Tracks sectional headers like "Group" or "Private"

        for (let line of lines) {
            let clean = line.trim();
            if (!clean) continue;

            // 1. Skip date/day metadata headers
            const isHeader = /^(absen|senin|selasa|rabu|kamis|jumat|sabtu|minggu|ming)/i.test(clean);
            const datePattern = /(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|june|july)/i;
            if (isHeader && (datePattern.test(clean) || /\b\d{4}\b/.test(clean) || clean.split(/\s+/).length > 1)) {
                continue;
            }

            // Detect sectional Group/Private headers
            const cleanLower = clean.toLowerCase();
            if (cleanLower === 'group' || cleanLower === 'private') {
                currentClassType = cleanLower;
                continue;
            }

            // 2. Strip numbers at start: "1. Claretta", "1) Claretta"
            clean = clean.replace(/^\[?\d+\]?[\s\.\)\-:\t]+/, '');

            // 3. Strip bullet points or dash signs: "- Claretta"
            clean = clean.replace(/^[\-\*\•\+\s]+/, '');

            if (!clean) continue;

            let kelas = currentClassType || "group";

            // Check for trailing 'private' or 'group' word (case-insensitive) without parentheses
            const trailingClassMatch = clean.match(/\s+\b(private|group)\b$/i);
            if (trailingClassMatch) {
                kelas = trailingClassMatch[1].toLowerCase();
                clean = clean.replace(/\s+\b(private|group)\b$/i, '').trim();
            }

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
     * Uses fuzzy matching (Levenshtein similarity >= 80%) to handle slight typos or spacing issues.
     * @param {Object[]} parsedObjects - Cleaned student objects from the parser
     * @param {Object[]} masterStudents - Database list of student objects { firstName, lastName, quota, teacherName }
     * @returns {Object} - Results containing matched student objects, unrecognized objects, and absent names
     */
    matchStudents(parsedObjects, masterStudents, defaultTeacher = "Hendra") {
        const matched = [];
        const unrecognized = [];
        const absent = [];

        // Map master list to lowercase keys for case-insensitive lookup
        const masterMap = new Map();
        for (const item of masterStudents) {
            const name = typeof item === 'string' ? item : `${item.firstName} ${item.lastName}`.trim();
            masterMap.set(name.trim().toLowerCase(), item);
            if (typeof item === 'object' && item && item.alias) {
                masterMap.set(item.alias.trim().toLowerCase(), item);
            }
        }

        // Keep track of matched keys to find absentees
        const matchedKeys = new Set();

        // Process parsed inputs
        for (const obj of parsedObjects) {
            const keyLower = obj.name.toLowerCase();
            
            let bestMatchItem = null;
            let bestMatchKey = null;
            let highestSimilarity = 0;

            // 1. Try exact match first for performance
            if (masterMap.has(keyLower)) {
                bestMatchItem = masterMap.get(keyLower);
                bestMatchKey = keyLower;
                highestSimilarity = 1.0;
            } else {
                // 2. Perform fuzzy search
                for (const [mKey, mItem] of masterMap.entries()) {
                    const sim = getSimilarity(keyLower, mKey);
                    if (sim > highestSimilarity) {
                        highestSimilarity = sim;
                        bestMatchItem = mItem;
                        bestMatchKey = mKey;
                    }
                }
            }

            // 3. Match if similarity is >= 50% (0.50)
            if (bestMatchItem && highestSimilarity >= 0.50) {
                const studentData = bestMatchItem;
                const originalSpelling = typeof studentData === 'string' ? studentData : `${studentData.firstName} ${studentData.lastName}`.trim();
                
                // If no explicit teacher is parsed in text, use student's registered teacherName from database if available
                let finalTeacher = obj.guru;
                if (!obj.hasExplicitTeacher && studentData && studentData.teacherName) {
                    const teachers = studentData.teacherName.split(',').map(t => t.trim()).filter(Boolean);
                    if (teachers.length > 0) {
                        const matchTeacher = teachers.find(t => t.toLowerCase() === defaultTeacher.toLowerCase());
                        finalTeacher = matchTeacher || teachers[0];
                    } else {
                        finalTeacher = studentData.teacherName;
                    }
                }

                matched.push({
                    name: originalSpelling,
                    guru: finalTeacher,
                    jam: obj.jam,
                    kelas: obj.kelas
                });
                matchedKeys.add(bestMatchKey);
            } else {
                unrecognized.push(obj);
            }
        }

        // Compute absentees (those in master who are NOT in matchedKeys)
        for (const item of masterStudents) {
            const name = typeof item === 'string' ? item : `${item.firstName} ${item.lastName}`.trim();
            const key = name.trim().toLowerCase();
            const aliasKey = (typeof item === 'object' && item && item.alias) ? item.alias.trim().toLowerCase() : null;
            if (!matchedKeys.has(key) && (!aliasKey || !matchedKeys.has(aliasKey))) {
                absent.push(name.trim());
            }
        }

        return {
            matched: matched,
            unrecognized: unrecognized,
            absent: absent
        };
    }
};
