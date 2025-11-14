import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { intentService } from "@/features/intents/api/service";

type Row = { name: string; examples: string };

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
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        // if first row looks like a header (contains 'intent' and/or 'example'), skip it
        if (lines.length > 0) {
            const firstParts = lines[0].split(/\t|,/).map((p) => p.trim().toLowerCase());
            const first0 = firstParts[0] || "";
            const first1 = firstParts[1] || "";
            if (/(intent|intentname|intent_name)/i.test(first0) || /example(s)?/i.test(first1)) {
                lines.shift();
            }
        }
        const out = lines.map((line) => {
            const parts = line.split(/\t|,/);
            const rawName = parts[0]?.trim() || "";
            const name = formatIntentName(rawName);
            const examples = parts[1]?.trim() || "";
            // ignore additional columns when importing; only use first two columns
            return { name, examples } as Row;
        });
        return out;
    };

    const parseXLSX = async (file: File) => {
        const XLSX = await import("xlsx");
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(firstSheet);
        return parseCSV(csv);
    };

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
                const intentPayload = {
                    name: row.name,
                    description: "",
                    define: row.examples.split(";").map((s) => `- ${s.trim()}`).join("\n"),
                    entities: [],
                };
                await intentService.createIntent(intentPayload as any);
            } catch (err) {
                console.error("Row import error", row, err);
            }
            setProgress((p) => ({ ...p, done: p.done + 1 }));
        }

        toast.success(`Imported ${toImport.length} intents`);
        setIsImporting(false);
        navigate("/");
    };

    const downloadTemplate = async () => {
        // Try to create an .xlsx if xlsx is available, otherwise fallback to CSV
        try {
            const XLSX = await import("xlsx");
            const wsData = [
                ["intentName", "examples"],
                [
                    "hoi dap ve truong",
                    "xin chao;toi muon hoi",
                ],
            ];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            // set column widths: first two reasonably sized
            ws["!cols"] = [{ wch: 20 }, { wch: 40 }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "template");
            // Add a README sheet so Excel users see instructions immediately
            const readme = [
                ["Instructions"],
                [""],
                ["Import intents using the following format:"],
                ["- Column 1: intentName (will be normalized to lowercase_with_underscores)."],
                ["- Column 2: examples (examples separated by ';')."],
                ["- Note: The importer will skip the first row if it looks like a header (intentName, examples)."],
                ["- We recommend using XLSX to preserve formatting and instructions."],
            ];
            const wsReadme = XLSX.utils.aoa_to_sheet(readme);
            XLSX.utils.book_append_sheet(wb, wsReadme, "README");
            const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([buf], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "intent_import_template.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            return;
        } catch (err) {
            // fallback to CSV
        }

        const escapeCell = (v: any) => {
            const s = String(v ?? "");
            return `"${s.replace(/"/g, '""')}"`;
        };
        const csvRows = [
            ["intentName", "examples"],
            [
                "hoi dap ve truong",
                "xin chao;toi muon hoi",
            ],
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
            "Import intents using the following format:",
            "- Column 1: intentName (will be normalized to lowercase_with_underscores)",
            "- Column 2: examples (examples separated by ';')",
            "- The first row will be skipped if it looks like a header",
            "- We recommend using XLSX to preserve formatting and instructions",
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
