import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, /* Download, */ Calendar, Tag } from "lucide-react";
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

  // Load model details when dialog opens and modelId changes
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

  // Temporarily disabled download function
  // const handleDownload = () => {
  //   if (model?.url) {
  //     // Create download link
  //     const link = document.createElement('a');
  //     link.href = model.url;
  //     link.download = model.name || 'model';
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //   }
  // };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {t("Model Details")}
          </DialogTitle>
          <DialogDescription>
            {t("View detailed information about the trained model")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : model ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("Model Name")}</Label>
                  <p className="text-base font-semibold">{model.name}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("Type")}</Label>
                  <Badge variant={model.isOriginal ? "default" : "secondary"}>
                    {model.isOriginal ? t("Original") : t("Custom")}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("Created At")}</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(model.createdAt)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("Updated At")}</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(model.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {model.description && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("Description")}</Label>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    {model.description}
                  </p>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {Array.isArray(model.intents) ? model.intents.length : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("Intents")}</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {Array.isArray(model.rules) ? model.rules.length : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("Rules")}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {Array.isArray(model.stories) ? model.stories.length : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("Stories")}</p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {Array.isArray(model.responses) ? model.responses.length : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("Responses")}</p>
                </div>
              </div>

              {/* YAML Content Tabs */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">{t("YAML Content")}</Label>
                <Tabs defaultValue="domain" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="domain">{t("Domain")}</TabsTrigger>
                    <TabsTrigger value="nlu">{t("NLU")}</TabsTrigger>
                    <TabsTrigger value="rules">{t("Rules")}</TabsTrigger>
                    <TabsTrigger value="stories">{t("Stories")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="domain" className="mt-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t("Domain YAML")}</Label>
                      <Textarea
                        value={model.domainYaml || t("No domain YAML available")}
                        readOnly
                        className="h-[300px] font-mono text-xs"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="nlu" className="mt-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t("NLU YAML")}</Label>
                      <Textarea
                        value={model.nluYaml || t("No NLU YAML available")}
                        readOnly
                        className="h-[300px] font-mono text-xs"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="rules" className="mt-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t("Rules YAML")}</Label>
                      <Textarea
                        value={model.ruleYaml || t("No rules YAML available")}
                        readOnly
                        className="h-[300px] font-mono text-xs"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="stories" className="mt-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t("Stories YAML")}</Label>
                      <Textarea
                        value={model.storyYaml || t("No stories YAML available")}
                        readOnly
                        className="h-[300px] font-mono text-xs"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="flex-shrink-0 flex gap-2 justify-end pt-4 border-t mt-4">
              {/* Temporarily hidden download button */}
              {/* {model.url && (
                <Button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("Download Model")}
                </Button>
              )} */}
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("Close")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">{t("No model data available")}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
