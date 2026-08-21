import { BodyCompositionRecord, Quarter } from '../types';

/**
 * Extracts Google Spreadsheet ID from a URL
 */
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match && match[1] ? match[1] : null;
}

/**
 * Normalizes and converts a Google Sheets URL into a direct CSV export endpoint
 */
export function convertGoogleSheetsUrlToCsvUrl(inputUrl: string, sheetNameOrGid?: string): string {
  const trimmed = inputUrl.trim();

  // If already an Apps Script endpoint or direct CSV link
  if (trimmed.includes('script.google.com') || (trimmed.endsWith('.csv') && !sheetNameOrGid)) {
    return trimmed;
  }

  const spreadsheetId = extractSpreadsheetId(trimmed);
  if (spreadsheetId) {
    if (sheetNameOrGid) {
      // If it's a numeric gid
      if (/^\d+$/.test(sheetNameOrGid)) {
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetNameOrGid}`;
      }
      // Use GViz query endpoint to fetch specific sheet tab by name
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetNameOrGid)}`;
    }

    // Default gid if present in URL
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gidParam = gidMatch && gidMatch[1] ? `&gid=${gidMatch[1]}` : '&gid=0';
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gidParam}`;
  }

  return trimmed;
}

/**
 * Detects Quarter ('Q1' | 'Q2' | 'Q3') from a tab name, filename, or text
 */
export function detectQuarterFromName(name: string): Quarter | undefined {
  if (!name) return undefined;
  const n = name.trim().toLowerCase();

  if (n.includes('q1') || n.includes('ไตรมาส 1') || n.includes('ไตรมาส1') || n.includes('รอบ 1') || n.includes('รอบ1') || n.includes('quarter 1') || n.includes('quarter1') || n === '1') {
    return 'Q1';
  }
  if (n.includes('q2') || n.includes('ไตรมาส 2') || n.includes('ไตรมาส2') || n.includes('รอบ 2') || n.includes('รอบ2') || n.includes('quarter 2') || n.includes('quarter2') || n === '2') {
    return 'Q2';
  }
  if (n.includes('q3') || n.includes('ไตรมาส 3') || n.includes('ไตรมาส3') || n.includes('รอบ 3') || n.includes('รอบ3') || n.includes('quarter 3') || n.includes('quarter3') || n === '3') {
    return 'Q3';
  }

  return undefined;
}

/**
 * Smartly parse CSV / TSV text containing Health & Wellness body composition records.
 * Supports Thai & English headers, multiple delimiters, and optional fallbackQuarter.
 */
export function parseHealthRecordsCsv(csvText: string, fallbackQuarter?: Quarter): BodyCompositionRecord[] {
  if (!csvText || !csvText.trim()) return [];

  // Normalize line endings
  const rawLines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);

  if (lines.length <= 1) return [];

  // Detect delimiter: comma, tab, or semicolon
  const headerLine = lines[0];
  let delimiter = ',';
  if (headerLine.includes('\t')) delimiter = '\t';
  else if (headerLine.includes(';') && !headerLine.includes(',')) delimiter = ';';

  // Helper to split a line safely regarding quotes
  const splitLine = (line: string): string[] => {
    if (delimiter === '\t') {
      return line.split('\t').map((s) => s.replace(/^["']|["']$/g, '').trim());
    }

    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        tokens.push(current.replace(/^["']|["']$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }
    tokens.push(current.replace(/^["']|["']$/g, '').trim());
    return tokens;
  };

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s_#%.-]/g, ''));

  // Find column indices with Thai and English aliases
  const findIndex = (aliases: string[]) => {
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (aliases.some((alias) => h === alias || h.includes(alias))) {
        return i;
      }
    }
    return -1;
  };

  const idxPerson = findIndex(['personid', 'id', 'รหัส', 'รหัสพนักงาน', 'person', 'pid', 'no', 'ลำดับ']);
  const idxQuarter = findIndex(['quarter', 'ไตรมาส', 'งวด', 'q', 'รอบ', 'period']);
  const idxHeight = findIndex(['height', 'ส่วนสูง', 'ความสูง', 'ht', 'cm']);
  const idxWeight = findIndex(['weight', 'น้ำหนัก', 'wt', 'kg']);
  const idxMuscle = findIndex(['musclemass', 'muscle', 'มวลกล้ามเนื้อ', 'กล้ามเนื้อ', 'smm']);
  const idxBmi = findIndex(['bmi', 'ดัชนีมวลกาย']);
  const idxFatPct = findIndex(['bodyfatpercentage', 'bodyfat', 'fatpercentage', 'fatpct', 'เปอร์เซ็นต์ไขมัน', 'ไขมัน%', '%ไขมัน', 'pbf', 'fat%']);
  const idxFatMass = findIndex(['fatmass', 'มวลไขมัน', 'ไขมัน(kg)', 'ไขมันkg', 'fm']);
  const idxVisceral = findIndex(['visceral_fat', 'visceralfat', 'visceral', 'ไขมันช่องท้อง', 'ช่องท้อง', 'vfl']);
  const idxDept = findIndex(['department', 'dept', 'แผนก', 'ฝ่าย', 'สำนัก', 'กอง', 'หน่วยงาน']);
  const idxGender = findIndex(['gender', 'sex', 'เพศ']);
  const idxAge = findIndex(['age', 'อายุ']);

  const records: BodyCompositionRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = splitLine(lines[i]);
    if (parts.length < 2) continue;

    // Person ID
    let personId = idxPerson !== -1 ? parts[idxPerson] : parts[0];
    personId = String(personId || '').trim();
    if (!personId || personId === '#N/A' || personId === 'null' || personId.toLowerCase() === 'person_id') continue;

    // Quarter extraction
    let quarter: Quarter = fallbackQuarter || 'Q3';
    if (idxQuarter !== -1 && parts[idxQuarter]) {
      const qRaw = parts[idxQuarter].toUpperCase().trim();
      if (qRaw.includes('Q1') || qRaw === '1' || qRaw.includes('ไตรมาส 1') || qRaw.includes('ไตรมาส1')) {
        quarter = 'Q1';
      } else if (qRaw.includes('Q2') || qRaw === '2' || qRaw.includes('ไตรมาส 2') || qRaw.includes('ไตรมาส2')) {
        quarter = 'Q2';
      } else if (qRaw.includes('Q3') || qRaw === '3' || qRaw.includes('ไตรมาส 3') || qRaw.includes('ไตรมาส3')) {
        quarter = 'Q3';
      }
    }

    // Parse numeric values safely
    const parseNum = (val: string | undefined): number | null => {
      if (!val || val === '#N/A' || val === 'null' || val === '-' || val === '') return null;
      const clean = val.replace(/,/g, '').replace(/%/g, '').trim();
      const n = parseFloat(clean);
      return isNaN(n) ? null : n;
    };

    const height = idxHeight !== -1 ? parseNum(parts[idxHeight]) : 160;
    const weight = idxWeight !== -1 ? parseNum(parts[idxWeight]) : null;
    const muscle = idxMuscle !== -1 ? parseNum(parts[idxMuscle]) : null;
    let bmi = idxBmi !== -1 ? parseNum(parts[idxBmi]) : null;
    const fatPct = idxFatPct !== -1 ? parseNum(parts[idxFatPct]) : null;
    let fatMass = idxFatMass !== -1 ? parseNum(parts[idxFatMass]) : null;
    let visceral = idxVisceral !== -1 ? parseNum(parts[idxVisceral]) : null;
    const department = idxDept !== -1 ? parts[idxDept] : undefined;

    // Calculate BMI if missing
    if (bmi === null && height && weight && height > 0) {
      bmi = Number((weight / ((height / 100) ** 2)).toFixed(2));
    }

    // Calculate Fat Mass if missing
    if (fatMass === null && weight !== null && fatPct !== null) {
      fatMass = Number((weight * (fatPct / 100)).toFixed(1));
    }

    // Calculate Visceral Fat proxy if missing
    if (visceral === null && bmi !== null && fatPct !== null) {
      visceral = Math.max(1, Math.round((bmi - 18) * 0.45 + (fatPct - 15) * 0.22 + 1));
    }

    // Skip empty dummy rows
    if (weight === null && muscle === null && bmi === null && fatPct === null) {
      continue;
    }

    records.push({
      person_id: personId,
      quarter,
      height,
      weight,
      muscle_mass: muscle,
      bmi,
      body_fat_percentage: fatPct,
      fat_mass: fatMass,
      visceral_fat: visceral,
      department,
    });
  }

  return records;
}

/**
 * Result structure for multi-sheet fetch
 */
export interface MultiSheetFetchResult {
  records: BodyCompositionRecord[];
  fetchedTabs: string[];
  quarterCounts: { Q1: number; Q2: number; Q3: number };
  errors: string[];
}

/**
 * Automatically probes and fetches all sheets/tabs from a Google Spreadsheet or Apps Script Web App
 */
export async function fetchAllSheetsFromSpreadsheet(
  inputUrl: string,
  userTabNames?: string[],
  onProgress?: (msg: string) => void
): Promise<MultiSheetFetchResult> {
  const trimmed = inputUrl.trim();
  const spreadsheetId = extractSpreadsheetId(trimmed);

  const result: MultiSheetFetchResult = {
    records: [],
    fetchedTabs: [],
    quarterCounts: { Q1: 0, Q2: 0, Q3: 0 },
    errors: [],
  };

  const recordMap = new Map<string, BodyCompositionRecord>();

  const addRecords = (recs: BodyCompositionRecord[], tabLabel: string) => {
    recs.forEach((r) => {
      const key = `${r.person_id}_${r.quarter}`;
      recordMap.set(key, r);
    });
    if (recs.length > 0 && !result.fetchedTabs.includes(tabLabel)) {
      result.fetchedTabs.push(tabLabel);
    }
  };

  // Case 1: Google Apps Script Web App or direct JSON/CSV endpoint
  if (trimmed.includes('script.google.com') || (!spreadsheetId && trimmed.startsWith('http'))) {
    onProgress?.('กำลังดึงข้อมูลจาก Apps Script Web App...');
    try {
      const res = await fetch(trimmed);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const json = JSON.parse(text);
        const list: BodyCompositionRecord[] = Array.isArray(json.records) ? json.records : Array.isArray(json) ? json : [];
        addRecords(list, 'AppsScript WebApp');
      } else {
        const list = parseHealthRecordsCsv(text);
        addRecords(list, 'CSV Endpoint');
      }
    } catch (err: any) {
      result.errors.push(`Apps Script fetch failed: ${err.message}`);
    }
  } else if (spreadsheetId) {
    // Case 2: Direct Google Spreadsheet with multiple tabs (Q1, Q2, Q3, etc.)
    // Build list of sheet tab candidates
    let tabCandidates: string[] = [];

    if (userTabNames && userTabNames.length > 0) {
      tabCandidates = userTabNames.map((t) => t.trim()).filter(Boolean);
    } else {
      // Common standard tab names in Thai and English
      tabCandidates = [
        'Q1', 'Q2', 'Q3',
        'ไตรมาส 1', 'ไตรมาส 2', 'ไตรมาส 3',
        'ไตรมาส1', 'ไตรมาส2', 'ไตรมาส3',
        'Quarter 1', 'Quarter 2', 'Quarter 3',
        'Quarter1', 'Quarter2', 'Quarter3',
        'Sheet1', 'Sheet2', 'Sheet3',
        'รอบที่ 1', 'รอบที่ 2', 'รอบที่ 3',
      ];
    }

    onProgress?.(`กำลังค้นหาและดึงข้อมูลทุกชีท (${tabCandidates.length} รูปแบบชื่อแท็บ)...`);

    // Fetch tab candidates using Google Visualization query API
    const fetchPromises = tabCandidates.map(async (tabName) => {
      const fallbackQuarter = detectQuarterFromName(tabName);
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;

      try {
        const res = await fetch(csvUrl);
        if (!res.ok) return null;
        const text = await res.text();

        // If sheet does not exist, gviz often returns an HTML error or empty response
        if (!text || text.includes('google.visualization.Query.setResponse') || text.includes('Error in query') || text.startsWith('<!DOCTYPE')) {
          return null;
        }

        const parsed = parseHealthRecordsCsv(text, fallbackQuarter);
        if (parsed.length > 0) {
          return { tabName, records: parsed };
        }
      } catch {
        // Tab probably does not exist or fetch restricted
        return null;
      }
      return null;
    });

    const results = await Promise.all(fetchPromises);

    results.forEach((item) => {
      if (item && item.records.length > 0) {
        addRecords(item.records, item.tabName);
      }
    });

    // If still no records or missing quarters, fallback to direct gid exports (gid=0, gid=1, gid=2)
    if (recordMap.size === 0) {
      onProgress?.('กำลังลองดึงผ่าน Sheet GID (แท็บเริ่มต้น)...');
      const gidList = ['0', '1', '2', '3', '4'];
      for (const gid of gidList) {
        try {
          const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
          const res = await fetch(exportUrl);
          if (res.ok) {
            const text = await res.text();
            if (text && !text.startsWith('<!DOCTYPE')) {
              const defaultQ: Quarter = gid === '0' ? 'Q1' : gid === '1' ? 'Q2' : gid === '2' ? 'Q3' : 'Q3';
              const parsed = parseHealthRecordsCsv(text, defaultQ);
              if (parsed.length > 0) {
                addRecords(parsed, `gid=${gid}`);
              }
            }
          }
        } catch {
          // ignore gid miss
        }
      }
    }
  }

  // Compile final array & quarter counts
  result.records = Array.from(recordMap.values());
  result.records.forEach((r) => {
    if (r.quarter === 'Q1') result.quarterCounts.Q1++;
    else if (r.quarter === 'Q2') result.quarterCounts.Q2++;
    else if (r.quarter === 'Q3') result.quarterCounts.Q3++;
  });

  return result;
}
