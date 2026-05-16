import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Pencil, Save, X, Sparkles, ChevronDown, ChevronRight, Upload, Database, FileUp, FileText, File } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { intentService } from "@/features/intents/api/service";
import { useChatbotStore } from "@/store/chatbot";
import { useChatbots } from "@/hooks/useChatbots";
import { useAuthStore } from "@/store/auth";
import { parseFile, formatIntentName, type ParsedRow, parseYAML, parseResponseYAML, mergeNLUWithResponses, type ResponseMap } from "../utils/fileParser";
import { generateTemplate } from "../utils/templateGenerator";
import { UnifiedQAImportTable, type UnifiedQARow } from "../components/UnifiedQAImportTable";
import { useUnifiedQAConverter } from "../hooks/useUnifiedQAConverter";

type Row = ParsedRow;

const isRateLimitError = (err: any) => {
    if (err?.response?.status === 429 || err?.status === 429) return true;
    const msg = String(err?.response?.data?.message || err?.message || "");
    return msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("Quota exceeded");
};

export function ImportIntentPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const selectedBotId = useChatbotStore((state) => state.selectedBotId);
    const user = useAuthStore((state) => state.user);
    const { chatbots } = useChatbots();
    const isManager = !!user?.roles?.some((role) => role.name?.toUpperCase() === "MANAGER");
    const managerAssignedBotId = user?.managedBotIds?.[0] || null;
    const [selectedImportBotIds, setSelectedImportBotIds] = useState<string[]>([]);
    const [importMode, setImportMode] = useState<'excel' | 'yaml'>('excel');
    const [file, setFile] = useState<File | null>(null);
    const [nluFile, setNluFile] = useState<File | null>(null); // For YAML mode
    const [domainFile, setDomainFile] = useState<File | null>(null); // For YAML mode
    const [isParsing, setIsParsing] = useState(false);
    const [rows, setRows] = useState<UnifiedQARow[]>([]);
    const { convertFromExcel } = useUnifiedQAConverter();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const nluInputRef = useRef<HTMLInputElement | null>(null);
    const domainInputRef = useRef<HTMLInputElement | null>(null);

    const availableImportBots = chatbots.filter((bot) => bot.botId !== "global");

    const toggleImportBot = (botId: string) => {
        setSelectedImportBotIds((prev) =>
            prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId]
        );
    };

    const clearImportBots = () => {
        setSelectedImportBotIds([]);
    };

    const selectAllImportBots = () => {
        setSelectedImportBotIds(availableImportBots.map((bot) => bot.botId));
    };

    // Back should return to the Create Data page
    const handleCancel = () => navigate("/add-data");

    // Default selected import bot follows current selector, except global.
    // When global is selected, keep user's explicit tickbox selections.
    // Also remove stale bot ids when chatbot list changes.
    const syncSelectedImportBots = () => {
        if (isManager) {
            setSelectedImportBotIds(managerAssignedBotId ? [managerAssignedBotId] : []);
            return;
        }

        setSelectedImportBotIds((prev) => {
            const validSet = new Set(availableImportBots.map((b) => b.botId));
            const filtered = prev.filter((id) => validSet.has(id));

            if (selectedBotId && selectedBotId !== "global" && validSet.has(selectedBotId)) {
                return filtered.includes(selectedBotId) ? filtered : [...filtered, selectedBotId];
            }

            return filtered;
        });
    };

    useEffect(() => {
        syncSelectedImportBots();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBotId, chatbots.length, isManager, managerAssignedBotId]);

    const handleParseYAMLDualFile = async (nlu: File, domain: File) => {
        setNluFile(nlu);
        setDomainFile(domain);
        setIsParsing(true);
        try {
            // Read and parse both files
            const nluText = await nlu.text();
            const domainText = await domain.text();

            const parsedNLU = await parseYAML(nluText);
            const parsedResponses = await parseResponseYAML(domainText);

            // Merge NLU with responses
            const merged = mergeNLUWithResponses(parsedNLU, parsedResponses);

            // Convert to UnifiedQARow format
            const converted = merged.map((m: any, idx: number) => ({
                id: `yaml_${idx}`,
                question: m.intentName || "",
                answer: m.responseContent || (m.response || ""),
                examples: m.examples || [],
            }));

            setRows(converted);
            toast.success(t("Read intents successfully from files", { count: converted.length, nluName: nlu.name, domainName: domain.name }));
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : t("Unable to read file");
            toast.error(t("Failed to read YAML file: {{error}}", { error: errorMessage }));
            setNluFile(null);
            setDomainFile(null);
        } finally {
            setIsParsing(false);
        }
    };

    function buildRuleDefine(ruleName: string, steps: Array<{ intentId?: string; actionId?: string }>) {
        const lines: string[] = [];
        lines.push(`- rule: ${ruleName}`);
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
            const converted = convertFromExcel(parsed);

            setRows(converted);
            setFile(null);
            toast.success(t("Read rows successfully from file", { count: converted.length, fileName: f.name }));
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : t("Unable to read file");
            toast.error(t("Failed to read file: {{error}}. Please check file format (Excel or CSV).", { error: errorMessage }));
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

    const handleClickChooseNLU = () => {
        nluInputRef.current?.click();
    };

    const handleClickChooseDomain = () => {
        domainInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) await handleParseFile(f);
    };

    const handleNLUFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) setNluFile(f);
    };

    const handleDomainFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) setDomainFile(f);
    };

    const handleParseYAMLFiles = async () => {
        if (!nluFile || !domainFile) {
            return toast.error(t("Please select both NLU and Domain files"));
        }
        await handleParseYAMLDualFile(nluFile, domainFile);
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
            return toast.error(t("Intent name cannot be empty"));
        }
        // Check for duplicate intent name
        const isDuplicate = rows.some((r, i) => i !== index && r.name === newName);
        if (isDuplicate) {
            return toast.error(t("Intent name is duplicated. Please choose another name."));
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
        toast.success(t("Updated successfully"));
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
        toast.success(t("Deleted successfully"));
    };

    const handleEditExample = (rowIdx: number, exampleIdx: number) => {
        setEditingExample({ rowIdx, exampleIdx });
        setEditExampleText(rows[rowIdx].examples[exampleIdx] || "");
    };

    const handleSaveExample = () => {
        if (!editingExample) return;
        if (!editExampleText.trim()) {
            return toast.error(t("Example cannot be empty"));
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
        toast.success(t("Example updated successfully"));
    };

    const handleCancelEditExample = () => {
        setEditingExample(null);
    };

    const handleDeleteExample = (rowIdx: number, exampleIdx: number) => {
        setRows((prev) => {
            const updated = [...prev];
            const newExamples = updated[rowIdx].examples.filter((_, i) => i !== exampleIdx);
            if (newExamples.length === 0) {
                return toast.error(t("At least one example is required")), prev;
            }
            updated[rowIdx] = { ...updated[rowIdx], examples: newExamples };
            return updated;
        });
        toast.success(t("Example deleted successfully"));
    };

    const handleGenerateExamplesForRow = async (rowIdx: number) => {
        if (generatingRowIdx !== null) return;
        const row = rows[rowIdx];
        if (!row.examples[0] || !row.response) {
            return toast.error(t("Question and answer are required to generate examples"));
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
                return toast.error(t("No examples were generated"));
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
            toast.success(t("Added new examples", { count: returnedExamples.length }));
        } catch (err: any) {
            console.error(err);
            if (isRateLimitError(err)) {
                toast.error(t("Rate limit exceeded. Too many requests sent in a short time. Please wait a moment and try again."));
            } else {
                toast.error(t("Failed to generate examples automatically"));
            }
        } finally {
            setGeneratingRowIdx(null);
        }
    };

    const handleGenerateIntents = async () => {
        if (rows.length === 0) {
            return toast.error(t("Please import a file first"));
        }
        if (isGenerating) return;

        setIsGenerating(true);
        try {
            let generatedCount = 0;
            let hitRateLimit = false;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (!row.examples[0] || !row.response) {
                    continue;
                }

                try {
                    const payload = { example: row.examples[0], num: 5, response: row.response };
                    const gen = await intentService.geminiExamples(payload);
                    const genAny: any = gen;
                    const returnedExamples: string[] = Array.isArray(genAny)
                        ? genAny
                        : (Array.isArray(genAny?.data?.examples) ? genAny.data.examples : []);

                    if (returnedExamples && returnedExamples.length > 0) {
                        setRows(prev => {
                            const updated = [...prev];
                            const newExamples = [...updated[i].examples, ...returnedExamples.map(ex => ex.trim())];
                            const uniqueExamples = Array.from(new Set(newExamples));
                            updated[i] = {
                                ...updated[i],
                                examples: uniqueExamples,
                                validationError: undefined
                            };
                            return updated;
                        });
                        generatedCount += returnedExamples.length;
                    }
                } catch (err: any) {
                    if (isRateLimitError(err)) {
                        hitRateLimit = true;
                        break;
                    }
                    console.error(`Failed to generate examples for row ${i}`, err);
                }
            }

            if (generatedCount > 0) {
                toast.success(t("Added new examples", { count: generatedCount }));
            } else if (!hitRateLimit) {
                toast.error(t("No examples were generated"));
            }

            if (hitRateLimit) {
                // Delay slightly to ensure it appears on top of the success toast
                setTimeout(() => {
                    toast.error(t("Rate limit exceeded. Too many requests sent in a short time. Please wait a moment and try again."));
                }, 100);
            }
        } catch (err) {
            console.error(err);
            toast.error(t("Failed to generate examples automatically"));
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
        // Convert escaped \n back to actual newlines for formatting
        const unescapedText = responseText ? responseText.replace(/\\n/g, '\n') : "";
        const textBlock = unescapedText ? unescapedText.trim().split('\n').map((ln) => `      ${ln}`).join('\n') : "";
        const lines: string[] = [];
        lines.push(`${responseName}:`);
        lines.push(`  - text: |`);
        if (textBlock) {
            lines.push(textBlock);
        }
        return lines.join("\n");
    }

    const isDuplicateKeyError = (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "";
        return /E11000\s+duplicate key error/i.test(String(msg));
    };

    const normalizeForCompare = (input?: string) =>
        String(input || "")
            .replace(/\r\n/g, "\n")
            .replace(/[ \t]+/g, " ")
            .trim();

    const formatImportError = (err: any, row: Row) => {
        const raw = String(err?.response?.data?.message || err?.message || t("Unknown error"));
        const status = Number(err?.response?.status || 0);
        const requestUrl = String(err?.response?.config?.url || "");
        const duplicateName = raw.match(/dup key:\s*\{\s*name:\s*"([^"]+)"\s*\}/i)?.[1];

        if (status === 401) {
            return t("Session expired or unauthorized. Please log in again.");
        }

        if (status === 409) {
            if (requestUrl.includes("/intent")) {
                return t("Intent name is duplicated{{name}}.", {
                    name: duplicateName ? `: ${duplicateName}` : `: ${row.name}`,
                });
            }
            if (requestUrl.includes("/my-response")) {
                const fallbackResp = row.responseName?.trim() || `utter_${row.name}`;
                return t("Response name is duplicated{{name}}.", {
                    name: duplicateName ? `: ${duplicateName}` : `: ${fallbackResp}`,
                });
            }
            return t("Data is duplicated. Please check intent/response names.");
        }

        if (raw.includes("ERR_CONNECTION_TIMED_OUT") || raw.includes("Network Error")) {
            return t("Cannot connect to server. Please check your network or try again later.");
        }

        if (isDuplicateKeyError(err)) {
            if (/myresponses/i.test(raw)) {
                const respName = row.responseName?.trim() || `utter_${row.name}`;
                return t("Response name is duplicated: {{name}}.", { name: duplicateName || respName });
            }
            if (/intents/i.test(raw)) {
                return t("Intent name is duplicated: {{name}}.", { name: duplicateName || row.name });
            }
            if (/stories/i.test(raw)) {
                return t("Story already exists for this intent.");
            }
            return t("Data is duplicated. Please check intent/response names.");
        }

        if (/E11000\s+duplicate key error/i.test(raw)) {
            return t("Data is duplicated. Please check intent/response names.");
        }

        return t("Cannot import this row. Please check data and try again.");
    };

    const findExistingIntentByName = async (name: string, botId: string) => {
        const limit = 100;
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages && page <= 20) {
            const res = await intentService.fetchIntents({ page, limit, search: name, botId });
            const found = (res.data || []).find((it: any) => it?.name === name);
            if (found) return found;

            totalPages = res.meta?.totalPages || 1;
            page += 1;
        }

        return null;
    };

    const findExistingResponseByName = async (name: string, botId: string) => {
        const limit = 100;
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages && page <= 20) {
            const query = `page=${page}&limit=${limit}&search=${encodeURIComponent(name)}&botId=${encodeURIComponent(botId)}`;
            const res = await responseService.fetchResponses(query);
            const found = (res.data || []).find((it: any) => it?.name === name);
            if (found) return found;

            totalPages = res.meta?.totalPages || 1;
            page += 1;
        }

        return null;
    };

    const handleImport = async () => {
        const importBotIds = isManager
            ? managerAssignedBotId
                ? [managerAssignedBotId]
                : []
            : selectedImportBotIds.filter(Boolean);
        const sharedLabel = importMode === "yaml" ? commonImportLabel.trim() : "";
        if (importBotIds.length === 0) {
            return toast.error(t("Please select at least 1 chatbot to import"));
        }

        const toImport = rows.filter((_, i) => selected[i] && rows[i].status !== 'success');
        if (toImport.length === 0) return toast.error(t("No rows selected for import"));

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
                        validationError: t("At least 5 examples required (current: {{count}})", {
                            count: updated[idx].examples.filter(ex => ex.trim()).length,
                        })
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

            return toast.error(t("Intents require at least 5 examples", { count: invalidRows.length }));
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
            return toast.error(t("Duplicate intent names detected: {{names}}. Please fix before import.", { names: duplicates.join(', ') }));
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
            const formattedName = row.name;
            const resolvedLabel = importMode === "yaml"
                ? (sharedLabel || undefined)
                : (row.label?.trim() || undefined);
            const examplesArr: string[] = row.examples.filter(ex => ex.trim());

            try {
                const result = await intentService.createFull({
                    name: formattedName,
                    description: "",
                    examples: examplesArr,
                    answer: row.response?.trim() || "",
                    botIds: importBotIds,
                    label: resolvedLabel,
                    source: importMode === 'yaml' ? 'excel' : 'excel',
                });

                if (result.duplicateExamples?.length > 0) {
                    // Mark as success but note duplicates
                    setRows((prev) => {
                        const updated = [...prev];
                        updated[i] = { ...updated[i], status: 'success', error: undefined };
                        return updated;
                    });
                    successCount++;
                } else {
                    setRows((prev) => {
                        const updated = [...prev];
                        updated[i] = { ...updated[i], status: 'success', error: undefined };
                        return updated;
                    });
                    successCount++;
                }
            } catch (err: any) {
                // Check for 429 Too Many Requests immediately and stop import
                if (isRateLimitError(err)) {
                    setIsImporting(false);
                    toast.error(t("Rate limit exceeded. Too many requests sent in a short time. Please wait a moment and try again."));
                    return;
                }
                
                const rootErr = err?.original || err;
                const botPrefix = err?.botId ? `[${err.botId}] ` : "";
                const errorMsg = `${botPrefix}${formatImportError(rootErr, row)}`;

                setRows((prev) => {
                    const updated = [...prev];
                    updated[i] = { ...updated[i], status: 'error', error: errorMsg };
                    return updated;
                });
                failCount++;
            }
            setProgress((p) => ({ ...p, done: p.done + 1 }));
        }

        if (failCount === 0) {
            toast.success(t("Imported rows successfully", { count: successCount }));
            // Stay on current import mode and reset form for next import batch.
            setRows([]);
            setSelected({});
            setExpandedRows({});
            setEditingRow(null);
            setEditingExample(null);
            setHasImported(false);
            setProgress({ done: 0, total: 0 });
            setFile(null);
            setNluFile(null);
            setDomainFile(null);
            setCommonImportLabel("");
        } else {
            toast.error(t("Import result: {{success}} succeeded, {{failed}} failed. Please check errors below.", { success: successCount, failed: failCount }));
        }
    };

    const handleRetryFailed = async () => {
        // Retry only failed rows
        const failedIndices = rows
            .map((r, i) => ({ row: r, index: i }))
            .filter(({ row }) => row.status === 'error')
            .map(({ index }) => index);

        if (failedIndices.length === 0) {
            return toast.error(t("No failed rows to retry"));
        }

        // Select only failed rows
        const newSelected: Record<number, boolean> = {};
        failedIndices.forEach(i => newSelected[i] = true);
        setSelected(newSelected);

        // Trigger import
        await handleImport();
    };

    const downloadTemplate = async (type: 'xlsx' | 'yaml') => {
        try {
            if (type === 'xlsx') {
                await generateTemplate('xlsx');
                toast.success(t("Excel template downloaded. Please fill data and upload."));
            } else if (type === 'yaml') {
                await generateTemplate('yaml');
                toast.success(t("YAML template downloaded. Please adjust data and upload."));
            }
        } catch (err) {
            console.error("Failed to generate template", err);
            toast.error(t("Failed to generate template file"));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="max-w-full mx-auto">
                {/* Header */}
                <div className="border-b bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm dark:border-white/10 dark:from-slate-950 dark:to-black">
                    <div className="px-3 py-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                
                            </Button>
                            <div className="flex items-center gap-2">
                                <FileUp className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                                <div>
                                    <h1 className="text-xl font-bold text-indigo-900 dark:text-indigo-200">{t("Import question groups from file")}</h1>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-300">{t("Import intents and create rules automatically")}</p>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Upload className="h-4 w-4" />
                                            {t("Download template")}
                                            <ChevronDown className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => downloadTemplate('xlsx')} className="gap-2 cursor-pointer">
                                            <FileText className="h-4 w-4 text-orange-500" />
                                            <span>{t("Excel template")}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">(.xlsx)</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => downloadTemplate('yaml')} className="gap-2 cursor-pointer">
                                            <File className="h-4 w-4 text-purple-500" />
                                            <span>{t("YAML template")}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">(.yaml)</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-3 pt-2 pr-6" style={{ height: 'calc(100vh - 120px)' }}>

                    {/* Mode Selection - Show when no rows loaded */}
                    {rows.length === 0 && (
                        <div className="max-w-3xl mx-auto mb-4">
                            <div className="flex gap-2 mb-4">
                                <Button
                                    variant={importMode === 'excel' ? 'default' : 'outline'}
                                    onClick={() => {
                                        setImportMode('excel');
                                        setNluFile(null);
                                        setDomainFile(null);
                                    }}
                                    className="flex-1 gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    {t("Import from file")}
                                </Button>
                                <Button
                                    variant={importMode === 'yaml' ? 'default' : 'outline'}
                                    onClick={() => {
                                        setImportMode('yaml');
                                        setFile(null);
                                    }}
                                    className="flex-1 gap-2"
                                >
                                    <File className="h-4 w-4" />
                                    {t("Import from YAML (2 files)")}
                                </Button>
                            </div>
                        </div>
                    )}

                    {rows.length === 0 && !isManager && (
                        <div className="max-w-3xl mx-auto mb-4 rounded-lg border bg-card p-4">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div>
                                    <div className="text-sm font-semibold">{t("Applicable Chatbots")}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {t("Select one or more chatbots to import this data")}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button type="button" size="sm" variant="outline" onClick={selectAllImportBots}>
                                        {t("Select all")}
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={clearImportBots}>
                                        {t("Clear")}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {availableImportBots.map((bot) => (
                                    <label key={bot._id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                                        <input
                                            type="checkbox"
                                            className="accent-indigo-600"
                                            checked={selectedImportBotIds.includes(bot.botId)}
                                            onChange={() => toggleImportBot(bot.botId)}
                                        />
                                        <span>{bot.name}</span>
                                    </label>
                                ))}
                            </div>
                            {importMode === 'yaml' && (
                                <div className="mt-3 space-y-2">
                                    <label className="text-sm font-medium">
                                        {t("Common label for import file")}
                                    </label>
                                    <Input
                                        value={commonImportLabel}
                                        onChange={(e) => setCommonImportLabel(e.target.value)}
                                        placeholder={t("Example: pccc_faq_03_2026")}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t("This label applies to all intents/responses imported from the current YAML file")}
                                    </p>
                                </div>
                            )}
                            {selectedImportBotIds.length === 0 && (
                                <p className="mt-2 text-xs text-red-500">
                                    {t("Please select at least 1 chatbot before importing")}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Excel Upload Area (existing flow) */}
                    {rows.length === 0 && importMode === 'excel' && (
                        <div className="max-w-3xl mx-auto space-y-3">
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                className="cursor-pointer rounded-lg border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 p-10 text-center shadow-sm transition-all hover:border-orange-400 hover:shadow-lg dark:border-orange-400/50 dark:from-slate-900 dark:to-slate-900 dark:hover:border-orange-300"
                                onClick={handleClickChoose}
                                role="button"
                                aria-label={t("Drop files here or click to select")}
                            >
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept=".csv,.tsv,.txt,.xls,.xlsx"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <Upload className="h-12 w-12 text-orange-400 mx-auto mb-3" />
                                <div className="mb-2 text-xl font-bold text-orange-900 dark:text-orange-200">{t("Drag and drop an Excel file here to import")}</div>
                                <div className="mb-3 text-base text-slate-600 dark:text-slate-300">
                                    {t("Or")} <button onClick={(e) => { e.stopPropagation(); handleClickChoose(); }} className="text-orange-600 font-semibold underline hover:text-orange-700">{t("choose file from your computer")}</button>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 shadow-sm dark:border-orange-300/40 dark:bg-slate-900">
                                    <Database className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("Supported: XLSX, CSV, TSV")}</span>
                                </div>
                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    <p>{t("Excel guide: Download template and fill data manually")}</p>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* YAML Dual File Upload Area */}
                    {rows.length === 0 && importMode === 'yaml' && (
                        <div className="max-w-3xl mx-auto">
                            <div className="space-y-3">
                                {/* NLU File Upload */}
                                <div
                                    onClick={handleClickChooseNLU}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                                            const f = e.dataTransfer.files[0];
                                            if (f.name.endsWith('.yaml') || f.name.endsWith('.yml')) {
                                                setNluFile(f);
                                            } else {
                                                toast.error(t("Please select a YAML file (.yaml or .yml)"));
                                            }
                                        }
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    className="cursor-pointer rounded-lg border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 text-center shadow-sm transition-all hover:border-purple-400 hover:shadow-lg dark:border-purple-400/50 dark:from-slate-900 dark:to-slate-900 dark:hover:border-purple-300"
                                    role="button"
                                >
                                    <input
                                        ref={nluInputRef}
                                        type="file"
                                        accept=".yaml,.yml"
                                        className="hidden"
                                        onChange={handleNLUFileChange}
                                    />
                                    <Upload className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                                    <div className="font-semibold text-purple-900 dark:text-purple-200">
                                        {nluFile ? `${t("Selected")}: ${nluFile.name}` : t("Drag NLU file or click to browse")}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                        {t("Contains intent definitions and examples")}
                                    </div>
                                </div>

                                {/* Domain File Upload */}
                                <div
                                    onClick={handleClickChooseDomain}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                                            const f = e.dataTransfer.files[0];
                                            if (f.name.endsWith('.yaml') || f.name.endsWith('.yml')) {
                                                setDomainFile(f);
                                            } else {
                                                toast.error(t("Please select a YAML file (.yaml or .yml)"));
                                            }
                                        }
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    className="cursor-pointer rounded-lg border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 text-center shadow-sm transition-all hover:border-purple-400 hover:shadow-lg dark:border-purple-400/50 dark:from-slate-900 dark:to-slate-900 dark:hover:border-purple-300"
                                    role="button"
                                >
                                    <input
                                        ref={domainInputRef}
                                        type="file"
                                        accept=".yaml,.yml"
                                        className="hidden"
                                        onChange={handleDomainFileChange}
                                    />
                                    <Upload className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                                    <div className="font-semibold text-purple-900 dark:text-purple-200">
                                        {domainFile ? `${t("Selected")}: ${domainFile.name}` : t("Drag Domain/Response file or click to browse")}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                        {t("Contains response definitions (utterances)")}
                                    </div>
                                </div>

                                {/* Parse Button */}
                                {nluFile && domainFile && (
                                    <Button
                                        onClick={handleParseYAMLFiles}
                                        disabled={isParsing}
                                        className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                                    >
                                        <Database className="h-4 w-4" />
                                        {t("Process 2 files and preview")}
                                    </Button>
                                )}

                                <div className="rounded bg-purple-50 p-3 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                                    <p>{t("NLU file help: Intent structure with examples")}</p>
                                    <p>{t("Domain file help: Response/utterance structure")}</p>
                                </div>
                            </div>
                        </div>
                    )}


                    {isParsing && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                            <div className="text-indigo-700 font-medium text-sm">{t("Reading file...")}</div>
                        </div>
                    )}

                    {rows.length > 0 && (
                        <UnifiedQAImportTable
                            rows={rows}
                            onChange={setRows}
                            onClear={() => {
                                setRows([]);
                                setFile(null);
                                setNluFile(null);
                                setDomainFile(null);
                            }}
                            botIds={selectedImportBotIds}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default ImportIntentPage;
