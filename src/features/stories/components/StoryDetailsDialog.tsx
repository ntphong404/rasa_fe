import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
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

    // Split by lines and process each line for syntax highlighting
    const lines = processedText.split('\n');
    const processedLines = lines.map((line, index) => {
      // Simple YAML syntax highlighting
      if (line.trim().startsWith('- story:')) {
        return (
          <div key={index} className="text-blue-600 font-semibold">
            {line}
          </div>
        );
      }
      if (line.trim().startsWith('steps:')) {
        return (
          <div key={index} className="text-green-600 font-medium">
            {line}
          </div>
        );
      }
      if (line.trim().startsWith('- intent:') || line.trim().startsWith('- action:')) {
        return (
          <div key={index} className="text-purple-600">
            {line}
          </div>
        );
      }
      if (line.trim().startsWith('entities:') || line.trim().startsWith('slots:')) {
        return (
          <div key={index} className="text-orange-600">
            {line}
          </div>
        );
      }
      return (
        <div key={index} className="text-gray-700 dark:text-gray-300">
          {line}
        </div>
      );
    });

    return (
      <div className="font-mono text-sm whitespace-pre-wrap">
        {processedLines}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Story Details")}</DialogTitle>
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
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">{t("Thông tin Cơ bản")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("Story Name")}
                  </label>
                  <p className="text-lg font-medium">{story.data?.name || "N/A"}</p>
                </div>
                {story.data?.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t("Description")}
                    </label>
                    <p>{story.data.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("Tạo lúc")}
                  </label>
                  <p>{story.data?.createdAt ? new Date(story.data.createdAt).toLocaleString("vi-VN") : "Invalid Date"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("Cập nhật lúc")}
                  </label>
                  <p>{story.data?.updatedAt ? new Date(story.data.updatedAt).toLocaleString("vi-VN") : "Invalid Date"}</p>
                </div>
              </div>
            </div>

            {/* Related Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Intents */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">{t("Intent Liên quan")}</h4>
                {Array.isArray(story?.data?.intents) && story.data.intents.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {story.data.intents.map((intent: any, index: number) => (
                      <div key={intent?._id || intent?.id || index} className="flex">
                        <Badge variant="secondary" className="w-full">
                          <span className="truncate block" title={intent?.name || intent || 'Unknown Intent'}>
                            {intent?.name || intent || 'Unknown Intent'}
                          </span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">{t("Không có intent")}</p>
                )}
              </div>

              {/* Actions */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">{t("Action Liên quan")}</h4>
                {Array.isArray(story?.data?.action) && story.data.action.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {story.data.action.map((action: any, index: number) => (
                      <div key={action?._id || action?.id || index} className="flex">
                        <Badge variant="secondary" className="w-full">
                          <span className="truncate block" title={action?.name || action || 'Unknown Action'}>
                            {action?.name || action || 'Unknown Action'}
                          </span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">{t("Không có action")}</p>
                )}
              </div>

              {/* Responses */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">{t("Response Liên quan")}</h4>
                {Array.isArray(story?.data?.responses) && story.data.responses.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {story.data.responses.map((response: any, index: number) => (
                      <div key={response?._id || response?.id || index} className="flex">
                        <Badge variant="secondary" className="w-full">
                          <span className="truncate block" title={response?.name || response || 'Unknown Response'}>
                            {response?.name || response || 'Unknown Response'}
                          </span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">{t("Không có response")}</p>
                )}
              </div>

              {/* Entities */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">{t("Entity Liên quan")}</h4>
                {Array.isArray(story?.data?.entities) && story.data.entities.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {story.data.entities.map((entity: any, index: number) => (
                      <div key={entity?._id || entity?.id || index} className="flex">
                        <Badge variant="secondary" className="w-full">
                          <span className="truncate block" title={entity?.name || entity || 'Unknown Entity'}>
                            {entity?.name || entity || 'Unknown Entity'}
                          </span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">{t("Không có entity")}</p>
                )}
              </div>
            </div>

            {/* YAML Define */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">{t("Định nghĩa YAML")}</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-x-auto max-h-96 overflow-y-auto">
                {story?.data?.define ? (
                  <div className="break-words">
                    {processDefine(
                      story.data.define,
                      story.data?.intents || [],
                      story.data?.action || [],
                      story.data?.responses || [],
                      story.data?.entities || [],
                      story.data?.slots || []
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">{t("Không có định nghĩa YAML")}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
