import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, BookText, Tag, Code, Calendar, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { storyService } from "../api/service";
import { StoryDetailResponse } from "../api/dto/StoryDto";

interface StoryDetailsDialogProps {
  storyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StoryDetailsDialog({
  storyId,
  open,
  onOpenChange,
}: StoryDetailsDialogProps) {
  const { t } = useTranslation();
  const [story, setStory] = useState<StoryDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && storyId) {
      fetchStoryDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storyId]);

  const fetchStoryDetails = async () => {
    if (!storyId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await storyService.getStoryById(storyId);
      setStory(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch story details"
      );
      console.error("Error fetching story details:", err);
    } finally {
      setLoading(false);
    }
  };

  const processDefine = (defineText: string, intents: any[], actions: any[], responses: any[], entities: any[], slots: any[]) => {
    if (!defineText) {
      return defineText;
    }

    let processedText = defineText;

    // Replace intent IDs with names if we have populated data
    intents.forEach(intent => {
      if (typeof intent === 'object' && intent._id && intent.name) {
        const regex = new RegExp(`\\[${intent._id}\\]`, 'g');
        processedText = processedText.replace(regex, intent.name);
      }
    });

    // Replace action IDs with names if we have populated data
    actions.forEach(action => {
      if (typeof action === 'object' && action._id && action.name) {
        const regex = new RegExp(`\\[${action._id}\\]`, 'g');
        processedText = processedText.replace(regex, action.name);
      }
    });

    // Replace response IDs with names if we have populated data
    // Note: Responses can appear in "- action:" lines in YAML
    responses.forEach(response => {
      if (typeof response === 'object' && response._id && response.name) {
        const regex = new RegExp(`\\[${response._id}\\]`, 'g');
        processedText = processedText.replace(regex, response.name);
      }
    });

    // Replace entity IDs with names if we have populated data
    entities.forEach(entity => {
      if (typeof entity === 'object' && entity._id && entity.name) {
        const regex = new RegExp(`\\[${entity._id}\\]`, 'g');
        processedText = processedText.replace(regex, entity.name);
      }
    });

    // Replace slot IDs with names if we have populated data
    slots.forEach(slot => {
      if (typeof slot === 'object' && slot._id && slot.name) {
        const regex = new RegExp(`\\[${slot._id}\\]`, 'g');
        processedText = processedText.replace(regex, slot.name);
      }
    });

    return processedText;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-violet-50 to-fuchsia-50">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookText className="h-6 w-6 text-violet-600" />
            {t("Story Details")}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">{t("Loading story details...")}</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {story && (
          <div className="flex-1 overflow-y-auto px-3 py-3 pt-0">
            <div className="space-y-2">
              {/* Name & Description Card */}
              <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200 rounded-lg p-3">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-1">
                      {t("Story Name")}
                    </h3>
                    <p className="text-lg font-bold text-violet-900">{story.data?.name || "N/A"}</p>
                  </div>
                  {story.data?.description && (
                    <div>
                      <h3 className="text-xs font-semibold text-fuchsia-600 uppercase tracking-wide mb-1">
                        {t("Description")}
                      </h3>
                      <p className="text-sm text-gray-700">{story.data.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Data */}
              <div className="bg-white border rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Intents */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Tag className="h-4 w-4 text-indigo-600" />
                      {t("Intents")}
                      <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {story.data?.intents?.length || 0}
                      </span>
                    </h3>
                  </div>

                  {/* Actions */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      {t("Actions")}
                      <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {story.data?.action?.length || 0}
                      </span>
                    </h3>
                  </div>

                  {/* Responses */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Tag className="h-4 w-4 text-amber-600" />
                      {t("Responses")}
                      <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        {story.data?.responses?.length || 0}
                      </span>
                    </h3>
                  </div>

                  {/* Entities */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Tag className="h-4 w-4 text-emerald-600" />
                      {t("Entities")}
                      <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        {story.data?.entities?.length || 0}
                      </span>
                    </h3>
                  </div>
                </div>
              </div>

              {/* YAML Definition */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Code className="h-4 w-4 text-violet-600" />
                  {t("YAML Definition")}
                </h3>
                {story?.data?.define ? (
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                    <pre className="whitespace-pre-wrap">
                      {processDefine(
                        story.data.define,
                        story.data?.intents || [],
                        story.data?.action || [],
                        story.data?.responses || [],
                        story.data?.entities || [],
                        story.data?.slots || []
                      )}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {t("No definition provided")}
                  </p>
                )}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <Calendar className="h-4 w-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-wide">
                      {t("Created At")}
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {story.data?.createdAt ? new Date(story.data.createdAt).toLocaleString() : "Invalid Date"}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <Calendar className="h-4 w-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-wide">
                      {t("Updated At")}
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {story.data?.updatedAt ? new Date(story.data.updatedAt).toLocaleString() : "Invalid Date"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
