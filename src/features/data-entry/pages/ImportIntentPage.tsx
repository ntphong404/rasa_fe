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
import { parseFile, formatIntentName, type ParsedRow, parseYAML, parseResponseYAML, mergeNLUWithResponses, parseNLUEntityNames, extractIntentEntityNames, parseDomainSlots, buildSlotDefineFromParsed } from "../utils/fileParser";
import { entityService } from "@/features/entity/api/service";
import { slotService } from "@/features/slots/api/service";
import { generateTemplate } from "../utils/templateGenerator";

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
    const [isImporting, setIsImporting] = useState(false);
    const [rows, setRows] = useState<Row[]>([]);
    const [selected, setSelected] = useState<Record<number, boolean>>({});
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [editingRow, setEditingRow] = useState<number | null>(null);
    const [editIntentName, setEditIntentName] = useState("");
    const [editLabel, setEditLabel] = useState("");
    const [editAnswer, setEditAnswer] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
    const [editingExample, setEditingExample] = useState<{ rowIdx: number; exampleIdx: number } | null>(null);
    const [editExampleText, setEditExampleText] = useState("");
    const [generatingRowIdx, setGeneratingRowIdx] = useState<number | null>(null);
    const [hasImported, setHasImported] = useState(false);
    const [duplicateStrategy, setDuplicateStrategy] = useState<"skip" | "overwrite" | "fail">("overwrite");
    const [commonImportLabel, setCommonImportLabel] = useState("");
    const [labelPrefix, setLabelPrefix] = useState("");
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
            const nluText = await nlu.text();
            const domainText = await domain.text();

            const parsedNLU = await parseYAML(nluText);
            const parsedResponses = await parseResponseYAML(domainText);

            // Resolve entity names to IDs (find existing or create new)
            const nluEntityNames = parseNLUEntityNames(nluText);
            const domainEntityNames = parsedResponses.entityNames || [];
            const uniqueEntityNames = Array.from(new Set([...nluEntityNames, ...domainEntityNames]));

            const importBotIds = isManager
                ? managerAssignedBotId ? [managerAssignedBotId] : []
                : selectedImportBotIds.filter(Boolean);

            const entityNameToId = new Map<string, string>();
            const createdEntities: string[] = [];
            const foundEntities: string[] = [];

            for (const entityName of uniqueEntityNames) {
                try {
                    const result = await entityService.fetchEntities({ search: entityName, limit: 10 });
                    const existing = result.data?.find(e => e.name === entityName);
                    if (existing?._id) {
                        entityNameToId.set(entityName, String(existing._id));
                        foundEntities.push(entityName);
                    } else if (importBotIds.length > 0) {
                        const created = await entityService.createEntity({
                            name: entityName,
                            description: '',
                            define: '',
                            botIds: importBotIds,
                        });
                        if (created?._id) {
                            entityNameToId.set(entityName, String(created._id));
                            createdEntities.push(entityName);
                        }
                    }
                } catch {
                    // Skip — intent will be imported without this entity link
                }
            }

            // Resolve slots — find existing or create new
            const parsedSlots = parseDomainSlots(domainText);
            let slotsCreated = 0;
            let slotsSkipped = 0;

            for (const slot of parsedSlots) {
                try {
                    const searchResult = await slotService.fetchSlots({ search: slot.name, limit: 10 });
                    const existing = (searchResult as any)?.data?.find((s: any) => s.name === slot.name);
                    if (existing) {
                        slotsSkipped++;
                        continue;
                    }
                    if (importBotIds.length > 0) {
                        const define = buildSlotDefineFromParsed(slot, entityNameToId);
                        // Find entity ID for the slot's from_entity mapping (first one)
                        const entityMapping = slot.mappings.find(m => m.type === 'from_entity' && m.entity);
                        const entityId = entityMapping?.entity ? entityNameToId.get(entityMapping.entity) ?? null : null;
                        await slotService.createSlot({
                            name: slot.name,
                            description: '',
                            define,
                            botIds: importBotIds,
                            entity: entityId,
                            intent: null,
                            action: null,
                            roles: [],
                        });
                        slotsCreated++;
                    }
                } catch {
                    // Skip on error — slot creation is best-effort
                }
            }

            // Merge NLU with responses, attach entity IDs per intent
            const merged = mergeNLUWithResponses(parsedNLU, parsedResponses);
            const merged2 = merged.map(m => {
                const intentEntityNames = extractIntentEntityNames(m.examples);
                const entityIds = intentEntityNames
                    .map(n => entityNameToId.get(n))
                    .filter(Boolean) as string[];
                return {
                    ...m,
                    response: m.responseContent || (m.response || ""),
                    entityIds,
                };
            });

            setRows(merged2);
            const sel: Record<number, boolean> = {};
            merged2.forEach((_, i) => (sel[i] = true));
            setSelected(sel);
            setHasImported(false);

            toast.success(t("Read intents successfully from files", { count: merged2.length, nluName: nlu.name, domainName: domain.name }));
            if (createdEntities.length > 0) {
                toast.info(`Created ${createdEntities.length} new entity record(s): ${createdEntities.join(', ')}`);
            }
            if (foundEntities.length > 0) {
                toast.info(`Linked ${foundEntities.length} existing entity record(s): ${foundEntities.join(', ')}`);
            }
            if (slotsCreated > 0) {
                toast.info(`Created ${slotsCreated} new slot(s) from domain file.`);
            }
            if (slotsSkipped > 0) {
                toast.info(`Skipped ${slotsSkipped} slot(s) already in database.`);
            }
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
            toast.success(t("Read rows successfully from file", { count: parsed.length, fileName: f.name }));
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

    const generateNameFromLabel = (label: string): string => {
        return formatIntentName(label);
    };

    const applyLabelPrefixToAllRows = (prefix: string) => {
        if (!prefix.trim()) {
            return toast.error(t("Please enter a label prefix"));
        }
        
        const formattedPrefix = formatIntentName(prefix);
        if (!formattedPrefix) {
            return toast.error(t("Could not generate name from label. Try another label."));
        }

        setRows((prev) => {
            const updated = prev.map((row, index) => ({
                ...row,
                name: `${formattedPrefix}_${index + 1}`,
                label: prefix.trim(),
            }));
            return updated;
        });

        toast.success(t("Applied label prefix to all intents: {{prefix}}", { prefix: formattedPrefix }));
    };

    const handleEditRow = (index: number) => {
        const row = rows[index];
        setEditingRow(index);
        setEditIntentName(row.name || "");
        setEditLabel(row.label || "");
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
                label: editLabel.trim(),
                response: editAnswer.trim(),
            };
            return updated;
        });
        setEditingRow(null);
        toast.success(t("Updated successfully"));
    };

    const handleGenerateNameFromLabel = () => {
        if (!editLabel.trim()) {
            return toast.error(t("Please enter a label first"));
        }
        const generatedName = generateNameFromLabel(editLabel);
        if (!generatedName) {
            return toast.error(t("Could not generate name from label. Try another label."));
        }
        setEditIntentName(generatedName);
        toast.success(t("Generated name from label: {{name}}", { name: generatedName }));
    };

    const handleCancelEdit = () => {
        setEditingRow(null);
        setEditIntentName("");
        setEditLabel("");
        setEditAnswer("");
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

    const isDuplicateKeyError = (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "";
        return /E11000\s+duplicate key error/i.test(String(msg));
    };

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
            try {
                const formattedName = row.name;
                const resolvedLabel = importMode === "yaml"
                    ? (sharedLabel || undefined)
                    : (row.label?.trim() || undefined);
                // Use all examples from the row
                const examplesArr: string[] = row.examples.filter(ex => ex.trim());

                // Create using the new createFull API
                // This API creates intent, response, rule, and examples all at once
                const responseValue = row.response?.trim() || "";
                // Detect which mode to use based on response content
                const actionMatch = importMode === 'yaml'
                    ? responseValue.match(/^action:\s+(.+)$/)
                    : null;
                const isYamlDefine = !actionMatch && importMode === 'yaml' && responseValue.startsWith('utter_');

                const result = await intentService.createFull({
                    name: formattedName,
                    description: "",
                    examples: examplesArr,
                    ...(actionMatch
                        ? { actionName: actionMatch[1].trim(), answer: "" }
                        : isYamlDefine
                            ? { define: responseValue, answer: "" }
                            : { answer: responseValue }
                    ),
                    botIds: importBotIds,
                    label: resolvedLabel,
                    entities: row.entityIds || [],
                    source: importMode === 'excel' ? 'excel' : 'manual',
                    duplicateStrategy,
                });

                // Mark as success
                setRows((prev) => {
                    const updated = [...prev];
                    updated[i] = { ...updated[i], status: 'success', error: undefined };
                    return updated;
                });
                successCount++;
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

        setIsImporting(false);

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
            setLabelPrefix("");
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
                        <div className="surface-card-strong flex h-full flex-col rounded-lg border border-indigo-100 dark:border-white/15">
                            <div className="flex items-center justify-between px-3 py-3 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0 dark:border-white/10 dark:from-slate-950 dark:to-black">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-indigo-600" />
                                    <div>
                                        <div className="font-semibold text-base text-indigo-900">{t("Data preview")}</div>
                                        <div className="text-xs text-indigo-600">{t("Question groups count: {{count}}", { count: rows.length })}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {progress.total > 0 && (
                                        <div className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-400/40 dark:bg-slate-900 dark:text-indigo-300">
                                            {t("Progress")}: {progress.done}/{progress.total}
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
                                        {isGenerating ? t("Generating...") : t("Generate more question groups")}
                                    </Button>
                                </div>
                            </div>

                            {/* Label Prefix Section */}
                            {rows.length > 0 && (
                                <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900 px-4 py-3">
                                    <div className="space-y-2">
                                        <div className="flex gap-3 items-end">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 w-40 flex-shrink-0">
                                                {t("label_prefix")}
                                            </label>
                                            <div className="w-64">
                                                <Input
                                                    value={labelPrefix}
                                                    onChange={(e) => setLabelPrefix(e.target.value)}
                                                    placeholder={t("label_prefix_placeholder")}
                                                    className="text-sm h-9"
                                                />
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => applyLabelPrefixToAllRows(labelPrefix)}
                                                disabled={!labelPrefix.trim()}
                                                className="gap-2 h-9"
                                            >
                                                <Sparkles className="h-4 w-4" />
                                                {t("apply_label")}
                                            </Button>
                                            <p className="text-xs text-slate-500 ml-auto">
                                                {t("label_preview_text", {
                                                    prefix: labelPrefix || "label",
                                                    count: rows.length,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="overflow-auto flex-1 border-t">
                            <table className="w-full text-left table-fixed">
                                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 border-b dark:border-white/10 dark:from-slate-900 dark:to-slate-900">
                                    <tr>
                                        <th className="px-4 py-3 w-12 text-xs font-semibold text-slate-600 uppercase">#</th>
                                        <th className="px-4 py-3 w-16 text-xs font-semibold text-slate-600 uppercase">{t("Select")}</th>
                                        <th className="px-4 py-3 w-80 text-xs font-semibold text-slate-600 uppercase">{t("Question group name")}</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">{t("Answer")}</th>
                                        <th className="px-4 py-3 w-32 text-xs font-semibold text-slate-600 uppercase">{t("Actions")}</th>
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
                                                : (i % 2 === 0 ? "bg-indigo-100/60 dark:bg-indigo-950/30" : "bg-white dark:bg-slate-900");

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
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <label className="text-xs text-slate-500 block mb-1">{t("Label (for auto-generating name)")}:</label>
                                                                        <div className="flex gap-2">
                                                                            <Input
                                                                                value={editLabel}
                                                                                onChange={(e) => setEditLabel(e.target.value)}
                                                                                className="w-full text-sm"
                                                                                placeholder={t("e.g., tuyen_sinh_2024")}
                                                                            />
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={handleGenerateNameFromLabel}
                                                                                className="whitespace-nowrap text-xs"
                                                                                title={t("Auto-generate name from label")}
                                                                            >
                                                                                {t("Generate")}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs text-slate-500 block mb-1">{t("Question group name")}:</label>
                                                                        <Input
                                                                            value={editIntentName}
                                                                            onChange={(e) => setEditIntentName(e.target.value)}
                                                                            className="w-full font-mono text-sm"
                                                                            placeholder={t("question_group_name")}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 align-top">
                                                                <Textarea
                                                                    value={editAnswer}
                                                                    onChange={(e) => setEditAnswer(e.target.value)}
                                                                    className="w-full min-h-[80px]"
                                                                    placeholder={t("Enter answer...")}
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
                                                                        {r.label && (
                                                                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate" title={r.label}>
                                                                                {t("Label")}: {r.label}
                                                                            </div>
                                                                        )}
                                                                        <div className="text-xs text-slate-400 mt-1">
                                                                            {t("Questions count: {{count}}", { count: r.examples.length })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 align-top">
                                                                {importMode === 'yaml' && r.response?.startsWith('utter_') ? (
                                                                    <pre className="text-xs text-slate-600 font-mono bg-slate-100 dark:bg-slate-800 rounded p-1 max-h-20 overflow-auto whitespace-pre-wrap break-words">
                                                                        {r.response}
                                                                    </pre>
                                                                ) : (
                                                                    <div className="text-sm text-slate-600 line-clamp-2 break-words" title={r.response}>
                                                                        {r.response}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2 align-top">
                                                                <div className="flex gap-1 items-center">
                                                                    {isSuccess ? (
                                                                        <span className="text-green-600 text-sm font-medium">{t("Saved")}</span>
                                                                    ) : (
                                                                        <>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => handleEditRow(i)}
                                                                                className="h-8 w-8 p-0"
                                                                                title={t("Edit question group")}
                                                                            >
                                                                                <Pencil className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => handleGenerateExamplesForRow(i)}
                                                                                disabled={generatingRowIdx === i}
                                                                                className="h-8 w-8 p-0"
                                                                                title={t("Generate more questions")}
                                                                            >
                                                                                <Sparkles className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => handleDeleteRow(i)}
                                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                                                title={t("Delete question group")}
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
                                                            <div className="ml-8 rounded-lg border border-indigo-200 bg-slate-50/50 p-2 pl-3 dark:border-indigo-400/30 dark:bg-slate-900/70">
                                                                <div className="font-medium text-sm mb-2 text-indigo-700">
                                                                    {t("Similar questions")}:
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {r.examples.map((ex, exIdx) => (
                                                                        <div key={exIdx} className={`group flex items-start gap-2 rounded border border-slate-300 p-2 transition-colors hover:border-indigo-400 dark:border-white/15 ${i % 2 === 0 ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'bg-white dark:bg-slate-900'}`}>
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
                                                                <strong>{t("Error")}:</strong> {r.error}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                {hasValidationError && r.validationError && (
                                                    <tr key={`${i}-validation`} className="bg-red-50">
                                                        <td colSpan={5} className="px-4 py-2">
                                                            <div className="text-red-600 text-sm flex items-center gap-2">
                                                                <strong>{t("Validation")}:</strong> {r.validationError}
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleGenerateExamplesForRow(i)}
                                                                    disabled={generatingRowIdx === i}
                                                                    className="h-6 text-xs"
                                                                >
                                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                                    {t("Generate more questions")}
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

                            <div className="flex flex-shrink-0 gap-3 border-t bg-gray-50 px-3 py-3 dark:border-white/10 dark:bg-slate-900/70">
                                <div className="flex items-center gap-2 rounded border bg-white px-3 py-1.5 dark:bg-slate-900">
                                    <span className="text-sm text-slate-600 dark:text-slate-300">{t("Duplicate handling")}</span>
                                    <select
                                        className="text-sm border rounded px-2 py-1 bg-white dark:bg-slate-900"
                                        value={duplicateStrategy}
                                        onChange={(e) => setDuplicateStrategy(e.target.value as "skip" | "overwrite" | "fail")}
                                        disabled={isImporting}
                                    >
                                        <option value="overwrite">{t("Overwrite if content differs")}</option>
                                        <option value="skip">{t("Skip duplicates")}</option>
                                        <option value="fail">{t("Stop and report duplicates")}</option>
                                    </select>
                                </div>
                                <Button 
                                    onClick={handleImport} 
                                    disabled={isImporting} 
                                    className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2"
                                >
                                    <Database className="h-4 w-4" />
                                    {isImporting ? t("Importing...") : t("Import selected data")}
                                </Button>
                                {hasImported && rows.some(r => r.status === 'error') && (
                                    <Button onClick={handleRetryFailed} variant="outline" disabled={isImporting} className="gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        {t("Retry failed rows")}
                                    </Button>
                                )}
                                <Button 
                                    variant="ghost" 
                                    onClick={() => { setRows([]); setFile(null); setSelected({}); setHasImported(false); setCommonImportLabel(""); setLabelPrefix(""); }}
                                    className="gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    {t("Cancel / Clear all")}
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
