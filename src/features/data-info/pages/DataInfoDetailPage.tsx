import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Edit2,
  Save,
  X,
  MessageSquare,
  BookOpen,
} from "lucide-react";
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

        const intentPromises = (s.intents || []).map((itOrId: any) => {
          if (!itOrId) return Promise.resolve(null);
          if (typeof itOrId === "string") {
            return intentService
              .getIntentById(String(itOrId))
              .then((r) => ({ ...(r as any), _id: String(itOrId) }))
              .catch((e) => null);
          }
          return Promise.resolve({
            ...(itOrId as any),
            _id: String((itOrId as any)._id),
          });
        });

        const responsePromises = (s.responses || []).map((rOrId: any) => {
          if (!rOrId) return Promise.resolve(null);
          if (typeof rOrId === "string") {
            return responseService
              .getResponseById(String(rOrId))
              .catch((e) => null);
          }
          return Promise.resolve(rOrId as any);
        });

        const actionPromises = (s.action || []).map((aOrId: any) => {
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
    if (!intent) {
      toast.error(t("Intent not found"));
      return;
    }
    setSavingIntentId(intentId);
    try {
      await intentService.updateIntent(intentId, intent as any);
      toast.success(t("Lưu câu hỏi thành công!"));
    } catch (error) {
      console.error("Failed to update intent", error);
      toast.error(t("Lưu câu hỏi thất bại. Vui lòng thử lại!"));
    } finally {
      setSavingIntentId(null);
    }
  };

  const handleSaveResponse = async (responseId: string) => {
    const resp = responses.find((r) => r._id === responseId);
    if (!resp) {
      toast.error(t("Response not found"));
      return;
    }
    setSavingResponseId(responseId);
    try {
      await responseService.updateResponse(responseId, resp as any);
      toast.success(t("Lưu câu trả lời thành công!"));
    } catch (error) {
      console.error("Failed to update response", error);
      toast.error(t("Lưu câu trả lời thất bại. Vui lòng thử lại!"));
    } finally {
      setSavingResponseId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <span className="text-gray-600 font-medium">
                {t("Loading story...")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !story) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("Back")}
            </Button>
          </div>
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-red-500 mb-4 text-lg">
              {loadError || t("Story not found")}
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 mb-4 hover:bg-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("Back")}
          </Button>

          <div className="relative bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="relative p-8">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <BookOpen className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700 mb-3">
                    {t("Story Details")}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {story.name}
                  </h1>
                  <p className="text-gray-600 text-base max-w-3xl">
                    {story.description || t("No description provided")}
                  </p>

                  {/* Stats badges */}
                  <div className="flex gap-3 mt-6">
                    <div className="px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="text-xs text-gray-600">Intents</div>
                      <div className="text-lg font-bold text-indigo-600">
                        {intents.length}
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-100">
                      <div className="text-xs text-gray-600">Responses</div>
                      <div className="text-lg font-bold text-green-600">
                        {responses.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Q&A Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t("Q&A ")}</h1>
          </div>

          <div className="space-y-4">
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

              const steps = parseStepsFromDefine(story.define);
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
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{t("No Q&A found")}</p>
                  </div>
                );
              }

              return filteredPairs.map((p, idx) => {
                const intentExamples = extractIntentExamples(p.intent?.define);
                const primary =
                  intentExamples.length > 0
                    ? intentExamples[0]
                    : p.intent?.define || "";
                const similar = intentExamples.slice(1);
                const answer = extractResponseText(p.nextData?.define) || "-";

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Question Section */}
                    <div className="bg-indigo-50 p-6 border-b border-indigo-100">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm uppercase tracking-wide">
                          <MessageSquare className="h-5 w-5" />
                          <span>Câu hỏi chính</span>
                        </div>
                        {p.intent &&
                          (editingIntentId === String(p.intent._id) ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingIntentId(null);
                                  setEditingIntentText("");
                                }}
                                className="gap-1 bg-white"
                              >
                                <X className="h-3 w-3" />
                                {t("Cancel")}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  const lines = editingIntentText
                                    .split(/\r?\n/)
                                    .map((l) => l.trim())
                                    .filter(Boolean);
                                  const newDefine = `- intent: ${
                                    (p.intent as any).name
                                  }\n  examples: |\n    - ${lines.join(
                                    "\n    - "
                                  )}`;
                                  setIntents((prev) =>
                                    prev.map((it) =>
                                      String(it._id) === String(p.intent._id)
                                        ? { ...it, define: newDefine }
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
                            </div>
                          ) : (
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
                              }}
                              className="gap-1 hover:bg-white/50"
                            >
                              <Edit2 className="h-3 w-3" />
                              {t("Sửa")}
                            </Button>
                          ))}
                      </div>
                      {editingIntentId === String(p.intent?._id) ? (
                        <textarea
                          className="w-full border-2 border-indigo-200 rounded-lg p-3 mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-base"
                          rows={3}
                          value={editingIntentText}
                          onChange={(e) => setEditingIntentText(e.target.value)}
                          placeholder="Nhập câu hỏi..."
                        />
                      ) : (
                        <div className="text-lg font-medium text-gray-800 leading-relaxed">
                          {primary}
                        </div>
                      )}
                    </div>

                    {/* Similar Questions */}
                    {similar.length > 0 && (
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-indigo-400 rounded-full"></div>
                          Các câu hỏi tương tự ({similar.length})
                        </div>
                        <div className="space-y-2">
                          {similar.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                            >
                              <div className="mt-1 w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0"></div>
                              <span className="text-sm text-gray-700 flex-1">
                                {s}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Answer Section */}
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2 text-green-700 font-semibold text-sm uppercase tracking-wide">
                          <MessageSquare className="h-5 w-5" />
                          <span>Câu trả lời</span>
                        </div>
                        {p.nextData &&
                          (editingResponseId === String(p.nextData._id) ? (
                            <div className="flex gap-2">
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
                            </div>
                          ) : (
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
                          ))}
                      </div>

                      {editingResponseId === String(p.nextData?._id) ? (
                        <textarea
                          className="w-full border-2 border-green-200 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-base leading-relaxed"
                          rows={4}
                          value={editingResponseText}
                          onChange={(e) =>
                            setEditingResponseText(e.target.value)
                          }
                          placeholder="Nhập câu trả lời..."
                        />
                      ) : (
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
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
