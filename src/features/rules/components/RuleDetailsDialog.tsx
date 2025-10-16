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
import { ruleService } from "../api/service";
import { RuleDetailResponse } from "../api/dto/RuleResponse";

interface RuleDetailsDialogProps {
  ruleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RuleDetailsDialog({
  ruleId,
  open,
  onOpenChange,
}: RuleDetailsDialogProps) {
  const { t } = useTranslation();
  const [rule, setRule] = useState<RuleDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && ruleId) {
      fetchRuleDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ruleId]);

  const fetchRuleDetails = async () => {
    if (!ruleId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await ruleService.getRuleById(ruleId);
      setRule(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch rule details"
      );
      console.error("Error fetching rule details:", err);
    } finally {
      setLoading(false);
    }
  };

  const processDefine = (defineText: string, intents: any[], actions: any[], responses: any[]) => {
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
    responses.forEach(response => {
      if (typeof response === 'object' && response._id && response.name) {
        const regex = new RegExp(`\\[${response._id}\\]`, 'g');
        processedText = processedText.replace(regex, response.name);
      }
    });

    // Split by lines and process each line for syntax highlighting
    const lines = processedText.split('\n');
    const processedLines = lines.map((line, index) => {
      // Simple YAML syntax highlighting
      if (line.trim().startsWith('- rule:')) {
        return (
          <div key={index} className="text-blue-600 font-semibold">
            {line}
          </div>
        );
      }
      if (line.trim().startsWith('condition:') || line.trim().startsWith('steps:')) {
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

      return (
        <div key={index}>
          {line}
        </div>
      );
    });

    return processedLines;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Rule Details")}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-red-600 text-center py-4">{error}</div>
        )}

        {rule && !loading && !error && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t("Basic Information")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {t("Name")}
                    </label>
                    <p className="text-lg font-semibold">{rule.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {t("Status")}
                    </label>
                    <div>
                      {rule.deleted ? (
                        <Badge variant="destructive">{t("Deleted")}</Badge>
                      ) : (
                        <Badge variant="default">{t("Active")}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">
                      {t("Description")}
                    </label>
                    <p className="text-sm text-gray-700 mt-1">
                      {rule.description || t("No description provided")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Intents */}
              {rule.intents && rule.intents.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold mb-2">{t("Associated Intents")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {rule.intents.map((intent, index) => (
                      <Badge key={index} variant="secondary">
                        {typeof intent === 'string' ? intent : intent.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {rule.action && rule.action.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold mb-2">{t("Associated Actions")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {rule.action.map((action, index) => (
                      <Badge key={index} variant="outline">
                        {typeof action === 'string' ? action : action.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Responses */}
              {rule.responses && rule.responses.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold mb-2">{t("Associated Responses")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {rule.responses.map((response, index) => (
                      <Badge key={index} variant="outline">
                        {typeof response === 'string' ? response : response.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* YAML Definition */}
              <div>
                <h3 className="text-lg font-semibold mb-2">{t("YAML Definition")}</h3>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                    {rule.define ? processDefine(
                      rule.define,
                      rule.intents || [],
                      rule.action || [],
                      rule.responses || []
                    ) : t("No definition provided")}
                  </pre>
                </div>
              </div>

              {/* Metadata */}
              <div>
                <h3 className="text-lg font-semibold mb-2">{t("Metadata")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-600">
                      {t("Created At")}
                    </label>
                    <p>{new Date(rule.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-600">
                      {t("Updated At")}
                    </label>
                    <p>{new Date(rule.updatedAt).toLocaleString()}</p>
                  </div>
                  {rule.deletedAt && (
                    <div>
                      <label className="font-medium text-gray-600">
                        {t("Deleted At")}
                      </label>
                      <p>{new Date(rule.deletedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
