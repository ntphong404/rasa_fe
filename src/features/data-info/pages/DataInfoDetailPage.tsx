import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { storyService } from "@/features/stories/api/service";
import { intentService } from "@/features/intents/api/service";
import { responseService } from "@/features/reponses/api/service";
import { actionService } from "@/features/action/api/service";
import { IStory } from "@/interfaces/story.interface";
import { IMyResponse } from "@/interfaces/response.interface";
import { IntentDetailResponse } from "@/features/intents/api/dto/IntentResponse";
import { toast } from "sonner";

export default function DataInfoDetailPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const storyId = searchParams.get("id");

    const [story, setStory] = useState<IStory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [intents, setIntents] = useState<Array<IntentDetailResponse & { _id: string }>>([]);
    const [responses, setResponses] = useState<IMyResponse[]>([]);
    const [actions, setActions] = useState<any[]>([]);

    const [savingIntentId, setSavingIntentId] = useState<string | null>(null);
    const [savingResponseId, setSavingResponseId] = useState<string | null>(null);
    const [editingIntentId, setEditingIntentId] = useState<string | null>(null);
    const [editingIntentText, setEditingIntentText] = useState<string>("");

    const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
    const [editingResponseText, setEditingResponseText] = useState<string>("");
    const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});

    const toggleExpanded = (idx: number) => {
        setExpandedMap(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const getSnippet = (text?: string, maxLines = 5) => {
        if (!text) return "-";
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length <= maxLines) return lines.join('\n');
        return lines.slice(0, maxLines).join('\n');
    };

    useEffect(() => {
        const load = async () => {
            if (!storyId) {
                setLoadError(t("Story ID not found"));
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const res = await storyService.getStoryById(storyId);
                const s = res.data;
                setStory(s);

                // load intents, responses, actions (if present)
                const intentPromises = (s.intents || []).map((itOrId: any) => {
                    if (!itOrId) return Promise.resolve(null);
                    if (typeof itOrId === "string") {
                        return intentService.getIntentById(String(itOrId)).then((r) => ({ ...(r as any), _id: String(itOrId) })).catch((e) => null);
                    }
                    // already populated object
                    return Promise.resolve({ ...(itOrId as any), _id: String((itOrId as any)._id) });
                });

                const responsePromises = (s.responses || []).map((rOrId: any) => {
                    if (!rOrId) return Promise.resolve(null);
                    if (typeof rOrId === "string") {
                        return responseService.getResponseById(String(rOrId)).catch((e) => null);
                    }
                    return Promise.resolve(rOrId as any);
                });

                const actionPromises = (s.action || []).map((aOrId: any) => {
                    if (!aOrId) return Promise.resolve(null);
                    if (typeof aOrId === "string") {
                        return actionService.getActionById(String(aOrId)).catch((e) => null);
                    }
                    return Promise.resolve(aOrId as any);
                });

                const loadedIntents = (await Promise.all(intentPromises)).filter(Boolean) as any[];
                const loadedResponses = (await Promise.all(responsePromises)).filter(Boolean) as IMyResponse[];
                const loadedActions = (await Promise.all(actionPromises)).filter(Boolean) as any[];

                setIntents(loadedIntents);
                setResponses(loadedResponses || []);
                setActions(loadedActions || []);
            } catch (error) {
                console.error("Error loading story details:", error);
                setLoadError(t("Failed to load story"));
                toast.error(t("Failed to load story"));
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [storyId, t]);

    const handleSaveIntent = async (intentId: string) => {
        const intent = intents.find((i) => i._id === intentId);
        if (!intent) return;
        setSavingIntentId(intentId);
        try {
            // backend expects IIntent shape; cast to any to avoid TS mismatch
            await intentService.updateIntent(intentId, intent as any);
            toast.success(t("Intent updated"));
        } catch (error) {
            console.error("Failed to update intent", error);
            toast.error(t("Failed to update intent"));
        } finally {
            setSavingIntentId(null);
        }
    };

    const handleSaveResponse = async (responseId: string) => {
        const resp = responses.find((r) => r._id === responseId);
        if (!resp) return;
        setSavingResponseId(responseId);
        try {
            await responseService.updateResponse(responseId, resp as any);
            toast.success(t("Response updated"));
        } catch (error) {
            console.error("Failed to update response", error);
            toast.error(t("Failed to update response"));
        } finally {
            setSavingResponseId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>{t("Loading story...")}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (loadError || !story) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t("Back")}
                    </Button>
                </div>
                <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{loadError || t("Story not found")}</p>
                    <Button onClick={() => navigate(-1)}>{t("Go back")}</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t("Back")}
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{t("Story Details")}</h1>
                        <p className="text-muted-foreground">{t("Viewing")}: {story.name}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <section>
                    <h2 className="text-lg font-semibold mb-2">{t("Story")}</h2>
                    <div className="p-4 border rounded bg-white">
                        <p><strong>{t("Name")}:</strong> {story.name}</p>
                        <p className="mt-2"><strong>{t("Description")}:</strong> {story.description || "-"}</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-2">{t("Q&A (theo define)")}</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {/* parse story.define into ordered steps and render intent -> response pairs */}
                        {(() => {
                            const parseStepsFromDefine = (def?: string) => {
                                const res: Array<{ kind: string; ids: string[] }> = [];
                                if (!def) return res;
                                const re = /^\s*-\s*(intent|action|response):\s*\[([^\]]*)\]/gim;
                                let m: RegExpExecArray | null;
                                while ((m = re.exec(def)) !== null) {
                                    const kind = m[1];
                                    const ids = m[2]
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean);
                                    res.push({ kind, ids });
                                }
                                return res;
                            };

                            const extractIntentExamples = (defineText?: string) => {
                                if (!defineText) return [] as string[];
                                const m = defineText.match(/examples:\s*\|([\s\S]*)/m);
                                if (!m) return [];
                                const block = m[1];
                                const lines = block
                                    .split(/\r?\n/)
                                    .map((l) => l.replace(/^\s*-\s*/, "").trim())
                                    .filter(Boolean);
                                return lines;
                            };

                            const extractResponseText = (defineText?: string) => {
                                if (!defineText) return "";
                                const m = defineText.match(/text:\s*\|([\s\S]*)/m) || defineText.match(/-\s*text:\s*\|([\s\S]*)/m);
                                if (m) {
                                    const block = m[1];
                                    // take first non-empty line as main answer or full block
                                    const content = block
                                        .split(/\r?\n/)
                                        .map((l) => l.replace(/^\s*/, "").trim())
                                        .filter(Boolean)
                                        .join("\n");
                                    return content;
                                }
                                // fallback to defineText
                                return defineText;
                            };

                            const steps = parseStepsFromDefine(story.define);
                            const pairs: Array<{ intent: any | null; nextKind?: 'action' | 'response'; nextData?: any | null }> = [];

                            for (let i = 0; i < steps.length; i++) {
                                const s = steps[i];
                                if (s.kind === "intent") {
                                    for (const id of s.ids) {
                                        const intentObj = intents.find((it) => String((it as any)._id) === String(id)) || null;
                                        let nextKind: 'action' | 'response' | undefined = undefined;
                                        let nextData: any | null = null;
                                        for (let j = i + 1; j < steps.length; j++) {
                                            if (steps[j].kind === 'response') {
                                                // try responses first, fallback to actions if id exists there
                                                const foundResp = steps[j].ids.find((x) => responses.some((r) => String(r._id) === String(x)));
                                                if (foundResp) {
                                                    nextKind = 'response';
                                                    nextData = responses.find((r) => String(r._id) === String(foundResp)) || null;
                                                    break;
                                                }
                                                const foundInActions = steps[j].ids.find((x) => actions.some((a) => String(a._id) === String(x)));
                                                if (foundInActions) {
                                                    nextKind = 'action';
                                                    nextData = actions.find((a) => String(a._id) === String(foundInActions)) || null;
                                                    break;
                                                }
                                            }
                                            if (steps[j].kind === 'action') {
                                                // try actions first, fallback to responses if id exists there
                                                const foundAct = steps[j].ids.find((x) => actions.some((a) => String(a._id) === String(x)));
                                                if (foundAct) {
                                                    nextKind = 'action';
                                                    nextData = actions.find((a) => String(a._id) === String(foundAct)) || null;
                                                    break;
                                                }
                                                const foundInResp = steps[j].ids.find((x) => responses.some((r) => String(r._id) === String(x)));
                                                if (foundInResp) {
                                                    nextKind = 'response';
                                                    nextData = responses.find((r) => String(r._id) === String(foundInResp)) || null;
                                                    break;
                                                }
                                            }
                                        }
                                        pairs.push({ intent: intentObj, nextKind, nextData });
                                    }
                                }
                            }

                            if (pairs.length === 0) {
                                return <div className="text-sm text-muted-foreground">{t("No Q&A found")}</div>;
                            }

                            return pairs.map((p, idx) => {
                                const intentExamples = extractIntentExamples(p.intent?.define);
                                const primary = intentExamples.length > 0 ? intentExamples[0] : (p.intent?.define || "");
                                const similar = intentExamples.slice(1);
                                const isAction = p.nextKind === 'action';
                                const answer = isAction ? (p.nextData?.define || "-") : (extractResponseText(p.nextData?.define) || "-");

                                return (
                                    <div key={idx} className="p-4 border rounded bg-white relative">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-sm text-muted-foreground">Câu hỏi:</div>
                                                        {p.intent && (
                                                            editingIntentId === String(p.intent._id) ? (
                                                                <div className="flex gap-2">
                                                                    <Button size="sm" variant="outline" onClick={() => {
                                                                        setEditingIntentId(null);
                                                                        setEditingIntentText("");
                                                                    }}>{t("Cancel")}</Button>
                                                                    <Button size="sm" onClick={() => {
                                                                        const lines = editingIntentText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                                                                        const newDefine = `- intent: ${(p.intent as any).name}\n  examples: |\n    - ${lines.join('\n    - ')}`;
                                                                        setIntents(prev => prev.map(it => String(it._id) === String(p.intent._id) ? { ...it, define: newDefine } : it));
                                                                        setEditingIntentId(null);
                                                                        setEditingIntentText("");
                                                                        handleSaveIntent(String(p.intent._id));
                                                                    }}>{savingIntentId === String(p.intent._id) ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Save")}</Button>
                                                                </div>
                                                            ) : (
                                                                <Button size="sm" variant="ghost" onClick={() => {
                                                                    const combined = [primary, ...similar].filter(Boolean).join('\n');
                                                                    setEditingIntentId(String((p.intent as any)._id));
                                                                    setEditingIntentText(combined);
                                                                }}>{t("Sửa")}</Button>
                                                            )
                                                        )}
                                                    </div>
                                                    {editingIntentId === String(p.intent?._id) ? (
                                                        <textarea
                                                            className="w-full border rounded p-2 mt-1"
                                                            rows={3}
                                                            value={editingIntentText}
                                                            onChange={(e) => setEditingIntentText(e.target.value)}
                                                        />
                                                    ) : (
                                                        <div className="mt-1 font-medium">{primary}</div>
                                                    )}
                                                </div>

                                                <div className="mb-3">
                                                    <div className="text-sm text-muted-foreground">Các câu hỏi tương tự:</div>
                                                    {similar.length === 0 ? (
                                                        <div className="mt-1 text-sm text-muted-foreground">-</div>
                                                    ) : (
                                                        <ul className="list-disc pl-5 mt-1 text-sm">
                                                            {similar.map((s, i) => (
                                                                <li key={i}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-sm text-muted-foreground">Câu trả lời:</div>
                                                        {/* If next is action, show no edit button */}
                                                        {!isAction && p.nextData && (
                                                            editingResponseId === String(p.nextData._id) ? (
                                                                <div className="flex gap-2">
                                                                    <Button size="sm" variant="outline" onClick={() => {
                                                                        setEditingResponseId(null);
                                                                        setEditingResponseText("");
                                                                    }}>{t("Cancel")}</Button>
                                                                    <Button size="sm" onClick={() => {
                                                                        const text = editingResponseText;
                                                                        const newDefine = `${(p.nextData as any).name}:\n  - text: |\n      ${text.replace(/\n/g, '\n      ')}`;
                                                                        setResponses(prev => prev.map(r => String(r._id) === String(p.nextData._id) ? { ...r, define: newDefine } : r));
                                                                        setEditingResponseId(null);
                                                                        setEditingResponseText("");
                                                                        handleSaveResponse(String(p.nextData._id));
                                                                    }}>{savingResponseId === String(p.nextData._id) ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Save")}</Button>
                                                                </div>
                                                            ) : (
                                                                <Button size="sm" variant="ghost" onClick={() => {
                                                                    setEditingResponseId(String((p.nextData as any)?._id));
                                                                    setEditingResponseText(answer);
                                                                }}>{t("Sửa")}</Button>
                                                            )
                                                        )}
                                                    </div>

                                                    {isAction ? (
                                                        // action: show short snippet (approx 5 lines) with expand/collapse
                                                        <div>
                                                            <div className="mt-1 whitespace-pre-wrap">{expandedMap[idx] ? (p.nextData?.define || "-") : getSnippet(p.nextData?.define, 5)}</div>
                                                            <div className="mt-2">
                                                                <Button size="sm" variant="ghost" onClick={() => toggleExpanded(idx)}>
                                                                    {expandedMap[idx] ? "Thu gọn" : "Xem thêm"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        (!isAction && editingResponseId === String(p.nextData?._id)) ? (
                                                            <textarea
                                                                className="w-full border rounded p-2 mt-1 whitespace-pre-wrap"
                                                                rows={4}
                                                                value={editingResponseText}
                                                                onChange={(e) => setEditingResponseText(e.target.value)}
                                                            />
                                                        ) : (
                                                            <div className="mt-1 whitespace-pre-wrap">{answer}</div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </section>
            </div>
        </div>
    );
}
