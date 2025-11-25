/**
 * File parser utilities for intent import
 * Supports CSV, TSV, TXT, XLS, XLSX formats
 */

export type ParsedRow = {
    rawName?: string;
    name: string;
    examples: string[];
    response?: string;
    status?: 'pending' | 'success' | 'error';
    error?: string;
    validationError?: string;
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
    } else {
        // Treat as CSV/TSV/TXT
        const text = await file.text();
        return await parseCSV(text);
    }
}
