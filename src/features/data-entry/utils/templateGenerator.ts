/**
 * Template file generation utilities
 * Generates XLSX and CSV templates for intent import
 */

/**
 * Generate Excel template file with proper formatting
 * Creates two sheets: template and README
 */
export async function generateXLSXTemplate(): Promise<void> {
    try {
        // Use exceljs for reliable styling and merge support
        // @ts-ignore - optional runtime import
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();

        // Main template sheet
        const ws = workbook.addWorksheet('template');

        // Row 1: STT | VÍ DỤ MẪU (merge B1:C1)
        ws.getRow(1).values = ['STT', 'VÍ DỤ MẪU', ''];
        // Row 2: header row
        ws.getRow(2).values = ['', 'Câu hỏi', 'Câu trả lời'];
        // Example data row
        ws.getRow(3).values = [
            1,
            'Cháy là gì',
            'Theo Khoản 1 Điều 2, Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ 2024 quy định: Cháy là phản ứng...'
        ];

        // Merge cells
        ws.mergeCells('B1:C1');
        ws.mergeCells('A1:A2');

        // Set column widths
        ws.columns = [
            { key: 'A', width: 6 },
            { key: 'B', width: 40 },
            { key: 'C', width: 100 },
        ];

        // Style first 2 rows (fill + alignment)
        for (let r = 1; r <= 2; r++) {
            const row = ws.getRow(r);
            for (let c = 1; c <= 3; c++) {
                const cell = row.getCell(c);
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFF00' },
                };
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle',
                    wrapText: true
                };
                cell.font = { bold: true };
            }
            row.height = 18;
        }

        // Add borders for first 3 rows
        for (let r = 1; r <= 3; r++) {
            const row = ws.getRow(r);
            for (let c = 1; c <= 3; c++) {
                const cell = row.getCell(c);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            }
        }

        // README sheet with instructions
        const readme = workbook.addWorksheet('README');
        const instructions = [
            ['Hướng dẫn / Instructions'],
            [''],
            ['File mẫu cho import dữ liệu (định dạng mẫu):'],
            ['- Dòng 1: Tiêu đề (VÍ DỤ MẪU).'],
            ['- Dòng 2: Header với các cột: STT | Câu hỏi | Câu trả lời'],
            ['- Dòng dữ liệu bắt đầu từ dòng 3: cột A = STT (số), cột B = Câu hỏi, cột C = Câu trả lời.'],
            ['- Import sẽ bỏ qua 2 dòng đầu tiên và bỏ cột A (STT).'],
            ['- Câu trả lời sẽ được dùng làm nội dung response; nếu cần nhiều ví dụ trong câu hỏi, tách bằng ";"'],
        ];
        instructions.forEach((r, i) => readme.getRow(i + 1).values = r);

        // Write workbook to buffer and download
        const buf = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buf], { type: 'application/octet-stream' });
        downloadFile(blob, 'intent_import_template.xlsx');
    } catch (err) {
        console.error('ExcelJS template generation failed', err);
        throw err;
    }
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
 * Generate template file - tries XLSX first, falls back to CSV
 */
export async function generateTemplate(): Promise<void> {
    try {
        await generateXLSXTemplate();
    } catch (err) {
        console.error('XLSX generation failed, falling back to CSV', err);
        generateCSVTemplate();
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
