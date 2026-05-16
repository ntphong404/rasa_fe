import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
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

  // Keep a live reference to the latest rows to avoid stale-prop overwrites
  // when updating multiple rows in async loops (parseAll/importAll).
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
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

  async function findExistingResponse(name: string, botId: string) {
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages && page <= 20) {
      const query = `page=${page}&limit=100&search=${encodeURIComponent(name)}&botId=${encodeURIComponent(botId)}`;
      const res = await responseService.fetchResponses(query);
      const found = (res.data || []).find((it: any) => it?.name === name);
      if (found) return found;
      totalPages = res.meta?.totalPages || 1;
      page++;
    }
    return null;
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
        if (row.parsedIntent && !row.isFallback) {
          intentName = row.parsedIntent;
        } else {
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
        }

        const result = await intentService.createFull({
          name: intentName,
          examples: [row.question.trim()],
          answer: row.answer?.trim() || "",
          botIds: importBotIds,
          source: 'gmail',
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
    } else {
      toast.error(
        t("Kết quả: {{success}} thành công, {{fail}} thất bại", {
          success: successCount,
          fail: failCount,
        })
      );
    }
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const parsedCount = rows.filter((r) => r.parseResult).length;
  const successCount = rows.filter((r) => r.status === "success").length;

  return (
    <div className="flex flex-col border rounded-lg bg-card" style={{ maxHeight: "calc(100vh - 280px)" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-3 border-b bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-950 dark:to-black flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {t("Tổng: {{total}} | Đã chọn: {{selected}} | Đã parse: {{parsed}} | Đã import: {{done}}",{
              total: rows.length,
              selected: selectedCount,
              parsed: parsedCount,
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

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-left table-fixed">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 border-b dark:from-slate-900 dark:to-slate-900">
            <tr>
              <th className="px-3 py-2 w-12 text-xs font-semibold text-slate-600">#</th>
              <th className="px-3 py-2 w-12 text-xs font-semibold text-slate-600">{t("Chọn")}</th>
              <th className="px-3 py-2 w-64 text-xs font-semibold text-slate-600">{t("Câu hỏi")}</th>
              <th className="px-3 py-2 w-64 text-xs font-semibold text-slate-600">{t("Câu trả lời")}</th>
              <th className="px-3 py-2 w-44 text-xs font-semibold text-slate-600">{t("Intent (Rasa)")}</th>
              <th className="px-3 py-2 w-28 text-xs font-semibold text-slate-600">{t("Thao tác")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isSuccess = row.status === "success";
              const isError = row.status === "error";
              const bgClass = isSuccess
                ? "opacity-50 bg-green-50"
                : isError
                ? "bg-red-50"
                : i % 2 === 0
                ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                : "bg-white dark:bg-slate-900";

              return (
                <>
                  <tr key={i} className={`${bgClass} border-b`}>
                    <td className="px-3 py-2 align-top text-xs">{i + 1}</td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="checkbox"
                        className="accent-indigo-600"
                        checked={!!selected[i]}
                        onChange={() => toggleSelect(i)}
                        disabled={isSuccess}
                      />
                    </td>

                    {editingRow === i && !isSuccess ? (
                      <>
                        <td className="px-3 py-2 align-top">
                          <Textarea
                            value={editQuestion}
                            onChange={(e) => setEditQuestion(e.target.value)}
                            className="w-full min-h-[60px] text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Textarea
                            value={editAnswer}
                            onChange={(e) => setEditAnswer(e.target.value)}
                            className="w-full min-h-[60px] text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">—</td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => saveEdit(i)} className="h-7 w-7 p-0">
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingRow(null)} className="h-7 w-7 p-0">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 align-top">
                          <div
                            className="text-sm line-clamp-2 break-words cursor-pointer"
                            onClick={() =>
                              setExpandedRows((prev) => ({ ...prev, [i]: !prev[i] }))
                            }
                            title={row.question}
                          >
                            {row.question}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="text-sm text-slate-600 line-clamp-2 break-words" title={row.answer}>
                            {row.answer || <span className="text-slate-400 italic">({t("trống")})</span>}
                          </div>
                        </td>

                        {/* Intent column: Rasa parse result */}
                        <td className="px-3 py-2 align-top">
                          {row.parseResult ? (
                            <div className="space-y-1">
                              {row.isFallback ? (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                  <AlertTriangle className="h-3 w-3" />
                                  {t("Fallback")}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                  <CheckCircle className="h-3 w-3" />
                                  {row.parsedIntent}
                                </span>
                              )}
                              <div className="text-xs text-slate-400">
                                {(row.parseResult.intent?.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                          ) : parsingRow === i ? (
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => parseRow(i)}
                              className="h-7 gap-1 text-xs text-amber-600 hover:text-amber-700"
                              title={t("Phân tích qua Rasa")}
                              disabled={isSuccess}
                            >
                              <Search className="h-3 w-3" />
                              Parse
                            </Button>
                          )}
                        </td>

                        <td className="px-3 py-2 align-top">
                          <div className="flex gap-1">
                            {isSuccess ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(i)}
                                  className="h-7 w-7 p-0"
                                  title={t("Sửa")}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteRow(i)}
                                  className="h-7 w-7 p-0 text-red-600"
                                  title={t("Xóa")}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>

                  {/* Expanded detail */}
                  {expandedRows[i] && !isSuccess && (
                    <tr key={`${i}-detail`} className={bgClass}>
                      <td colSpan={6} className="px-4 py-3">
                        <div className="rounded-lg border bg-slate-50/50 dark:bg-slate-900/70 p-3 space-y-2 text-sm">
                          <div>
                            <span className="font-medium">{t("Câu hỏi")}:</span>{" "}
                            <span className="whitespace-pre-wrap">{row.question}</span>
                          </div>
                          <div>
                            <span className="font-medium">{t("Câu trả lời")}:</span>{" "}
                            <span className="whitespace-pre-wrap">{row.answer || "(trống)"}</span>
                          </div>
                          {row.conversation && (
                            <div className="text-xs text-slate-400">
                              {t("Hội thoại")}: {row.conversation}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Error row */}
                  {isError && row.error && (
                    <tr key={`${i}-error`} className="bg-red-50">
                      <td colSpan={6} className="px-4 py-2">
                        <div className="text-red-600 text-sm">
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
