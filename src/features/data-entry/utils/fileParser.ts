/**
 * File parser utilities for intent import
 * Supports CSV, TSV, TXT, XLS, XLSX formats
 */

import { parseXlsxFromBuffer, ParsedRow as ExcelParsedRow } from './excel.utils';

export type ParsedRow = ExcelParsedRow & {
    responseName?: string;
    responseContent?: string;
    entityIds?: string[];
};

export type ResponseMap = {
    [utteranceName: string]: string;
};

export type ParsedSlotMapping = {
    type: string;
    entity?: string;
};

export type ParsedSlot = {
    name: string;
    slotType: string;
    influenceConversation: boolean;
    initialValue?: string;
    mappings: ParsedSlotMapping[];
};

export type ParsedDomain = {
    responses: ResponseMap;
    actions: string[];
    entityNames: string[];
    actionRefs: Record<string, string>; // utterName → actionName for utter_ that wrap custom actions
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
 * Parse response/utterances YAML file (domain.yml)
 * Builds proper YAML define strings for each utterance, supporting multi-text and conditions.
 */
export async function parseResponseYAML(text: string): Promise<ParsedDomain> {
    const lines = text.split(/\r?\n/);
    const responseMap: ResponseMap = {};
    const actionsList: string[] = [];
    const entityNames: string[] = [];
    const actionRefs: Record<string, string> = {};

    type Variant = {
        text: string;
        conditionSlotName?: string;
        conditionValue?: string;
    };

    let currentUtter: string | null = null;
    let inResponsesSection = false;
    let inActionsSection = false;
    let inEntitiesSection = false;
    let variants: Variant[] = [];
    let pendingCondition: { slotName?: string; value?: string } | null = null;

    const saveCurrentUtter = () => {
        if (currentUtter && variants.length > 0) {
            // Detect single-variant action proxy: text is "action: action_name"
            if (variants.length === 1 && !variants[0].conditionSlotName) {
                const actionMatch = variants[0].text.trim().match(/^action:\s+(\S+)$/);
                if (actionMatch) {
                    actionRefs[currentUtter] = actionMatch[1];
                    variants = [];
                    pendingCondition = null;
                    currentUtter = null;
                    return;
                }
            }

            const yamlLines: string[] = [`${currentUtter}:`];
            for (const v of variants) {
                const escaped = v.text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                if (v.conditionSlotName) {
                    yamlLines.push(`- condition:`);
                    yamlLines.push(`  - type: slot`);
                    yamlLines.push(`    name: ${v.conditionSlotName}`);
                    if (v.conditionValue !== undefined) {
                        yamlLines.push(`    value: "${v.conditionValue}"`);
                    }
                    yamlLines.push(`  text: "${escaped}"`);
                } else {
                    yamlLines.push(`- text: "${escaped}"`);
                }
            }
            responseMap[currentUtter] = yamlLines.join('\n');
        }
        variants = [];
        pendingCondition = null;
        currentUtter = null;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) continue;

        // Top-level section headers have no leading whitespace
        if (!line.startsWith(' ') && !line.startsWith('\t') && trimmed.endsWith(':')) {
            const sectionName = trimmed.slice(0, -1);
            saveCurrentUtter();
            inResponsesSection = sectionName === 'responses';
            inActionsSection = sectionName === 'actions';
            inEntitiesSection = sectionName === 'entities';
            continue;
        }

        if (inEntitiesSection) {
            const m = trimmed.match(/^-\s+(.+)$/);
            if (m) {
                const val = m[1].trim().replace(/^["']|["']$/g, '');
                if (val && !val.includes(':')) entityNames.push(val);
            }
            continue;
        }

        if (inActionsSection) {
            const m = trimmed.match(/^-\s+(.+)$/);
            if (m && !m[1].includes(':')) actionsList.push(m[1].trim());
            continue;
        }

        if (inResponsesSection) {
            // New utter_ response name (e.g. "  utter_greet:")
            if (trimmed.match(/^utter_[A-Za-z0-9_-]+:$/)) {
                saveCurrentUtter();
                currentUtter = trimmed.slice(0, -1);
                continue;
            }

            if (!currentUtter) continue;

            // Start of a conditional response item
            if (trimmed === '- condition:') {
                pendingCondition = {};
                continue;
            }

            if (pendingCondition !== null) {
                if (trimmed === '- type: slot' || trimmed.startsWith('- type:')) continue;
                if (trimmed.startsWith('name:')) {
                    pendingCondition.slotName = trimmed.slice(5).trim().replace(/^["']|["']$/g, '');
                    continue;
                }
                if (trimmed.startsWith('value:')) {
                    pendingCondition.value = trimmed.slice(6).trim().replace(/^["']|["']$/g, '');
                    continue;
                }
            }

            // Plain text variant: "- text: ..."
            // Conditional text (sibling of condition key): "  text: ..."
            const isPlainText = trimmed.startsWith('- text:');
            const isCondText = !trimmed.startsWith('- ') && trimmed.startsWith('text:');

            if (isPlainText || isCondText) {
                let textContent = '';

                if (trimmed.includes(' |')) {
                    // Block scalar — collect subsequent indented lines
                    const baseIndent = (line.match(/^(\s*)/) || ['', ''])[1].length;
                    const blockLines: string[] = [];
                    let j = i + 1;
                    for (; j < lines.length; j++) {
                        const nl = lines[j];
                        const nt = nl.trim();
                        if (!nt) { blockLines.push(''); continue; }
                        const ni = (nl.match(/^(\s*)/) || ['', ''])[1].length;
                        if (ni <= baseIndent) break;
                        blockLines.push(nt);
                    }
                    textContent = blockLines.filter(Boolean).join(' ').trim();
                    i = j - 1;
                } else {
                    const m = trimmed.match(/(?:^-\s+)?text:\s*["']?([\s\S]+?)["']?\s*$/);
                    textContent = m ? m[1].trim() : '';
                }

                if (textContent) {
                    const variant: Variant = { text: textContent };
                    if (pendingCondition?.slotName) {
                        variant.conditionSlotName = pendingCondition.slotName;
                        if (pendingCondition.value !== undefined) {
                            variant.conditionValue = pendingCondition.value;
                        }
                    }
                    variants.push(variant);
                }
                pendingCondition = null;
            }
        }
    }

    saveCurrentUtter();

    if (Object.keys(responseMap).length === 0 && actionsList.length === 0) {
        throw new Error("Không tìm thấy response hoặc action nào trong file. Vui lòng kiểm tra định dạng file domain/responses.");
    }

    return { responses: responseMap, actions: actionsList, entityNames, actionRefs };
}

/**
 * Parse NLU YAML file content
 */
export async function parseYAML(text: string): Promise<ParsedRow[]> {
    const lines = text.split(/\r?\n/);
    const out: ParsedRow[] = [];

    let currentIntent: string | null = null;
    let currentExamples: string[] = [];
    let inNluSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        if (trimmed === 'nlu:' ) {
            inNluSection = true;
            continue;
        }

        if (!inNluSection && !trimmed.startsWith('version:')) {
            continue;
        }

        const intentMatch = trimmed.match(/^-\s+intent:\s*(.+)$/);
        if (intentMatch) {
            if (currentIntent && currentExamples.length > 0) {
                out.push({
                    rawName: currentIntent,
                    name: currentIntent,
                    examples: currentExamples,
                });
            }
            currentIntent = intentMatch[1].trim();
            currentExamples = [];
            continue;
        }

        // Handle regex, lookup, synonym — save entity name and skip their examples
        const otherNluMatch = trimmed.match(/^-\s+(regex|synonym|lookup):\s*(.+)$/);
        if (otherNluMatch) {
            if (currentIntent && currentExamples.length > 0) {
                out.push({
                    rawName: currentIntent,
                    name: currentIntent,
                    examples: currentExamples,
                });
            }
            currentIntent = null;
            currentExamples = [];
            continue;
        }

        if (trimmed.startsWith('examples:')) {
            continue;
        }

        if (currentIntent && trimmed.startsWith('- ') && !trimmed.startsWith('- intent:')) {
            const exampleText = trimmed.substring(2).trim();
            if (exampleText) {
                currentExamples.push(exampleText);
            }
            continue;
        }

        if (trimmed.startsWith('- intent:') || trimmed.startsWith('responses:') || trimmed.startsWith('rules:') || trimmed.startsWith('stories:')) {
            if (currentIntent && currentExamples.length > 0) {
                out.push({
                    rawName: currentIntent,
                    name: currentIntent,
                    examples: currentExamples,
                });
                currentIntent = null;
                currentExamples = [];
            }
        }
    }

    if (currentIntent && currentExamples.length > 0) {
        out.push({
            rawName: currentIntent,
            name: currentIntent,
            examples: currentExamples,
        });
    }

    if (out.length === 0) {
        throw new Error("Không tìm thấy intent nào trong file YAML. Vui lòng kiểm tra định dạng file. Cần có cấu trúc: nlu: -> intent: -> examples:");
    }

    return out;
}

/**
 * Parse slots section from a domain YAML file.
 */
export function parseDomainSlots(text: string): ParsedSlot[] {
    const slots: ParsedSlot[] = [];
    const lines = text.split(/\r?\n/);

    let inSlotsSection = false;
    let currentSlot: ParsedSlot | null = null;
    let inMappings = false;
    let currentMapping: ParsedSlotMapping | null = null;

    const saveMapping = () => {
        if (currentMapping && currentSlot) {
            currentSlot.mappings.push(currentMapping);
            currentMapping = null;
        }
    };

    const saveSlot = () => {
        saveMapping();
        if (currentSlot) slots.push(currentSlot);
        currentSlot = null;
        inMappings = false;
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const indent = (line.match(/^(\s*)/) || ['', ''])[1].length;

        // Top-level section headers
        if (indent === 0 && trimmed.endsWith(':')) {
            saveSlot();
            inSlotsSection = trimmed === 'slots:';
            continue;
        }

        if (!inSlotsSection) continue;

        // Slot name at indent 2: e.g. "  nganh_hien_tai:"
        if (indent === 2 && trimmed.endsWith(':') && !trimmed.startsWith('-')) {
            saveSlot();
            currentSlot = { name: trimmed.slice(0, -1), slotType: 'text', influenceConversation: false, mappings: [] };
            inMappings = false;
            continue;
        }

        if (!currentSlot) continue;

        // Slot properties at indent 4
        if (indent === 4) {
            if (trimmed.startsWith('type:')) {
                currentSlot.slotType = trimmed.slice(5).trim();
            } else if (trimmed.startsWith('influence_conversation:')) {
                currentSlot.influenceConversation = trimmed.includes('true');
            } else if (trimmed.startsWith('initial_value:')) {
                currentSlot.initialValue = trimmed.slice(14).trim();
            } else if (trimmed === 'mappings:') {
                inMappings = true;
            }
            continue;
        }

        if (!inMappings) continue;

        // Mapping items at indent 6: "      - type: from_entity"
        if (indent === 6 && trimmed.startsWith('- type:')) {
            saveMapping();
            currentMapping = { type: trimmed.replace(/^-\s*type:\s*/, '').trim() };
            continue;
        }

        // Mapping property at indent 8: "        entity: nganh"
        if (indent === 8 && currentMapping) {
            if (trimmed.startsWith('entity:')) {
                currentMapping.entity = trimmed.slice(7).trim().replace(/^["']|["']$/g, '');
            }
        }
    }

    saveSlot();
    return slots;
}

/**
 * Build a slot define string (DB format, no leading spaces) from parsed slot data.
 * Entity names in from_entity mappings are replaced with [entityId] if found in the map.
 */
export function buildSlotDefineFromParsed(slot: ParsedSlot, entityNameToId: Map<string, string>): string {
    const lines: string[] = [`${slot.name}:`];
    lines.push(`  type: ${slot.slotType}`);
    if (slot.influenceConversation) {
        lines.push(`  influence_conversation: true`);
    } else {
        lines.push(`  influence_conversation: false`);
    }
    if (slot.initialValue !== undefined && slot.initialValue !== '') {
        lines.push(`  initial_value: ${slot.initialValue}`);
    }
    lines.push(`  mappings:`);

    const mappings = slot.mappings.length > 0 ? slot.mappings : [{ type: 'custom' }];
    for (const m of mappings) {
        if (m.type === 'from_entity' && m.entity) {
            const entityId = entityNameToId.get(m.entity);
            lines.push(`  - type: from_entity`);
            lines.push(`    entity: ${entityId || m.entity}`);
        } else {
            lines.push(`  - type: ${m.type}`);
        }
    }

    return lines.join('\n');
}

/**
 * Parse all unique entity names from an NLU YAML file.
 * Collects names from regex/lookup/synonym block headers AND inline (entity_name) annotations.
 */
export function parseNLUEntityNames(text: string): string[] {
    const names = new Set<string>();
    const lines = text.split(/\r?\n/);
    let inNluSection = false;
    let inIntentExamples = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        if (trimmed === 'nlu:') { inNluSection = true; continue; }
        if (!inNluSection) continue;

        // regex/lookup/synonym blocks define entity names
        const blockMatch = trimmed.match(/^-\s+(regex|lookup|synonym):\s*(.+)$/);
        if (blockMatch) {
            names.add(blockMatch[2].trim());
            inIntentExamples = false;
            continue;
        }

        if (trimmed.match(/^-\s+intent:/)) {
            inIntentExamples = false;
            continue;
        }

        if (trimmed.startsWith('examples:')) {
            inIntentExamples = true;
            continue;
        }

        // Extract (entity_name) from inline intent example annotations
        if (inIntentExamples && trimmed.startsWith('- ')) {
            for (const m of trimmed.substring(2).matchAll(/\(([a-z_][a-z0-9_]*)\)/g)) {
                names.add(m[1]);
            }
        }
    }

    return Array.from(names);
}

/**
 * Extract entity names referenced by inline annotations in a list of example strings.
 * E.g. "ngành [CNTT](nganh) năm [2024](nam)" → ["nganh", "nam"]
 */
export function extractIntentEntityNames(examples: string[]): string[] {
    const names = new Set<string>();
    for (const ex of examples) {
        for (const m of ex.matchAll(/\(([a-z_][a-z0-9_]*)\)/g)) {
            names.add(m[1]);
        }
    }
    return Array.from(names);
}

/**
 * Merge NLU data with Response data
 */
export function mergeNLUWithResponses(nlus: ParsedRow[], domain: ParsedDomain): ParsedRow[] {
    const { responses, actions, actionRefs } = domain;
    return nlus.map((intent) => {
        const directUtterName = `utter_${intent.name}`;
        const normalizedUtterName = `utter_${formatIntentName(intent.name)}`;
        const directActionName = `action_${intent.name}`;
        const normalizedActionName = `action_${formatIntentName(intent.name)}`;

        let matchedName = "";
        let responseContent = "";

        // Check action refs first (utter_ that wraps a custom action)
        if (actionRefs[directUtterName]) {
            matchedName = directUtterName;
            responseContent = `action: ${actionRefs[directUtterName]}`;
        } else if (actionRefs[normalizedUtterName]) {
            matchedName = normalizedUtterName;
            responseContent = `action: ${actionRefs[normalizedUtterName]}`;
        // Regular utter_ response
        } else if (responses[directUtterName]) {
            matchedName = directUtterName;
            responseContent = responses[directUtterName];
        } else if (responses[normalizedUtterName]) {
            matchedName = normalizedUtterName;
            responseContent = responses[normalizedUtterName];
        // Custom action from actions: section
        } else if (actions.includes(directActionName)) {
            matchedName = directActionName;
            responseContent = `action: ${directActionName}`;
        } else if (actions.includes(normalizedActionName)) {
            matchedName = normalizedActionName;
            responseContent = `action: ${normalizedActionName}`;
        }

        return {
            ...intent,
            responseName: matchedName || undefined,
            responseContent: responseContent,
        };
    });
}

/**
 * Parse XLSX/XLS file using ExcelJS
 */
export async function parseXLSX(file: File): Promise<ParsedRow[]> {
    const arrayBuffer = await file.arrayBuffer();
    try {
        return await parseXlsxFromBuffer(arrayBuffer);
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to parse XLSX");
    }
}

/**
 * Main file parser - auto-detects format and parses accordingly
 */
export async function parseFile(file: File): Promise<ParsedRow[]> {
    const fileName = (file.name || "").toLowerCase();

    if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
        return await parseXLSX(file);
    } else if (fileName.endsWith(".yaml") || fileName.endsWith(".yml")) {
        const text = await file.text();
        return await parseYAML(text);
    } else {
        const text = await file.text();
        return await parseCSV(text);
    }
}

/**
 * Extract raw YAML blocks for entities from NLU file
 */
export function parseNLUEntityDefinitions(text: string): Record<string, string> {
    const entityBlocks: Record<string, string[]> = {};
    const lines = text.split(/\r?\n/);
    
    let currentEntityName: string | null = null;
    let currentBlockLines: string[] = [];
    
    const saveBlock = () => {
        if (currentEntityName && currentBlockLines.length > 0) {
            if (!entityBlocks[currentEntityName]) {
                entityBlocks[currentEntityName] = [];
            }
            entityBlocks[currentEntityName].push(currentBlockLines.join('\n'));
        }
    };
    
    for (const line of lines) {
        const trimmed = line.trim();
        const blockMatch = trimmed.match(/^-\s+(regex|lookup|synonym):\s*(.+)$/);
        
        if (blockMatch) {
            saveBlock();
            currentEntityName = blockMatch[2].trim();
            currentBlockLines = [line];
            continue;
        }
        
        if (trimmed.match(/^-\s+intent:/)) {
            saveBlock();
            currentEntityName = null;
            currentBlockLines = [];
            continue;
        }
        
        if (currentEntityName) {
            currentBlockLines.push(line);
        }
    }
    saveBlock();
    
    const result: Record<string, string> = {};
    for (const [name, blocks] of Object.entries(entityBlocks)) {
        result[name] = blocks.join('\n');
    }
    return result;
}

/**
 * Extract raw YAML blocks for slots from Domain file
 */
export function parseDomainSlotDefinitions(text: string): Record<string, string> {
    const slots: Record<string, string> = {};
    const lines = text.split(/\r?\n/);
    
    let inSlotsSection = false;
    let currentSlotName: string | null = null;
    let currentSlotLines: string[] = [];
    
    const saveSlot = () => {
        if (currentSlotName && currentSlotLines.length > 0) {
            slots[currentSlotName] = currentSlotLines.join('\n');
        }
    };
    
    for (const line of lines) {
        const trimmed = line.trim();
        const indent = (line.match(/^(\s*)/) || ['', ''])[1].length;
        
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        if (indent === 0 && trimmed.endsWith(':')) {
            saveSlot();
            inSlotsSection = trimmed === 'slots:';
            currentSlotName = null;
            currentSlotLines = [];
            continue;
        }
        
        if (!inSlotsSection) continue;
        
        if (indent === 2 && trimmed.endsWith(':') && !trimmed.startsWith('-')) {
            saveSlot();
            currentSlotName = trimmed.slice(0, -1);
            currentSlotLines = [`${currentSlotName}:`];
            continue;
        }
        
        if (currentSlotName) {
            currentSlotLines.push(line.length >= 2 ? line.substring(2) : line);
        }
    }
    
    saveSlot();
    return slots;
}
