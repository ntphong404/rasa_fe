import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Tag, Code, Calendar, AlertCircle, Zap } from "lucide-react";
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

    return processedText;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="h-6 w-6 text-blue-600" />
            {t("Rule Details")}
          </DialogTitle>
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
          <div className="flex-1 overflow-y-auto px-3 py-3 pt-0">
            <div className="space-y-2">
              {/* Name & Description Card */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                        {t("Name")}
                      </h3>
                      <p className="text-lg font-bold text-blue-900">{rule.name}</p>
                    </div>
                    {rule.deleted ? (
                      <Badge variant="destructive" className="h-6">{t("Deleted")}</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600 h-6">{t("Active")}</Badge>
                    )}
                  </div>
                  {rule.description && (
                    <div>
                      <h3 className="text-xs font-semibold text-cyan-600 uppercase tracking-wide mb-1">
                        {t("Description")}
                      </h3>
                      <p className="text-sm text-gray-700">{rule.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Intents, Actions & Responses */}
              <div className="bg-white border rounded-lg p-4">
                <div className="grid grid-cols-3 gap-6">
                  {/* Intents */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Tag className="h-4 w-4 text-indigo-600" />
                      {t("Intents")}
                      <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {rule.intents?.length || 0}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {rule.intents && rule.intents.length > 0 ? (
                        rule.intents.map((intent, index) => (
                          <Badge key={index} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-300">
                            {typeof intent === 'string' ? intent : intent.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">-</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      {t("Actions")}
                      <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {rule.action?.length || 0}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {rule.action && rule.action.length > 0 ? (
                        rule.action.map((action, index) => (
                          <Badge key={index} className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300">
                            {typeof action === 'string' ? action : action.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">-</span>
                      )}
                    </div>
                  </div>

                  {/* Responses */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Tag className="h-4 w-4 text-amber-600" />
                      {t("Responses")}
                      <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        {rule.responses?.length || 0}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {rule.responses && rule.responses.length > 0 ? (
                        rule.responses.map((response, index) => (
                          <Badge key={index} className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300">
                            {typeof response === 'string' ? response : response.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* YAML Definition */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Code className="h-4 w-4 text-blue-600" />
                  {t("YAML Definition")}
                </h3>
                {rule.define ? (
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                    <pre className="whitespace-pre-wrap">
                      {processDefine(
                        rule.define,
                        rule.intents || [],
                        rule.action || [],
                        rule.responses || []
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
                    {new Date(rule.createdAt).toLocaleString()}
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
                    {new Date(rule.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Deleted status */}
              {rule.deleted && rule.deletedAt && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <Badge variant="destructive" className="text-sm">{t("Deleted")}</Badge>
                    <span className="text-sm text-red-600 font-medium">
                      {t("on")} {new Date(rule.deletedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
