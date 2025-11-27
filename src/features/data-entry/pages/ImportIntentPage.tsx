import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Pencil, Save, X, Sparkles, ChevronDown, ChevronRight, Upload, Database, FileUp } from "lucide-react";
import { toast } from "sonner";
import { intentService } from "@/features/intents/api/service";
import { responseService } from "@/features/reponses/api/service";
import { storyService } from "@/features/stories/api/service";
import { parseFile, formatIntentName, type ParsedRow } from "../utils/fileParser";
import { generateTemplate } from "../utils/templateGenerator";

type Row = ParsedRow;

export function ImportIntentPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [rows, setRows] = useState<Row[]>([]);
    const [selected, setSelected] = useState<Record<number, boolean>>({});
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [editingRow, setEditingRow] = useState<number | null>(null);
    const [editIntentName, setEditIntentName] = useState("");
    const [editAnswer, setEditAnswer] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
    const [editingExample, setEditingExample] = useState<{ rowIdx: number; exampleIdx: number } | null>(null);
    const [editExampleText, setEditExampleText] = useState("");
    const [generatingRowIdx, setGeneratingRowIdx] = useState<number | null>(null);
    const [hasImported, setHasImported] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Back should return to the Create Data page
    const handleCancel = () => navigate("/add-data");

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
            const parsed = await parseFile(f);

            setRows(parsed);
            // mark all selected by default
            const sel: Record<number, boolean> = {};
            parsed.forEach((_, i) => (sel[i] = true));
            setSelected(sel);
            setHasImported(false);
            // Hide file upload area after successful parse
            setFile(null);
            toast.success(`Đã đọc thành công ${parsed.length} dòng từ file ${f.name}`);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "Không thể đọc file";
            toast.error(`Lỗi khi đọc file: ${errorMessage}. Vui lòng kiểm tra định dạng file (Excel hoặc CSV).`);
            setFile(null);
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

    const toggleExpandRow = (index: number) => {
        setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const handleEditRow = (index: number) => {
        const row = rows[index];
        setEditingRow(index);
        setEditIntentName(row.name || "");
        setEditAnswer(row.response || "");
    };

    const handleSaveRow = (index: number) => {
        const newName = editIntentName.trim();
        if (!newName) {
            return toast.error("Tên intent không được để trống");
        }
        // Check for duplicate intent name
        const isDuplicate = rows.some((r, i) => i !== index && r.name === newName);
        if (isDuplicate) {
            return toast.error("Tên intent bị trùng. Vui lòng đặt tên khác.");
        }
        setRows((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                name: newName,
                response: editAnswer.trim(),
            };
            return updated;
        });
        setEditingRow(null);
        toast.success("Đã cập nhật");
    };

    const handleCancelEdit = () => {
        setEditingRow(null);
    };

    const handleDeleteRow = (index: number) => {
        setRows((prev) => prev.filter((_, i) => i !== index));
        setSelected((prev) => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
        });
        toast.success("Đã xóa");
    };

    const handleEditExample = (rowIdx: number, exampleIdx: number) => {
        setEditingExample({ rowIdx, exampleIdx });
        setEditExampleText(rows[rowIdx].examples[exampleIdx] || "");
    };

    const handleSaveExample = () => {
        if (!editingExample) return;
        if (!editExampleText.trim()) {
            return toast.error("Ví dụ không được để trống");
        }
        const { rowIdx, exampleIdx } = editingExample;
        setRows((prev) => {
            const updated = [...prev];
            const newExamples = [...updated[rowIdx].examples];
            newExamples[exampleIdx] = editExampleText.trim();
            updated[rowIdx] = {
                ...updated[rowIdx],
                examples: newExamples,
                validationError: undefined // Clear validation error
            };
            return updated;
        });
        setEditingExample(null);
        toast.success("Đã cập nhật ví dụ");
    };

    const handleCancelEditExample = () => {
        setEditingExample(null);
    };

    const handleDeleteExample = (rowIdx: number, exampleIdx: number) => {
        setRows((prev) => {
            const updated = [...prev];
            const newExamples = updated[rowIdx].examples.filter((_, i) => i !== exampleIdx);
            if (newExamples.length === 0) {
                return toast.error("Phải có ít nhất 1 ví dụ"), prev;
            }
            updated[rowIdx] = { ...updated[rowIdx], examples: newExamples };
            return updated;
        });
        toast.success("Đã xóa ví dụ");
    };

    const handleGenerateExamplesForRow = async (rowIdx: number) => {
        if (generatingRowIdx !== null) return;
        const row = rows[rowIdx];
        if (!row.examples[0] || !row.response) {
            return toast.error("Cần có câu hỏi và câu trả lời để tạo ví dụ");
        }

        setGeneratingRowIdx(rowIdx);
        try {
            const payload = { example: row.examples[0], num: 5, response: row.response };
            const gen = await intentService.geminiExamples(payload);
            const genAny: any = gen;
            const returnedExamples: string[] = Array.isArray(genAny)
                ? genAny
                : (Array.isArray(genAny?.data?.examples) ? genAny.data.examples : []);

            if (!returnedExamples || returnedExamples.length === 0) {
                return toast.error("Không có ví dụ nào được tạo");
            }

            // Add new examples to this row
            setRows((prev) => {
                const updated = [...prev];
                const newExamples = [...updated[rowIdx].examples, ...returnedExamples.map(ex => ex.trim())];
                // Deduplicate
                const uniqueExamples = Array.from(new Set(newExamples));
                updated[rowIdx] = {
                    ...updated[rowIdx],
                    examples: uniqueExamples,
                    validationError: undefined // Clear validation error when examples are added
                };
                return updated;
            });

            // Auto-expand this row
            setExpandedRows((prev) => ({ ...prev, [rowIdx]: true }));
            toast.success(`Đã thêm ${returnedExamples.length} ví dụ mới`);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi tạo ví dụ tự động");
        } finally {
            setGeneratingRowIdx(null);
        }
    };

    const handleGenerateIntents = async () => {
        if (rows.length === 0) {
            return toast.error("Vui lòng import file trước");
        }
        if (isGenerating) return;

        setIsGenerating(true);
        try {
            // Use first row as seed example
            const seed = rows[0].rawName || "";
            const seedResponse = rows[0].response || "";

            if (!seed.trim() || !seedResponse.trim()) {
                return toast.error("Dòng đầu tiên cần có đầy đủ câu hỏi và câu trả lời");
            }

            const payload = { example: seed, num: 5, response: seedResponse };
            const gen = await intentService.geminiExamples(payload);
            const genAny: any = gen;
            const returnedExamples: string[] = Array.isArray(genAny)
                ? genAny
                : (Array.isArray(genAny?.data?.examples) ? genAny.data.examples : []);

            if (!returnedExamples || returnedExamples.length === 0) {
                return toast.error("Không có ví dụ nào được tạo");
            }

            // Add generated examples as new rows
            const newRows: Row[] = returnedExamples.map((ex) => ({
                rawName: ex.trim(),
                name: formatIntentName(ex.trim()),
                examples: [ex.trim()],
                response: seedResponse, // Use same response as seed
            }));

            setRows((prev) => [...prev, ...newRows]);

            // Auto-select new rows
            setSelected((prev) => {
                const updated = { ...prev };
                newRows.forEach((_, i) => {
                    updated[rows.length + i] = true;
                });
                return updated;
            });

            toast.success(`Đã tạo ${returnedExamples.length} intent mới`);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi tạo intent tự động");
        } finally {
            setIsGenerating(false);
        }
    };

    function buildIntentDefine(intentName: string, examplesArr: string[]) {
        const examplesBlock = examplesArr.length
            ? examplesArr.map((s) => `- ${s.trim()}`).join("\n")
            : "";
        const lines: string[] = [];
        lines.push(`- intent: ${intentName}`);
        lines.push(`  examples: |`);
        if (examplesBlock) {
            examplesBlock.split('\n').forEach((ln) => lines.push(`    ${ln}`));
        }
        return lines.join("\n");
    }

    function buildResponseDefine(responseName: string, responseText: string) {
        const textBlock = responseText ? responseText.trim().split('\n').map((ln) => `      ${ln}`).join('\n') : "";
        const lines: string[] = [];
        lines.push(`${responseName}:`);
        lines.push(`  - text: |`);
        if (textBlock) {
            lines.push(textBlock);
        }
        return lines.join("\n");
    }

    const handleImport = async () => {
        const toImport = rows.filter((_, i) => selected[i] && rows[i].status !== 'success');
        if (toImport.length === 0) return toast.error("Chưa chọn dòng nào để import");

        // Validate each row has at least 5 examples BEFORE any state update
        const invalidRows: number[] = [];
        toImport.forEach((row) => {
            const actualIdx = rows.findIndex(r => r === row);
            if (row.examples.filter(ex => ex.trim()).length < 5) {
                invalidRows.push(actualIdx);
            }
        });

        if (invalidRows.length > 0) {
            // Mark validation errors in state
            setRows((prev) => {
                const updated = [...prev];
                invalidRows.forEach(idx => {
                    updated[idx] = {
                        ...updated[idx],
                        validationError: `Cần ít nhất 5 ví dụ (hiện tại: ${updated[idx].examples.filter(ex => ex.trim()).length})`
                    };
                });
                return updated;
            });

            // Auto expand invalid rows to show examples
            setExpandedRows((prev) => {
                const updated = { ...prev };
                invalidRows.forEach(idx => updated[idx] = true);
                return updated;
            });

            return toast.error(`${invalidRows.length} intent không đủ 5 ví dụ. Vui lòng thêm ví dụ hoặc dùng nút ✨ để tạo tự động.`);
        }

        // Clear validation errors for valid rows
        setRows((prev) => {
            const updated = [...prev];
            toImport.forEach((row) => {
                const actualIdx = rows.findIndex(r => r === row);
                updated[actualIdx] = { ...updated[actualIdx], validationError: undefined };
            });
            return updated;
        });

        // Check for duplicate intent names in selected rows
        const intentNames = new Set<string>();
        const duplicates: string[] = [];
        toImport.forEach(row => {
            if (intentNames.has(row.name)) {
                duplicates.push(row.name);
            }
            intentNames.add(row.name);
        });
        if (duplicates.length > 0) {
            return toast.error(`Phát hiện tên intent trùng: ${duplicates.join(', ')}. Vui lòng sửa trước khi import.`);
        }

        setIsImporting(true);
        setHasImported(true);
        setProgress({ done: 0, total: toImport.length });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < rows.length; i++) {
            // Skip if not selected or already successful
            if (!selected[i] || rows[i].status === 'success') {
                continue;
            }

            const row = rows[i];
            try {
                const formattedName = row.name;

                // Use all examples from the row
                const examplesArr: string[] = row.examples.filter(ex => ex.trim());

                // Create intent with all examples
                const intentPayload = {
                    name: formattedName,
                    description: "",
                    define: buildIntentDefine(formattedName, examplesArr),
                    entities: [],
                };
                const createdIntent = await intentService.createIntent(intentPayload as any);

                // Create response with answer text
                let createdResponse = null;
                if (row.response && row.response.trim()) {
                    const respName = `utter_${formattedName}`;
                    const responsePayload = {
                        name: respName,
                        description: "",
                        define: buildResponseDefine(respName, row.response.trim()),
                    };
                    createdResponse = await responseService.createResponse(responsePayload as any);
                }

                // Create story linking the created intent and response
                if (createdResponse) {
                    const storyName = `story_for_${formattedName}`;
                    const steps: Array<{ intentId?: string; actionId?: string }> = [{ intentId: createdIntent._id }];
                    steps.push({ actionId: createdResponse._id });

                    const storyPayload = {
                        name: storyName,
                        description: "",
                        define: buildStoryDefine(storyName, steps),
                        intents: [createdIntent._id],
                        responses: [createdResponse._id],
                        action: [],
                        entities: [],
                        slots: [],
                        roles: [],
                    };

                    await storyService.createStory(storyPayload as any);
                }

                // Mark as success
                setRows((prev) => {
                    const updated = [...prev];
                    updated[i] = { ...updated[i], status: 'success', error: undefined };
                    return updated;
                });
                successCount++;
            } catch (err: any) {
                console.error("Row import error", row, err);
                const errorMsg = err?.response?.data?.message || err?.message || "Lỗi không xác định";
                setRows((prev) => {
                    const updated = [...prev];
                    updated[i] = { ...updated[i], status: 'error', error: errorMsg };
                    return updated;
                });
                failCount++;
            }
            setProgress((p) => ({ ...p, done: p.done + 1 }));
        }

        setIsImporting(false);

        if (failCount === 0) {
            toast.success(`Đã import thành công ${successCount} dòng`);
            // Auto navigate after 2s if all successful
            setTimeout(() => navigate("/"), 2000);
        } else {
            toast.error(`Thành công: ${successCount}, Thất bại: ${failCount}. Kiểm tra lỗi bên dưới.`);
        }
    };

    const handleRetryFailed = async () => {
        // Retry only failed rows
        const failedIndices = rows
            .map((r, i) => ({ row: r, index: i }))
            .filter(({ row }) => row.status === 'error')
            .map(({ index }) => index);

        if (failedIndices.length === 0) {
            return toast.error("Không có dòng nào thất bại để thử lại");
        }

        // Select only failed rows
        const newSelected: Record<number, boolean> = {};
        failedIndices.forEach(i => newSelected[i] = true);
        setSelected(newSelected);

        // Trigger import
        await handleImport();
    };

    const downloadTemplate = async () => {
        try {
            await generateTemplate();
        } catch (err) {
            console.error("Failed to generate template", err);
            toast.error("Lỗi khi tạo file mẫu");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-full mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b shadow-sm">
                    <div className="px-3 py-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                
                            </Button>
                            <div className="flex items-center gap-2">
                                <FileUp className="h-6 w-6 text-indigo-600" />
                                <div>
                                    <h1 className="text-xl font-bold text-indigo-900">Nhập nhóm câu hỏi từ file</h1>
                                    <p className="text-xs text-indigo-600">Import intents và tạo stories tự động</p>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    Tải file mẫu
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-3 pt-2 pr-6" style={{ height: 'calc(100vh - 120px)' }}>

                    {/* Only show upload area if no rows loaded */}
                    {rows.length === 0 && (
                        <div className="max-w-3xl mx-auto">
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                className="border-2 border-dashed border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-10 text-center cursor-pointer shadow-sm hover:shadow-lg hover:border-indigo-400 transition-all"
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
                                <Upload className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                                <div className="text-xl font-bold text-indigo-900 mb-2">Kéo thả file vào đây để nhập</div>
                                <div className="text-base text-slate-600 mb-3">
                                    Hoặc <button onClick={(e) => { e.stopPropagation(); handleClickChoose(); }} className="text-indigo-600 font-semibold underline hover:text-indigo-700">chọn file từ máy tính</button>
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-indigo-200">
                                    <Database className="h-4 w-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-slate-700">Hỗ trợ: Excel (XLSX, XLS), CSV</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {isParsing && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                            <div className="text-indigo-700 font-medium text-sm">Đang đọc file...</div>
                        </div>
                    )}

                    {rows.length > 0 && (
                        <div className="bg-white rounded-lg shadow-lg border border-indigo-100 flex flex-col h-full">
                            <div className="flex items-center justify-between px-3 py-3 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-indigo-600" />
                                    <div>
                                        <div className="font-semibold text-base text-indigo-900">Xem trước dữ liệu</div>
                                        <div className="text-xs text-indigo-600">{rows.length} nhóm câu hỏi</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {progress.total > 0 && (
                                        <div className="text-sm text-indigo-700 font-medium bg-white px-3 py-1.5 rounded-full border border-indigo-200">
                                            Tiến trình: {progress.done}/{progress.total}
                                        </div>
                                    )}
                                    <Button
                                        onClick={handleGenerateIntents}
                                        disabled={isGenerating || rows.length === 0}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 border-indigo-300 hover:bg-indigo-50"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        {isGenerating ? 'Đang tạo...' : 'Tạo thêm nhóm câu hỏi'}
                                    </Button>
                                </div>
                            </div>
                            <div className="overflow-auto flex-1 border-t">
                            <table className="w-full text-left table-fixed">
                                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 border-b">
                                    <tr>
                                        <th className="px-4 py-3 w-12 text-xs font-semibold text-slate-600 uppercase">#</th>
                                        <th className="px-4 py-3 w-16 text-xs font-semibold text-slate-600 uppercase">Chọn</th>
                                        <th className="px-4 py-3 w-80 text-xs font-semibold text-slate-600 uppercase">Tên nhóm câu hỏi</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Câu trả lời</th>
                                        <th className="px-4 py-3 w-32 text-xs font-semibold text-slate-600 uppercase">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r, i) => {
                                        const isSuccess = r.status === 'success';
                                        const isError = r.status === 'error';
                                        const hasValidationError = !!r.validationError;
                                        const rowClasses = isSuccess
                                            ? "opacity-50 bg-slate-100"
                                            : (isError || hasValidationError)
                                                ? "bg-red-100"
                                                : (i % 2 === 0 ? "bg-indigo-100/60" : "bg-white");

                                        return (
                                            <>
                                                <tr key={i} className={`${rowClasses} border-b`}>
                                                    <td className="px-4 py-2 align-top">{i + 1}</td>
                                                    <td className="px-4 py-2 align-top">
                                                        <input
                                                            type="checkbox"
                                                            className="accent-indigo-600"
                                                            checked={!!selected[i]}
                                                            onChange={() => handleToggle(i)}
                                                            disabled={isSuccess}
                                                        />
                                                    </td>
                                                    {editingRow === i && !isSuccess ? (
                                                        <>
                                                            <td className="px-4 py-2 align-top">
                                                                <div className="space-y-2">
                                                                    <label className="text-xs text-slate-500">Tên nhóm câu hỏi:</label>
                                                                    <Input
                                                                        value={editIntentName}
                                                                        onChange={(e) => setEditIntentName(e.target.value)}
                                                                        className="w-full font-mono text-sm"
                                                                        placeholder="ten_nhom_cau_hoi"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 align-top">
                                                                <Textarea
                                                                    value={editAnswer}
                                                                    onChange={(e) => setEditAnswer(e.target.value)}
                                                                    className="w-full min-h-[80px]"
                                                                    placeholder="Nhập câu trả lời..."
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 align-top">
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleSaveRow(i)}
                                                                        className="h-8 w-8 p-0"
                                                                    >
                                                                        <Save className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={handleCancelEdit}
                                                                        className="h-8 w-8 p-0"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-4 py-2 align-top">
                                                                <div className="flex items-start gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => toggleExpandRow(i)}
                                                                        className="h-6 w-6 p-0 flex-shrink-0"
                                                                        disabled={isSuccess}
                                                                    >
                                                                        {expandedRows[i] ? (
                                                                            <ChevronDown className="h-4 w-4" />
                                                                        ) : (
                                                                            <ChevronRight className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium text-sm font-mono text-indigo-700 truncate" title={r.name}>{r.name}</div>
                                                                        <div className="text-xs text-slate-400 mt-1">
                                                                            {r.examples.length} câu hỏi
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 align-top">
                                                                <div className="text-sm text-slate-600 line-clamp-2 break-words" title={r.response}>
                                                                    {r.response}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 align-top">
                                                                <div className="flex gap-1 items-center">
                                                                    {isSuccess ? (
                                                                        <span className="text-green-600 text-sm font-medium">✓ Đã lưu</span>
                                                                    ) : (
                                                                        <>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => handleEditRow(i)}
                                                                                className="h-8 w-8 p-0"
                                                                                title="Sửa nhóm câu hỏi"
                                                                            >
                                                                                <Pencil className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => handleGenerateExamplesForRow(i)}
                                                                                disabled={generatingRowIdx === i}
                                                                                className="h-8 w-8 p-0"
                                                                                title="Tạo thêm câu hỏi"
                                                                            >
                                                                                <Sparkles className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => handleDeleteRow(i)}
                                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                                                title="Xóa nhóm câu hỏi"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                                {expandedRows[i] && !isSuccess && (
                                                    <tr key={`${i}-examples`} className={rowClasses}>
                                                        <td colSpan={5} className="px-2 py-2">
                                                            <div className="ml-8 border-l-2 border-indigo-200 pl-3 border rounded-lg p-2 bg-slate-50/50">
                                                                <div className="font-medium text-sm mb-2 text-indigo-700">
                                                                    Các câu hỏi tương tự:
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {r.examples.map((ex, exIdx) => (
                                                                        <div key={exIdx} className={`flex items-start gap-2 group p-2 rounded border border-slate-300 ${i % 2 === 0 ? 'bg-indigo-50/50' : 'bg-white'} hover:border-indigo-400 transition-colors`}>
                                                                            <span className="text-xs text-slate-400 mt-0.5 w-6 flex-shrink-0">{exIdx + 1}.</span>
                                                                            {editingExample?.rowIdx === i && editingExample?.exampleIdx === exIdx ? (
                                                                                <div className="flex-1 flex gap-2">
                                                                                    <Input
                                                                                        value={editExampleText}
                                                                                        onChange={(e) => setEditExampleText(e.target.value)}
                                                                                        className="flex-1"
                                                                                        autoFocus
                                                                                    />
                                                                                    <Button
                                                                                        size="sm"
                                                                                        onClick={handleSaveExample}
                                                                                        className="h-8"
                                                                                    >
                                                                                        <Save className="h-3 w-3" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={handleCancelEditExample}
                                                                                        className="h-8"
                                                                                    >
                                                                                        <X className="h-3 w-3" />
                                                                                    </Button>
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    <span className="flex-1 text-sm">{ex}</span>
                                                                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0">
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="ghost"
                                                                                            onClick={() => handleEditExample(i, exIdx)}
                                                                                            className="h-6 w-6 p-0"
                                                                                        >
                                                                                            <Pencil className="h-3 w-3" />
                                                                                        </Button>
                                                                                        {r.examples.length > 1 && (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="ghost"
                                                                                                onClick={() => handleDeleteExample(i, exIdx)}
                                                                                                className="h-6 w-6 p-0 text-red-600"
                                                                                            >
                                                                                                <X className="h-3 w-3" />
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                {isError && r.error && (
                                                    <tr key={`${i}-error`} className="bg-red-50">
                                                        <td colSpan={5} className="px-4 py-2">
                                                            <div className="text-red-600 text-sm">
                                                                <strong>❌ Lỗi API:</strong> {r.error}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                {hasValidationError && r.validationError && (
                                                    <tr key={`${i}-validation`} className="bg-red-50">
                                                        <td colSpan={5} className="px-4 py-2">
                                                            <div className="text-red-600 text-sm flex items-center gap-2">
                                                                <strong>⚠️ Kiểm tra:</strong> {r.validationError}
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleGenerateExamplesForRow(i)}
                                                                    disabled={generatingRowIdx === i}
                                                                    className="h-6 text-xs"
                                                                >
                                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                                    Tạo thêm câu hỏi
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                            <div className="flex gap-3 px-3 py-3 border-t bg-gray-50 flex-shrink-0">
                                <Button 
                                    onClick={handleImport} 
                                    disabled={isImporting} 
                                    className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2"
                                >
                                    <Database className="h-4 w-4" />
                                    {isImporting ? 'Đang nhập...' : 'Nhập dữ liệu đã chọn'}
                                </Button>
                                {hasImported && rows.some(r => r.status === 'error') && (
                                    <Button onClick={handleRetryFailed} variant="outline" disabled={isImporting} className="gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        Thử lại các dòng lỗi
                                    </Button>
                                )}
                                <Button 
                                    variant="ghost" 
                                    onClick={() => { setRows([]); setFile(null); setSelected({}); setHasImported(false); }}
                                    className="gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Hủy / Xóa tất cả
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ImportIntentPage;
