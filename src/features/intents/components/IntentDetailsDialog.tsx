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
      return <pre className="text-sm whitespace-pre-wrap">{processed}</pre>;
    }

    return (
      <pre className="text-sm whitespace-pre-wrap">
        {processed.map((part, index) =>
          part.isHighlighted ? (
            <span
              key={index}
              className="bg-yellow-200 dark:bg-yellow-900 px-1 py-0.5 rounded font-semibold"
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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Intent Details")}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">{t("Error loading intent")}</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
        ) : intent ? (
          <div className="space-y-6">
            {/* Name */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                {t("Name")}
              </h3>
              <p className="text-base font-semibold">{intent.name}</p>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                {t("Description")}
              </h3>
              <p className="text-sm">
                {intent.description || (
                  <span className="text-muted-foreground">
                    {t("No description")}
                  </span>
                )}
              </p>
            </div>

            {/* Entities */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("Entities")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {intent.entities && intent.entities.length > 0 ? (
                  intent.entities.map((entity) => (
                    <Badge key={entity._id} variant="secondary">
                      {entity.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("No entities")}
                  </span>
                )}
              </div>
            </div>

            {/* Roles */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("Roles")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {intent.roles && intent.roles.length > 0 ? (
                  intent.roles.map((role, index) => (
                    <Badge key={index} variant="outline">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("No roles")}
                  </span>
                )}
              </div>
            </div>

            {/* Define (YAML) */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("Definition (YAML)")}
              </h3>
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                {renderDefine()}
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("Created At")}
                </h3>
                <p className="text-sm">
                  {new Date(intent.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("Updated At")}
                </h3>
                <p className="text-sm">
                  {new Date(intent.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Deleted status */}
            {intent.deleted && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{t("Deleted")}</Badge>
                  {intent.deletedAt && (
                    <span className="text-sm text-muted-foreground">
                      {t("on")} {new Date(intent.deletedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}