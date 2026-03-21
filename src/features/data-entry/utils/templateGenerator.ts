/**
 * Template file generation utilities
 * Generates XLSX and CSV templates for intent import
 */

import { generateTemplateWorkbook } from './excel.utils';

/**
 * Generate Excel template file with proper formatting
 * Creates two sheets: template and README
 */
export async function generateXLSXTemplate(): Promise<void> {
    try {
        const buffer = await generateTemplateWorkbook();
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        downloadFile(blob, 'intent_import_template.xlsx');
    } catch (err) {
        console.error('ExcelJS template generation failed', err);
        throw err;
    }
}

/**
 * Generate YAML template for Rasa NLU format
 */
export function generateYAMLTemplate(): void {
    const yaml = `version: "3.1"
nlu:
  - intent: ask_program
    examples: |
      - KMA có chương trình đào tạo nào?
      - Các ngành học tại KMA là gì?
      - KMA cơ các chương trình cử nhân và thạc sĩ không?
      - Chương trình học của KMA bao gồm những gì?

  - intent: ask_admission
    examples: |
      - Làm thế nào để đăng ký vào KMA?
      - KMA yêu cầu gì khi nộp hồ sơ?
      - Tôi cần làm gì để đăng ký tuyển sinh KMA?
      - Khi nào tôi có thể đăng ký?

  - intent: ask_criteria
    examples: |
      - KMA có yêu cầu gì về điểm số để nhập học không?
      - Điều kiện xét tuyển vào KMA là gì?
      - Có cần thi đầu vào không?
      - KMA yêu cầu trình độ học vấn như thế nào?

  - intent: ask_deadline
    examples: |
      - Hạn cuối để nộp hồ sơ là khi nào?
      - Khi nào là ngày cuối cùng để nộp đơn?
      - KMA có hạn nộp hồ sơ không?

  - intent: greet
    examples: |
      - Xin chào
      - Chào bạn
      - Hi
      - Chào

  - intent: goodbye
    examples: |
      - Tạm biệt
      - Hẹn gặp lại
      - Chào nhé
      - See you
`;

    const blob = new Blob([yaml], { type: "text/yaml;charset=utf-8;" });
    downloadFile(blob, "nlu_template.yaml");
}

/**
 * Generate CSV template as fallback
 * Simpler format without styling
 */
export function generateCSVTemplate(): void {
    const escapeCell = (v: any) => {
        const s = String(v ?? "");
        return `"${s.replace(/"/g, '""')}"`;
    };

    // CSV uses the same two-header-row format with STT as first column
    const csvRows = [
        ["STT", "VÍ DỤ MẪU", ""],
        ["", "Câu hỏi", "Câu trả lời"],
        [
            "1",
            "Cháy là gì",
            "Theo Khoản 1 Điều 2, Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ 2024 ..."
        ],
    ];

    const csv = csvRows.map(r => r.map(escapeCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadFile(blob, "intent_import_template.csv");

    // Also provide instructions as separate text file
    const instructions = [
        "Hướng dẫn import / Import instructions:",
        "- Bỏ qua 2 dòng đầu tiên (title + header).",
        "- Cột A: STT (bỏ qua khi import).",
        "- Cột B: Câu hỏi (sẽ được dùng làm tên intent, sẽ được chuẩn hóa).",
        "- Cột C: Câu trả lời (sẽ được dùng làm nội dung response).",
        "- Nếu muốn nhiều ví dụ cho intent, tách các ví dụ bởi ';' trong cùng 1 ô.",
    ].join("\r\n");

    const txtBlob = new Blob([instructions], { type: "text/plain;charset=utf-8;" });
    downloadFile(txtBlob, "intent_import_instructions.txt");
}

/**
 * Generate template file - tries XLSX first, falls back to CSV or YAML
 * Can generate different formats based on parameter
 */
export async function generateTemplate(format: 'xlsx' | 'csv' | 'yaml' = 'xlsx'): Promise<void> {
    try {
        if (format === 'xlsx') {
            await generateXLSXTemplate();
        } else if (format === 'yaml') {
            generateYAMLTemplate();
        } else {
            generateCSVTemplate();
        }
    } catch (err) {
        console.error(`${format} generation failed`, err);
        if (format === 'xlsx') {
            generateCSVTemplate();
        }
    }
}

/**
 * Helper function to trigger file download in browser
 */
function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
