import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Loader2,
  Calendar,
  Database,
  Brain,
  MessageSquare,
  Workflow,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { trainingService } from "../api/service";
import { IModel } from "@/interfaces/train.interface";

interface ModelDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelId: string | null;
}

export function ModelDetailsDialog({
  open,
  onOpenChange,
  modelId,
}: ModelDetailsDialogProps) {
  const { t } = useTranslation();
  const [model, setModel] = useState<IModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && modelId) {
      loadModelDetails();
    } else {
      setModel(null);
    }
  }, [open, modelId]);

  const loadModelDetails = async () => {
    if (!modelId) return;
    try {
      setIsLoading(true);
      const response = await trainingService.getModelById(modelId);
      setModel(response.data);
    } catch (error) {
      console.error("Error loading model details:", error);
      toast.error(t("Failed to load model details"));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b px-6 py-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-cyan-900">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Brain className="h-6 w-6 text-cyan-600" />
              </div>
              {t("Model Details")}
            </DialogTitle>
            <DialogDescription className="text-cyan-700">
              {model?.name || t("Review model information and YAML configuration")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/40">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t("Loading model details...")}</span>
            </div>
          ) : model ? (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-cyan-600 uppercase tracking-wide mb-1">
                      {t("Model Name")}
                    </h3>
                    <p className="text-lg font-bold text-cyan-900 break-all">{model.name}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={model.isOriginal ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-purple-100 text-purple-800 border-purple-200"}
                  >
                    {model.isOriginal ? t("Original") : t("Custom")}
                  </Badge>
                </div>
                {model.description && (
                  <p className="mt-3 text-sm text-cyan-800">{model.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t("Intents"), value: model.intents?.length || 0, icon: Brain, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: t("Rules"), value: model.rules?.length || 0, icon: Workflow, color: "text-orange-600", bg: "bg-orange-50" },
                  { label: t("Stories"), value: model.stories?.length || 0, icon: Database, color: "text-purple-600", bg: "bg-purple-50" },
                  { label: t("Responses"), value: model.responses?.length || 0, icon: MessageSquare, color: "text-green-600", bg: "bg-green-50" },
                ].map((item) => (
                  <div key={item.label} className="bg-white border rounded-lg p-4 text-center shadow-sm">
                    <div className={`mx-auto mb-2 h-8 w-8 rounded-full ${item.bg} flex items-center justify-center`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <p className="text-xs uppercase tracking-wide text-slate-500">{t("Created At")}</p>
                  </div>
                  <p className="mt-1 font-medium text-slate-900">{formatDate(model.createdAt)}</p>
                </div>
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="text-xs uppercase tracking-wide text-slate-500">{t("Updated At")}</p>
                  </div>
                  <p className="mt-1 font-medium text-slate-900">{formatDate(model.updatedAt)}</p>
                </div>
              </div>

              <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-slate-600" />
                    {t("Model Configuration (YAML)")}
                  </h3>
                  <Badge variant="secondary">{t("Read only")}</Badge>
                </div>
                <Tabs defaultValue="domain" className="w-full flex flex-col">
                  <div className="px-4 pt-3">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="domain">{t("Domain")}</TabsTrigger>
                      <TabsTrigger value="nlu">{t("NLU")}</TabsTrigger>
                      <TabsTrigger value="rules">{t("Rules")}</TabsTrigger>
                      <TabsTrigger value="stories">{t("Stories")}</TabsTrigger>
                    </TabsList>
                  </div>

                  {[
                    { id: "domain", label: t("Domain Configuration"), content: model.domainYaml },
                    { id: "nlu", label: t("NLU Data"), content: model.nluYaml },
                    { id: "rules", label: t("Rule Definitions"), content: model.ruleYaml },
                    { id: "stories", label: t("Story Flows"), content: model.storyYaml },
                  ].map((tab) => (
                    <TabsContent key={tab.id} value={tab.id} className="px-4 pb-4 pt-3">
                      <pre className="p-4 bg-slate-950 text-slate-100 rounded-md font-mono text-xs leading-relaxed overflow-auto h-[320px]">
                        {tab.content || `# ${t("No content available for this section")}`}
                      </pre>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 p-6">
              <Database className="h-10 w-10 opacity-30" />
              <p>{t("No model data available")}</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-8"
          >
            {t("Close Details")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
