import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Tag, Users, Code, Calendar, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { intentService } from "../api/service";
import { IntentDetailResponse } from "../api/dto/IntentResponse";

interface IntentDetailsDialogProps {
  intentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IntentDetailsDialog({
  intentId,
  open,
  onOpenChange,
}: IntentDetailsDialogProps) {
  const { t } = useTranslation();
  const [intent, setIntent] = useState<IntentDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && intentId) {
      fetchIntentDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, intentId]);

  const fetchIntentDetails = async () => {
    if (!intentId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await intentService.getIntentById(intentId);
      setIntent(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch intent details"
      );
      console.error("Error fetching intent details:", err);
    } finally {
      setLoading(false);
    }
  };

  const processDefine = (defineText: string, entities: IntentDetailResponse["entities"]) => {
    if (!defineText || !entities || entities.length === 0) {
      return defineText;
    }

    // Create a map of entity ID to entity name
    const entityMap = new Map<string, string>();
    entities.forEach((entity) => {
      entityMap.set(entity._id, entity.name);
    });

    // Replace [text]([entity_id]) with [text](entity_name) and highlight
    const pattern = /\[([^\]]+)\]\(\[([^\]]+)\]\)/g;
    
    const parts: Array<{ text: string; isHighlighted: boolean }> = [];
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(defineText)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({
          text: defineText.substring(lastIndex, match.index),
          isHighlighted: false,
        });
      }

      // Get entity name or keep original ID
      const displayText = match[1];
      const entityId = match[2];
      const entityName = entityMap.get(entityId) || entityId;

      // Add highlighted match
      parts.push({
        text: `[${displayText}](${entityName})`,
        isHighlighted: true,
      });

      lastIndex = pattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < defineText.length) {
      parts.push({
        text: defineText.substring(lastIndex),
        isHighlighted: false,
      });
    }

    return parts;
  };

  const renderDefine = () => {
    if (!intent?.define) {
      return <span className="text-muted-foreground">{t("No definition")}</span>;
    }

    const processed = processDefine(intent.define, intent.entities);

    if (typeof processed === "string") {
      return <pre className="text-sm whitespace-pre-wrap text-slate-100">{processed}</pre>;
    }

    return (
      <pre className="text-sm whitespace-pre-wrap text-slate-100">
        {processed.map((part, index) =>
          part.isHighlighted ? (
            <span
              key={index}
              className="bg-yellow-400 text-slate-900 px-1.5 py-0.5 rounded font-semibold"
            >
              {part.text}
            </span>
          ) : (
            <span key={index}>{part.text}</span>
          )
        )}
      </pre>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b px-6 py-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-indigo-900">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              {t("Intent Details")}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <div className="text-red-500 font-semibold mb-2">{t("Error loading intent")}</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
          ) : intent ? (
            <div className="space-y-4">
              {/* Name & Description Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-5 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                        {t("Name")}
                      </h3>
                    </div>
                    <p className="text-xl font-bold text-indigo-900">{intent.name}</p>
                  </div>
                  {intent.description && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <h3 className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                          {t("Description")}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{intent.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Entities & Roles */}
              <div className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="grid grid-cols-2 gap-6">
                  {/* Entities */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                      <Tag className="h-4 w-4 text-blue-600" />
                      {t("Entities")}
                      <Badge className="ml-auto bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs">
                        {intent.entities?.length || 0}
                      </Badge>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {intent.entities && intent.entities.length > 0 ? (
                        intent.entities.map((entity) => (
                          <Badge key={entity._id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-medium">
                            {entity.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400 italic">
                          {t("No entities")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Roles */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                      <Users className="h-4 w-4 text-green-600" />
                      {t("Roles")}
                      <Badge className="ml-auto bg-green-100 text-green-700 hover:bg-green-200 text-xs">
                        {intent.roles?.length || 0}
                      </Badge>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {intent.roles && intent.roles.length > 0 ? (
                        intent.roles.map((role, index) => (
                          <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 font-medium">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400 italic">
                          {t("No roles")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Define (YAML) */}
              <div className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                  <Code className="h-4 w-4 text-purple-600" />
                  {t("Definition (YAML)")}
                </h3>
                <div className="bg-slate-900 text-slate-100 p-5 rounded-lg overflow-x-auto font-mono text-sm shadow-inner">
                  {renderDefine()}
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Calendar className="h-4 w-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wide">
                      {t("Created At")}
                    </h3>
                  </div>
                  <p className="text-sm font-semibold text-green-900">
                    {new Date(intent.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <Calendar className="h-4 w-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wide">
                      {t("Updated At")}
                    </h3>
                  </div>
                  <p className="text-sm font-semibold text-blue-900">
                    {new Date(intent.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Deleted status */}
              {intent.deleted && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <Badge variant="destructive" className="text-sm font-bold">{t("Deleted")}</Badge>
                    {intent.deletedAt && (
                      <span className="text-sm text-red-700 font-semibold">
                        {t("on")} {new Date(intent.deletedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}