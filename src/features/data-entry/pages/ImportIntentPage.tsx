import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { intentService } from "@/features/intents/api/service";
import { responseService } from "@/features/reponses/api/service";
import { storyService } from "@/features/stories/api/service";

type Row = { rawName?: string; name: string; examples: string; response?: string };

function formatIntentName(input?: string) {
    if (!input) return "";
    // remove diacritics, convert to lowercase, replace non-alphanumeric with underscore
    const cleaned = input
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^\p{L}\p{N}]+/gu, "_")
        .replace(/^_+|_+$/g, "")
        .replace(/_+/g, "_")
        .toLowerCase();
    return cleaned;
}

export function ImportIntentPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [rows, setRows] = useState<Row[]>([]);
    const [selected, setSelected] = useState<Record<number, boolean>>({});
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Back should return to the Create Data page
    const handleCancel = () => navigate("/add-data");

    const parseCSV = async (text: string) => {
        const linesAll = text.split(/\r?\n/);
        // remove fully empty lines
        const lines = linesAll.map((l) => l.replace(/\u00A0/g, ' ').trimRight());

        // Heuristic: if the first row contains header words (e.g., 'STT', 'Câu hỏi', 'Câu trả lời' or 'intent'), skip first 1-2 rows
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

        const out: Row[] = [];
        for (let i = startRow; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(/\t|,/).map((p) => p.trim());
            // If file has an index column (STT) as first column, skip it and take columns 2 and 3
            const rawName = parts[1] ?? parts[0] ?? '';
            const responseText = parts[2] ?? parts[1] ?? '';
            const name = formatIntentName(rawName || parts[1] || parts[0] || '');
            out.push({ rawName, name, examples: responseText, response: responseText });
        }
        return out;
    };

    const parseXLSX = async (file: File) => {
        // Use exceljs to read XLSX so we keep consistency with template generation
        // @ts-ignore - optional runtime dependency, types may not be available in this environment
        const ExcelJS = await import('exceljs');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.worksheets[0];
        const out: Row[] = [];
        // ExcelJS rows are 1-indexed. Skip first two rows per requirement.
        worksheet.eachRow((row: any, rowNumber: number) => {
            if (rowNumber <= 2) return;
            // read columns B and C (2 and 3)
            const rawColB = (row.getCell(2).value ?? '').toString().trim();
            const rawColC = (row.getCell(3).value ?? '').toString().trim();
            if (!rawColB && !rawColC) return;
            const name = formatIntentName(rawColB || rawColC || '');
            out.push({ rawName: rawColB, name, examples: rawColC, response: rawColC });
        });
        return out;
    };

    function buildStoryDefine(storyName: string, steps: Array<{ intentId?: string; actionId?: string }>) {
        const lines: string[] = [];
        lines.push(`- story: ${storyName}`);
        lines.push(`  steps:`);
        steps.forEach((s) => {
            if (s.intentId) lines.push(`  - intent: [${s.intentId}]`);
            if (s.actionId) lines.push(`  - action: [${s.actionId}]`);
        });
        return lines.join("\n");
    }

    const handleParseFile = async (f: File) => {
        setFile(f);
        setIsParsing(true);
        try {
            let parsed: Row[] = [];
            const name = (f.name || "").toLowerCase();
            if (name.endsWith(".xls") || name.endsWith(".xlsx")) {
                try {
                    parsed = await parseXLSX(f);
                } catch (err) {
                    console.error("XLSX parse error", err);
                    toast.error("Failed to parse Excel file. Make sure 'xlsx' is installed.");
                    setIsParsing(false);
                    return;
                }
            } else {
                const text = await f.text();
                parsed = await parseCSV(text);
            }

            setRows(parsed);
            // mark all selected by default
            const sel: Record<number, boolean> = {};
            parsed.forEach((_, i) => (sel[i] = true));
            setSelected(sel);
        } catch (err) {
            console.error(err);
            toast.error("Failed to parse file");
        } finally {
            setIsParsing(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            const f = e.dataTransfer.files[0];
            await handleParseFile(f);
        }
    };

    const handleClickChoose = () => {
        inputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) await handleParseFile(f);
    };

    const handleToggle = (index: number) => {
        setSelected((s) => ({ ...s, [index]: !s[index] }));
    };

    const handleImport = async () => {
        const toImport = rows.filter((_, i) => selected[i]);
        if (toImport.length === 0) return toast.error("No rows selected");
        setIsImporting(true);
        setProgress({ done: 0, total: toImport.length });

        for (let i = 0; i < toImport.length; i++) {
            const row = toImport[i];
            try {
                // Create intent
                const intentPayload = {
                    name: row.name,
                    description: row.rawName || "",
                    define: (function buildIntentDefine(intentName: string, examplesText: string) {
                        const examples = examplesText
                            ? examplesText.split(";").map((s) => `- ${s.trim()}`).join("\n")
                            : "";
                        const lines: string[] = [];
                        lines.push(`- intent: ${intentName}`);
                        lines.push(`  examples: |`);
                        if (examples) {
                            examples.split('\n').forEach((ln) => lines.push(`    ${ln}`));
                        }
                        return lines.join("\n");
                    })(row.name, row.examples),
                    entities: [],
                };
                const createdIntent = await intentService.createIntent(intentPayload as any);

                // Create response if we have response text
                let createdResponse = null;
                if (row.response && row.response.trim()) {
                    const respName = `utter_${createdIntent.name || createdIntent._id}`;
                    const responsePayload = {
                        name: respName,
                        description: "",
                        define: (function buildResponseDefine(responseName: string, responseText: string) {
                            const textBlock = responseText ? responseText.trim().split('\n').map((ln) => `      ${ln}`).join('\n') : "";
                            const lines: string[] = [];
                            lines.push(`${responseName}:`);
                            lines.push(`  - text: |`);
                            if (textBlock) {
                                lines.push(textBlock);
                            }
                            return lines.join("\n");
                        })(respName, row.response.trim()),
                    };
                    createdResponse = await responseService.createResponse(responsePayload as any);
                }

                // Create story linking the created intent and response
                const storyName = `story_for_${createdIntent.name || createdIntent._id}`;
                const steps: Array<{ intentId?: string; actionId?: string }> = [{ intentId: createdIntent._id }];
                if (createdResponse) steps.push({ actionId: createdResponse._id });

                const storyPayload = {
                    name: storyName,
                    description: "",
                    define: buildStoryDefine(storyName, steps),
                    intents: [createdIntent._id],
                    responses: createdResponse ? [createdResponse._id] : [],
                    action: [],
                    entities: [],
                    slots: [],
                    roles: [],
                };

                await storyService.createStory(storyPayload as any);
            } catch (err) {
                console.error("Row import error", row, err);
            }
            setProgress((p) => ({ ...p, done: p.done + 1 }));
        }

        toast.success(`Imported ${toImport.length} rows as stories`);
        setIsImporting(false);
        navigate("/");
    };

    const downloadTemplate = async () => {
        // Try to create an .xlsx if xlsx is available, otherwise fallback to CSV
        try {
            // Use exceljs for reliable styling and merge support
            // @ts-ignore - optional runtime import
            const ExcelJS = await import('exceljs');
            const workbook = new ExcelJS.Workbook();

            const ws = workbook.addWorksheet('template');

            // Row 1: STT | VÍ DỤ MẪU (merge B1:C1)
            ws.getRow(1).values = ['STT', 'VÍ DỤ MẪU', ''];
            // Row 2: header row
            ws.getRow(2).values = ['', 'Câu hỏi', 'Câu trả lời'];
            // Example data row
            ws.getRow(3).values = [1, 'Cháy là gì', 'Theo Khoản 1 Điều 2, Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ 2024 quy định: Cháy là phản ứng...'];

            // Merge B1:C1 and A1:A2
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
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
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

            // README sheet
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

            // Write workbook to buffer
            const buf = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buf], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'intent_import_template.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            return;
        } catch (err) {
            console.error('exceljs template generation failed', err);
            // fallback to CSV
        }

        const escapeCell = (v: any) => {
            const s = String(v ?? "");
            return `"${s.replace(/"/g, '""')}"`;
        };
        // CSV fallback uses the same two-header-row format with STT as first column
        const csvRows = [
            ["STT", "VÍ DỤ MẪU", ""],
            ["", "Câu hỏi", "Câu trả lời"],
            ["1", "Cháy là gì", "Theo Khoản 1 Điều 2, Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ 2024 ..."],
        ];
        const csv = csvRows.map(r => r.map(escapeCell).join(",")).join("\r\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "intent_import_template.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        // Also provide a small instructions .txt so users opening CSV can read guidance easily
        const instructions = [
            "Hướng dẫn import / Import instructions:",
            "- Bỏ qua 2 dòng đầu tiên (title + header).",
            "- Cột A: STT (bỏ qua khi import).",
            "- Cột B: Câu hỏi (sẽ được dùng làm tên intent, sẽ được chuẩn hóa).",
            "- Cột C: Câu trả lời (sẽ được dùng làm nội dung response).",
            "- Nếu muốn nhiều ví dụ cho intent, tách các ví dụ bởi ';' trong cùng 1 ô.",
        ].join("\r\n");
        const txtBlob = new Blob([instructions], { type: "text/plain;charset=utf-8;" });
        const txtUrl = URL.createObjectURL(txtBlob);
        const a2 = document.createElement("a");
        a2.href = txtUrl;
        a2.download = "intent_import_instructions.txt";
        document.body.appendChild(a2);
        a2.click();
        a2.remove();
        URL.revokeObjectURL(txtUrl);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold">Import intents from file</h1>
                    <div className="ml-auto">
                        <Button variant="outline" size="sm" onClick={downloadTemplate} className="ml-2">Download template</Button>
                    </div>
                </div>

                <div className="mb-6">
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="border-2 border-indigo-200 bg-white rounded-lg p-10 text-center cursor-pointer mb-4 shadow-sm hover:shadow-md"
                        onClick={handleClickChoose}
                        role="button"
                        aria-label="Drop files here or click to select"
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,.tsv,.txt,.xls,.xlsx"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <div className="text-xl font-semibold text-indigo-700">Drop anywhere to import</div>
                        <div className="mt-2 text-sm text-slate-500">Or select <button onClick={(e) => { e.stopPropagation(); handleClickChoose(); }} className="text-indigo-600 underline">files</button></div>
                        <div className="mt-3 text-sm text-slate-400">Supported: CSV, TSV, TXT, XLS, XLSX</div>
                    </div>
                </div>

                {isParsing && <div>Parsing file...</div>}

                {rows.length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-lg">Preview <span className="text-sm text-slate-400">({rows.length})</span></div>
                            <div className="text-sm text-slate-400">Progress: {progress.done}/{progress.total}</div>
                        </div>
                        <div className="overflow-auto max-h-72 border rounded">
                            <table className="w-full text-left divide-y">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 w-12">#</th>
                                        <th className="px-4 py-2 w-20">Import</th>
                                        <th className="px-4 py-2 w-56">Intent name</th>
                                        <th className="px-4 py-2 w-96">Examples</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r, i) => (
                                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                            <td className="px-4 py-2 align-top">{i + 1}</td>
                                            <td className="px-4 py-2 align-top">
                                                <input type="checkbox" className="accent-indigo-600" checked={!!selected[i]} onChange={() => handleToggle(i)} />
                                            </td>
                                            <td className="px-4 py-2 align-top font-medium">{r.name}</td>
                                            <td className="px-4 py-2 align-top whitespace-pre-wrap text-sm text-slate-600">{r.examples}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <Button onClick={handleImport} disabled={isImporting} className="bg-indigo-600 text-white hover:bg-indigo-700">{isImporting ? 'Importing...' : 'Import selected'}</Button>
                            <Button variant="ghost" onClick={() => { setRows([]); setFile(null); setSelected({}); }}>{'Cancel / Clear'}</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ImportIntentPage;
