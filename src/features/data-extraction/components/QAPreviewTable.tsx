import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Pencil,
  Save,
  X,
  Zap,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { intentService } from "@/features/intents/api/service";
import { useChatbotStore } from "@/store/chatbot";
import { useChatbots } from "@/hooks/useChatbots";
import { useAuthStore } from "@/store/auth";
import * as api from "../api/service";
import type { ExtractionRow } from "../api/types";

interface Props {
  rows: ExtractionRow[];
  onChange: (rows: ExtractionRow[]) => void;
  onClear: () => void;
}

function buildIntentDefine(name: string, examples: string[]) {
  const lines = [`- intent: ${name}`, `  examples: |`];
  examples.forEach((ex) => lines.push(`    - ${ex.trim()}`));
  return lines.join("\n");
}

function buildResponseDefine(name: string, text: string) {
  const block = text ? text.replace(/\\n/g, "\n").trim().split("\n").map((l: string) => `      ${l}`).join("\n") : "";
  const lines = [`${name}:`, `  - text: |`];
  if (block) lines.push(block);
  return lines.join("\n");
}

function buildRuleDefine(name: string, steps: Array<{ intentId?: string; actionId?: string }>) {
  const lines = [`- rule: ${name}`, `  steps:`];
  steps.forEach((s) => {
    if (s.intentId) lines.push(`  - intent: [${s.intentId}]`);
    if (s.actionId) lines.push(`  - action: [${s.actionId}]`);
  });
  return lines.join("\n");
}

export function QAPreviewTable({ rows, onChange, onClear }: Props) {
  const { t } = useTranslation();
  const selectedBotId = useChatbotStore((s) => s.selectedBotId);
  const user = useAuthStore((s) => s.user);
  const { chatbots } = useChatbots();
  const isManager = !!user?.roles?.some((r) => r.name?.toUpperCase() === "MANAGER");
  const managerAssignedBotId = user?.managedBotIds?.[0] || null;

  const [selected, setSelected] = useState<Record<number, boolean>>(() => {
    const s: Record<number, boolean> = {};
    rows.forEach((_, i) => (s[i] = true));
    return s;
  });
  const [parsingAll, setParsingAll] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [parsingRow, setParsingRow] = useState<number | null>(null);
  const [labelPrefix, setLabelPrefix] = useState("");
  const [editLabel, setEditLabel] = useState<number | null>(null);
  const [generatingRowIdx, setGeneratingRowIdx] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ done: 0, total: 0 });
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationErrorIndex, setGenerationErrorIndex] = useState<number | null>(null);

  // Keep a live reference to the latest rows to avoid stale-prop overwrites
  // when updating multiple rows in async loops (parseAll/importAll).
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
    // Reset labelPrefix when all rows are cleared
    if (rows.length === 0) {
      setLabelPrefix("");
    }
  }, [rows]);

  const importBotIds: string[] = isManager
    ? managerAssignedBotId
      ? [managerAssignedBotId]
      : []
    : [selectedBotId].filter((id): id is string => Boolean(id));

  function updateRow(index: number, patch: Partial<ExtractionRow>) {
    const current = rowsRef.current;
    const next = current.map((r, i) => (i === index ? { ...r, ...patch } : r));
    rowsRef.current = next;
    onChange(next);
  }

  function deleteRow(index: number) {
    const current = rowsRef.current;
    const nextRows = current.filter((_, i) => i !== index);
    rowsRef.current = nextRows;
    onChange(nextRows);
    setSelected((prev) => {
      const next: Record<number, boolean> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const ki = Number(k);
        if (ki < index) next[ki] = v;
        else if (ki > index) next[ki - 1] = v;
      });
      return next;
    });
  }

  function toggleSelect(index: number) {
    setSelected((s) => ({ ...s, [index]: !s[index] }));
  }

  function selectAll() {
    const s: Record<number, boolean> = {};
    rows.forEach((_, i) => (s[i] = true));
    setSelected(s);
  }

  function deselectAll() {
    setSelected({});
  }

  function formatIntentName(input?: string) {
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

  function applyLabelPrefixToAllRows(prefix: string) {
    if (!prefix.trim()) return;
    const formattedPrefix = formatIntentName(prefix.trim());
    const nextRows = rowsRef.current.map((row, i) => ({
      ...row,
      label: `${formattedPrefix}_${i + 1}`,
    }));
    rowsRef.current = nextRows;
    onChange(nextRows);
    toast.success(t("Áp dụng nhãn cho {{count}} dòng", { count: nextRows.length }));
  }

  // Parse 1 row qua Rasa
  async function parseRow(index: number) {
    const row = rowsRef.current[index];
    if (!row.question) return;
    setParsingRow(index);
    try {
      const result = await api.rasaParse(row.question);
      const intentName = result.intent?.name || "";
      const confidence = result.intent?.confidence || 0;
      const isFallback =
        intentName === "nlu_fallback" || intentName === "out_of_scope" || confidence < 0.65;

      updateRow(index, {
        parseResult: result,
        parsedIntent: isFallback ? null : intentName,
        isFallback,
      });
    } catch (err) {
      updateRow(index, {
        parseResult: null,
        parsedIntent: null,
        isFallback: true,
      });
      toast.error(t("Lỗi Rasa parse cho dòng {{n}}", { n: index + 1 }));
    } finally {
      setParsingRow(null);
    }
  }

  // Parse tất cả rows đã chọn
  async function parseAll() {
    setParsingAll(true);
    let count = 0;
    for (let i = 0; i < rowsRef.current.length; i++) {
      const row = rowsRef.current[i];
      if (!selected[i] || row?.parseResult) continue;
      await parseRow(i);
      count++;
      // Delay nhẹ để không overload Rasa
      await new Promise((r) => setTimeout(r, 100));
    }
    setParsingAll(false);
    toast.success(t("Đã phân tích {{count}} câu hỏi qua Rasa", { count }));
  }

  function startEdit(index: number) {
    setEditingRow(index);
    setEditQuestion(rowsRef.current[index]?.question || "");
    setEditAnswer(rowsRef.current[index]?.answer || "");
  }

  function saveEdit(index: number) {
    updateRow(index, {
      question: editQuestion.trim(),
      answer: editAnswer.trim(),
      parseResult: undefined,
      parsedIntent: undefined,
      isFallback: undefined,
    });
    setEditingRow(null);
  }

  // Tìm intent trong DB
  async function findExistingIntent(name: string, botId: string) {
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages && page <= 20) {
      const res = await intentService.fetchIntents({ page, limit: 100, search: name, botId } as any);
      const found = (res.data || []).find((it: any) => it?.name === name);
      if (found) return found;
      totalPages = res.meta?.totalPages || 1;
      page++;
    }
    return null;
  }

  async function generateExamplesForRow(index: number) {
    const row = rowsRef.current[index];
    if (!row.question || !row.answer) {
      return toast.error(t("Câu hỏi và câu trả lời là bắt buộc để sinh ví dụ"));
    }
    if (!row.parseResult || !row.isFallback) {
      return toast.error(t("Chỉ sinh ví dụ khi kết quả parse là fallback"));
    }

    setGeneratingRowIdx(index);
    try {
      const examples = await intentService.geminiExamples({
        example: row.question.trim(),
        num: 5,
        response: row.answer.trim(),
      });

      if (Array.isArray(examples) && examples.length > 0) {
        // Combine original question with generated examples, remove duplicates
        const allExamples = [row.question, ...examples];
        const uniqueExamples = Array.from(new Set(allExamples.map((e: string) => e.trim())));
        
        updateRow(index, {
          generatedExamples: uniqueExamples,
        });
        toast.success(t("Đã sinh {{count}} ví dụ", { count: examples.length }));
      } else {
        toast.warning(t("Không sinh được ví dụ"));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t("Lỗi sinh ví dụ");
      toast.error(msg);
    } finally {
      setGeneratingRowIdx(null);
    }
  }

  async function generateExamplesForAll() {
    // Determine start index: resume from error if exists, otherwise from 0
    const startIdx = generationErrorIndex !== null ? generationErrorIndex : 0;
    
    setGeneratingAll(true);
    setGenerationError(null);
    setGenerationErrorIndex(null);
    setGenerationProgress({ done: 0, total: 0 });

    let successCount = 0;

    for (let i = startIdx; i < rowsRef.current.length; i++) {
      const row = rowsRef.current[i];
      
      // Skip unselected rows, rows with no question/answer, or rows with existing examples, or not fallback
      if (!selected[i] || !row?.question || !row?.answer || (row?.generatedExamples && row.generatedExamples.length > 0) || !row?.parseResult || !row?.isFallback) {
        continue;
      }

      try {
        const examples = await intentService.geminiExamples({
          example: row.question.trim(),
          num: 5,
          response: row.answer.trim(),
        });

        if (Array.isArray(examples) && examples.length > 0) {
          const allExamples = [row.question, ...examples];
          const uniqueExamples = Array.from(new Set(allExamples.map((e: string) => e.trim())));
          
          updateRow(i, { generatedExamples: uniqueExamples });
          successCount++;
        }

        setGenerationProgress((p) => ({ ...p, done: p.done + 1 }));
        // Delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 200));
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || t("Lỗi sinh ví dụ");
        setGenerationError(msg);
        setGenerationErrorIndex(i);
        setGeneratingAll(false);
        toast.error(t("Lỗi ở dòng {{n}}: {{msg}}", { n: i + 1, msg }));
        return;
      }
    }

    setGeneratingAll(false);
    setGenerationProgress({ done: 0, total: 0 });
    toast.success(t("Đã sinh ví dụ cho {{count}} dòng", { count: successCount }));
  }

  // Import tất cả rows đã chọn
  async function handleImport() {
    if (importBotIds.length === 0) {
      return toast.error(t("Vui lòng chọn chatbot trước khi import"));
    }

    const toImport = rowsRef.current.filter((_, i) => selected[i] && rowsRef.current[i].status !== "success");
    if (toImport.length === 0) return toast.error(t("Không có dòng nào được chọn"));

    setImporting(true);
    setProgress({ done: 0, total: toImport.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rowsRef.current.length; i++) {
      const row = rowsRef.current[i];
      if (!selected[i] || row?.status === "success") continue;

      try {
        // Tạo intent name: nếu Rasa nhận diện intent → dùng intent đó, else tạo mới
        let intentName = "";
        let isExisting = false;

        if (row.parsedIntent && !row.isFallback) {
          intentName = row.parsedIntent;
          
          // Tìm intent có sẵn trong DB
          const found = await findExistingIntent(intentName, importBotIds[0]);
          if (found) {
            isExisting = true;
            // Get full details to merge examples
            const intentDetail = await intentService.getIntentById(found._id);
            const currentExampleTexts = intentDetail.examples?.map(e => e.text) || [];
            
            const newExamples = (row.generatedExamples && row.generatedExamples.length > 0)
              ? row.generatedExamples
              : [row.question.trim()];
              
            const uniqueNew = newExamples.filter(ex => !currentExampleTexts.includes(ex));
            
            if (uniqueNew.length > 0) {
              await intentService.updateIntent(found._id, {
                _id: found._id,
                name: intentDetail.name,
                botIds: intentDetail.botIds || importBotIds,
                label: intentDetail.label,
                description: intentDetail.description,
                examples: [...currentExampleTexts, ...uniqueNew],
                entities: intentDetail.entities || [],
                roles: intentDetail.roles || [],
              });
            }
            
            updateRow(i, { status: "success", parsedIntent: intentName });
            successCount++;
            setProgress((p) => ({ ...p, done: p.done + 1 }));
            continue;
          }
        } 
        
        if (!intentName) {
          intentName = row.question
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D")
            .replace(/[^a-z0-9\s]/g, "")
            .split(/\s+/)
            .slice(0, 5)
            .join("_")
            .substring(0, 60);
          if (!intentName) intentName = `intent_${i}`;
          
          if (row.label) {
             intentName = `${row.label}`; 
          }
        }

        // Use generated examples if available, otherwise just the question
        const examplesArr = (row.generatedExamples && row.generatedExamples.length > 0)
          ? row.generatedExamples
          : [row.question.trim()];

        const result = await intentService.createFull({
          name: intentName,
          examples: examplesArr,
          answer: row.answer?.trim() || "",
          botIds: importBotIds,
          source: 'gmail',
          label: row.label || undefined,
        });

        if (result.duplicateExamples?.length > 0) {
          updateRow(i, { status: "success", parsedIntent: intentName });
        } else {
          updateRow(i, { status: "success", parsedIntent: intentName });
        }

        successCount++;
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || t("Lỗi không xác định");
        updateRow(i, { status: "error", error: msg });
        failCount++;
      }

      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setImporting(false);
    if (failCount === 0) {
      toast.success(t("Import thành công {{count}} dòng", { count: successCount }));
      setLabelPrefix("");
    } else {
      toast.error(
        t("Kết quả: {{success}} thành công, {{fail}} thất bại", {
          success: successCount,
          fail: failCount,
        })
      );
    }
  }

  const [editingExampleIdx, setEditingExampleIdx] = useState<{ rowIdx: number; exIdx: number } | null>(null);
  const [editingExampleText, setEditingExampleText] = useState("");

  function saveEditExample(rowIdx: number, exIdx: number) {
    const row = rowsRef.current[rowIdx];
    if (!row.generatedExamples) return;
    const updated = [...row.generatedExamples];
    updated[exIdx] = editingExampleText.trim();
    updateRow(rowIdx, { generatedExamples: updated });
    setEditingExampleIdx(null);
  }

  function deleteExample(rowIdx: number, exIdx: number) {
    const row = rowsRef.current[rowIdx];
    if (!row.generatedExamples) return;
    const updated = row.generatedExamples.filter((_, i) => i !== exIdx);
    updateRow(rowIdx, { generatedExamples: updated });
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const parsedCount = rows.filter((r) => r.parseResult).length;
  const successCount = rows.filter((r) => r.status === "success").length;
  const generatedCount = rows.filter((r) => r.generatedExamples && r.generatedExamples.length > 0).length;

  return (
    <div className="flex flex-col border rounded-lg bg-card w-full h-full" style={{ maxHeight: "calc(100vh - 200px)" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-3 border-b bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-950 dark:to-black flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {t("Tổng: {{total}} | Đã chọn: {{selected}} | Đã parse: {{parsed}} | Đã sinh ví dụ: {{generated}} | Đã import: {{done}}",{
              total: rows.length,
              selected: selectedCount,
              parsed: parsedCount,
              generated: generatedCount,
              done: successCount,
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll} disabled={importing}>
            {t("Chọn tất cả")}
          </Button>
          <Button variant="ghost" size="sm" onClick={deselectAll} disabled={importing}>
            {t("Bỏ chọn")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={parseAll}
            disabled={parsingAll || importing}
            className="gap-1 border-amber-400 text-amber-700 hover:bg-amber-50"
          >
            {parsingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
            {parsingAll ? t("Đang phân tích...") : t("Phân tích Rasa")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateExamplesForAll}
            disabled={parsingAll || importing || generatingAll || selectedCount === 0 || !rows.some((r, i) => selected[i] && r.parseResult && r.isFallback && !((r.generatedExamples?.length || 0) > 0))}
            className={`gap-1 ${generationError ? 'border-red-400 text-red-700 hover:bg-red-50' : 'border-purple-400 text-purple-700 hover:bg-purple-50'}`}
          >
            {generatingAll ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("Sinh ví dụ... {{done}}/{{total}}", generationProgress)}
              </>
            ) : generationError ? (
              <>
                <AlertTriangle className="h-3 w-3" />
                {t("Thử lại từ dòng {{n}}", { n: generationErrorIndex! + 1 })}
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                {t("Sinh ví dụ")}
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={importing || selectedCount === 0}
            className="gap-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
            {importing
              ? t("Importing... {{done}}/{{total}}", progress)
              : t("Import {{count}} dòng", { count: selectedCount })}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1" disabled={importing}>
            <X className="h-3 w-3" />
            {t("Xóa tất cả")}
          </Button>
        </div>
      </div>

      {/* Label Prefix Section */}
      {rows.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-3 border-b bg-amber-50/50 dark:bg-amber-950/20">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("label_prefix")}:
          </label>
          <Input
            placeholder={t("label_prefix_placeholder")}
            value={labelPrefix}
            onChange={(e) => setLabelPrefix(e.target.value)}
            className="w-64"
            disabled={importing}
          />
          <Button
            size="sm"
            onClick={() => applyLabelPrefixToAllRows(labelPrefix)}
            disabled={!labelPrefix.trim() || importing}
            variant="outline"
            className="gap-1"
          >
            {t("apply_label")}
          </Button>
          {labelPrefix && (
            <span className="text-xs text-amber-700 dark:text-amber-300">
              {t("label_preview_text", { prefix: formatIntentName(labelPrefix), count: rows.length })}
            </span>
          )}
        </div>
      )}

      {/* Table View */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
            <tr className="border-b">
              <th className="w-12 px-3 py-3 text-left">#</th>
              <th className="px-3 py-3 text-left font-medium">{t("TÊN NHÓM CÂU HỎI")}</th>
              <th className="px-3 py-3 text-left font-medium">{t("CÂU TRẢ LỜI")}</th>
              <th className="w-24 px-3 py-3 text-left font-medium">Rasa Parse</th>
              <th className="w-20 px-3 py-3 text-left font-medium">{t("Sinh ví dụ")}</th>
              <th className="px-3 py-3 text-left font-medium">{t("THAO TÁC")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isSuccess = row.status === "success";
              const isError = row.status === "error";
              const intentName = row.label ? `${row.label}` : formatIntentName(row.question.substring(0, 30));
              const examplesCount = row.generatedExamples?.length || 0;
              const isExpanded = expandedRows[i];

              return (
                <>
                  {/* Main Row */}
                  <tr
                    className={`border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      isSuccess
                        ? "bg-green-50 dark:bg-green-950/20"
                        : isError
                        ? "bg-red-50 dark:bg-red-950/20"
                        : ""
                    }`}
                  >
                    {/* Checkbox + Expand Button */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-indigo-600"
                          checked={!!selected[i]}
                          onChange={() => toggleSelect(i)}
                          disabled={isSuccess}
                        />
                        {(row.generatedExamples?.length || 0 > 0) && (
                          <button
                            onClick={() =>
                              setExpandedRows((prev) => ({ ...prev, [i]: !prev[i] }))
                            }
                            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Intent Name */}
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {intentName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {row.question}
                      </div>
                    </td>

                    {/* Answer */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {row.answer || (
                          <span className="italic text-slate-400">
                            ({t("trống")})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Rasa Parse Result */}
                    <td className="px-3 py-3">
                      {parsingRow === i ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>{t("Đang phân tích...")}</span>
                        </div>
                      ) : row.parseResult ? (
                        row.isFallback ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            Fallback ({(row.parseResult.intent?.confidence * 100).toFixed(0)}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            <CheckCircle className="h-3 w-3" />
                            {row.parsedIntent} ({(row.parseResult.intent?.confidence * 100).toFixed(0)}%)
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    {/* Examples Count / Generate Button */}
                    <td className="px-3 py-3">
                      {generatingRowIdx === i ? (
                        <Button size="sm" disabled className="h-6 gap-1 text-xs whitespace-nowrap">
                          <Loader2 className="h-3 w-3 animate-spin" />
                        </Button>
                      ) : examplesCount > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs dark:bg-purple-900/30 dark:text-purple-300">
                          {examplesCount}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => generateExamplesForRow(i)}
                          variant="outline"
                          className="h-6 gap-1 text-xs text-purple-600 hover:text-purple-700"
                          disabled={!row.question || !row.answer || !row.parseResult || !row.isFallback}
                        >
                          <Sparkles className="h-3 w-3" />
                        </Button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {!row.parseResult && !parsingRow && (
                          <Button
                            size="sm"
                            onClick={() => parseRow(i)}
                            variant="ghost"
                            className="h-6 px-1.5 p-0 text-amber-600 hover:text-amber-700"
                            title="Parse Rasa"
                          >
                            <Search className="h-3 w-3" />
                          </Button>
                        )}
                        {!isSuccess && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => startEdit(i)}
                              variant="ghost"
                              className="h-6 px-1.5 p-0"
                              title="Edit"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => deleteRow(i)}
                              variant="ghost"
                              className="h-6 px-1.5 p-0 text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {isSuccess && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {isError && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row - Examples */}
                  {isExpanded && examplesCount > 0 && (
                    <tr className="border-b bg-slate-50 dark:bg-slate-800/30">
                      <td colSpan={6} className="px-6 py-3">
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {t("Các ví dụ")} ({examplesCount}):
                          </div>
                          <div className="space-y-1">
                            {row.generatedExamples?.map((example: string, exIdx: number) => (
                              <div key={exIdx} className="flex items-start gap-2 group p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700/50">
                                <span className="text-xs text-slate-400 min-w-6">{exIdx + 1}.</span>
                                {editingExampleIdx?.rowIdx === i && editingExampleIdx?.exIdx === exIdx ? (
                                  <>
                                    <Input
                                      value={editingExampleText}
                                      onChange={(e) => setEditingExampleText(e.target.value)}
                                      className="flex-1 text-xs h-8"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => saveEditExample(i, exIdx)}
                                      className="h-6 px-2 p-0 text-xs"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingExampleIdx(null)}
                                      className="h-6 px-2 p-0 text-xs"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-xs text-slate-600 dark:text-slate-300 flex-1">
                                      {example}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingExampleIdx({ rowIdx: i, exIdx });
                                        setEditingExampleText(example);
                                      }}
                                      className="h-5 px-1.5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteExample(i, exIdx)}
                                      className="h-5 px-1.5 p-0 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Edit Mode Row */}
                  {editingRow === i && !isSuccess && (
                    <tr className="border-b bg-blue-50 dark:bg-blue-950/20">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {t("Câu hỏi")}:
                            </label>
                            <Textarea
                              value={editQuestion}
                              onChange={(e) => setEditQuestion(e.target.value)}
                              className="w-full min-h-[60px] text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {t("Câu trả lời")}:
                            </label>
                            <Textarea
                              value={editAnswer}
                              onChange={(e) => setEditAnswer(e.target.value)}
                              className="w-full min-h-[60px] text-sm mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(i)} className="gap-1">
                              <Save className="h-3 w-3" />
                              {t("Lưu")}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingRow(null)}>
                              {t("Hủy")}
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Error Row */}
                  {isError && row.error && (
                    <tr className="border-b bg-red-50 dark:bg-red-950/20">
                      <td colSpan={6} className="px-6 py-3">
                        <div className="text-xs text-red-600 dark:text-red-300">
                          <strong>{t("Lỗi")}:</strong> {row.error}
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
    </div>
  );
}
