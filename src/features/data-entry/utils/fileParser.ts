/**
 * File parser utilities for intent import
 * Supports CSV, TSV, TXT, XLS, XLSX formats
 */

export type ParsedRow = {
    rawName?: string;
    name: string;
    examples: string[];
    response?: string;
    responseContent?: string;
    status?: 'pending' | 'success' | 'error';
    error?: string;
    validationError?: string;
};

export type ResponseMap = {
    [utteranceName: string]: string;
};

/**
 * Format intent name to lowercase_with_underscores
 * Removes diacritics and special characters
 */
export function formatIntentName(input?: string): string {
    if (!input) return "";
    const cleaned = input
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^\p{L}\p{N}]+/gu, "_")
        .replace(/^_+|_+$/g, "")
        .replace(/_+/g, "_")
        .toLowerCase();
    return cleaned;
}

/**
 * Parse CSV/TSV/TXT file content
 * Automatically detects and skips header rows
 * Expects format: STT | Câu hỏi | Câu trả lời
 */
export async function parseCSV(text: string): Promise<ParsedRow[]> {
    const linesAll = text.split(/\r?\n/);
    // Remove fully empty lines and normalize whitespace
    const lines = linesAll.map((l) => l.replace(/\u00A0/g, ' ').trimRight());

    // Heuristic: if the first row contains header words, skip first 1-2 rows
    let startRow = 0;
    if (lines.length > 0) {
        const firstLower = (lines[0] || '').toLowerCase();
        if (/\b(stt|cau hoi|câu hỏi|intent|ví dụ|ví dụ mẫu|example)\b/.test(firstLower)) {
            startRow = 1;
            if (lines.length > 1) {
                const secondLower = (lines[1] || '').toLowerCase();
                if (/\b(cau hoi|câu hỏi|câu trả lời|question|answer|examples)\b/.test(secondLower)) {
                    startRow = 2;
                }
            }
        }
    }

    const out: ParsedRow[] = [];
    for (let i = startRow; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(/\t|,/).map((p) => p.trim());
        // If file has an index column (STT) as first column, skip it and take columns 2 and 3
        const rawName = parts[1] ?? parts[0] ?? '';
        const responseText = parts[2] ?? parts[1] ?? '';
        const name = formatIntentName(rawName || parts[1] || parts[0] || '');

        out.push({
            rawName,
            name,
            examples: [rawName],
            response: responseText
        });
    }

    return out;
}

/**
 * Parse response/utterances YAML file
 * Expects Rasa response format:
 * 
 * version: "3.1"
 * responses:
 *   utter_ask_program:
 *     - text: "KMA có các chương trình..."
 *   utter_ask_admission:
 *     - text: "Để đăng ký vào KMA..."
 */
export async function parseResponseYAML(text: string): Promise<ResponseMap> {
    const lines = text.split(/\r?\n/);
    const responseMap: ResponseMap = {};

    let currentUtter: string | null = null;
    let inResponsesSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        // Check if we're entering the responses section
        if (trimmed === 'responses:') {
            inResponsesSection = true;
            continue;
        }

        if (!inResponsesSection) continue;

        // Match utterance names (e.g., "utter_ask_program:")
        if (trimmed.match(/^[a-z_]+:$/) && trimmed.startsWith('utter_')) {
            currentUtter = trimmed.slice(0, -1);
            continue;
        }

        // Match text content (e.g., "- text: "...")
        if (currentUtter && trimmed.startsWith('- text:')) {
            const textMatch = trimmed.match(/^-\s+text:\s*["']?(.+?)["']?\s*$/);
            if (textMatch) {
                responseMap[currentUtter] = textMatch[1].trim();
            } else {
                // Multi-line text handling
                const simpleText = trimmed.substring(7).trim().replace(/^["']|["']$/g, '');
                if (simpleText) {
                    responseMap[currentUtter] = simpleText;
                }
            }
        }
    }

    if (Object.keys(responseMap).length === 0) {
        throw new Error("Không tìm thấy response nào trong file. Vui lòng kiểm tra định dạng file responses.");
    }

    return responseMap;
}

/**
 * Parse NLU YAML file content
 * Expects Rasa NLU format:
 * version: "3.1"
 * nlu:
 *   - intent: intent_name
 *     examples: |
 *       - example 1
 *       - example 2
 */
export async function parseYAML(text: string): Promise<ParsedRow[]> {
    const lines = text.split(/\r?\n/);
    const out: ParsedRow[] = [];

    let currentIntent: string | null = null;
    let currentExamples: string[] = [];
    let inNluSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        // Check if we're entering the nlu section
        if (trimmed === 'nlu:' || trimmed === 'nlu:' ) {
            inNluSection = true;
            continue;
        }

        // Skip if not in nlu section and we haven't started yet
        if (!inNluSection && !trimmed.startsWith('version:')) {
            continue;
        }

        // Match "- intent: intent_name" (can be indented)
        const intentMatch = trimmed.match(/^-\s+intent:\s*(.+)$/);
        if (intentMatch) {
            // Save previous intent if exists
            if (currentIntent && currentExamples.length > 0) {
                out.push({
                    rawName: currentIntent,
                    name: formatIntentName(currentIntent),
                    examples: currentExamples,
                });
            }
            currentIntent = intentMatch[1].trim();
            currentExamples = [];
            continue;
        }

        // Match "examples: |" or "examples: |-"
        if (trimmed.startsWith('examples:')) {
            // Just mark that examples are coming, examples will be on next lines
            continue;
        }

        // Match example lines "- example text" (can be indented)
        if (currentIntent && trimmed.startsWith('- ') && !trimmed.startsWith('- intent:')) {
            const exampleText = trimmed.substring(2).trim();
            if (exampleText) {
                currentExamples.push(exampleText);
            }
            continue;
        }

        // If we hit another intent or response section, save current
        if (trimmed.startsWith('- intent:') || trimmed.startsWith('responses:') || trimmed.startsWith('rules:') || trimmed.startsWith('stories:')) {
            if (currentIntent && currentExamples.length > 0) {
                out.push({
                    rawName: currentIntent,
                    name: formatIntentName(currentIntent),
                    examples: currentExamples,
                });
                currentIntent = null;
                currentExamples = [];
            }
        }
    }

    // Save last intent
    if (currentIntent && currentExamples.length > 0) {
        out.push({
            rawName: currentIntent,
            name: formatIntentName(currentIntent),
            examples: currentExamples,
        });
    }

    if (out.length === 0) {
        throw new Error("Không tìm thấy intent nào trong file YAML. Vui lòng kiểm tra định dạng file. Cần có cấu trúc: nlu: -> intent: -> examples:");
    }

    return out;
}

/**
 * Merge NLU data with Response data
 * Matches intent names with utter_<intent_name> in responses
 */
export function mergeNLUWithResponses(nlus: ParsedRow[], responses: ResponseMap): ParsedRow[] {
    return nlus.map((intent) => {
        const utterName = `utter_${intent.name}`;
        const responseContent = responses[utterName] || '';
        
        return {
            ...intent,
            responseContent: responseContent,
        };
    });
}

/**
 * Parse XLSX/XLS file using ExcelJS
 * Skips first 2 rows (title and header)
 * Expects format: STT | Câu hỏi | Câu trả lời
 */
export async function parseXLSX(file: File): Promise<ParsedRow[]> {
    // Dynamic import to avoid bundling if not needed
    // @ts-ignore - optional runtime dependency
    const ExcelJS = await import('exceljs');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

    const out: ParsedRow[] = [];
    // ExcelJS rows are 1-indexed. Skip first two rows per requirement.
    worksheet.eachRow((row: any, rowNumber: number) => {
        if (rowNumber <= 2) return;

        // Read columns B and C (2 and 3)
        const rawColB = (row.getCell(2).value ?? '').toString().trim();
        const rawColC = (row.getCell(3).value ?? '').toString().trim();

        if (!rawColB && !rawColC) return;

        const name = formatIntentName(rawColB || rawColC || '');
        out.push({
            rawName: rawColB,
            name,
            examples: [rawColB],
            response: rawColC
        });
    });

    return out;
}

/**
 * Main file parser - auto-detects format and parses accordingly
 */
export async function parseFile(file: File): Promise<ParsedRow[]> {
    const fileName = (file.name || "").toLowerCase();

    if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
        return await parseXLSX(file);
    } else if (fileName.endsWith(".yaml") || fileName.endsWith(".yml")) {
        const text = await file.text();
        return await parseYAML(text);
    } else {
        // Treat as CSV/TSV/TXT
        const text = await file.text();
        return await parseCSV(text);
    }
}
