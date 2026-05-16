import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Loader2,
  ArrowLeft,
  Edit2,
  Save,
  X,
  MessageSquare,
  BookOpen,
  Check,
  Search,
} from "lucide-react";
import { ruleService } from "@/features/rules/api/service";
import { intentService } from "@/features/intents/api/service";
import { responseService } from "@/features/reponses/api/service";
import { actionService } from "@/features/action/api/service";
import { IRule } from "@/interfaces/rule.interface";
import { IMyResponse } from "@/interfaces/response.interface";
import { IntentDetailResponse } from "@/features/intents/api/dto/IntentResponse";
import { IEntity } from "@/interfaces/entity.interface";
import { useChatbotStore } from "@/store/chatbot";
import toast from "react-hot-toast";

export default function DataInfoDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const selectedBotId = useChatbotStore((state) => state.selectedBotId);
  const [searchParams] = useSearchParams();
  const ruleId = searchParams.get("id");

  const [rule, setRule] = useState<IRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [intents, setIntents] = useState<
    Array<IntentDetailResponse & { _id: string }>
  >([]);
  const [responses, setResponses] = useState<IMyResponse[]>([]);
  const [actions, setActions] = useState<any[]>([]);

  const [savingIntentId, setSavingIntentId] = useState<string | null>(null);
  const [savingResponseId, setSavingResponseId] = useState<string | null>(null);
  const [editingIntentId, setEditingIntentId] = useState<string | null>(null);
  const [editingIntentText, setEditingIntentText] = useState<string>("");

  const [editingResponseId, setEditingResponseId] = useState<string | null>(
    null
  );
  const [editingResponseText, setEditingResponseText] = useState<string>("");
  
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionText, setDescriptionText] = useState<string>("");
  const [savingDescription, setSavingDescription] = useState(false);

  // Entity management
  const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<IEntity[]>([]);
  const [entitySearchOpen, setEntitySearchOpen] = useState(false);
  const [entitySearchQuery, setEntitySearchQuery] = useState("");
  const [entitySearchResults, setEntitySearchResults] = useState<IEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!ruleId) {
        setLoadError(t("Rule ID not found"));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const r = await ruleService.getRuleById(ruleId);
        const ruleBotId = (r as any)?.botId as string | undefined;

        const scopedBotId = selectedBotId && selectedBotId !== "global" ? selectedBotId : null;
        if (scopedBotId && ruleBotId && ruleBotId !== scopedBotId && ruleBotId !== "global") {
          setLoadError(t("Bạn không có quyền xem dữ liệu của chatbot khác"));
          setRule(null);
          setIntents([]);
          setResponses([]);
          setActions([]);
          return;
        }

        setRule(r);

        const intentPromises = (r.intents || []).map((itOrId: any) => {
          if (!itOrId) return Promise.resolve(null);
          const intentId = typeof itOrId === "string" ? itOrId : (itOrId as any)._id;
          // Always fetch full intent to ensure examples are populated
          return intentService
            .getIntentById(String(intentId))
            .then((intent) => ({ ...(intent as any), _id: String(intentId) }))
            .catch((e) => null);
        });

        const responsePromises = (r.responses || []).map((rOrId: any) => {
          if (!rOrId) return Promise.resolve(null);
          if (typeof rOrId === "string") {
            return responseService
              .getResponseById(String(rOrId))
              .catch((e) => null);
          }
          return Promise.resolve(rOrId as any);
        });

        const actionPromises = (r.action || []).map((aOrId: any) => {
          if (!aOrId) return Promise.resolve(null);
          if (typeof aOrId === "string") {
            return actionService
              .getActionById(String(aOrId))
              .catch((e) => null);
          }
          return Promise.resolve(aOrId as any);
        });

        const loadedIntents = (await Promise.all(intentPromises)).filter(
          Boolean
        ) as any[];
        const loadedResponses = (await Promise.all(responsePromises)).filter(
          Boolean
        ) as IMyResponse[];
        const loadedActions = (await Promise.all(actionPromises)).filter(
          Boolean
        ) as any[];

        setIntents(loadedIntents);
        setResponses(loadedResponses || []);
        setActions(loadedActions || []);
      } catch (error) {
        console.error("Error loading rule details:", error);
        setLoadError(t("Failed to load rule"));
        toast.error(t("Failed to load rule"));
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [ruleId, selectedBotId, t]);

  // Entity search effect
  useEffect(() => {
    if (entitySearchQuery.length > 0) {
      const debounce = setTimeout(async () => {
        try {
          setIsSearching(true);
          const results = await intentService.searchEntityForIntent(entitySearchQuery);
          setEntitySearchResults(results);
        } catch (error) {
          console.error("Error searching entities:", error);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(debounce);
    } else {
      setEntitySearchResults([]);
    }
  }, [entitySearchQuery]);

  // Load entities for current intent
  useEffect(() => {
    if (selectedIntentId) {
      const intent = intents.find((i) => String(i._id) === String(selectedIntentId));
      if (intent && (intent as any).entities) {
        const entityIds = (intent as any).entities.map((e: any) =>
          typeof e === "string" ? e : e._id
        );
        setSelectedEntities(entityIds.length > 0 ? entityIds : []);
      } else {
        setSelectedEntities([]);
      }
    }
  }, [selectedIntentId, intents]);

  // Handle add entity
  const handleAddEntity = (entity: IEntity) => {
    setSelectedEntities((prev) => {
      const exists = prev.some((e) => (typeof e === "string" ? e : e._id) === entity._id);
      if (exists) return prev;
      return [...prev, entity];
    });
    setEntitySearchQuery("");
    setEntitySearchOpen(false);
  };

  // Handle remove entity
  const handleRemoveEntity = (entityId: string) => {
    setSelectedEntities((prev) =>
      prev.filter((e) => (typeof e === "string" ? e : e._id) !== entityId)
    );
  };

  // Handle entity click - insert pattern into textarea
  const handleEntityClick = (entity: IEntity | string) => {
    if (!textareaRef.current) return;
    
    const entityId = typeof entity === "string" ? entity : entity._id;
    const pattern = `[value]([${entityId}])`;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editingIntentText;
    
    const newText = text.substring(0, start) + pattern + text.substring(end);
    setEditingIntentText(newText);
    
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + pattern.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  const handleSaveIntent = async (intentId: string) => {
    const intent = intents.find((i) => i._id === intentId);
    if (!intent) {
      toast.error("Intent không tìm thấy!");
      return;
    }

    const lines = editingIntentText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const updatedIntent = {
      _id: intent._id,
      name: (intent as any).name,
      description: (intent as any).description,
      examples: lines,
      label: (intent as any).label,
      botIds: (intent as any).botIds || [(selectedBotId && selectedBotId !== "global" ? selectedBotId : "global")],
      entities: selectedEntities.map((entity: any) =>
        typeof entity === "string" ? entity : entity._id
      ),
      roles: (intent as any).roles || [],
      deleted: !!(intent as any).deleted,
      createdAt: (intent as any).createdAt,
      updatedAt: (intent as any).updatedAt,
      deletedAt: (intent as any).deletedAt,
    };

    setSavingIntentId(intentId);
    try {
      await intentService.updateIntent(intentId, updatedIntent as any);

      const updatedExamples = lines.map((text, idx) => {
        const existing = ((intent as any).examples || [])[idx];
        return { _id: existing?._id || `new_${idx}`, text };
      });

      setIntents((prev) =>
        prev.map((it) =>
          String(it._id) === String(intentId)
            ? ({ ...it, examples: updatedExamples } as any)
            : it
        )
      );

      setEditingIntentId(null);
      setEditingIntentText("");
      setSelectedIntentId(null);
      setSelectedEntities([]);

      toast.success("Lưu câu hỏi thành công!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (error) {
      console.error("Failed to update intent", error);
      toast.error("Lưu câu hỏi thất bại. Vui lòng thử lại!", {
        duration: 3000,
        position: "top-right",
      });
    } finally {
      setSavingIntentId(null);
    }
  };

  const handleSaveDescription = async () => {
    if (!rule || !ruleId) return;

    setSavingDescription(true);
    try {
      const updatedRule = { ...rule, description: descriptionText };
      await ruleService.updateRule(ruleId, updatedRule as any);
      
      setRule(updatedRule);
      setEditingDescription(false);
      
      toast.success("Cập nhật mô tả thành công!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (error) {
      console.error("Failed to update description", error);
      toast.error("Cập nhật mô tả thất bại. Vui lòng thử lại!", {
        duration: 3000,
        position: "top-right",
      });
    } finally {
      setSavingDescription(false);
    }
  };

  const handleSaveResponse = async (responseId: string) => {
    const resp = responses.find((r) => r._id === responseId);
    if (!resp) {
      toast.error("Response không tìm thấy!");
      return;
    }

    // ✅ Lấy giá trị mới từ editingResponseText
    const text = editingResponseText;
    const newDefine = `${
      (resp as any).name
    }:\n  - text: |\n      ${text.replace(/\n/g, "\n      ")}`;
    const updatedResponse = {
      _id: resp._id,
      name: resp.name,
      description: resp.description,
      define: newDefine,
      label: resp.label,
      botId: (resp as any).botId || (selectedBotId && selectedBotId !== "global" ? selectedBotId : "global"),
      roles: resp.roles || [],
      likeCount: resp.likeCount ?? 0,
      dislikeCount: resp.dislikeCount ?? 0,
      deleted: !!resp.deleted,
      createdAt: resp.createdAt,
      updatedAt: resp.updatedAt,
      deletedAt: resp.deletedAt,
    };

    setSavingResponseId(responseId);
    try {
      await responseService.updateResponse(responseId, updatedResponse as any);

      // ✅ Cập nhật state sau khi save thành công
      setResponses((prev) =>
        prev.map((r) =>
          String(r._id) === String(responseId) ? updatedResponse : r
        )
      );

      setEditingResponseId(null);
      setEditingResponseText("");

      toast.success("Lưu câu trả lời thành công!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (error) {
      console.error("Failed to update response", error);
      toast.error("Lưu câu trả lời thất bại. Vui lòng thử lại!", {
        duration: 3000,
        position: "top-right",
      });
    } finally {
      setSavingResponseId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="px-3 py-3 pr-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <span className="font-medium text-muted-foreground">
                {t("Loading rule...")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !rule) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="px-3 py-3 pr-6 max-w-6xl mx-auto">
          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 hover:bg-white/80 dark:hover:bg-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("Back")}
            </Button>
          </div>
          <div className="surface-card text-center py-12">
            <p className="text-red-500 mb-4 text-lg">
              {loadError || t("Rule not found")}
            </p>
            <Button
              onClick={() => navigate(-1)}
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              {t("Go back")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-violet-50 to-fuchsia-50 shadow-sm dark:border-white/10 dark:from-slate-900 dark:to-slate-900">
        <div className="px-3 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("Back")}
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <BookOpen className="h-6 w-6 text-violet-600" />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-violet-900 dark:text-violet-200">{rule.name}</h1>
                {editingDescription ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      className="flex-1 rounded border border-violet-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-violet-500/60 dark:bg-slate-900"
                      value={descriptionText}
                      onChange={(e) => setDescriptionText(e.target.value)}
                      placeholder="Nhập mô tả..."
                      autoFocus
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingDescription(false);
                            setDescriptionText("");
                          }}
                          className="h-6 px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Hủy chỉnh sửa mô tả</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={handleSaveDescription}
                          disabled={savingDescription}
                          className="h-6 px-2 bg-violet-600 hover:bg-violet-700"
                        >
                          {savingDescription ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Lưu mô tả</TooltipContent>
                    </Tooltip>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-violet-600 dark:text-violet-300">{rule.description || t("No description provided")}</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingDescription(true);
                            setDescriptionText(rule.description || "");
                          }}
                          className="h-5 px-1 hover:bg-violet-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-3 w-3 text-violet-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Sửa mô tả</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 pr-6 max-w-6xl mx-auto">
        {/* Rule Info Card */}
        <div className="mb-3">
          <div className="surface-card p-3">
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-violet-600 uppercase tracking-wide">
                {t("Rule Details")}
              </div>
              <div className="flex gap-2">
                <div className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 dark:border-indigo-500/40 dark:bg-indigo-950/30">
                  <span className="text-xs text-muted-foreground">Intents: </span>
                  <span className="text-xs font-bold text-indigo-600">{intents.length}</span>
                </div>
                <div className="rounded-full border border-green-200 bg-green-50 px-3 py-1 dark:border-green-500/40 dark:bg-green-950/30">
                  <span className="text-xs text-muted-foreground">Responses: </span>
                  <span className="text-xs font-bold text-green-600">{responses.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Q&A Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg font-bold text-foreground">{t("Q&A")}</h2>
          </div>

          <div className="space-y-3">
            {(() => {
              const parseStepsFromDefine = (def?: string) => {
                const res: Array<{ kind: string; ids: string[] }> = [];
                if (!def) return res;
                const re =
                  /^\s*-\s*(intent|action|response):\s*\[([^\]]*)\]/gim;
                let m: RegExpExecArray | null;
                while ((m = re.exec(def)) !== null) {
                  const kind = m[1];
                  const ids = m[2]
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  res.push({ kind, ids });
                }
                return res;
              };

              const getIntentExamples = (intentObj: any): string[] => {
                if (!intentObj?.examples) return [];
                return (intentObj.examples as Array<{ _id: string; text: string }>)
                  .map((e) => e.text)
                  .filter(Boolean);
              };

              const extractResponseText = (defineText?: string) => {
                if (!defineText) return "";
                const m =
                  defineText.match(/text:\s*\|([\s\S]*)/m) ||
                  defineText.match(/-\s*text:\s*\|([\s\S]*)/m);
                if (m) {
                  const block = m[1];
                  const content = block
                    .split(/\r?\n/)
                    .map((l) => l.replace(/^\s*/, "").trim())
                    .filter(Boolean)
                    .join("\n");
                  return content;
                }
                return defineText;
              };

              const steps = parseStepsFromDefine(rule.define);
              const pairs: Array<{
                intent: any | null;
                nextKind?: "action" | "response";
                nextData?: any | null;
              }> = [];

              for (let i = 0; i < steps.length; i++) {
                const s = steps[i];
                if (s.kind === "intent") {
                  for (const id of s.ids) {
                    const intentObj =
                      intents.find(
                        (it) => String((it as any)._id) === String(id)
                      ) || null;
                    let nextKind: "action" | "response" | undefined = undefined;
                    let nextData: any | null = null;
                    for (let j = i + 1; j < steps.length; j++) {
                      if (steps[j].kind === "response") {
                        const foundResp = steps[j].ids.find((x) =>
                          responses.some((r) => String(r._id) === String(x))
                        );
                        if (foundResp) {
                          nextKind = "response";
                          nextData =
                            responses.find(
                              (r) => String(r._id) === String(foundResp)
                            ) || null;
                          break;
                        }
                        const foundInActions = steps[j].ids.find((x) =>
                          actions.some((a) => String(a._id) === String(x))
                        );
                        if (foundInActions) {
                          nextKind = "action";
                          nextData =
                            actions.find(
                              (a) => String(a._id) === String(foundInActions)
                            ) || null;
                          break;
                        }
                      }
                      if (steps[j].kind === "action") {
                        const foundAct = steps[j].ids.find((x) =>
                          actions.some((a) => String(a._id) === String(x))
                        );
                        if (foundAct) {
                          nextKind = "action";
                          nextData =
                            actions.find(
                              (a) => String(a._id) === String(foundAct)
                            ) || null;
                          break;
                        }
                        const foundInResp = steps[j].ids.find((x) =>
                          responses.some((r) => String(r._id) === String(x))
                        );
                        if (foundInResp) {
                          nextKind = "response";
                          nextData =
                            responses.find(
                              (r) => String(r._id) === String(foundInResp)
                            ) || null;
                          break;
                        }
                      }
                    }
                    pairs.push({ intent: intentObj, nextKind, nextData });
                  }
                }
              }

              // Lọc bỏ các cặp có action
              const filteredPairs = pairs.filter(
                (p) => p.nextKind !== "action"
              );

              if (filteredPairs.length === 0) {
                return (
                  <div className="surface-card p-6 text-center">
                    <MessageSquare className="mx-auto mb-2 h-10 w-10 text-gray-300 dark:text-gray-500" />
                    <p className="text-sm text-muted-foreground">{t("No Q&A found")}</p>
                  </div>
                );
              }

              return filteredPairs.map((p, idx) => {
                const intentExamples = getIntentExamples(p.intent);
                const primary =
                  intentExamples.length > 0
                    ? intentExamples[0]
                    : "";
                const similar = intentExamples.slice(1);
                const answer = extractResponseText(p.nextData?.define) || "-";

                return (
                  <div
                    key={idx}
                    className="surface-card overflow-hidden transition-shadow hover:shadow-md"
                  >
                    {/* Question Section */}
                    <div className="border-b border-indigo-100 bg-indigo-50 p-3 dark:border-indigo-500/40 dark:bg-indigo-950/25">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm uppercase tracking-wide">
                          <MessageSquare className="h-5 w-5" />
                          <span>Câu hỏi chính</span>
                        </div>
                        {p.intent &&
                          (editingIntentId === String(p.intent._id) ? (
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingIntentId(null);
                                      setEditingIntentText("");
                                      setSelectedIntentId(null);
                                      setSelectedEntities([]);
                                    }}
                                    className="gap-1 bg-white dark:bg-slate-900"
                                  >
                                    <X className="h-3 w-3" />
                                    {t("Cancel")}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Hủy sửa câu hỏi</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const lines = editingIntentText
                                        .split(/\r?\n/)
                                        .map((l) => l.trim())
                                        .filter(Boolean);
                                      const updatedExamples = lines.map((text, idx) => {
                                        const existing = ((p.intent as any).examples || [])[idx];
                                        return { _id: existing?._id || `new_${idx}`, text };
                                      });
                                      setIntents((prev) =>
                                        prev.map((it) =>
                                          String(it._id) === String(p.intent._id)
                                            ? { ...it, examples: updatedExamples }
                                            : it
                                        )
                                      );
                                      setEditingIntentId(null);
                                      setEditingIntentText("");
                                      handleSaveIntent(String(p.intent._id));
                                    }}
                                    className="gap-1 bg-indigo-600 hover:bg-indigo-700"
                                  >
                                    {savingIntentId === String(p.intent._id) ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Save className="h-3 w-3" />
                                    )}
                                    {t("Save")}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Lưu câu hỏi</TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const combined = [primary, ...similar]
                                      .filter(Boolean)
                                      .join("\n");
                                    setEditingIntentId(
                                      String((p.intent as any)._id)
                                    );
                                    setEditingIntentText(combined);
                                    setSelectedIntentId(String((p.intent as any)._id));
                                  }}
                                  className="gap-1 hover:bg-white/50 dark:hover:bg-slate-800/70"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  {t("Sửa")}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Sửa câu hỏi</TooltipContent>
                            </Tooltip>
                          ))}
                      </div>
                      {editingIntentId === String(p.intent?._id) ? (
                        <div className="space-y-3 mt-3">
                          {/* Entity Management Section */}
                          <div className="flex items-center gap-2">
                            <Popover open={entitySearchOpen} onOpenChange={setEntitySearchOpen}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="gap-2" size="sm">
                                  <Search className="h-4 w-4" />
                                  {t("Add Entity")}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <Command shouldFilter={false}>
                                  <CommandInput
                                    placeholder={t("Search entities...")}
                                    value={entitySearchQuery}
                                    onValueChange={setEntitySearchQuery}
                                  />
                                  <CommandList className="max-h-[200px] overflow-y-auto">
                                    <CommandEmpty>
                                      {isSearching
                                        ? t("Searching...")
                                        : t("No entities found")}
                                    </CommandEmpty>
                                    {entitySearchResults.length > 0 && (
                                      <CommandGroup>
                                        {entitySearchResults.map((entity) => (
                                          <CommandItem
                                            key={entity._id}
                                            value={entity._id}
                                            onSelect={() => handleAddEntity(entity)}
                                            className="cursor-pointer"
                                          >
                                            <div className="flex flex-col">
                                              <span className="font-medium">{entity.name}</span>
                                              {entity.description && (
                                                <span className="text-xs text-muted-foreground">
                                                  {entity.description}
                                                </span>
                                              )}
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    )}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Selected Entities Display */}
                          {selectedEntities.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                Các entity đã chọn ({selectedEntities.length})
                              </div>
                              <div className="flex flex-wrap gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                                {selectedEntities.map((entity) => {
                                  const isString = typeof entity === "string";
                                  const entityId = isString ? entity : entity._id;
                                  const entityName = isString ? entity : entity.name;
                                  return (
                                    <Badge
                                      key={entityId}
                                      variant="secondary"
                                      className="gap-2 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
                                      onClick={() => handleEntityClick(entity)}
                                      title={t("Click to insert entity pattern")}
                                    >
                                      <span>{entityName}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 hover:bg-transparent"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveEntity(entityId);
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </Badge>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                💡 {t("Click on an entity to insert its pattern at cursor position")}
                              </p>
                            </div>
                          )}

                          {/* Textarea for editing */}
                          <textarea
                            ref={textareaRef}
                            className="mt-2 w-full rounded-lg border-2 border-indigo-200 bg-white p-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-indigo-500/60 dark:bg-slate-900"
                            rows={3}
                            value={editingIntentText}
                            onChange={(e) => setEditingIntentText(e.target.value)}
                            placeholder="Nhập câu hỏi..."
                          />
                        </div>
                      ) : (
                        <div className="text-lg font-medium leading-relaxed text-foreground">
                          {primary}
                        </div>
                      )}
                    </div>

                    {/* Similar Questions */}
                    {similar.length > 0 && (
                      <div className="border-b border-slate-200 bg-gray-50 px-3 py-3 dark:border-white/10 dark:bg-slate-900/70">
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                          <div className="w-1 h-4 bg-indigo-400 rounded-full"></div>
                          Các câu hỏi tương tự ({similar.length})
                        </div>
                        <div className="space-y-2">
                          {similar.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-indigo-300 dark:border-white/15 dark:bg-slate-900"
                            >
                              <div className="mt-1 w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0"></div>
                              <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">
                                {s}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Answer Section */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2 text-green-700 font-semibold text-sm uppercase tracking-wide">
                          <MessageSquare className="h-5 w-5" />
                          <span>Câu trả lời</span>
                        </div>
                        {p.nextData &&
                          (editingResponseId === String(p.nextData._id) ? (
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingResponseId(null);
                                      setEditingResponseText("");
                                    }}
                                    className="gap-1"
                                  >
                                    <X className="h-3 w-3" />
                                    {t("Cancel")}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Hủy sửa câu trả lời</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const text = editingResponseText;
                                      const newDefine = `${
                                        (p.nextData as any).name
                                      }:\n  - text: |\n      ${text.replace(
                                        /\n/g,
                                        "\n      "
                                      )}`;
                                      setResponses((prev) =>
                                        prev.map((r) =>
                                          String(r._id) === String(p.nextData._id)
                                            ? { ...r, define: newDefine }
                                            : r
                                        )
                                      );
                                      setEditingResponseId(null);
                                      setEditingResponseText("");
                                      handleSaveResponse(String(p.nextData._id));
                                    }}
                                    className="gap-1 bg-green-600 hover:bg-green-700"
                                  >
                                    {savingResponseId === String(p.nextData._id) ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Save className="h-3 w-3" />
                                    )}
                                    {t("Save")}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Lưu câu trả lời</TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingResponseId(
                                      String((p.nextData as any)?._id)
                                    );
                                    setEditingResponseText(answer);
                                  }}
                                  className="gap-1"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  {t("Sửa")}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Sửa câu trả lời</TooltipContent>
                            </Tooltip>
                          ))}
                      </div>

                      {editingResponseId === String(p.nextData?._id) ? (
                        <textarea
                          className="w-full rounded-lg border-2 border-green-200 bg-white p-4 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-green-500/60 dark:bg-slate-900"
                          rows={4}
                          value={editingResponseText}
                          onChange={(e) =>
                            setEditingResponseText(e.target.value)
                          }
                          placeholder="Nhập câu trả lời..."
                        />
                      ) : (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-500/40 dark:bg-green-950/30">
                          <div className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-200">
                            {answer}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
